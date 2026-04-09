require('dotenv').config({ path: require('path').join(__dirname, 'config.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const xss = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');

const { initTables } = require('./db');
const { errorHandler } = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const disputeRoutes = require('./routes/disputeRoutes');
const contactRoutes = require('./routes/contactRoutes');

const app = express();

app.set('trust proxy', 1);

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

app.use(xss());
app.use(hpp());

app.use(express.json({ limit: '10kb' }));

const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',').map(o => o.trim())
  : ['*'];

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
  res.json({ success: true, status: 'ok', timestamp: Date.now(), db: 'postgresql' });
});

app.use(express.static(path.join(__dirname, '../frontend')));

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.status(404).sendFile(path.join(__dirname, '../frontend/404.html'));
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const gracefulShutdown = (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(() => {
      console.log('HTTP server closed. Process terminated.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

let server;

initTables()
  .then(() => {
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Proximity server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });
  })
  .catch(err => {
    console.error('[DB] Failed to initialise database tables:', err.message);
    process.exit(1);
  });
