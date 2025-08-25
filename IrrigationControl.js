import React, { useState, useEffect } from 'react';
import { Droplets, Power, Clock } from 'lucide-react';

const IrrigationControl = ({ isAutoModeInitial = true, pumpActiveInitial = false, predictedSecondsUntilDry }) => {
  const [isAuto, setIsAuto] = useState(isAutoModeInitial);
  const [pumpActive, setPumpActive] = useState(pumpActiveInitial);

  // Calculate next watering time display from predictedSecondsUntilDry (seconds)
  const [nextWateringTime, setNextWateringTime] = useState(null);

  useEffect(() => {
    if (predictedSecondsUntilDry && predictedSecondsUntilDry > 0) {
      const nextTime = new Date(Date.now() + predictedSecondsUntilDry * 1000);
      setNextWateringTime(nextTime);
    } else {
      setNextWateringTime(null);
    }
  }, [predictedSecondsUntilDry]);

  // Handler for mode toggle: in a real app you might sync with backend/Firebase here
  const toggleMode = () => {
    setIsAuto(prev => !prev);
    // If switching to Auto, automatically set pump inactive
    if (isAuto) {
      setPumpActive(false);
    }
  };

  // Handler for pump activation toggle (only enabled in manual mode)
  const togglePump = () => {
    if (!isAuto) {
      setPumpActive(prev => !prev);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-6">
        <Droplets className="w-6 h-6 text-primary-600" />
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Irrigation Controls</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg dark:bg-primary-900">
          <div>
            <h3 className="font-medium text-gray-800 dark:text-primary-200">System Mode</h3>
            <p className="text-sm text-gray-600 dark:text-primary-300">Smart automatic adjustments</p>
          </div>
          <button
            onClick={toggleMode}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isAuto ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
            aria-pressed={isAuto}
          >
            {isAuto ? 'AUTO' : 'MANUAL'}
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
          <div className="flex items-center space-x-3">
            <Power className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <div>
              <h3 className="font-medium text-gray-800 dark:text-primary-200">Pump Control</h3>
              <p className="text-sm text-gray-600 dark:text-primary-300">
                {isAuto ? 'AUTO MODE ACTIVE' : 'MANUAL CONTROL'}
              </p>
            </div>
          </div>
          <button
            onClick={togglePump}
            disabled={isAuto}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              pumpActive ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            } ${isAuto ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-pressed={pumpActive}
          >
            {pumpActive ? 'ACTIVE' : 'INACTIVE'}
          </button>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg dark:bg-blue-900">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-medium text-gray-800 dark:text-blue-200">Next Scheduled Watering</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-blue-300">
            {nextWateringTime
              ? nextWateringTime.toLocaleString()
              : 'Not scheduled; soil moisture stable or insufficient data'}
            {' '}
            (Auto mode)
          </p>
        </div>
      </div>
    </div>
  );
};

export default IrrigationControl;
