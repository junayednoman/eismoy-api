import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

let cachedConnection = null;

export async function connectToDatabase() {
    if (cachedConnection && mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    try {
        await mongoose.connect(uri, {
            dbName,
        });

        cachedConnection = mongoose.connection;

        return mongoose.connection;
    } catch (error) {
        console.error('Error connecting to the database:', error);
        throw new Error('Database connection error');
    }
}
