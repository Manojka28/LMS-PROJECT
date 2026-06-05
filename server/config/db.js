import mongoose from 'mongoose';

export async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error('MONGODB_URI is missing in .env file');
    }

    mongoose.set('strictQuery', true);

    console.log('Connecting to MongoDB Atlas...');

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });

    console.log('MongoDB URI:', uri.replace(/\/\/(.*?):(.*?)@/, '//****:****@'));
    console.log('MongoDB connected:', mongoose.connection.name);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    throw err;
  }
}