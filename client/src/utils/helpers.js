import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import clsx from 'clsx';

/**
 * Utility functions for data formatting and manipulation
 */

/**
 * Format a number to specified decimal places
 * @param {number} value - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number
 */
export function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  return parseFloat(value).toFixed(decimals);
}

/**
 * Format timestamp for display
 * @param {string|Date} timestamp - Timestamp to format
 * @param {string} formatStr - Format string (default: 'PPpp')
 * @returns {string} Formatted timestamp
 */
export function formatTimestamp(timestamp, formatStr = 'PPpp') {
  if (!timestamp) return 'N/A';
  
  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
    if (!isValid(date)) return 'Invalid Date';
    
    return format(date, formatStr);
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Invalid Date';
  }
}

/**
 * Format relative time (e.g., "2 minutes ago")
 * @param {string|Date} timestamp - Timestamp
 * @returns {string} Relative time string
 */
export function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Unknown';
  
  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
    if (!isValid(date)) return 'Invalid Date';
    
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Unknown';
  }
}

/**
 * Check if data is recent (within threshold)
 * @param {string|Date} timestamp - Timestamp to check
 * @param {number} thresholdMinutes - Threshold in minutes (default: 5)
 * @returns {boolean} Whether data is recent
 */
export function isDataRecent(timestamp, thresholdMinutes = 5) {
  if (!timestamp) return false;
  
  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
    if (!isValid(date)) return false;
    
    const now = new Date();
    const diffMinutes = (now - date) / (1000 * 60);
    
    return diffMinutes <= thresholdMinutes;
  } catch {
    return false;
  }
}

/**
 * Get status color based on value
 * @param {string} status - Status value
 * @returns {string} Color class or hex color
 */
export function getStatusColor(status) {
  const colors = {
    online: '#10b981',      // green
    offline: '#ef4444',     // red
    warning: '#f59e0b',     // yellow
    unknown: '#6b7280',     // gray
    healthy: '#10b981',     // green
    error: '#ef4444',       // red
    connecting: '#3b82f6'   // blue
  };
  
  return colors[status?.toLowerCase()] || colors.unknown;
}

/**
 * Get status text color for dark/light themes
 * @param {string} status - Status value
 * @param {boolean} isDark - Whether using dark theme
 * @returns {string} Tailwind color class
 */
export function getStatusTextColor(status, isDark = false) {
  const lightColors = {
    online: 'text-green-600',
    offline: 'text-red-600',
    warning: 'text-yellow-600',
    unknown: 'text-gray-600',
    healthy: 'text-green-600',
    error: 'text-red-600',
    connecting: 'text-blue-600'
  };
  
  const darkColors = {
    online: 'text-green-400',
    offline: 'text-red-400',
    warning: 'text-yellow-400',
    unknown: 'text-gray-400',
    healthy: 'text-green-400',
    error: 'text-red-400',
    connecting: 'text-blue-400'
  };
  
  const colors = isDark ? darkColors : lightColors;
  return colors[status?.toLowerCase()] || colors.unknown;
}

/**
 * Calculate statistics for an array of values
 * @param {Array} values - Array of numeric values
 * @returns {Object} Statistics object
 */
export function calculateStats(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return {
      min: 0,
      max: 0,
      avg: 0,
      median: 0,
      count: 0
    };
  }

  const numericValues = values
    .map(v => typeof v === 'object' ? v.value : v)
    .filter(v => v !== null && v !== undefined && !isNaN(v))
    .map(Number);

  if (numericValues.length === 0) {
    return {
      min: 0,
      max: 0,
      avg: 0,
      median: 0,
      count: 0
    };
  }

  const sorted = numericValues.slice().sort((a, b) => a - b);
  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);
  const avg = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];

  return {
    min: parseFloat(min.toFixed(2)),
    max: parseFloat(max.toFixed(2)),
    avg: parseFloat(avg.toFixed(2)),
    median: parseFloat(median.toFixed(2)),
    count: numericValues.length
  };
}

/**
 * Convert time range string to milliseconds
 * @param {string} timeRange - Time range (e.g., '1h', '30m', '1d')
 * @returns {number} Milliseconds
 */
export function timeRangeToMs(timeRange) {
  const units = {
    's': 1000,
    'm': 60 * 1000,
    'h': 60 * 60 * 1000,
    'd': 24 * 60 * 60 * 1000,
    'w': 7 * 24 * 60 * 60 * 1000
  };

  const match = timeRange.match(/^(\d+)([smhdw])$/);
  if (!match) return 0;

  const [, number, unit] = match;
  return parseInt(number) * (units[unit] || 0);
}

/**
 * Format time range for display
 * @param {string} timeRange - Time range string
 * @returns {string} Formatted time range
 */
export function formatTimeRange(timeRange) {
  const units = {
    's': 'second',
    'm': 'minute',
    'h': 'hour',
    'd': 'day',
    'w': 'week'
  };

  const match = timeRange.match(/^-?(\d+)([smhdw])$/);
  if (!match) return timeRange;

  const [, number, unit] = match;
  const unitName = units[unit];
  const num = parseInt(number);
  
  return `${num} ${unitName}${num !== 1 ? 's' : ''}`;
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Generate random ID
 * @param {number} length - Length of ID (default: 8)
 * @returns {string} Random ID
 */
export function generateId(length = 8) {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Deep clone object
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone(obj[key]);
    });
    return cloned;
  }
}

/**
 * Check if value is empty
 * @param {*} value - Value to check
 * @returns {boolean} Whether value is empty
 */
export function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize string for HTML display
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Convert bytes to human readable format
 * @param {number} bytes - Bytes to convert
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted bytes string
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Create className string using clsx
 * @param {...*} inputs - Class name inputs
 * @returns {string} Combined class names
 */
export function cn(...inputs) {
  return clsx(inputs);
}

/**
 * Get sensor unit symbol
 * @param {string} sensorType - Type of sensor
 * @returns {string} Unit symbol
 */
export function getSensorUnit(sensorType) {
  const units = {
    temperature: '°C',
    humidity: '%',
    pressure: 'hPa',
    voltage: 'V',
    current: 'A',
    power: 'W'
  };
  
  return units[sensorType?.toLowerCase()] || '';
}

/**
 * Get sensor icon name
 * @param {string} sensorType - Type of sensor
 * @returns {string} Icon name
 */
export function getSensorIcon(sensorType) {
  const icons = {
    temperature: 'Thermometer',
    humidity: 'Droplets',
    pressure: 'Gauge',
    voltage: 'Zap',
    current: 'Zap',
    power: 'Power'
  };
  
  return icons[sensorType?.toLowerCase()] || 'Activity';
}

/**
 * Validate sensor value range
 * @param {string} sensorType - Type of sensor
 * @param {number} value - Sensor value
 * @returns {Object} Validation result
 */
export function validateSensorValue(sensorType, value) {
  const ranges = {
    temperature: { min: -40, max: 85, unit: '°C' },
    humidity: { min: 0, max: 100, unit: '%' },
    pressure: { min: 300, max: 1100, unit: 'hPa' }
  };
  
  const range = ranges[sensorType?.toLowerCase()];
  if (!range) {
    return { isValid: true, message: '' };
  }
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    return { isValid: false, message: 'Invalid number' };
  }
  
  if (numValue < range.min || numValue > range.max) {
    return {
      isValid: false,
      message: `Value should be between ${range.min} and ${range.max} ${range.unit}`
    };
  }
  
  return { isValid: true, message: '' };
}

export default {
  formatNumber,
  formatTimestamp,
  formatRelativeTime,
  isDataRecent,
  getStatusColor,
  getStatusTextColor,
  calculateStats,
  timeRangeToMs,
  formatTimeRange,
  debounce,
  throttle,
  generateId,
  deepClone,
  isEmpty,
  isValidEmail,
  sanitizeString,
  formatBytes,
  cn,
  getSensorUnit,
  getSensorIcon,
  validateSensorValue
};