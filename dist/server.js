// src/server.ts
// InfraFlow Federated Access - Main Server Entry Point (Node v24 ESM Safe)
import { createApi } from './api/index.js';
import { initDb } from './infra/db.js';
import { initMetrics } from './telemetry/metrics.js';
const PORT = Number(process.env.PORT || 8080);
const ENV = process.env.NODE_ENV || 'development';
async function main() {
    console.log('-------------------------------------------');
    console.log('[InfraFlow] Booting Federated Access Node…');
    console.log('-------------------------------------------');
    console.log(`[InfraFlow] Environment: ${ENV}`);
    console.log(`[InfraFlow] Port: ${PORT}`);
    try {
        console.log('[InfraFlow] Initializing database…');
        await initDb();
        console.log('[InfraFlow] Initializing telemetry…');
        initMetrics();
        console.log('[InfraFlow] Creating API server…');
        const app = createApi();
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n✅ [InfraFlow] Server online at: http://0.0.0.0:${PORT}`);
            console.log(`🔍 Health check: http://localhost:${PORT}/health`);
            console.log('🚀 API routes mounted successfully\n');
        });
    }
    catch (err) {
        console.error('❌ [InfraFlow] Fatal startup error:');
        console.error(err);
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n[InfraFlow] SIGINT received — shutting down…');
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.log('\n[InfraFlow] SIGTERM received — shutting down…');
    process.exit(0);
});
// Start
main().catch((err) => {
    console.error('❌ [InfraFlow] Unhandled error in main():');
    console.error(err);
    process.exit(1);
});
