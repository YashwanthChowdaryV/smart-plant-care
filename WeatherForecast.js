import React from 'react';
import { Cloud, Sun, CloudRain } from 'lucide-react';

const WeatherForecast = () => {
  const forecast = [
    { day: 'Today', temp: '28°C', condition: 'Sunny', icon: Sun, humidity: '65%' },
    { day: 'Tomorrow', temp: '22°C', condition: 'Cloudy', icon: Cloud, humidity: '70%' },
    { day: 'Monday', temp: '26°C', condition: 'Sunny', icon: Sun, humidity: '60%' },
    { day: 'Tuesday', temp: '20°C', condition: 'Rainy', icon: CloudRain, humidity: '85%' },
    { day: 'Wednesday', temp: '23°C', condition: 'Cloudy', icon: Cloud, humidity: '68%' },
    { day: 'Thursday', temp: '25°C', condition: 'Sunny', icon: Sun, humidity: '62%' },
    { day: 'Friday', temp: '21°C', condition: 'Rainy', icon: CloudRain, humidity: '80%' },
  ];

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">7-Day Weather Forecast</h2>
      <div className="space-y-3">
        {forecast.map((day, index) => {
          const IconComponent = day.icon;
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <IconComponent className="w-5 h-5 text-primary-600" />
                <div>
                  <span className="font-medium text-gray-800">{day.day}</span>
                  <p className="text-sm text-gray-600">{day.condition}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-800">{day.temp}</div>
                <div className="text-sm text-gray-600">{day.humidity}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeatherForecast;
