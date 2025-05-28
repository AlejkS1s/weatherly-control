import Joi from 'joi';
import { ValidationError } from './errorHandler.js';

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Property to validate (body, query, params)
 * @returns {Function} Express middleware function
 */
export function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      throw new ValidationError('Validation failed', details);
    }

    // Replace the original property with the validated and cleaned value
    req[property] = value;
    next();
  };
}

/**
 * Validation schemas
 */
export const schemas = {
  // Time range validation
  timeRange: Joi.object({
    startTime: Joi.string().default('-1h'),
    endTime: Joi.string().default('now()'),
    windowPeriod: Joi.string().pattern(/^\d+[smhdw]$/).default('5m')
  }),

  // Sensor data query validation
  sensorQuery: Joi.object({
    field: Joi.string().valid('temperature', 'humidity', 'pressure').required(),
    startTime: Joi.string().default('-1h'),
    endTime: Joi.string().default('now()'),
    windowPeriod: Joi.string().pattern(/^\d+[smhdw]$/).default('5m')
  }),

  // Device command validation
  deviceCommand: Joi.object({
    command: Joi.string().required(),
    parameters: Joi.object().default({}),
    deviceId: Joi.string().optional(),
    priority: Joi.string().valid('low', 'normal', 'high').default('normal'),
    timeout: Joi.number().integer().min(1000).max(30000).default(5000)
  }),

  // Device configuration validation
  deviceConfig: Joi.object({
    configType: Joi.string().required(),
    settings: Joi.object().required(),
    deviceId: Joi.string().optional(),
    applyImmediately: Joi.boolean().default(true)
  }),

  // Sensor configuration
  sensorConfig: Joi.object({
    sensorType: Joi.string().valid('temperature', 'humidity', 'pressure').required(),
    enabled: Joi.boolean().default(true),
    sampleRate: Joi.number().integer().min(1).max(3600).default(60), // seconds
    threshold: Joi.object({
      min: Joi.number().optional(),
      max: Joi.number().optional()
    }).optional(),
    calibration: Joi.object({
      offset: Joi.number().default(0),
      multiplier: Joi.number().default(1)
    }).optional()
  }),

  // General settings validation
  generalSettings: Joi.object({
    deviceName: Joi.string().min(1).max(50).optional(),
    location: Joi.string().min(1).max(100).optional(),
    reportingInterval: Joi.number().integer().min(10).max(3600).default(60),
    wifiSSID: Joi.string().min(1).max(32).optional(),
    wifiPassword: Joi.string().min(8).max(64).optional(),
    deepSleepEnabled: Joi.boolean().default(false),
    deepSleepDuration: Joi.number().integer().min(60).max(86400).default(300)
  }),

  // Pagination validation
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(1000).default(100),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  // Date range validation
  dateRange: Joi.object({
    from: Joi.date().iso().required(),
    to: Joi.date().iso().min(Joi.ref('from')).required()
  }),

  // Device status validation
  deviceStatus: Joi.object({
    online: Joi.boolean().required(),
    lastSeen: Joi.date().iso().required(),
    batteryLevel: Joi.number().min(0).max(100).optional(),
    signalStrength: Joi.number().min(-100).max(0).optional(),
    errorCount: Joi.number().integer().min(0).default(0),
    uptime: Joi.number().integer().min(0).optional()
  })
};

/**
 * Specific validation middleware functions
 */
export const validateTimeRange = validate(schemas.timeRange, 'query');
export const validateSensorQuery = validate(schemas.sensorQuery, 'query');
export const validateDeviceCommand = validate(schemas.deviceCommand, 'body');
export const validateDeviceConfig = validate(schemas.deviceConfig, 'body');
export const validateSensorConfig = validate(schemas.sensorConfig, 'body');
export const validateGeneralSettings = validate(schemas.generalSettings, 'body');
export const validatePagination = validate(schemas.pagination, 'query');
export const validateDateRange = validate(schemas.dateRange, 'query');

/**
 * Custom validation functions
 */

/**
 * Validate MQTT topic format
 * @param {string} topic - MQTT topic string
 * @returns {boolean} Whether topic is valid
 */
export function isValidMQTTTopic(topic) {
  if (!topic || typeof topic !== 'string') return false;
  
  // MQTT topic rules:
  // - Cannot be empty
  // - Cannot contain null character
  // - Cannot start or end with '/'
  // - Cannot contain '+' or '#' in publish topics
  const invalidChars = /[\x00+#]/;
  const startsOrEndsWithSlash = /^\/|\/$/;
  
  return !invalidChars.test(topic) && !startsOrEndsWithSlash.test(topic);
}

/**
 * Validate InfluxDB field name
 * @param {string} field - Field name
 * @returns {boolean} Whether field name is valid
 */
export function isValidInfluxField(field) {
  if (!field || typeof field !== 'string') return false;
  
  // InfluxDB field name rules:
  // - Cannot be empty
  // - Cannot start with underscore (reserved)
  // - Should contain only alphanumeric, underscore, and hyphen
  const validPattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
  
  return validPattern.test(field);
}

/**
 * Validate time range string
 * @param {string} timeStr - Time range string (e.g., '1h', '30m', '1d')
 * @returns {boolean} Whether time string is valid
 */
export function isValidTimeRange(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return false;
  
  // Valid formats: -1h, -30m, -1d, -1w, etc.
  const validPattern = /^-?\d+[smhdw]$/;
  
  return validPattern.test(timeStr) || timeStr === 'now()';
}

/**
 * Sanitize string input
 * @param {string} input - Input string
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized string
 */
export function sanitizeString(input, maxLength = 255) {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>'"&]/g, ''); // Remove potentially dangerous characters
}

/**
 * Validate and sanitize device ID
 * @param {string} deviceId - Device ID
 * @returns {string} Sanitized device ID
 */
export function sanitizeDeviceId(deviceId) {
  if (!deviceId || typeof deviceId !== 'string') return null;
  
  // Device ID should be alphanumeric with hyphens and underscores
  const sanitized = deviceId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50);
  
  return sanitized.length > 0 ? sanitized : null;
}