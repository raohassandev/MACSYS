import mongoose from 'mongoose';

/**
 * Connect to the MongoDB database
 * @returns A promise that resolves when the connection is established
 */
export async function connectToDatabase(): Promise<mongoose.Connection> {
  try {
    // Use the MongoDB connection string from environment or default value
    const connectionString = process.env.MONGODB_URI || 'mongodb://82.25.118.148:27017/modbus';
    
    await mongoose.connect(connectionString);
    console.log('Connected to MongoDB successfully');
    
    // Return the connection instance
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}