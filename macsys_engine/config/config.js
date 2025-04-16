import dotenv from 'dotenv';
dotenv.config();

export default {
  realtimeInterval: parseInt(process.env.REALTIME_INTERVAL_MS) || 1000,
  historicalInterval: parseInt(process.env.HISTORICAL_INTERVAL_MS) || 60000,
  configCheckInterval: parseInt(process.env.CONFIG_CHECK_INTERVAL_MS) || 5000,
  mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/modbus',
  port: process.env.PORT || 3333,
};
