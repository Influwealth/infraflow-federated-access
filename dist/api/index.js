// src/api/index.ts
// InfraFlow Federated Access - Express API Factory
// Mounts all route handlers and middleware
import express from 'express';
import accounts from './routes/accounts.js';
import devices from './routes/devices.js';
import deviceStatus from './routes/device-status.js'; // Import new router
export function createApi() {
    const app = express();
    // Middleware stack
    app.use(express.json({ limit: '10mb' })); // Body parser (10MB limit)
    app.use(express.urlencoded({ extended: true })); // URL-encoded bodies
    // Request logging middleware
    app.use((req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            console.log(`[API] ${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`);
        });
        next();
    });
    // Health check endpoint (before routes)
    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'healthy',
            service: 'InfraFlow Federated Access',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        });
    });
    // Mount route handlers
    app.use('/accounts', accounts);
    app.use('/devices', devices);
    app.use('/devices/status', deviceStatus); // Mount new router
    // 404 handler (after all routes)
    app.use((req, res) => {
        res.status(404).json({
            error: 'Not Found',
            message: `Route ${req.method} ${req.path} does not exist`,
            timestamp: new Date().toISOString(),
        });
    });
    // Global error handler (must be last)
    app.use((err, req, res, next) => {
        console.error('[API] Error:', err);
        res.status(500).json({
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
            timestamp: new Date().toISOString(),
        });
    });
    return app;
}
