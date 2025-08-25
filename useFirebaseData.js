import { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, onValue, off } from 'firebase/database';

// Helper to calculate simple moving average for given data array and window size
const movingAverage = (data, windowSize = 3) => {
  if (data.length < windowSize) return data;

  let averages = [];
  for (let i = 0; i <= data.length - windowSize; i++) {
    let windowSlice = data.slice(i, i + windowSize);
    const avg = windowSlice.reduce((sum, val) => sum + val, 0) / windowSize;
    averages.push(avg);
  }
  // Fill start with first average for alignment
  while (averages.length < data.length) {
    averages.unshift(averages[0]);
  }
  return averages;
};

// Utility to compute min, max, avg of array
const computeStats = (arr) => ({
  min: Math.min(...arr),
  max: Math.max(...arr),
  avg: arr.reduce((a, b) => a + b, 0) / arr.length || 0,
});

export const useFirebaseData = () => {
  const [currentData, setCurrentData] = useState({
    temperature: 0,
    humidity: 0,
    soilMoisture: 0,
    timestamp: null
  });
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const currentRef = ref(database, 'current');
    const historyRef = ref(database, 'history');

    const unsubscribeCurrent = onValue(currentRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCurrentData(data);
      }
      setLoading(false);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    const unsubscribeHistory = onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const historyArray = Object.entries(data)
          .map(([key, value]) => ({
            id: key,
            ...value,
            time: new Date(value.timestamp * 1000).toLocaleTimeString()
          }))
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(-20);
        setHistoryData(historyArray);
      }
    }, (err) => {
      setError(err.message);
    });

    return () => {
      off(currentRef, 'value', unsubscribeCurrent);
      off(historyRef, 'value', unsubscribeHistory);
    };
  }, []);

  // Compute stats and moving averages for the history data (used by App)
  const stats = (historyData) => {
    if (!historyData || historyData.length === 0) return {
      temperatureStats: { min: 0, max: 0, avg: 0 },
      humidityStats: { min: 0, max: 0, avg: 0 },
      soilMoistureStats: { min: 0, max: 0, avg: 0 },
      temperatureMovingAvg: [],
      humidityMovingAvg: [],
      soilMoistureMovingAvg: [],
    };

    const temperatureValues = historyData.map(d => d.temperature);
    const humidityValues = historyData.map(d => d.humidity);
    const soilMoistureValues = historyData.map(d => d.soilMoisture);

    return {
      temperatureStats: computeStats(temperatureValues),
      humidityStats: computeStats(humidityValues),
      soilMoistureStats: computeStats(soilMoistureValues),

      temperatureMovingAvg: movingAverage(temperatureValues, 5),
      humidityMovingAvg: movingAverage(humidityValues, 5),
      soilMoistureMovingAvg: movingAverage(soilMoistureValues, 5),
    };
  }
  
  return { currentData, historyData, loading, error};
};
