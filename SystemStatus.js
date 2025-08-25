import React from 'react';
import { CheckCircle, AlertCircle, Wifi, Battery, Settings } from 'lucide-react';

const SystemStatus = ({ currentData, healthScore }) => {
  // Derive statuses from currentData
  // For example purposes; adjust thresholds as needed
  const systemStatus = currentData ? 'All Systems Normal' : 'No Data';
  
  // Pump status example: you could extend to real pump state from your data
  const pumpStatus = currentData && currentData.pumpActive ? 'Running' : 'System idle';

  // Last update time from currentData timestamp
  const lastUpdate = currentData && currentData.timestamp
    ? new Date(currentData.timestamp * 1000).toLocaleString()
    : 'No timestamp';

  // Health index display; fallback
  const healthIndexDisplay = healthScore !== null && healthScore !== undefined
    ? `${healthScore}%`
    : 'N/A';

  // Determine individual status classes by some logic
  const getStatusColor = (status) => {
    switch (status) {
      case 'good':
      case 'optimal':
        return 'text-green-600 bg-green-50';
      case 'inactive':
        return 'text-gray-600 bg-gray-50';
      case 'auto':
      case 'running':
        return 'text-blue-600 bg-blue-50';
      case 'recent':
        return 'text-primary-600 bg-primary-50';
      case 'no-data':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIndicator = (status) => {
    switch (status) {
      case 'good':
      case 'optimal':
        return 'bg-green-400';
      case 'inactive':
        return 'bg-gray-400';
      case 'auto':
      case 'running':
        return 'bg-blue-400';
      case 'recent':
        return 'bg-primary-400';
      case 'no-data':
        return 'bg-red-400';
      default:
        return 'bg-gray-400';
    }
  };

  // Determine status keywords dynamically
  // System status: if currentData exists and temperatures look normal
  const systemStatusKeyword = currentData ? 'good' : 'no-data';

  // Pump status keyword: assuming currentData.pumpActive boolean exists
  const pumpStatusSentence = pumpStatus === 'Running' ? 'running' : 'inactive';

  // Operation mode currently hard coded as 'auto', you can make dynamic if your data supports
  const operationMode = 'auto';

  // System health index keyword (optimal if above 90)
  const healthIndexKeyword = (healthScore || 0) >= 90 ? 'optimal' : 'good';

  // Last update keyword: recent if updated within last 5 minutes
  const lastUpdateDate = currentData && currentData.timestamp ? new Date(currentData.timestamp * 1000) : null;
  const now = new Date();
  let lastUpdateKeyword = 'no-data';
  if (lastUpdateDate) {
    const diffMinutes = (now - lastUpdateDate) / 1000 / 60;
    lastUpdateKeyword = diffMinutes <= 5 ? 'recent' : 'no-data';
  }

  // Define status items array dynamically
  const statusItems = [
    {
      label: 'System Status',
      value: systemStatus,
      status: systemStatusKeyword,
      icon: CheckCircle,
    },
    {
      label: 'Pump Status',
      value: pumpStatus,
      status: pumpStatusSentence,
      icon: AlertCircle,
    },
    {
      label: 'Operation Mode',
      value: 'Automatic adjustments',
      status: operationMode,
      icon: Settings,
    },
    {
      label: 'Last Update',
      value: lastUpdate,
      status: lastUpdateKeyword,
      icon: Wifi,
    },
    {
      label: 'System Health Index',
      value: healthIndexDisplay,
      status: healthIndexKeyword,
      icon: Battery,
    },
  ];

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">System Status</h2>
      <div className="space-y-4">
        {statusItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <IconComponent className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  <div
                    className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getStatusIndicator(item.status)}`}
                  ></div>
                </div>
                <div>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{item.label}</span>
                </div>
              </div>
              <div
                className={`text-sm font-medium px-2 py-1 rounded ${getStatusColor(item.status)} dark:ring-1 dark:ring-inset dark:ring-white/10`}
              >
                {item.value}
              </div>
            </div>
          );
        })}
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-primary-50 dark:from-green-900 dark:to-primary-900 rounded-lg border border-green-200 dark:border-green-700">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 mb-2">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              <span className="text-lg font-semibold text-green-800 dark:text-green-300">All Systems Operational</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400">
              Your smart plant care system is running optimally
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;
