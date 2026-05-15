const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();
connectDB();

const app = express();

// ✅ Allowed origins (dynamic)


// ✅ CORS FIX (important)
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// ✅ VERY IMPORTANT (you removed this)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// health
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API running 🚀' });
});

// routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found.`,
  });
});

// error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});

module.exports = app;