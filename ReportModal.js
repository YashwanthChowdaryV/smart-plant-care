import React, { useState } from 'react';

function getRangeReport(history, events, windowSec) {
  const now = Math.floor(Date.now() / 1000);
  const relevant = history.filter(d => now - d.timestamp <= windowSec);
  if (!relevant.length) return null;

  const avg = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : '--';
  const temps = relevant.map(d => d.temperature);
  const hums = relevant.map(d => d.humidity);
  const soils = relevant.map(d => d.soilMoisture);

  const eventCount = events.filter(e => now - e.timestamp <= windowSec).length;
  const stressCount = relevant.filter(d =>
    d.temperature > 30 || d.temperature < 15 ||
    d.humidity > 80 || d.humidity < 40 ||
    d.soilMoisture > 3500
  ).length;

  return {
    avgTemp: avg(temps),
    avgHum: avg(hums),
    avgSoil: avg(soils),
    eventCount,
    stressCount,
    readingCount: relevant.length
  };
}

function ReportModal({ historyData, events }) {
  const [open, setOpen] = useState(false);
  const [rangeSec, setRangeSec] = useState(3600 * 24); // default: 1 day

  const report = getRangeReport(historyData, events, rangeSec);

  return (
    <div className="mb-8">
      <button onClick={() => setOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        📈 Show Daily/Weekly Report
      </button>
      {open && (
        <div className="fixed left-0 top-0 w-full h-full z-50 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-xl max-w-lg w-full">
            <h3 className="text-xl font-semibold mb-2 text-blue-700">Plant Health Report</h3>
            <label className="block mb-1">Time window:</label>
            <select value={rangeSec} onChange={e => setRangeSec(Number(e.target.value))}
              className="rounded border px-2 py-1 mb-3 dark:bg-gray-700 dark:text-white">
              <option value={3600*24}>Last 24 hours</option>
              <option value={3600*24*7}>Last 7 days</option>
            </select>
            {report ? (
              <div>
                <div>Average Temp: <b>{report.avgTemp}°C</b></div>
                <div>Average Humidity: <b>{report.avgHum}%</b></div>
                <div>Average Soil Moisture: <b>{report.avgSoil}</b></div>
                <div className="mt-1 text-green-600">
                  Watered/Fertilized: <b>{report.eventCount}</b> time(s)
                </div>
                <div className="mt-1 text-red-600">
                  Stress Events: <b>{report.stressCount}</b> over {report.readingCount} readings
                </div>
                <div className="mt-2 italic text-sm">
                  {report.stressCount === 0
                    ? "Plant has been happy all period! 🌱"
                    : report.stressCount < 3
                      ? "Minor stresses detected. Keep watching moisture & temp."
                      : "Multiple stress events, consider more frequent checks."}
                </div>
              </div>
            ) : (
              <div>No data in selected window.</div>
            )}
            <div className="mt-4 text-right">
              <button onClick={() => setOpen(false)} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportModal;
