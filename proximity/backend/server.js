require('dotenv').config({ path: require('path').join(__dirname, 'config.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');

const { errorHandler } = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const disputeRoutes = require('./routes/disputeRoutes');
const contactRoutes = require('./routes/contactRoutes');

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  }
}));

app.use(compression());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

app.use(express.json({ limit: '10kb' }));

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.ALLOWED_ORIGIN].filter(Boolean)
  : ['http://localhost:5000', 'http://localhost:3000', '*'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests from this IP' }
});
app.use('/api/', globalLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/contact', contactRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: Date.now(), db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.use(express.static(path.join(__dirname, '../frontend')));

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.status(404).sendFile(path.join(__dirname, '../frontend/404.html'));
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = () => {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Proximity server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
  return server;
};

let server;

const gracefulShutdown = (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(() => {
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed. Process terminated.');
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

mongoose.set('strictQuery', true);

if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
  })
    .then(() => {
      console.log('MongoDB Connected');
      server = startServer();
    })
    .catch(err => {
      console.error('MongoDB connection error:', err.message);
      console.warn('Starting without DB — set MONGO_URI for full functionality.');
      server = startServer();
    });
} else {
  console.warn('MONGO_URI not set — starting without database. Set MONGO_URI to enable all features.');
  server = startServer();
}
