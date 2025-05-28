import { InfluxDB, Point } from '@influxdata/influxdb-client';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.INFLUXDB_URL;
const token = process.env.INFLUXDB_TOKEN;
const org = process.env.INFLUXDB_ORG;
const bucket = process.env.INFLUXDB_BUCKET;

// Create InfluxDB client
const client = new InfluxDB({ url, token });

// Query API
const queryApi = client.getQueryApi(org);

// Write API
const writeApi = client.getWriteApi(org, bucket);

// Debug configuration
console.log('InfluxDB Configuration:');
console.log(`URL: ${url}`);
console.log(`Organization: ${org}`);
console.log(`Bucket: ${bucket}`);
console.log(`Token: ${token ? '***' + token.slice(-8) : 'NOT SET'}`);

/**
 * Get environmental data for a specific time range
 * @param {string} field - The field to query (temperature, humidity, pressure)
 * @param {string} startTime - Start time (ISO string or relative time like '-1h')
 * @param {string} endTime - End time (ISO string or 'now()')
 * @param {string} windowPeriod - Aggregation window (e.g., '5m', '1h')
 * @returns {Promise<Array>} Array of data points
 */
export async function getEnvironmentalData(field, startTime = '-1h', endTime = 'now()', windowPeriod = '5m') {
  try {
    const fieldMapping = {
      temperature: 'aht20_temperature_celsius',
      humidity: 'aht20_humidity_percent',
      pressure: 'bmp280_pressure_hpa'
    };

    const influxField = fieldMapping[field] || field;

    const query = `
      from(bucket: "${bucket}")
        |> range(start: ${startTime}, stop: ${endTime})
        |> filter(fn: (r) => r["_measurement"] == "environment_data")
        |> filter(fn: (r) => r["_field"] == "${influxField}")
        |> aggregateWindow(every: ${windowPeriod}, fn: mean, createEmpty: false)
        |> yield(name: "mean")
    `;

    const result = [];
    
    return new Promise((resolve, reject) => {
      queryApi.queryRows(query, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          result.push({
            time: o._time,
            value: o._value,
            field: o._field,
            measurement: o._measurement
          });
        },
        error(error) {
          console.error('InfluxDB query error:', error);
          reject(error);
        },
        complete() {
          resolve(result);
        },
      });
    });
  } catch (error) {
    console.error('Error querying InfluxDB:', error);
    throw error;
  }
}

/**
 * Get all environmental data (temperature, humidity, pressure) for a time range
 * @param {string} startTime - Start time
 * @param {string} endTime - End time  
 * @param {string} windowPeriod - Aggregation window
 * @returns {Promise<Object>} Object with temperature, humidity, and pressure arrays
 */
export async function getAllEnvironmentalData(startTime = '-1h', endTime = 'now()', windowPeriod = '5m') {
  try {
    const [temperature, humidity, pressure] = await Promise.all([
      getEnvironmentalData('temperature', startTime, endTime, windowPeriod),
      getEnvironmentalData('humidity', startTime, endTime, windowPeriod),
      getEnvironmentalData('pressure', startTime, endTime, windowPeriod)
    ]);

    return {
      temperature,
      humidity,
      pressure,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting all environmental data:', error);
    throw error;
  }
}

/**
 * Get latest environmental data point
 * @returns {Promise<Object>} Latest data point for each sensor
 */
export async function getLatestData() {
  try {
    const query = `
      from(bucket: "${bucket}")
        |> range(start: -1h)
        |> filter(fn: (r) => r["_measurement"] == "environment_data")
        |> filter(fn: (r) => r["_field"] == "aht20_temperature_celsius" or r["_field"] == "aht20_humidity_percent" or r["_field"] == "bmp280_pressure_hpa")
        |> last()
    `;

    const result = {};
    
    return new Promise((resolve, reject) => {
      queryApi.queryRows(query, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          const fieldType = o._field.includes('temperature') ? 'temperature' :
                           o._field.includes('humidity') ? 'humidity' : 'pressure';
          
          result[fieldType] = {
            value: o._value,
            time: o._time,
            field: o._field
          };
        },
        error(error) {
          console.error('InfluxDB latest data query error:', error);
          reject(error);
        },
        complete() {
          resolve(result);
        },
      });
    });
  } catch (error) {
    console.error('Error getting latest data:', error);
    throw error;
  }
}

/**
 * Write data point to InfluxDB
 * @param {string} measurement - Measurement name
 * @param {Object} fields - Field values
 * @param {Object} tags - Tag values
 * @returns {Promise<void>}
 */
export async function writeDataPoint(measurement, fields, tags = {}) {
  try {
    const point = new Point(measurement);
    
    // Add tags
    Object.entries(tags).forEach(([key, value]) => {
      point.tag(key, value);
    });
    
    // Add fields
    Object.entries(fields).forEach(([key, value]) => {
      if (typeof value === 'number') {
        point.floatField(key, value);
      } else {
        point.stringField(key, value);
      }
    });
    
    point.timestamp(new Date());
    
    writeApi.writePoint(point);
    await writeApi.flush();
    
    console.log('Data point written to InfluxDB');
  } catch (error) {
    console.error('Error writing to InfluxDB:', error);
    throw error;
  }
}

/**
 * Test InfluxDB connection and bucket availability
 * @returns {Promise<Object>} Connection test result
 */
export async function testConnection() {
  try {
    console.log('Testing InfluxDB connection...');
    // Try a simple query to test bucket access
    const testQuery = `
      from(bucket: "${bucket}")
        |> range(start: -1m)
        |> limit(n: 1)
    `;

    const result = [];
    return new Promise((resolve, reject) => {
      queryApi.queryRows(testQuery, {
        next(row, tableMeta) {
          const data = tableMeta.toObject(row);
          result.push(data);
        },
        error(error) {
          console.error('InfluxDB test query error:', error);
          reject(error);
        },
        complete() {
          console.log('InfluxDB connection test successful');
          resolve({
            success: true,
            message: 'Connection successful',
            hasData: result.length > 0,
            sampleData: result[0] || null
          });
        }
      });
    });
  } catch (error) {
    console.error('InfluxDB connection test failed:', error);
    throw error;
  }
}

export { client, queryApi, writeApi };