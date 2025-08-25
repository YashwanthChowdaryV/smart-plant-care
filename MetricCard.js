import React from 'react';
import { Thermometer, Droplets, Sprout } from 'lucide-react';

const MetricCard = ({ title, value, unit, type, status = 'normal' }) => {
  const getIcon = () => {
    switch (type) {
      case 'temperature':
        return <Thermometer className="w-6 h-6 text-primary-600" />;
      case 'humidity':
        return <Droplets className="w-6 h-6 text-primary-600" />;
      case 'soil':
        return <Sprout className="w-6 h-6 text-primary-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'low':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-primary-600 bg-primary-50';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'high':
        return 'High';
      case 'low':
        return 'Low';
      default:
        return 'Normal';
    }
  };

  return (
    <div className="metric-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {getIcon()}
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
      <div className="flex items-baseline space-x-1">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        <span className="text-sm text-gray-500">{unit}</span>
      </div>
    </div>
  );
};

export default MetricCard;
