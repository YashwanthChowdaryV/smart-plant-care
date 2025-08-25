import React from 'react';

/**
 * CalendarEventHistory modified to show only useful future care recommendations
 * based on history and events.
 */
function CalendarEventHistory({ historyData, events }) {
  if (!historyData.length) {
    return (
      <div className="card p-4 my-8 bg-blue-50">
        <h3 className="font-semibold mb-2 text-blue-800">📅 Care Calendar & Recommendations</h3>
        <p>No sensor data available yet.</p>
      </div>
    );
  }

  // Analyze soil moisture to predict next watering time based on drying trend
  const timestamps = historyData.map(d => d.timestamp);
  const soilValues = historyData.map(d => d.soilMoisture);

  // Basic linear regression prediction helper
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

  const predictWatering = (timestamps, values, dryThreshold = 3500, safeThreshold = 2500) => {
    if (values.length === 0) return null;
    const lastValue = values[values.length - 1];
    if (lastValue <= safeThreshold) return null; // soil is wet enough
    if (timestamps.length < 2) return null;
    const lr = linearRegression(timestamps, values);
    if (!lr) return null;
    const { m, b } = lr;
    if (m <= 0) return null; // not drying
    const predictedTime = (dryThreshold - b) / m;
    const now = Math.max(...timestamps);
    const secondsLeft = predictedTime - now;
    return secondsLeft > 0 ? secondsLeft : null;
  };

  // Predict watering time in seconds from now
  const predictedSecUntilDry = predictWatering(timestamps, soilValues);
  const nextWateringDate = predictedSecUntilDry
    ? new Date((Math.floor(Date.now() / 1000) + predictedSecUntilDry) * 1000)
    : null;

  // Check for other care events logged in events array
  const recentEvents = events.filter(e => {
    const eventAgeSeconds = Math.floor(Date.now() / 1000) - e.timestamp;
    // Filter events from past 7 days
    return eventAgeSeconds <= (7 * 24 * 3600);
  });

  // Decide care actions based on recent events and soil moisture
  const wateringUrgency = predictedSecUntilDry !== null
    ? `Water your plant around ${nextWateringDate.toLocaleString()}`
    : 'No immediate watering needed';

  const fertilizerActionNeeded = !recentEvents.some(ev => ev.text.toLowerCase().includes('fertilizer')) 
    ? 'Consider fertilizing soon (no fertilizer events logged in last 7 days)'
    : 'Fertilizer was applied recently';

  // Pests check
  const pestsObserved = recentEvents.some(ev => ev.text.toLowerCase().includes('pest'));

  return (
    <div className="card p-4 my-8 bg-blue-50 rounded shadow">
      <h3 className="font-semibold mb-4 text-blue-800">📅 Care Calendar & Recommendations</h3>
      <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
        <li><strong>Next Watering:</strong> {wateringUrgency}</li>
        <li><strong>Fertilizer:</strong> {fertilizerActionNeeded}</li>
        <li><strong>Pest Status:</strong> {pestsObserved ? 'Pests observed recently. Consider pest control.' : 'No recent pest reports.'}</li>
      </ul>
    </div>
  );
}

export default CalendarEventHistory;
