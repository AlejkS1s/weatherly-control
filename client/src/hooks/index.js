import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

/**
 * Hook for fetching sensor data from API
 * @param {string} timeRange - Time range for data (e.g., '1h', '24h', '7d')
 * @returns {Object} Sensor data state and methods
 */
export function useSensorData(timeRange = '1h') {
  const [sensorData, setSensorData] = useState(null); // Changed from [] to null
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSensorData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Convert timeRange to the format expected by the server
      const params = {
        startTime: `-${timeRange}`,
        endTime: 'now()',
        windowPeriod: '2s'  // High resolution with 2-second aggregation
      };
      
      console.log('🔍 Fetching sensor data with params:', params);
      const data = await api.getSensorData(params);
      console.log('📊 Received sensor data keys:', Object.keys(data || {}));
      
      setSensorData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch sensor data');
      console.error('❌ Error fetching sensor data:', err);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  // Fetch data on mount and when timeRange changes
  useEffect(() => {
    fetchSensorData();
  }, [fetchSensorData]);

  // Set up interval for periodic data refresh (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(fetchSensorData, 30000);
    return () => clearInterval(interval);
  }, [fetchSensorData]);

  return {
    sensorData,
    loading,
    error,
    refetch: fetchSensorData
  };
}

/**
 * Hook for managing device state
 * @returns {Object} Device state and methods
 */
export function useDevices() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceStatus, setDeviceStatus] = useState('unknown');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const addDevice = useCallback((device) => {
    setDevices(prevDevices => {
      const existingIndex = prevDevices.findIndex(d => d.id === device.id);
      if (existingIndex >= 0) {
        // Update existing device
        const updated = [...prevDevices];
        updated[existingIndex] = { ...updated[existingIndex], ...device };
        return updated;
      } else {
        // Add new device
        return [...prevDevices, device];
      }
    });
  }, []);

  const removeDevice = useCallback((deviceId) => {
    setDevices(prevDevices => prevDevices.filter(d => d.id !== deviceId));
    if (selectedDevice?.id === deviceId) {
      setSelectedDevice(null);
    }
  }, [selectedDevice]);

  const updateDeviceStatus = useCallback((deviceId, status) => {
    setDevices(prevDevices => 
      prevDevices.map(device => 
        device.id === deviceId ? { ...device, status } : device
      )
    );
    
    if (selectedDevice?.id === deviceId) {
      setSelectedDevice(prev => ({ ...prev, status }));
    }
  }, [selectedDevice]);

  return {
    devices,
    selectedDevice,
    deviceStatus,
    isLoading,
    error,
    setDevices,
    setSelectedDevice,
    setDeviceStatus,
    setIsLoading,
    setError,
    addDevice,
    removeDevice,
    updateDeviceStatus
  };
}

/**
 * Hook for local storage management
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value
 * @returns {Array} [value, setValue] tuple
 */
export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  const setStoredValue = useCallback((newValue) => {
    try {
      setValue(newValue);
      window.localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [value, setStoredValue];
}

/**
 * Hook for debouncing values
 * @param {*} value - Value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {*} Debounced value
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for managing intervals
 * @param {Function} callback - Callback function
 * @param {number} delay - Delay in milliseconds
 */
export function useInterval(callback, delay) {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

/**
 * Hook for managing previous values
 * @param {*} value - Current value
 * @returns {*} Previous value
 */
export function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

/**
 * Hook for managing component mount state
 * @returns {Object} Mount state reference
 */
export function useIsMounted() {
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  return isMountedRef;
}

/**
 * Hook for managing async operations
 * @param {Function} asyncFunction - Async function to execute
 * @returns {Object} Async state
 */
export function useAsync(asyncFunction) {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null
  });
  
  const isMounted = useIsMounted();

  const execute = useCallback(async (...args) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await asyncFunction(...args);
      if (isMounted.current) {
        setState({ data: result, loading: false, error: null });
      }
      return result;
    } catch (error) {
      if (isMounted.current) {
        setState({ data: null, loading: false, error });
      }
      throw error;
    }
  }, [asyncFunction, isMounted]);

  return {
    ...state,
    execute
  };
}

/**
 * Hook for managing form state
 * @param {Object} initialValues - Initial form values
 * @param {Function} onSubmit - Submit handler
 * @returns {Object} Form state and methods
 */
export function useForm(initialValues = {}, onSubmit) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async (event) => {
    if (event) {
      event.preventDefault();
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await onSubmit(values);
    } catch (error) {
      if (error.details && Array.isArray(error.details)) {
        // Handle validation errors
        const newErrors = {};
        error.details.forEach(detail => {
          newErrors[detail.field] = detail.message;
        });
        setErrors(newErrors);
      } else {
        setErrors({ general: error.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [values, onSubmit]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    reset,
    setValues,
    setErrors
  };
}

/**
 * Hook for managing toggle state
 * @param {boolean} initialValue - Initial toggle value
 * @returns {Array} [value, toggle, setValue] tuple
 */
export function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);
  
  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, []);

  return [value, toggle, setValue];
}

/**
 * Hook for copying text to clipboard
 * @returns {Array} [copyToClipboard, isCopied] tuple
 */
export function useClipboard() {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, []);

  return [copyToClipboard, isCopied];
}