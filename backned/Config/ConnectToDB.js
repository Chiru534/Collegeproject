import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/examresul';

const connectOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
};

const connectToDB = async (retries = 5) => {
  try {
    // Clear existing connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    const conn = await mongoose.connect(dbUri, connectOptions);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Event handlers
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('❌ MongoDB disconnected');
      if (retries > 0) {
        console.log(`🔄 Retrying connection... (${retries} attempts left)`);
        setTimeout(() => connectToDB(retries - 1), 5000);
      }
    });

    return conn;

  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err);
    if (retries > 0) {
      console.log(`🔄 Retrying connection... (${retries} attempts left)`);
      return new Promise(resolve => {
        setTimeout(() => resolve(connectToDB(retries - 1)), 5000);
      });
    }
    process.exit(1);
  }
};

export default connectToDB;
