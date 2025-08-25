import React from 'react';

const StatsCard = ({ title, min, max, avg, unit }) => {
  // Helper to safely format numbers or show placeholder
  const formatNumber = (num) => (typeof num === 'number' && !isNaN(num) ? num.toFixed(2) : '--');

  return (
    <div className="metric-card p-4 bg-white dark:bg-gray-800 rounded shadow">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">{title} Summary</h3>
      <p>Min: {formatNumber(min)}{unit}</p>
      <p>Max: {formatNumber(max)}{unit}</p>
      <p>Avg: {formatNumber(avg)}{unit}</p>
    </div>
  );
};

export default StatsCard;
