import express from 'express';
import { 
  sendDeviceCommand, 
  sendDeviceConfig, 
  isConnected as isMQTTConnected 
} from '../services/mqtt.js';
import { 
  validateDeviceCommand, 
  validateDeviceConfig, 
  validateGeneralSettings 
} from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// In-memory device registry (in production, this would be in a database)
const deviceRegistry = new Map();

/**
 * GET /api/devices
 * Get list of all registered devices
 */
router.get('/', asyncHandler(async (req, res) => {
  const devices = Array.from(deviceRegistry.values());
  
  res.json({
    success: true,
    devices,
    meta: {
      count: devices.length,
      mqttConnected: isMQTTConnected(),
      timestamp: new Date().toISOString()
    }
  });
}));

/**
 * GET /api/devices/:deviceId
 * Get specific device information
 */
router.get('/:deviceId', asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  
  const device = deviceRegistry.get(deviceId);
  
  if (!device) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Device not found',
        deviceId
      }
    });
  }
  
  res.json({
    success: true,
    device,
    timestamp: new Date().toISOString()
  });
}));

/**
 * POST /api/devices/:deviceId/commands
 * Send command to specific device
 */
router.post('/:deviceId/commands', validateDeviceCommand, asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const commandData = req.body;
  
  if (!isMQTTConnected()) {
    return res.status(503).json({
      success: false,
      error: {
        message: 'MQTT broker not connected',
        status: 'service_unavailable'
      }
    });
  }
  
  // Add device ID to command
  const command = {
    ...commandData,
    deviceId,
    timestamp: new Date().toISOString(),
    id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
  
  try {
    await sendDeviceCommand(command);
    
    // Update device last command timestamp
    if (deviceRegistry.has(deviceId)) {
      const device = deviceRegistry.get(deviceId);
      device.lastCommand = {
        command: command.command,
        timestamp: command.timestamp,
        id: command.id
      };
      deviceRegistry.set(deviceId, device);
    }
    
    res.json({
      success: true,
      message: 'Command sent successfully',
      command: {
        id: command.id,
        command: command.command,
        deviceId,
        timestamp: command.timestamp
      }
    });
  } catch (error) {
    console.error('Error sending device command:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to send command',
        details: error.message
      }
    });
  }
}));

/**
 * POST /api/devices/:deviceId/config
 * Update device configuration
 */
router.post('/:deviceId/config', validateDeviceConfig, asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const configData = req.body;
  
  if (!isMQTTConnected()) {
    return res.status(503).json({
      success: false,
      error: {
        message: 'MQTT broker not connected',
        status: 'service_unavailable'
      }
    });
  }
  
  // Add device ID to configuration
  const config = {
    ...configData,
    deviceId,
    timestamp: new Date().toISOString(),
    id: `cfg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
  
  try {
    await sendDeviceConfig(config);
    
    // Update device configuration in registry
    if (deviceRegistry.has(deviceId)) {
      const device = deviceRegistry.get(deviceId);
      device.lastConfig = {
        configType: config.configType,
        timestamp: config.timestamp,
        id: config.id
      };
      device.configuration = { ...device.configuration, ...config.settings };
      deviceRegistry.set(deviceId, device);
    }
    
    res.json({
      success: true,
      message: 'Configuration updated successfully',
      config: {
        id: config.id,
        configType: config.configType,
        deviceId,
        timestamp: config.timestamp
      }
    });
  } catch (error) {
    console.error('Error updating device configuration:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update configuration',
        details: error.message
      }
    });
  }
}));

/**
 * POST /api/devices/:deviceId/settings
 * Update general device settings
 */
router.post('/:deviceId/settings', validateGeneralSettings, asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const settings = req.body;
  
  if (!isMQTTConnected()) {
    return res.status(503).json({
      success: false,
      error: {
        message: 'MQTT broker not connected',
        status: 'service_unavailable'
      }
    });
  }
  
  // Send as configuration update
  const config = {
    configType: 'general_settings',
    settings,
    deviceId,
    applyImmediately: true
  };
  
  try {
    await sendDeviceConfig(config);
    
    // Update device in registry
    let device = deviceRegistry.get(deviceId) || {
      id: deviceId,
      name: settings.deviceName || deviceId,
      status: 'unknown',
      lastSeen: null,
      configuration: {}
    };
    
    device.configuration = { ...device.configuration, ...settings };
    device.name = settings.deviceName || device.name;
    device.lastUpdated = new Date().toISOString();
    
    deviceRegistry.set(deviceId, device);
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      device,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating device settings:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update settings',
        details: error.message
      }
    });
  }
}));

/**
 * GET /api/devices/:deviceId/status
 * Get device status and health information
 */
router.get('/:deviceId/status', asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  
  const device = deviceRegistry.get(deviceId);
  
  if (!device) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Device not found',
        deviceId
      }
    });
  }
  
  // Calculate device health based on last seen time
  const now = new Date();
  const lastSeen = device.lastSeen ? new Date(device.lastSeen) : null;
  const minutesSinceLastSeen = lastSeen ? Math.round((now - lastSeen) / (1000 * 60)) : null;
  
  const status = {
    ...device,
    health: {
      status: minutesSinceLastSeen === null ? 'unknown' :
              minutesSinceLastSeen < 5 ? 'online' :
              minutesSinceLastSeen < 15 ? 'warning' : 'offline',
      lastSeenMinutesAgo: minutesSinceLastSeen,
      mqttConnected: isMQTTConnected()
    },
    timestamp: new Date().toISOString()
  };
  
  res.json({
    success: true,
    status
  });
}));

/**
 * POST /api/devices/discover
 * Trigger device discovery
 */
router.post('/discover', asyncHandler(async (req, res) => {
  if (!isMQTTConnected()) {
    return res.status(503).json({
      success: false,
      error: {
        message: 'MQTT broker not connected',
        status: 'service_unavailable'
      }
    });
  }
  
  const discoveryCommand = {
    command: 'discover',
    timestamp: new Date().toISOString(),
    id: `discovery_${Date.now()}`
  };
  
  try {
    await sendDeviceCommand(discoveryCommand);
    
    res.json({
      success: true,
      message: 'Device discovery initiated',
      discoveryId: discoveryCommand.id,
      timestamp: discoveryCommand.timestamp
    });
  } catch (error) {
    console.error('Error initiating device discovery:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to initiate device discovery',
        details: error.message
      }
    });
  }
}));

/**
 * POST /api/devices/:deviceId/restart
 * Restart specific device
 */
router.post('/:deviceId/restart', asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  
  if (!isMQTTConnected()) {
    return res.status(503).json({
      success: false,
      error: {
        message: 'MQTT broker not connected',
        status: 'service_unavailable'
      }
    });
  }
  
  const restartCommand = {
    command: 'restart',
    deviceId,
    timestamp: new Date().toISOString(),
    parameters: { 
      delay: 2000 // 2 second delay before restart
    }
  };
  
  try {
    await sendDeviceCommand(restartCommand);
    
    // Update device status
    if (deviceRegistry.has(deviceId)) {
      const device = deviceRegistry.get(deviceId);
      device.lastCommand = {
        command: 'restart',
        timestamp: restartCommand.timestamp
      };
      deviceRegistry.set(deviceId, device);
    }
    
    res.json({
      success: true,
      message: 'Restart command sent',
      deviceId,
      timestamp: restartCommand.timestamp
    });
  } catch (error) {
    console.error('Error sending restart command:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to send restart command',
        details: error.message
      }
    });
  }
}));

/**
 * DELETE /api/devices/:deviceId
 * Remove device from registry
 */
router.delete('/:deviceId', asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  
  if (!deviceRegistry.has(deviceId)) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Device not found',
        deviceId
      }
    });
  }
  
  deviceRegistry.delete(deviceId);
  
  res.json({
    success: true,
    message: 'Device removed from registry',
    deviceId,
    timestamp: new Date().toISOString()
  });
}));

/**
 * Utility function to register or update device
 * This would typically be called when receiving MQTT messages
 */
export function registerDevice(deviceId, deviceInfo) {
  const existingDevice = deviceRegistry.get(deviceId) || {};
  
  const device = {
    ...existingDevice,
    id: deviceId,
    name: deviceInfo.name || existingDevice.name || deviceId,
    status: deviceInfo.status || 'online',
    lastSeen: new Date().toISOString(),
    batteryLevel: deviceInfo.batteryLevel,
    signalStrength: deviceInfo.signalStrength,
    uptime: deviceInfo.uptime,
    version: deviceInfo.version,
    configuration: { ...existingDevice.configuration, ...deviceInfo.configuration }
  };
  
  deviceRegistry.set(deviceId, device);
  return device;
}

/**
 * Utility function to update device last seen timestamp
 */
export function updateDeviceLastSeen(deviceId) {
  if (deviceRegistry.has(deviceId)) {
    const device = deviceRegistry.get(deviceId);
    device.lastSeen = new Date().toISOString();
    device.status = 'online';
    deviceRegistry.set(deviceId, device);
  }
}

export default router;