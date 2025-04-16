import { getDeviceCache, updateDeviceCache } from './utils/configCache.js';

import config from './config/config.js';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import { readAndStore } from './controllers/modbusReader.js';
import router from './routes/api.js';

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

app.get('/', (req, res) => res.send(`Modbus TCP service running port ${3333}`));
app.post('/', (req, res) => res.send(`Post request recieved1`));
app.use(router);
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
