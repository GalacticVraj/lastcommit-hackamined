require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth');
const salesRoutes = require('./routes/sales');
const purchaseRoutes = require('./routes/purchase');
const productionRoutes = require('./routes/production');
const simulationRoutes = require('./routes/simulation');
const financeRoutes = require('./routes/finance');
const hrRoutes = require('./routes/hr');
const qualityRoutes = require('./routes/quality');
const warehouseRoutes = require('./routes/warehouse');
const statutoryRoutes = require('./routes/statutory');
const logisticsRoutes = require('./routes/logistics');
const contractorsRoutes = require('./routes/contractors');
const maintenanceRoutes = require('./routes/maintenance');
const assetsRoutes = require('./routes/assets');
const reportsRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/sales', salesRoutes);
app.use('/api/v1/purchase', purchaseRoutes);
app.use('/api/v1/production', productionRoutes);
app.use('/api/v1/simulation', simulationRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/hr', hrRoutes);
app.use('/api/v1/quality', qualityRoutes);
app.use('/api/v1/warehouse', warehouseRoutes);
app.use('/api/v1/statutory', statutoryRoutes);
app.use('/api/v1/logistics', logisticsRoutes);
app.use('/api/v1/contractors', contractorsRoutes);
app.use('/api/v1/maintenance', maintenanceRoutes);
app.use('/api/v1/assets', assetsRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// Health check
app.get('/api/v1/health', (req, res) => {
    res.json({ success: true, message: 'ERP API is running', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 ERP API Server running on http://localhost:${PORT}`);
});

module.exports = app;
