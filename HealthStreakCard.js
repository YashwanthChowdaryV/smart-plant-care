import React from 'react';

// Helper to check streak
function getCurrentHealthStreak(historyData) {
  // Group readings by day (YYYY-MM-DD)
  const days = {};
  for (const d of historyData) {
    const dt = new Date(d.timestamp * 1000);
    const key = dt.toISOString().slice(0, 10);
    if (!days[key]) days[key] = [];
    days[key].push(d);
  }
  const dayKeys = Object.keys(days).sort().reverse(); // newest first
  let streak = 0;
  for (const k of dayKeys) {
    // Define "stress"!
    const stress = days[k].some(d =>
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

function HealthStreakCard({ historyData }) {
  const streak = getCurrentHealthStreak(historyData);
  return (
    <div className="card p-4 rounded-lg bg-green-50 mb-8 flex flex-col items-center">
      <h3 className="font-semibold text-lg text-green-700">
      </h3>
      {streak >= 7 && (
        <div className="mt-2 text-yellow-600 font-bold">🏆 1 Week Streak! Keep it up!</div>
      )}
      {streak && streak % 30 === 0 && (
        <div className="mt-2 text-pink-600 font-bold">🌟 1 Month Streak. Your plant is THRIVING!</div>
      )}
    </div>
  );
}

export default HealthStreakCard;
