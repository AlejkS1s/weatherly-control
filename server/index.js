import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import sensorsRouter from './routes/sensors.js';
import devicesRouter from './routes/devices.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';

// Import services
import { initializeMQTT } from './services/mqtt.js';
import { testConnection } from './services/influxdb.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/sensors', sensorsRouter);
app.use('/api/devices', devicesRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize services with graceful fallback
const initializeServices = async () => {
  let influxConnected = false;
  let mqttConnected = false;

  // Test InfluxDB connection
  try {
    console.log('🔄 Testing InfluxDB connection...');
    await testConnection();
    console.log('✅ InfluxDB connection successful');
    influxConnected = true;
  } catch (error) {
    console.warn('⚠️  InfluxDB connection failed:', error.message);
    console.warn('🔄 Server will continue without InfluxDB (using mock data)');
  }

  // Initialize MQTT service
  try {
    console.log('🔄 Initializing MQTT service...');
    const mqttClient = await initializeMQTT();
    console.log('✅ MQTT service initialized');
    mqttConnected = true;
  } catch (error) {
    console.warn('⚠️  MQTT initialization failed:', error.message);
    console.warn('🔄 Server will continue without MQTT (using mock data)');
  }

  return { influxConnected, mqttConnected };
};

// Initialize services
try {
  const { influxConnected, mqttConnected } = await initializeServices();
  
  if (influxConnected && mqttConnected) {
    console.log('✅ All services initialized successfully');
  } else if (influxConnected || mqttConnected) {
    console.log('⚠️  Server running with partial services');
  } else {
    console.log('⚠️  Server running in development mode (no external services)');
  }
} catch (error) {
  console.error('❌ Unexpected error during service initialization:', error);
  console.log('🔄 Starting server without external services...');
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});