import mqtt from 'mqtt';
import dotenv from 'dotenv';

dotenv.config();

const MQTT_CONFIG = {
  host: process.env.MQTT_BROKER_HOST,
  port: parseInt(process.env.MQTT_BROKER_PORT),
  username: process.env.MQTT_USERNAME_LOCAL,
  password: process.env.MQTT_PASSWORD_LOCAL,
  keepalive: 60,
  reconnectPeriod: 1000,
  clean: true
};

// MQTT Topics
export const TOPICS = {
  SENSOR_DATA: 'sensors/data',
  SENSOR_COMMANDS: 'sensors/commands',
  SENSOR_CONFIG: 'sensors/config',
  DEVICE_STATUS: 'devices/status',
  DEVICE_HEARTBEAT: 'devices/heartbeat'
};

let mqttClient = null;
let messageHandlers = new Map();

/**
 * Initialize MQTT client connection
 * @returns {Promise<Object>} MQTT client instance
 */
export async function initializeMQTT() {
  return new Promise((resolve, reject) => {
    try {
      const brokerUrl = `mqtt://${MQTT_CONFIG.host}:${MQTT_CONFIG.port}`;
      
      console.log(`🔌 Connecting to MQTT broker: ${brokerUrl}`);
      
      mqttClient = mqtt.connect(brokerUrl, {
        username: MQTT_CONFIG.username,
        password: MQTT_CONFIG.password,
        keepalive: MQTT_CONFIG.keepalive,
        reconnectPeriod: MQTT_CONFIG.reconnectPeriod,
        clean: MQTT_CONFIG.clean
      });

      mqttClient.on('connect', () => {
        console.log('✅ Connected to MQTT broker');
        
        // Subscribe to essential topics
        const topicsToSubscribe = [
          TOPICS.SENSOR_DATA,
          TOPICS.DEVICE_STATUS,
          TOPICS.DEVICE_HEARTBEAT
        ];
        
        topicsToSubscribe.forEach(topic => {
          mqttClient.subscribe(topic, (err) => {
            if (err) {
              console.error(`❌ Failed to subscribe to ${topic}:`, err);
            } else {
              console.log(`📡 Subscribed to topic: ${topic}`);
            }
          });
        });
        
        resolve(mqttClient);
      });

      mqttClient.on('error', (error) => {
        console.error('❌ MQTT connection error:', error);
        reject(error);
      });

      mqttClient.on('message', (topic, message) => {
        try {
          const messageStr = message.toString();
          console.log(`📨 Received message on ${topic}:`, messageStr);
          
          // Parse JSON message
          let parsedMessage;
          try {
            parsedMessage = JSON.parse(messageStr);
          } catch (parseError) {
            console.warn('⚠️ Failed to parse message as JSON:', messageStr);
            parsedMessage = { raw: messageStr };
          }
          
          // Call registered handlers for this topic
          const handlers = messageHandlers.get(topic) || [];
          handlers.forEach(handler => {
            try {
              handler(parsedMessage, topic);
            } catch (handlerError) {
              console.error('❌ Error in message handler:', handlerError);
            }
          });
          
        } catch (error) {
          console.error('❌ Error processing MQTT message:', error);
        }
      });

      mqttClient.on('reconnect', () => {
        console.log('🔄 Reconnecting to MQTT broker...');
      });

      mqttClient.on('close', () => {
        console.log('🔌 MQTT connection closed');
      });

      mqttClient.on('offline', () => {
        console.log('📴 MQTT client offline');
      });

    } catch (error) {
      console.error('❌ Failed to initialize MQTT:', error);
      reject(error);
    }
  });
}

/**
 * Publish message to MQTT topic
 * @param {string} topic - MQTT topic
 * @param {Object|string} message - Message to publish
 * @param {Object} options - Publish options
 * @returns {Promise<void>}
 */
export async function publishMessage(topic, message, options = {}) {
  return new Promise((resolve, reject) => {
    if (!mqttClient || !mqttClient.connected) {
      reject(new Error('MQTT client not connected'));
      return;
    }

    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
    
    mqttClient.publish(topic, messageStr, {
      qos: options.qos || 0,
      retain: options.retain || false,
      ...options
    }, (error) => {
      if (error) {
        console.error(`❌ Failed to publish to ${topic}:`, error);
        reject(error);
      } else {
        console.log(`📤 Published to ${topic}:`, messageStr);
        resolve();
      }
    });
  });
}

/**
 * Subscribe to MQTT topic
 * @param {string} topic - MQTT topic
 * @param {Function} handler - Message handler function
 * @returns {Promise<void>}
 */
export async function subscribeToTopic(topic, handler) {
  return new Promise((resolve, reject) => {
    if (!mqttClient) {
      reject(new Error('MQTT client not initialized'));
      return;
    }

    // Add handler to handlers map
    if (!messageHandlers.has(topic)) {
      messageHandlers.set(topic, []);
    }
    messageHandlers.get(topic).push(handler);

    // Subscribe to topic if not already subscribed
    mqttClient.subscribe(topic, (error) => {
      if (error) {
        console.error(`❌ Failed to subscribe to ${topic}:`, error);
        reject(error);
      } else {
        console.log(`📡 Subscribed to topic: ${topic}`);
        resolve();
      }
    });
  });
}

/**
 * Unsubscribe from MQTT topic
 * @param {string} topic - MQTT topic
 * @param {Function} handler - Specific handler to remove (optional)
 * @returns {Promise<void>}
 */
export async function unsubscribeFromTopic(topic, handler = null) {
  return new Promise((resolve, reject) => {
    if (!mqttClient) {
      reject(new Error('MQTT client not initialized'));
      return;
    }

    // Remove specific handler or all handlers
    if (handler) {
      const handlers = messageHandlers.get(topic) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
      if (handlers.length === 0) {
        messageHandlers.delete(topic);
      }
    } else {
      messageHandlers.delete(topic);
    }

    // Unsubscribe from topic if no handlers left
    if (!messageHandlers.has(topic)) {
      mqttClient.unsubscribe(topic, (error) => {
        if (error) {
          console.error(`❌ Failed to unsubscribe from ${topic}:`, error);
          reject(error);
        } else {
          console.log(`📡 Unsubscribed from topic: ${topic}`);
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

/**
 * Send command to IoT device
 * @param {Object} command - Command object
 * @returns {Promise<void>}
 */
export async function sendDeviceCommand(command) {
  const commandMessage = {
    timestamp: new Date().toISOString(),
    id: Date.now().toString(),
    ...command
  };

  await publishMessage(TOPICS.SENSOR_COMMANDS, commandMessage);
}

/**
 * Send configuration to IoT device
 * @param {Object} config - Configuration object
 * @returns {Promise<void>}
 */
export async function sendDeviceConfig(config) {
  const configMessage = {
    timestamp: new Date().toISOString(),
    id: Date.now().toString(),
    ...config
  };

  await publishMessage(TOPICS.SENSOR_CONFIG, configMessage);
}

/**
 * Get MQTT client connection status
 * @returns {boolean} Connection status
 */
export function isConnected() {
  return mqttClient && mqttClient.connected;
}

/**
 * Get MQTT client instance
 * @returns {Object|null} MQTT client
 */
export function getClient() {
  return mqttClient;
}

/**
 * Close MQTT connection
 * @returns {Promise<void>}
 */
export async function closeMQTT() {
  return new Promise((resolve) => {
    if (mqttClient) {
      mqttClient.end(false, () => {
        console.log('🔌 MQTT connection closed');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

export { mqttClient };