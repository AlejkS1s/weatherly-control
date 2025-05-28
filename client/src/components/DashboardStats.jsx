import React from 'react';
import { formatNumber } from '../utils/helpers';
import { TemperatureIcon, HumidityIcon, PressureIcon, AirQualityIcon } from './icons';

const StatCard = ({ title, value, unit, icon, color, trend }) => {
  const colorClasses = {
    blue: 'bg-blue-500 text-blue-100',
    green: 'bg-green-500 text-green-100',
    orange: 'bg-orange-500 text-orange-100',
    purple: 'bg-purple-500 text-purple-100'
  };

  const trendIcon = trend > 0 ? '↗' : trend < 0 ? '↘' : '→';
  const trendColor = trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-gray-500';

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(value)}
                </p>
                <span className="text-sm text-gray-500">{unit}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className={`flex items-center space-x-1 text-sm ${trendColor}`}>
          <span className="font-medium">{Math.abs(trend).toFixed(1)}%</span>
          <span className="text-lg">{trendIcon}</span>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Last hour</span>
          <span className="font-medium">Updated now</span>
        </div>
      </div>
    </div>
  );
};

const DashboardStats = ({ sensorData }) => {
  // Calculate latest values and trends from sensor data
  const getLatestValue = (type) => {
    if (!sensorData || sensorData.length === 0) return 0;
    const typeData = sensorData.filter(d => d.type === type);
    return typeData.length > 0 ? typeData[typeData.length - 1].value : 0;
  };

  const getTrend = (type) => {
    if (!sensorData || sensorData.length < 2) return 0;
    const typeData = sensorData.filter(d => d.type === type);
    if (typeData.length < 2) return 0;
    
    const latest = typeData[typeData.length - 1].value;
    const previous = typeData[typeData.length - 2].value;
    return previous !== 0 ? ((latest - previous) / previous) * 100 : 0;
  };

  const stats = [
    {
      title: 'Temperature',
      value: getLatestValue('temperature'),
      unit: '°C',
      color: 'orange',
      trend: getTrend('temperature'),
      icon: <TemperatureIcon />
    },
    {
      title: 'Humidity',
      value: getLatestValue('humidity'),
      unit: '%',
      color: 'blue',
      trend: getTrend('humidity'),
      icon: <HumidityIcon />
    },
    {
      title: 'Pressure',
      value: getLatestValue('pressure'),
      unit: 'hPa',
      color: 'purple',
      trend: getTrend('pressure'),
      icon: <PressureIcon />
    },
    {
      title: 'Air Quality',
      value: getLatestValue('air_quality') || 85,
      unit: 'AQI',
      color: 'green',
      trend: getTrend('air_quality') || -2.1,
      icon: <AirQualityIcon />
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default DashboardStats;