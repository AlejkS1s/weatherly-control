import express from 'express';
import { 
  getAllEnvironmentalData, 
  getEnvironmentalData, 
  getLatestData, 
  testConnection 
} from '../services/influxdb.js';
import { 
  validateTimeRange, 
  validateSensorQuery, 
  validateSensorConfig 
} from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * GET /api/sensors/data
 * Get all environmental sensor data for a time range
 */
router.get('/data', validateTimeRange, asyncHandler(async (req, res) => {
  const { startTime, endTime, windowPeriod } = req.query;
  
  const data = await getAllEnvironmentalData(startTime, endTime, windowPeriod);
  
  res.json({
    success: true,
    data,
    meta: {
      startTime,
      endTime,
      windowPeriod,
      requestTime: new Date().toISOString()
    }
  });
}));

/**
 * GET /api/sensors/data/:field
 * Get specific sensor data (temperature, humidity, or pressure)
 */
router.get('/data/:field', validateSensorQuery, asyncHandler(async (req, res) => {
  const { field } = req.params;
  const { startTime, endTime, windowPeriod } = req.query;
  
  // Validate field parameter
  const validFields = ['temperature', 'humidity', 'pressure'];
  if (!validFields.includes(field)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid field parameter',
        validFields,
        provided: field
      }
    });
  }
  
  const data = await getEnvironmentalData(field, startTime, endTime, windowPeriod);
  
  res.json({
    success: true,
    data,
    meta: {
      field,
      startTime,
      endTime,
      windowPeriod,
      count: data.length,
      requestTime: new Date().toISOString()
    }
  });
}));

/**
 * GET /api/sensors/latest
 * Get latest sensor readings
 */
router.get('/latest', asyncHandler(async (req, res) => {
  const data = await getLatestData();
  
  // Check if we have recent data (within last 10 minutes)
  const now = new Date();
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
  
  const dataStatus = {};
  Object.keys(data).forEach(key => {
    const dataTime = new Date(data[key]?.time);
    dataStatus[key] = {
      ...data[key],
      isRecent: dataTime > tenMinutesAgo,
      ageMinutes: Math.round((now - dataTime) / (1000 * 60))
    };
  });
  
  res.json({
    success: true,
    data: dataStatus,
    meta: {
      requestTime: new Date().toISOString(),
      dataAvailable: Object.keys(data).length > 0,
      allDataRecent: Object.values(dataStatus).every(d => d.isRecent)
    }
  });
}));

/**
 * GET /api/sensors/status
 * Get sensor system status and health
 */
router.get('/status', asyncHandler(async (req, res) => {
  const influxDBConnected = await testConnection();
  const latestData = await getLatestData();
  
  // Calculate data freshness
  const now = new Date();
  const dataFreshness = {};
  
  Object.keys(latestData).forEach(key => {
    if (latestData[key]?.time) {
      const dataTime = new Date(latestData[key].time);
      dataFreshness[key] = {
        lastUpdate: latestData[key].time,
        minutesAgo: Math.round((now - dataTime) / (1000 * 60)),
        isHealthy: (now - dataTime) < 15 * 60 * 1000 // Healthy if < 15 minutes old
      };
    } else {
      dataFreshness[key] = {
        lastUpdate: null,
        minutesAgo: null,
        isHealthy: false
      };
    }
  });
  
  const overallHealth = influxDBConnected && 
    Object.values(dataFreshness).some(d => d.isHealthy);
  
  res.json({
    success: true,
    status: {
      overall: overallHealth ? 'healthy' : 'warning',
      influxDB: {
        connected: influxDBConnected,
        status: influxDBConnected ? 'online' : 'offline'
      },
      sensors: dataFreshness,
      lastCheck: new Date().toISOString()
    }
  });
}));

/**
 * GET /api/sensors/summary
 * Get summary statistics for sensor data
 */
router.get('/summary', validateTimeRange, asyncHandler(async (req, res) => {
  const { startTime, endTime, windowPeriod } = req.query;
  
  const data = await getAllEnvironmentalData(startTime, endTime, windowPeriod);
  
  // Calculate summary statistics
  const summary = {};
  
  ['temperature', 'humidity', 'pressure'].forEach(field => {
    if (data[field] && data[field].length > 0) {
      const values = data[field].map(d => d.value).filter(v => v != null);
      
      if (values.length > 0) {
        values.sort((a, b) => a - b);
        
        summary[field] = {
          count: values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((sum, val) => sum + val, 0) / values.length,
          median: values[Math.floor(values.length / 2)],
          latest: data[field][data[field].length - 1]?.value || null,
          latestTime: data[field][data[field].length - 1]?.time || null
        };
      }
    }
  });
  
  res.json({
    success: true,
    summary,
    meta: {
      timeRange: { startTime, endTime },
      windowPeriod,
      requestTime: new Date().toISOString()
    }
  });
}));

/**
 * POST /api/sensors/config
 * Update sensor configuration
 */
router.post('/config', validateSensorConfig, asyncHandler(async (req, res) => {
  const config = req.body;
  
  // Here you would typically save the configuration to a database
  // and send it to the device via MQTT
  
  // For now, we'll just return the configuration
  res.json({
    success: true,
    message: 'Sensor configuration updated',
    config,
    timestamp: new Date().toISOString()
  });
}));

/**
 * GET /api/sensors/export
 * Export sensor data as CSV
 */
router.get('/export', validateTimeRange, asyncHandler(async (req, res) => {
  const { startTime, endTime, windowPeriod, format = 'csv' } = req.query;
  
  if (format !== 'csv') {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Only CSV format is currently supported',
        supportedFormats: ['csv']
      }
    });
  }
  
  const data = await getAllEnvironmentalData(startTime, endTime, windowPeriod);
  
  // Convert to CSV format
  let csv = 'timestamp,temperature,humidity,pressure\n';
  
  // Create a map of timestamps to values
  const timeValueMap = new Map();
  
  ['temperature', 'humidity', 'pressure'].forEach(field => {
    if (data[field]) {
      data[field].forEach(point => {
        const timeKey = point.time;
        if (!timeValueMap.has(timeKey)) {
          timeValueMap.set(timeKey, {});
        }
        timeValueMap.get(timeKey)[field] = point.value;
      });
    }
  });
  
  // Sort by timestamp and create CSV rows
  const sortedTimes = Array.from(timeValueMap.keys()).sort();
  sortedTimes.forEach(time => {
    const values = timeValueMap.get(time);
    csv += `${time},${values.temperature || ''},${values.humidity || ''},${values.pressure || ''}\n`;
  });
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="sensor-data-${Date.now()}.csv"`);
  res.send(csv);
}));

export default router;