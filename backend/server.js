const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const branchRoutes = require('./routes/branchRoutes');
const transferRoutes = require('./routes/transferRoutes');
const defectRoutes = require('./routes/defectRoutes');
const forecastRoutes = require('./routes/forecastRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Middlewares
app.use(cors({
  origin: '*', // Allow all origins for simplicity in development
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Large limit to handle webcam base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/defects', defectRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 Route
app.use((req, res, next) => {
  res.status(404).json({ message: 'API Route Not Found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error stack:', err.stack);
  res.status(500).json({ message: err.message || 'Something went wrong on the server!' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect database
  await connectDB();
  
  const server = app.listen(PORT, () => {
    console.log(`🚀 Smart Stock Server running in dev mode on http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use by another running Node process.`);
      console.log(`💡 Solution: Close the previous server instance or run 'npx kill-port 5000' in terminal.\n`);
    } else {
      console.error('Server start error:', err);
    }
  });
};

startServer();
