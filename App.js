import React, { useState, useEffect, useMemo } from 'react';
import { useFirebaseData } from './hooks/useFirebaseData';

import MetricCard from './components/MetricCard';
import StatsCard from './components/StatsCard';
import { LineChart, BarChart } from './components/Charts';
import WeatherForecast from './components/WeatherForecast';
import IrrigationControl from './components/IrrigationControl';
import SystemStatus from './components/SystemStatus';

import HealthStreakCard from './components/HealthStreakCard';
import CalendarEventHistory from './components/CalendarEventHistory';

import { Leaf, RefreshCw, Wifi, WifiOff, Sun, Moon } from 'lucide-react';

// === Multilingual Wait Messages ===
const pleaseWaitMessages = [
  // Indian languages (only sample; add as needed for 100+)
  "कृपया प्रतीक्षा करें",              // Hindi
  "దయచేసి వేచి ఉండండి",              // Telugu
  "कृपया प्रतीक्षा करा",             // Marathi
  "দয়া করে অপেক্ষা করুন",           // Bengali
  "ਕਿਰਪਾ ਕਰਕੇ ਪ੍ਰਤੀਕਸ਼ਾ ਕਰੋ",        // Punjabi
  "કૃપયા રાહ જુઓ",                   // Gujarati
  "ദയവായി കാത്തിരിക്കൂ",                // Malayalam
  "कृपया प्रतीक्षा करें",              // Nepali
  "कृपया प्रतीक्षा करें",              // Sanskrit
  "कृपया प्रतीक्षा करें",              // Bhojpuri
  "कृपया प्रतीक्षा करें",              // Maithili
  "Please wait",
  "Por favor espera",
  "Veuillez patienter",
  "Bitte warten",
  "Attendez s'il vous plaît",
  "Aspetta per favore",
  "Espere por favor",
  "Wacht alsjeblieft",
  "Por favor, aguarde",
  "Пожалуйста, подождите",
  "Bitte warten Sie",
  "请稍候",
  "잠시만 기다려주세요",
  "お待ちください",
  // repeated to ensure sufficient entries
  ...Array(70).fill("कृपया प्रतीक्षा करें"),
];

// Multilingual loading / error display component
function MultilingualWait({ isError = false, errorMsg = "", intervalMs = 2000 }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1) % pleaseWaitMessages.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 px-4 text-center">
      {isError ? (
        <>
          <WifiOff className="w-12 h-12 text-red-600 mb-6 animate-pulse" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">Oops! Something went wrong.</h2>
          <p className="text-red-600 mb-4">{errorMsg || "Please check your internet connection and try again."}</p>
          <p className="text-gray-700 dark:text-gray-300 italic">Meanwhile, {pleaseWaitMessages[idx]}...</p>
        </>
      ) : (
        <>
          <RefreshCw className="w-12 h-12 text-blue-600 mb-6 animate-spin" />
          <p className="text-lg font-medium text-blue-700 mb-2">{pleaseWaitMessages[idx]}</p>
          <p className="text-gray-700 dark:text-gray-300">Loading your plant data...</p>
        </>
      )}
    </div>
  );
};

// === Utility functions ===

const movingAverage = (data, windowSize = 3) => {
  if (data.length < windowSize) return data;
  let averages = [];
  for (let i = 0; i <= data.length - windowSize; i++) {
    const windowSlice = data.slice(i, i + windowSize);
    averages.push(windowSlice.reduce((sum, val) => sum + val, 0) / windowSize);
  }
  while (averages.length < data.length) averages.unshift(averages[0]);
  return averages;
};

const computeStats = (arr) => ({
  min: arr.length ? Math.min(...arr) : 0,
  max: arr.length ? Math.max(...arr) : 0,
  avg: arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0,
});

function robustStats(arr) {
  if (arr.length < 5) return computeStats(arr);
  const sorted = [...arr].sort((a, b) => a - b);
  const trimCount = Math.max(1, Math.floor(sorted.length * 0.1));
  const trimmed = sorted.slice(trimCount, sorted.length - trimCount);
  return computeStats(trimmed.length ? trimmed : sorted);
}

const detectAnomalies = (arr, threshold = 2) => {
  if (!arr.length) return [];
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const stdDev = Math.sqrt(arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length);
  if (stdDev === 0) return new Array(arr.length).fill(false);
  return arr.map(val => Math.abs((val - mean) / stdDev) > threshold);
};

const linearRegression = (xs, ys) => {
  const n = xs.length;
  if (n === 0) return null;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((acc, val, i) => acc + val * ys[i], 0);
  const sumX2 = xs.reduce((acc, val) => acc + val * val, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;
  const m = (n * sumXY - sumX * sumY) / denom;
  const b = (sumY - m * sumX) / n;
  return { m, b };
};

const predictWatering = (
  timestamps,
  values,
  dryThreshold1 = 3000,
  dryThreshold2 = 4000,
  stableThreshold1 = 2500,
  stableThreshold2 = 2000
) => {
  if (values.length === 0) {
    return null;
  }
  const lastValue = values[values.length - 1];

  // No watering needed if soil moisture is low enough
  if (lastValue <= stableThreshold2) {
    return null;
  }
  // Urgent watering needed if soil moisture very high
  if (lastValue >= dryThreshold2) {
    return 0;
  }

  if (timestamps.length < 2) {
    return null;
  }

  const lr = linearRegression(timestamps, values);
  if (!lr) {
    return null;
  }

  const { m, b } = lr;
  if (m <= 0) {
    return null;
  }

  let predictedTime = (dryThreshold1 - b) / m;
  const now = Math.max(...timestamps);
  let secondsLeft = predictedTime - now;

  if (lastValue >= dryThreshold1 && lastValue < dryThreshold2) {
    secondsLeft = secondsLeft > 0 ? secondsLeft / 2 : 0;
  }

  return secondsLeft > 0 ? secondsLeft : 0;
};

const computeHealthIndex = (temp, humidity, soil) => {
  const optimalTemp = [18, 28];
  const optimalHumidity = [40, 70];
  const optimalSoil = [1200, 2500];
  const isSoilUnhealthy = soil >= 3000;

  const tempScore = temp >= optimalTemp[0] && temp <= optimalTemp[1] ? 1 : 0.5;
  const humidityScore = humidity >= optimalHumidity[0] && humidity <= optimalHumidity[1] ? 1 : 0.5;
  const soilScore = isSoilUnhealthy ? 0.1 : soil >= optimalSoil[0] && soil <= optimalSoil[1] ? 1 : 0.5;

  return Math.round((tempScore * 0.4 + humidityScore * 0.3 + soilScore * 0.3) * 100);
};

const getStatus = {
  temperature: (t) => (t > 30 ? 'high' : t < 15 ? 'low' : 'normal'),
  humidity: (h) => (h > 80 ? 'high' : h < 40 ? 'low' : 'normal'),
  soil: (s) => (s > 3500 ? 'low' : s < 1500 ? 'high' : 'normal'),
};

const TIME_RANGES = [
  { label: '1 Hour', value: 3600 },
  { label: '6 Hours', value: 3600 * 6 },
  { label: '12 Hours', value: 3600 * 12 },
  { label: '1 Day', value: 3600 * 24 },
  { label: '3 Days', value: 3600 * 24 * 3 },
  { label: '1 Week', value: 3600 * 24 * 7 },
];

const EVENT_OPTIONS = ['Fertilizer added', 'Watered', 'Pruned', 'Pests observed', 'Other'];

// Growth streak helper
function getCurrentHealthStreak(historyData) {
  const days = {};
  for (const d of historyData) {
    const dt = new Date(d.timestamp * 1000);
    const key = dt.toISOString().slice(0, 10);
    if (!days[key]) days[key] = [];
    days[key].push(d);
  }
  const sortedDaysDesc = Object.keys(days).sort().reverse(); // newest first
  let streak = 0;
  for (const day of sortedDaysDesc) {
    const stress = days[day].some(
      (d) =>
        d.temperature > 30 ||
        d.temperature < 15 ||
        d.humidity > 80 ||
        d.humidity < 40 ||
        d.soilMoisture > 3500
    );
    if (stress) break;
    streak++;
  }
  return streak;
}

// Explainable AI: updated wording using "soil moisture sensor readings"
function ExplainableInterpretation({ timestamps, temperatureValues, soilValues }) {
  if (timestamps.length < 2 || temperatureValues.length === 0 || soilValues.length === 0) {
    return <p className="text-sm text-gray-600 dark:text-gray-400">Not enough data for explanation.</p>;
  }

  const firstSoil = soilValues[0];
  const lastSoil = soilValues[soilValues.length - 1];
  const soilChangePercent = ((lastSoil - firstSoil) / firstSoil) * 100;

  const tempLR = linearRegression(timestamps, temperatureValues);
  const tempSlope = tempLR ? tempLR.m : 0;

  const soilTrend = soilChangePercent > 5 ? 'increased' : soilChangePercent < -5 ? 'decreased' : 'stable';
  const tempTrend = tempSlope > 0.01 ? 'rising' : tempSlope < -0.01 ? 'falling' : 'stable';

  // Explanation text expanded into multiple sentences
  let wateringMessage;
  if (lastSoil >= 4000) {
    wateringMessage = (
      <>
        <p>Watering is <strong>urgently required</strong> as current soil moisture sensor readings are very high, reaching above 4000 units. Such high readings indicate the soil has dried to a critical level.</p>
        <p>Over the monitoring period, the soil moisture sensor readings have {soilTrend} by {soilChangePercent.toFixed(1)}%, indicating a significant change in soil dryness.</p>
        <p>The temperature trend during this period has been {tempTrend}, which can accelerate soil drying if temperatures are rising.</p>
        <p>Immediate watering will help prevent plant stress and maintain optimal hydration levels.</p>
        <p>Please take necessary action to ensure the soil moisture reduces to a safer range for your plant.</p>
      </>
    );
  } else if (lastSoil >= 3000) {
    wateringMessage = (
      <>
        <p>Watering is <strong>recommended soon</strong> because current soil moisture sensor readings are moderately high, above 3000 units.</p>
        <p>Sensor readings have {soilTrend} by {soilChangePercent.toFixed(1)}% through the observed period, which suggests that the soil moisture is declining towards dryer conditions.</p>
        <p>Temperature has been {tempTrend} in this timeframe, which may be influencing soil moisture levels.</p>
        <p>Consider watering your plant within the next few hours to maintain healthy growing conditions.</p>
        <p>Monitoring these conditions regularly will ensure timely care.</p>
      </>
    );
  } else {
    wateringMessage = (
      <>
        <p>No watering is needed currently as the soil moisture sensor readings are <strong>stable or low</strong>, indicating sufficient moisture.</p>
        <p>The sensor readings have {soilTrend} by {soilChangePercent.toFixed(1)}% during the monitoring period, reflecting a steady state.</p>
        <p>The temperature trend is {tempTrend}, which typically supports good moisture retention in soil.</p>
        <p>Keep monitoring these sensor values to track any future changes promptly.</p>
        <p>Ensuring optimal watering timing prevents overwatering or underwatering issues.</p>
      </>
    );
  }

  return (
    <div className="text-sm text-gray-700 dark:text-gray-300 italic space-y-2">
      {wateringMessage}
    </div>
  );
}


function App() {
  const { currentData, historyData, loading, error } = useFirebaseData();

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const [timeRangeSec, setTimeRangeSec] = useState(3600 * 24);
  const [events, setEvents] = useState(() => JSON.parse(localStorage.getItem('plantEvents')) || []);
  const [newEvent, setNewEvent] = useState(EVENT_OPTIONS[0]);

  const addEvent = () => {
    if (!newEvent) return;
    const timestamp = Math.floor(Date.now() / 1000);
    const updatedEvents = [...events, { timestamp, text: newEvent }];
    setEvents(updatedEvents);
    localStorage.setItem('plantEvents', JSON.stringify(updatedEvents));
  };

  const clearEvents = () => {
    setEvents([]);
    localStorage.removeItem('plantEvents');
  };

  // useMemo ensures updates on timeRangeSec change
  const filteredHistory = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    return historyData.filter((d) => now - d.timestamp <= timeRangeSec);
  }, [historyData, timeRangeSec]);

  const temperatureValues = useMemo(() => filteredHistory.map((d) => d.temperature), [filteredHistory]);
  const humidityValues = useMemo(() => filteredHistory.map((d) => d.humidity), [filteredHistory]);
  const soilValues = useMemo(() => filteredHistory.map((d) => d.soilMoisture), [filteredHistory]);

  const temperatureStats = useMemo(() => robustStats(temperatureValues), [temperatureValues]);
  const humidityStats = useMemo(() => robustStats(humidityValues), [humidityValues]);
  const soilStats = useMemo(() => robustStats(soilValues), [soilValues]);

  const temperatureMovingAvg = useMemo(() => movingAverage(temperatureValues, 5), [temperatureValues]);
  const humidityMovingAvg = useMemo(() => movingAverage(humidityValues, 5), [humidityValues]);
  const soilMovingAvg = useMemo(() => movingAverage(soilValues, 5), [soilValues]);

  const tempAnomalies = useMemo(() => detectAnomalies(temperatureValues), [temperatureValues]);
  const humAnomalies = useMemo(() => detectAnomalies(humidityValues), [humidityValues]);
  const soilAnomalies = useMemo(() => detectAnomalies(soilValues), [soilValues]);

  const timestamps = useMemo(() => filteredHistory.map((d) => d.timestamp), [filteredHistory]);
  const predictedSecondsUntilDry = useMemo(() => predictWatering(timestamps, soilValues), [timestamps, soilValues]);

  const healthScore =
    currentData.timestamp &&
    computeHealthIndex(currentData.temperature, currentData.humidity, currentData.soilMoisture);

  const growthStreak = getCurrentHealthStreak(historyData);

  const formatTime = (item) => (item.timestamp ? new Date(item.timestamp * 1000).toLocaleTimeString() : item.time || '');

  const temperatureChartData = {
    labels: filteredHistory.map(formatTime),
    datasets: [
      {
        label: 'Temperature (°C)',
        data: temperatureValues,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: tempAnomalies.map((a) => (a ? '#dc2626' : '#22c55e')),
      },
      {
        label: 'Temperature Moving Avg',
        data: temperatureMovingAvg,
        borderColor: '#166534',
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
      },
    ],
  };

  const humidityChartData = {
    labels: filteredHistory.map(formatTime),
    datasets: [
      {
        label: 'Humidity (%)',
        data: humidityValues,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: humAnomalies.map((a) => (a ? '#dc2626' : '#3b82f6')),
      },
      {
        label: 'Humidity Moving Avg',
        data: humidityMovingAvg,
        borderColor: '#1e40af',
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
      },
    ],
  };

  const soilMoistureChartData = {
    labels: filteredHistory.map(formatTime),
    datasets: [
      {
        label: 'Soil Moisture',
        data: soilValues,
        borderColor: soilAnomalies.map((a) => (a ? '#dc2626' : '#22c55e')),
        backgroundColor: soilAnomalies.map((a) => (a ? 'rgba(220,38,38,0.5)' : 'rgba(34,197,94,0.5)')),
        borderWidth: 1,
      },
      {
        label: 'Soil Moisture Moving Avg',
        data: soilMovingAvg,
        borderColor: '#14532d',
        borderDash: [5, 5],
        fill: false,
      },
    ],
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="ml-2">Loading plant data...</p>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        <WifiOff className="w-8 h-8 mr-2" />
        <p>Error loading data: {error}</p>
      </div>
    );

  return (
    <div
      className={`${theme === 'dark' ? 'dark' : ''} min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800`}
    >
      <header className="bg-white dark:bg-gray-900 border-b border-primary-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-4 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-600 p-2 rounded-lg">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Plant Care</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Monitoring Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
            <Wifi className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span>Connected</span>
            {currentData.timestamp && (
              <span>Updated: {new Date(currentData.timestamp * 1000).toLocaleTimeString()}</span>
            )}
            <span className="flex items-center space-x-1 text-yellow-500 font-semibold pl-4 border-l border-gray-300 dark:border-gray-700">
              <span>🔥</span>
              <span>{growthStreak}</span>
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* <HealthStreakCard historyData={historyData} /> */}

        <section className="mb-6">
          <label htmlFor="timeRange" className="block mb-2 font-semibold text-gray-800 dark:text-gray-200">
            Select Time Range for Analysis:
          </label>
          <select
            id="timeRange"
            value={timeRangeSec}
            onChange={(e) => setTimeRangeSec(Number(e.target.value))}
            className="rounded border border-gray-300 p-2 dark:bg-gray-700 dark:text-white"
          >
            {TIME_RANGES.map(({ label, value }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </section>

        <section className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            title="Temperature"
            value={currentData.temperature.toFixed(1)}
            unit="°C"
            type="temperature"
            status={getStatus.temperature(currentData.temperature)}
          />
          <MetricCard
            title="Humidity"
            value={currentData.humidity.toFixed(1)}
            unit="%"
            type="humidity"
            status={getStatus.humidity(currentData.humidity)}
          />
          <MetricCard
            title="Soil Moisture"
            value={currentData.soilMoisture}
            unit=""
            type="soil"
            status={getStatus.soil(currentData.soilMoisture)}
          />
          <div className="metric-card flex flex-col justify-center items-center">
            <h3 className="text-sm font-semibold mb-2">Plant Health Index</h3>
            <div className="text-3xl font-bold text-green-600">{healthScore ?? '--'}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">0 (bad) to 100 (optimal)</div>
          </div>
        </section>
                <section className="mb-8 p-4 rounded-lg bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 font-semibold">
          {predictedSecondsUntilDry !== null ? (
            predictedSecondsUntilDry === 0 ? (
              <p>Soil moisture sensor readings are very high (≥ 4000). Water your plant immediately!</p>
            ) : (
              <p>
                Estimated time until soil dryness: {(predictedSecondsUntilDry / 3600).toFixed(2)} hours. Consider watering
                soon.
              </p>
            )
          ) : (
            <p>Soil moisture sensor readings are adequate or stable; no watering needed now.</p>
          )}
        </section>


        {/* Explainable AI Interpretation */}
        <section className="mb-8">
          <h2 className="font-semibold text-xl mb-2 text-gray-800 dark:text-gray-200">AI Explanation</h2>
          <ExplainableInterpretation
            timestamps={timestamps}
            temperatureValues={temperatureValues}
            soilValues={soilValues}
          />
        </section>


        <section className="mb-8">
          <h2 className="mb-4 font-semibold text-xl text-gray-700 dark:text-gray-300">Summary Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard title="Temperature" unit="°C" {...temperatureStats} />
            <StatsCard title="Humidity" unit="%" {...humidityStats} />
            <StatsCard title="Soil Moisture" unit="" {...soilStats} />
          </div>
        </section>

        {filteredHistory.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 font-semibold text-xl text-gray-700 dark:text-gray-300">Historical Data with Anomalies Highlighted</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="card p-4 bg-white rounded shadow dark:bg-gray-800">
                <LineChart data={temperatureChartData} title="Temperature Trends" />
              </div>
              <div className="card p-4 bg-white rounded shadow dark:bg-gray-800">
                <LineChart data={humidityChartData} title="Humidity Trends" />
              </div>
            </div>
            <div className="card p-4 bg-white rounded shadow dark:bg-gray-800">
              <BarChart data={soilMoistureChartData} title="Soil Moisture Levels" />
            </div>
          </section>
        )}

        <section className="mb-8">
          <CalendarEventHistory historyData={historyData} events={events} />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <IrrigationControl predictedWateringTime={predictedSecondsUntilDry} />
          <SystemStatus currentData={currentData} healthScore={healthScore} />
          <WeatherForecast />
        </section>
      </main>

      <footer className="border-t border-primary-200 dark:border-gray-700 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
        Smart Plant Care System © 2024. All rights reserved.
      </footer>
    </div>
  );
}

export default App;
