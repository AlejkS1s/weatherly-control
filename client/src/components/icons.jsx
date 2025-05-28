import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTemperatureThreeQuarters,
  faDroplet,
  faGauge,
  faWind,
  faPowerOff,
  faGear,
  faArrowsRotate,
  faChartLine,
  faDatabase,
  faBars,
  faClock
} from '@fortawesome/free-solid-svg-icons';

// Environmental sensor icons as reusable React components
export const TemperatureIcon = ({ className = "w-6 h-6" }) => (
  <FontAwesomeIcon icon={faTemperatureThreeQuarters} className={className} />
);

export const HumidityIcon = ({ className = "w-6 h-6" }) => (
  <FontAwesomeIcon icon={faDroplet} className={className} />
);

export const PressureIcon = ({ className = "w-6 h-6" }) => (
  <FontAwesomeIcon icon={faGauge} className={className} />
);

export const AirQualityIcon = ({ className = "w-6 h-6" }) => (
  <FontAwesomeIcon icon={faWind} className={className} />
);

// Device control icons
export const PowerIcon = ({ className = "w-6 h-6" }) => (
  <FontAwesomeIcon icon={faPowerOff} className={className} />
);

export const SettingsIcon = ({ className = "w-6 h-6" }) => (
  <FontAwesomeIcon icon={faGear} className={className} />
);

export const RefreshIcon = ({ className = "w-6 h-6" }) => (
  <FontAwesomeIcon icon={faArrowsRotate} className={className} />
);

// Chart and data icons
export const ChartIcon = ({ className = "w-6 h-6" }) => (
  <FontAwesomeIcon icon={faChartLine} className={className} />
);

export const DataIcon = ({ className = "w-6 h-6" }) => (
  <FontAwesomeIcon icon={faDatabase} className={className} />
);

// Navigation icons
export const MenuIcon = ({ className = "w-6 h-6" }) => (
  <FontAwesomeIcon icon={faBars} className={className} />
);

export const ClockIcon = ({ className = "w-6 h-6" }) => (
  <FontAwesomeIcon icon={faClock} className={className} />
);