import mongoose from 'mongoose';

export const connectToDB = () => {
  // If there's an active connection, skip re-connecting
  if (mongoose.connection.readyState !== 0) {
    console.log('Mongoose already connected or connecting');
    return;
  }

  // Force IPv4 with family: 4 to avoid IPv6 (::1) resolution issues
  mongoose
    .connect('mongodb://127.0.0.1:27017/', {
      dbName: 'Collegepro',
      useNewUrlParser: true,
      useUnifiedTopology: true,
      family: 4,
    })
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
    });
};
