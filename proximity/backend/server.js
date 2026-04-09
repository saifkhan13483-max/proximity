require('dotenv').config({ path: './config.env' });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const { errorHandler } = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const disputeRoutes = require('./routes/disputeRoutes');
const contactRoutes = require('./routes/contactRoutes');

const app = express();

app.use(express.json());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/contact', contactRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: Date.now() });
});

app.use(express.static(path.join(__dirname, '../frontend')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = () => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Proximity server running on port ${PORT}`);
  });
};

if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      console.log('MongoDB Connected');
      startServer();
    })
    .catch(err => {
      console.error('MongoDB connection error:', err.message);
      console.warn('Starting without DB — set MONGO_URI for full functionality.');
      startServer();
    });
} else {
  console.warn('MONGO_URI not set — starting without database. Set MONGO_URI to enable all features.');
  startServer();
}
