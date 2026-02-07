// src/infra/db.ts
// InfraFlow Federated Access - Database Initialization (ESM Safe)
export async function initDb() {
    console.log('[DB] Initializing database connection (mock)…');
    // Simulate async DB init
    await new Promise((resolve) => setTimeout(resolve, 100));
    console.log('[DB] Database initialized (mock mode)');
}
export async function closeDb() {
    console.log('[DB] Closing database connection (mock)…');
}
