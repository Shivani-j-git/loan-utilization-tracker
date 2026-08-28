const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// ─── MIDDLEWARE ───────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json());

// ─── ROUTES ───────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/loans',      require('./routes/loans'));
app.use('/api/repayments', require('./routes/repayments'));
app.use('/api/ai',         require('./routes/ai'));
app.use('/api/analytics',  require('./routes/analytics'));
app.use('/api/admin',      require('./routes/admin'));

// ─── HOME ROUTE ───────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'Loan Utilization Tracker API',
    status:  'Running',
    version: '1.0.0'
  });
});

// ─── MONGODB CONNECTION ───────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');

    // Start notification cron job
    require('./services/notificationService').startCronJob();

    // Start server
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB Error:', err.message);
    process.exit(1);
  });
