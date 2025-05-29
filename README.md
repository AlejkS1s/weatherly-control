# Weatherly Control

A modern web application for visualizing environmental data and controlling IoT devices. Built with React, Node.js, InfluxDB, and MQTT for real-time data monitoring and device management.

![Weatherly Control Dashboard](https://img.shields.io/badge/Status-Ready-green)

## 🌟 Features

### Real-time Data Visualization
- **Interactive Time Series Charts**: Visualize temperature, humidity, and pressure data with custom time ranges
- **Live Dashboard Stats**: Real-time metrics with trend indicators and visual status updates
- **Canvas-based Charts**: High-performance data visualization with interactive hover tooltips

### IoT Device Management
- **Device Control Panel**: Send commands and configure IoT devices remotely
- **MQTT Integration**: Real-time communication with sensors and actuators (optional)
- **Device Status Monitoring**: Live connection status and heartbeat monitoring
- **Graceful Degradation**: App functions even when external services are down

### Modern UI/UX
- **FontAwesome Icons**: Professional icon system throughout the application
- **Error & Loading States**: Clean, prominent error and loading displays above content
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Real-time Updates**: Live data refresh without page reloads

### Robust Architecture
- **WebSocket Communication**: Real-time bidirectional data flow between client and server
- **RESTful APIs**: Clean HTTP endpoints for data retrieval and device management
- **InfluxDB Integration**: Time-series database optimized for sensor data storage (optional)
- **Service Resilience**: Server starts successfully even if external services fail

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- **Optional**: InfluxDB instance
- **Optional**: MQTT broker (graceful fallback if unavailable)

### Installation

1. **Clone and install dependencies:**
```bash
cd weatherly-ctl
npm run install:all
```

2. **Configure environment variables (optional):**
```bash
cp .env.example .env
```

3. **Start the development server:**
```bash
npm run dev
```

The application will start with:
- **Backend server**: http://localhost:3001
- **Frontend client**: http://localhost:5173
- **Graceful fallback**: Works even without InfluxDB/MQTT

## 🏗️ Project Structure

```
weatherly-ctl/
├── 📁 server/               # Node.js/Express backend
│   ├── index.js            # Main server entry point
│   ├── services/           # InfluxDB, MQTT, WebSocket services
│   ├── routes/             # API endpoints (sensors, devices)
│   ├── middleware/         # Validation and error handling
│   └── controllers/        # Request handlers
├── 📁 client/              # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API and WebSocket clients
│   │   └── utils/          # Helper functions
│   └── public/             # Static assets
└── 📄 .env                 # Environment configuration
```

## 🔌 API Endpoints

### Sensor Data
- `GET /api/sensors/data` - Retrieve time-series sensor data
- `GET /api/sensors/latest` - Get latest sensor readings
- `GET /api/sensors/stats` - Statistical summaries and aggregations

### Device Management  
- `GET /api/devices` - List all connected devices
- `POST /api/devices/:id/command` - Send command to device
- `PUT /api/devices/:id/config` - Update device configuration
- `GET /api/devices/:id/status` - Get device status and connectivity

### Real-time WebSocket Events
- `real-time-sensor-data` - Live sensor readings
- `device-status-update` - Device connectivity changes
- `send-command` - Device command transmission
- `send-config` - Device configuration updates

## 🎛️ Available Scripts

### Development
```bash
npm run dev          # Start both backend and frontend
npm run server:dev   # Start backend only (with nodemon)
npm run client:dev   # Start frontend only (Vite dev server)
```

### Production
```bash
npm start           # Start production server
npm run build       # Build frontend for production
```

### Utilities
```bash
npm run install:all # Install all dependencies
npm run lint        # Lint client code
```

## 🛠️ Technology Stack

### Backend
- **Express.js** - Web application framework
- **InfluxDB** - Time-series database for sensor data
- **MQTT** - IoT device communication protocol
- **Socket.IO** - Real-time WebSocket communication
- **Winston** - Structured logging
- **Joi** - Request validation

### Frontend
- **React 18** - Component-based UI framework
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **FontAwesome** - Professional icon system
- **Axios** - HTTP client for API requests
- **Socket.IO Client** - WebSocket client
- **Canvas API** - High-performance chart rendering

### Infrastructure
- **Docker** support for containerized deployment
- **CORS** configuration for cross-origin requests
- **Rate limiting** for API protection
- **Environment-based** configuration

## 📊 Data Flow

1. **IoT Sensors** → MQTT Broker → **Backend MQTT Client**
2. **Backend** → InfluxDB (data storage)
3. **Backend** → WebSocket → **Frontend** (real-time updates)
4. **Frontend** → HTTP API → **Backend** (data queries)
5. **Frontend** → WebSocket → **Backend** → MQTT → **IoT Devices** (commands)

## 🔧 Configuration

### Environment Variables (.env)
```bash
# InfluxDB Configuration
INFLUXDB_URL=http://your-influxdb:8086
INFLUXDB_TOKEN=your-influxdb-token
INFLUXDB_ORG=your-org
INFLUXDB_BUCKET=your-bucket

# MQTT Configuration
MQTT_BROKER_HOST=your-mqtt-broker
MQTT_BROKER_PORT=1883
MQTT_USERNAME_LOCAL=your-username
MQTT_PASSWORD_LOCAL=your-password

# Server Configuration
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

## 🎯 Key Components

### Frontend Components
- **Header**: Navigation with FontAwesome icons, system status and time display
- **DashboardStats**: Real-time metrics cards with trend indicators
- **TimeSeriesChart**: Interactive canvas-based charts with multiple metrics
- **DeviceControlPanel**: Device management interface with command sending
- **ErrorDisplay**: Prominent error notifications with FontAwesome icons
- **LoadingDisplay**: Clean loading states with animated FontAwesome spinner
- **Footer**: System information and status indicators

### Backend Services
- **InfluxDB Service**: Time-series data queries and aggregations
- **MQTT Service**: Device communication and message handling
- **WebSocket Service**: Real-time client-server communication
- **Validation Middleware**: Request validation using Joi schemas
- **Error Handler**: Centralized error management

## 🚀 Deployment

The application is ready for deployment with:
- Environment-based configuration
- Production build optimization
- CORS and security middleware
- Structured logging for monitoring
- Error handling and graceful shutdowns

## 📈 Features in Detail

### Real-time Dashboard
- Live updating metrics with trend calculations
- Color-coded status indicators
- Responsive grid layout for different screen sizes
- Interactive chart filtering by metric type and time range

### Device Control
- Send commands to IoT devices via MQTT
- Update device configurations remotely
- Monitor device connectivity and status
- View device response and acknowledgments

### Data Visualization
- Custom canvas-based charts for performance
- Interactive hover tooltips with precise values
- Time range selection (1h, 6h, 24h, 7d)
- Multiple metric support (temperature, humidity, pressure)

## 🔧 Development Features

### Service Resilience
- **Graceful Startup**: Server starts successfully even if InfluxDB or MQTT are unavailable
- **Mock Data**: Automatic fallback to realistic sensor data when external services fail
- **Error Recovery**: Individual service failures don't crash the entire application
- **Optional Dependencies**: InfluxDB and MQTT are now optional for development

### FontAwesome Integration
- **Centralized Management**: All icons defined in `/client/src/components/icons.jsx`
- **Easy Maintenance**: Single place to update or swap icons
- **Performance**: Optimized icon loading with tree-shaking

### Component Architecture
- **Separated Concerns**: Error and loading displays extracted to dedicated components
- **Reusable Components**: Clean, composable UI elements
- **Top-level Notifications**: Error and loading states prominently displayed above content
- **Consistent Styling**: Unified design language across all components

---

**Weatherly Control** - Making environmental monitoring simple and powerful! 🌡️💧📊
