import { InfluxDB } from '@influxdata/influxdb-client';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.INFLUXDB_URL;
const token = process.env.INFLUXDB_TOKEN;
const org = process.env.INFLUXDB_ORG;
const bucket = process.env.INFLUXDB_BUCKET;

console.log('InfluxDB Configuration:');
console.log(`URL: ${url}`);
console.log(`Organization: ${org}`);
console.log(`Bucket: ${bucket}`);
console.log(`Token: ${token ? '***' + token.slice(-8) : 'NOT SET'}`);

const client = new InfluxDB({ url, token });

async function debugInfluxDB() {
  try {
    console.log('\n🔍 Testing InfluxDB connection...');
    
    // Test 1: Test basic connection with a simple query
    console.log('1. Testing basic connection...');
    const queryApi = client.getQueryApi(org);
    
    // Test 2: List available buckets using Flux query
    console.log('2. Listing available buckets...');
    const bucketsQuery = 'buckets()';
    
    const buckets = [];
    await new Promise((resolve, reject) => {
      queryApi.queryRows(bucketsQuery, {
        next(row, tableMeta) {
          const data = tableMeta.toObject(row);
          buckets.push(data);
        },
        error(error) {
          console.error('❌ Buckets query failed:', error.message);
          reject(error);
        },
        complete() {
          console.log('✅ Successfully connected to InfluxDB');
          console.log('Available buckets:');
          buckets.forEach(b => {
            console.log(`  - ${b.name} (ID: ${b.id})`);
          });
          resolve();
        }
      });
    });

    // Test 3: Check if our specific bucket exists
    const targetBucket = buckets.find(b => b.name === bucket);
    if (targetBucket) {
      console.log(`✅ Target bucket "${bucket}" found!`);
    } else {
      console.log(`❌ Target bucket "${bucket}" NOT found!`);
      console.log('Available bucket names:', buckets.map(b => b.name));
    }

    // Test 4: Try to query data from the target bucket
    console.log('\n3. Testing data query...');
    const dataQuery = `
      from(bucket: "${bucket}")
        |> range(start: -1h)
        |> limit(n: 1)
    `;
    
    const dataResults = [];
    await new Promise((resolve, reject) => {
      queryApi.queryRows(dataQuery, {
        next(row, tableMeta) {
          const data = tableMeta.toObject(row);
          dataResults.push(data);
        },
        error(error) {
          console.error('❌ Data query failed:', error.message);
          console.error('This might be expected if the bucket is empty or doesn\'t exist');
          resolve(); // Don't reject, this is expected
        },
        complete() {
          if (dataResults.length > 0) {
            console.log('✅ Successfully queried data from bucket');
            console.log('Sample data:', dataResults[0]);
          } else {
            console.log('⚠️  Bucket exists but no data found (or bucket is empty)');
          }
          resolve();
        }
      });
    });

  } catch (error) {
    console.error('❌ Debug failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      body: error.body
    });
  }
}

debugInfluxDB();
