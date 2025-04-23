import dotenv from 'dotenv';
dotenv.config();

interface Config {
  realtimeInterval: number;
  historicalInterval: number;
  configCheckInterval: number;
  mongoURI: string;
  port: number;
}

const config: Config = {
  realtimeInterval: parseInt(process.env.REALTIME_INTERVAL_MS || '1000'),
  historicalInterval: parseInt(process.env.HISTORICAL_INTERVAL_MS || '60000'),
  configCheckInterval: parseInt(process.env.CONFIG_CHECK_INTERVAL_MS || '5000'),
  mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/modbus',
  port: parseInt(process.env.PORT || '3333'),
};

export default config;