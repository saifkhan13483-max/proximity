const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: './config.env' });

const authRoutes = require('./routes/authRoutes');
const disputeRoutes = require('./routes/disputeRoutes');
const contactRoutes = require('./routes/contactRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth', authRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/contact', contactRoutes);

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    const filePath = req.path === '/' ? 'index.html' : req.path.replace(/^\//, '') + (req.path.endsWith('.html') ? '' : '.html');
    const fullPath = path.join(__dirname, '../frontend', filePath);
    res.sendFile(fullPath, (err) => {
      if (err) res.sendFile(path.join(__dirname, '../frontend/index.html'));
    });
  }
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err.message);
    app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT} (without DB)`));
  });
