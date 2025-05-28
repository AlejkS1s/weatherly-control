import { useState, useEffect } from 'react';
import { Header, Footer, TimeSeriesChart, DeviceControlPanel, DashboardStats, ErrorDisplay, LoadingDisplay } from './components';
import { useSensorData } from './hooks';

function App() {
  const [error, setError] = useState(null);

  // Use custom hooks for data management
  const { 
    sensorData, 
    loading: sensorLoading, 
    error: sensorError 
  } = useSensorData('1h');

  // Combine sensor error with any connection errors
  useEffect(() => {
    if (sensorError) {
      setError(sensorError);
    }
  }, [sensorError]);

  // Create array of sensor data for components
  const formatSensorDataForChart = () => {
    // Handle case where sensorData is not available yet
    if (!sensorData || typeof sensorData !== 'object') return [];
    
    // The server returns data as { temperature: [...], humidity: [...], pressure: [...] }
    // We need to flatten this into a single array
    const flattenedData = [];
    
    if (sensorData.temperature && Array.isArray(sensorData.temperature)) {
      flattenedData.push(...sensorData.temperature.map(item => ({
        timestamp: item.time,
        type: 'temperature',
        value: item.value,
        field: item.field,
        measurement: item.measurement
      })));
    }
    
    if (sensorData.humidity && Array.isArray(sensorData.humidity)) {
      flattenedData.push(...sensorData.humidity.map(item => ({
        timestamp: item.time,
        type: 'humidity',
        value: item.value,
        field: item.field,
        measurement: item.measurement
      })));
    }
    
    if (sensorData.pressure && Array.isArray(sensorData.pressure)) {
      flattenedData.push(...sensorData.pressure.map(item => ({
        timestamp: item.time,
        type: 'pressure',
        value: item.value,
        field: item.field,
        measurement: item.measurement
      })));
    }
    
    // Sort by timestamp
    flattenedData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    return flattenedData;
  };

  const chartData = formatSensorDataForChart();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-6 flex-1">
        {/* Error Display - Above Everything */}
        <ErrorDisplay error={error} onDismiss={() => setError(null)} />

        {/* Loading Display - Above Everything */}
        <LoadingDisplay loading={sensorLoading} />

        {/* Dashboard Stats */}
        <div className="mb-8">
          <DashboardStats sensorData={chartData} />
        </div>

        {/* Time Series Charts - Three Separate Charts */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TimeSeriesChart
            sensorData={chartData.filter(d => d.type === 'temperature')}
            title="Temperature"
            sensorType="temperature"
            color="#ef4444"
            unit="°C"
          />
          <TimeSeriesChart
            sensorData={chartData.filter(d => d.type === 'humidity')}
            title="Humidity"
            sensorType="humidity"
            color="#3b82f6"
            unit="%"
          />
          <TimeSeriesChart
            sensorData={chartData.filter(d => d.type === 'pressure')}
            title="Pressure"
            sensorType="pressure"
            color="#10b981"
            unit="hPa"
          />
        </div>

        {/* Device Control Panel - Full Width */}
        <div className="mb-8">
          <DeviceControlPanel />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
