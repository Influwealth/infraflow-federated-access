// siteops/workers/ifa-wrk-radio-cbrs/index.ts
// First InfraFlow Worker — CBRS Radio Worker (ESM Safe)

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load worker manifest
const manifestPath = path.join(__dirname, 'worker.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

const IFA_BASE = 'http://localhost:8080';

async function heartbeat() {
  try {
    await axios.put(`${IFA_BASE}/devices/${manifest.deviceId}/heartbeat`, {
      status: 'online',
      health: 95,
      metadata: {
        frequency_band: 'CBRS',
        tx_power_dbm: 20,
        sas_grant_id: 'grant_abc123'
      }
    });

    console.log(`[Heartbeat] Sent for ${manifest.deviceId}`);
  } catch (err) {
    console.error('[Heartbeat Error]', err.message);
  }
}

async function telemetry() {
  try {
    await axios.post(`${IFA_BASE}/devices/${manifest.deviceId}/telemetry`, {
      rssi: -72,
      sinr: 18,
      bandwidth_mhz: 20,
      tx_power_dbm: 20,
      timestamp: new Date().toISOString()
    });

    console.log(`[Telemetry] Sent for ${manifest.deviceId}`);
  } catch (err) {
    console.error('[Telemetry Error]', err.message);
  }
}

async function pollCommands() {
  try {
    const res = await axios.get(`${IFA_BASE}/devices/${manifest.deviceId}/commands`);
    const commands = res.data.commands || [];

    for (const cmd of commands) {
      console.log(`[Command] Received: ${cmd.type}`);

      // TODO: Execute command here

      await axios.post(`${IFA_BASE}/devices/${manifest.deviceId}/commands/${cmd.id}/ack`, {
        status: 'completed',
        timestamp: new Date().toISOString()
      });

      console.log(`[Command] Acknowledged: ${cmd.id}`);
    }
  } catch (err) {
    console.error('[Command Poll Error]', err.message);
  }
}

console.log(`\n🚀 Starting worker: ${manifest.name}`);
console.log(`📡 Device ID: ${manifest.deviceId}`);
console.log(`📍 Site: ${manifest.site}\n`);

setInterval(heartbeat, manifest.heartbeatIntervalMs);
setInterval(telemetry, manifest.telemetryIntervalMs);
setInterval(pollCommands, 3000);

