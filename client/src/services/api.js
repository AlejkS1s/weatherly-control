import axios from 'axios';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging and auth
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    console.log('Response data:', response.data);
    return response;
  },
  (error) => {
    console.error('API Response Error Details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config?.url
    });
    
    // Handle specific error cases
    if (error.response?.status === 503) {
      throw new Error('Service temporarily unavailable. Please try again later.');
    } else if (error.response?.status === 404) {
      throw new Error('Resource not found.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    } else if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error. Please check your connection.');
    }
    
    throw error;
  }
);

/**
 * Sensor Data API
 */
export const sensorAPI = {
  // Get all sensor data for time range
  async getData(params = {}) {
    const response = await apiClient.get('/sensors/data', { params });
    // Server returns { success: true, data: [...] }, so we extract the data
    return response.data.success ? response.data.data : [];
  },

  // Get specific sensor field data
  async getFieldData(field, params = {}) {
    const response = await apiClient.get(`/sensors/data/${field}`, { params });
    return response.data.success ? response.data.data : [];
  },

  // Get latest sensor readings
  async getLatest() {
    const response = await apiClient.get('/sensors/latest');
    return response.data.success ? response.data.data : {};
  },

  // Get sensor system status
  async getStatus() {
    const response = await apiClient.get('/sensors/status');
    return response.data;
  },

  // Get summary statistics
  async getSummary(params = {}) {
    const response = await apiClient.get('/sensors/summary', { params });
    return response.data;
  },

  // Update sensor configuration
  async updateConfig(config) {
    const response = await apiClient.post('/sensors/config', config);
    return response.data;
  },

  // Export sensor data as CSV
  async exportData(params = {}) {
    const response = await apiClient.get('/sensors/export', { 
      params,
      responseType: 'blob'
    });
    return response.data;
  }
};

/**
 * Device Management API
 */
export const deviceAPI = {
  // Get all devices
  async getDevices() {
    const response = await apiClient.get('/devices');
    return response.data;
  },

  // Get specific device
  async getDevice(deviceId) {
    const response = await apiClient.get(`/devices/${deviceId}`);
    return response.data;
  },

  // Send command to device
  async sendCommand(deviceId, command) {
    const response = await apiClient.post(`/devices/${deviceId}/commands`, command);
    return response.data;
  },

  // Update device configuration
  async updateConfig(deviceId, config) {
    const response = await apiClient.post(`/devices/${deviceId}/config`, config);
    return response.data;
  },

  // Update device settings
  async updateSettings(deviceId, settings) {
    const response = await apiClient.post(`/devices/${deviceId}/settings`, settings);
    return response.data;
  },

  // Get device status
  async getStatus(deviceId) {
    const response = await apiClient.get(`/devices/${deviceId}/status`);
    return response.data;
  },

  // Discover devices
  async discover() {
    const response = await apiClient.post('/devices/discover');
    return response.data;
  },

  // Restart device
  async restart(deviceId) {
    const response = await apiClient.post(`/devices/${deviceId}/restart`);
    return response.data;
  },

  // Remove device
  async remove(deviceId) {
    const response = await apiClient.delete(`/devices/${deviceId}`);
    return response.data;
  }
};

/**
 * System API
 */
export const systemAPI = {
  // Health check
  async healthCheck() {
    const response = await apiClient.get('/health');
    return response.data;
  }
};

/**
 * Main API object with all endpoints
 */
export const api = {
  // Sensor data methods
  getSensorData: sensorAPI.getData,
  getSensorFieldData: sensorAPI.getFieldData,
  getLatestData: sensorAPI.getLatest,
  getSensorStatus: sensorAPI.getStatus,
  getSensorSummary: sensorAPI.getSummary,
  updateSensorConfig: sensorAPI.updateConfig,
  exportSensorData: sensorAPI.exportData,

  // Device methods  
  getDevices: deviceAPI.getDevices,
  getDevice: deviceAPI.getDevice,
  sendDeviceCommand: deviceAPI.sendCommand,
  updateDeviceConfig: deviceAPI.updateConfig,
  updateDeviceSettings: deviceAPI.updateSettings,
  getDeviceStatus: deviceAPI.getStatus,
  discoverDevices: deviceAPI.discover,
  restartDevice: deviceAPI.restart,
  removeDevice: deviceAPI.remove,

  // System methods
  healthCheck: systemAPI.healthCheck,
};

// Utility functions
export const apiUtils = {
  /**
   * Convert time range to human readable format
   */
  formatTimeRange(timeRange) {
    const units = {
      'm': 'minute',
      'h': 'hour', 
      'd': 'day',
      'w': 'week'
    };
    
    const match = timeRange.match(/^-?(\d+)([mhdw])$/);
    if (!match) return timeRange;
    
    const [, number, unit] = match;
    const unitName = units[unit];
    return `${number} ${unitName}${number > 1 ? 's' : ''}`;
  },

  /**
   * Format data for chart display
   */
  formatChartData(data) {
    if (!Array.isArray(data)) return [];
    
    return data.map(point => ({
      time: new Date(point.time).toLocaleTimeString(),
      timestamp: point.time,
      value: parseFloat(point.value).toFixed(2),
      rawValue: point.value
    }));
  },

  /**
   * Calculate data statistics
   */
  calculateStats(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return { min: 0, max: 0, avg: 0, count: 0 };
    }

    const values = data.map(point => point.value).filter(val => val != null);
    if (values.length === 0) {
      return { min: 0, max: 0, avg: 0, count: 0 };
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;

    return {
      min: parseFloat(min.toFixed(2)),
      max: parseFloat(max.toFixed(2)),
      avg: parseFloat(avg.toFixed(2)),
      count: values.length
    };
  },

  /**
   * Check if data is recent (within last 5 minutes)
   */
  isDataRecent(timestamp, thresholdMinutes = 5) {
    if (!timestamp) return false;
    
    const now = new Date();
    const dataTime = new Date(timestamp);
    const diffMinutes = (now - dataTime) / (1000 * 60);
    
    return diffMinutes <= thresholdMinutes;
  },

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    
    const date = new Date(timestamp);
    return date.toLocaleString();
  },

  /**
   * Get status color for UI
   */
  getStatusColor(status) {
    const colors = {
      online: 'green',
      offline: 'red',
      warning: 'yellow',
      unknown: 'gray'
    };
    
    return colors[status] || 'gray';
  }
};

export default api;