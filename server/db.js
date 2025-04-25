import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://82.25.118.148:27017/modbus';

// MongoDB connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// Connect to MongoDB
export async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, options);
    console.log('Connected to MongoDB successfully');
    return true;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    return false;
  }
}

// Handle connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected, trying to reconnect...');
  setTimeout(() => {
    connectToDatabase();
  }, 5000);
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});

export default mongoose;