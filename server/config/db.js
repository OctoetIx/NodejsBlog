const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected! Attempting to reconnect...');
      reconnect();
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected successfully!');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('connecting', () => {
      console.log('MongoDB connecting...');
    });

    mongoose.connection.on('connected', () => {
      console.log('MongoDB connection established.');
    });

  } catch (err) {
    console.error('Initial MongoDB connection failed:', err.message);
    setTimeout(connectDB, 5000); // Retry after 5 seconds
  }
};

// Reconnect function
const reconnect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Reconnected to MongoDB!');
  } catch (err) {
    console.error('MongoDB reconnection failed:', err.message);
    setTimeout(reconnect, 5000); // Retry after 5 seconds
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing MongoDB connection...');
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = connectDB;