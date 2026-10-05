import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import authRoutes from './routes/authRoutes.js';
import disasterRoutes from './routes/disasterRoutes.js';
import emergencyRoutes from './routes/emergencyRoutes.js';
import shelterRoutes from './routes/shelterRoutes.js';
import hospitalRoutes from './routes/hospitalRoutes.js';
import { connectDatabase } from './config/database.js';
import { getStats } from './controllers/statsController.js';
import { seedDemoData } from './seeder.js';

const app = express();
const server = createServer(app);
const allowedOrigins = (process.env.CLIENT_URL || 'http://127.0.0.1:5173,http://localhost:5173')
  .split(',').map((origin) => origin.trim());
export const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});
app.set('io', io);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));
const here = path.dirname(fileURLToPath(import.meta.url));
app.use('/uploads', express.static(path.join(here, 'uploads')));
let memoryDatabase;

app.get('/api/health', (req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
app.use('/api/auth', authRoutes);
app.use('/api/disasters', disasterRoutes);
app.use('/api/sos', emergencyRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/shelters', shelterRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.get('/api/stats', getStats);

app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.originalUrl}` }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const validationError = ['ValidationError', 'CastError', 'MulterError'].includes(error.name);
  const status = error.status || (error.code === 11000 ? 409 : validationError ? 400 : res.statusCode !== 200 && res.statusCode || 500);
  const uploadErrors = error.name === 'MulterError'
    ? {
        images: error.code === 'LIMIT_FILE_SIZE'
          ? 'Each image must be 8 MB or smaller'
          : error.code === 'LIMIT_FILE_COUNT'
            ? 'You can upload up to 4 images'
            : error.message
      }
    : undefined;
  res.status(status).json({
    message: error.message || 'Internal server error',
    ...(uploadErrors && { errors: uploadErrors }),
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});

const start = async () => {
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be configured in production');
  }
  try {
    await connectDatabase();
  } catch (error) {
    const configuredUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/disasterx';
    const mongoHost = new URL(configuredUri).hostname;
    if (process.env.NODE_ENV === 'production' || !['localhost', '127.0.0.1', '::1'].includes(mongoHost)) {
      throw error;
    }
    console.warn(`Local MongoDB is unavailable (${error.message}). Starting an ephemeral development database.`);
    const databaseName = new URL(configuredUri).pathname.split('/').filter(Boolean)[0] || 'disasterx';
    memoryDatabase = await MongoMemoryServer.create({ instance: { dbName: databaseName } });
    await mongoose.connect(memoryDatabase.getUri());
    console.warn('Demo database is temporary and resets when the backend stops.');
    await seedDemoData();
  }
  const port = Number(process.env.PORT || 5000);
  server.listen(port, '127.0.0.1', () => console.log(`DisasterX API listening at http://127.0.0.1:${port}`));
};

start().catch((error) => {
  console.error('Backend startup failed:', error.message);
  process.exitCode = 1;
});
