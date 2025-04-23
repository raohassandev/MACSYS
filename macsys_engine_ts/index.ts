import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import config from './config/config.js';
import router from './routes/api.js';
import { readAndStore } from './controllers/modbusReader.js';
import { getDeviceCache, updateDeviceCache } from './utils/configCache.js';

const app = express();

app.use(
  cors({
    // origin: 'http://localhost:5173', //  Set to your React app's origin
    origin: '*', //  Set to your React app's origin
    methods: 'POST, OPTIONS, GET, PUT, PATCH, DELETE',
    allowedHeaders: ['Content-Type'],
  })
);

app.use(express.json());

mongoose
  .connect(config.mongoURI)
  .then(() => {
    console.log('MongoDB connected');
    updateDeviceCache();

    setInterval(async () => {
      await updateDeviceCache();
    }, config.configCheckInterval);

    setInterval(async () => {
      await readAndStore(getDeviceCache(), 'realtime');
    }, config.realtimeInterval);

    setInterval(async () => {
      await readAndStore(getDeviceCache(), 'historical');
    }, config.historicalInterval);
  })
  .catch((err) => console.error('MongoDB connection error:', err));

app.get('/', (_req, res) => res.send(`Modbus TCP service running port ${config.port}`));
app.post('/', (_req, res) => res.send(`Post request received`));
app.use(router);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});