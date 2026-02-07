// src/api/routes/device-status.ts
// InfraFlow Federated Access - Device Status API
// Handles federated infrastructure device status updates and queries
import { Router } from 'express';
const router = Router();
// Mock device store (replace with database in production) - This should eventually be replaced by a shared mock or real DB
const mockDevices = [
    {
        id: 'dev_radio_001',
        type: 'radio',
        site_id: 'site_alpha',
        status: 'online',
        health: 98,
        last_seen: new Date().toISOString(),
        metadata: {
            frequency_band: 'CBRS',
            tx_power_dbm: 20,
            sas_grant_id: 'grant_abc123',
        },
    },
    {
        id: 'dev_gpu_001',
        type: 'compute',
        site_id: 'site_alpha',
        status: 'online',
        health: 95,
        last_seen: new Date().toISOString(),
        metadata: {
            gpu_model: 'NVIDIA A100',
            mig_slices: 7,
            utilization_pct: 42,
        },
    },
];
// Implement endpoints here
router.get('/', async (req, res) => {
    try {
        const allDeviceStatus = mockDevices.map((d) => ({
            id: d.id,
            status: d.status,
            last_seen: d.last_seen,
        }));
        res.status(200).json({
            device_statuses: allDeviceStatus,
            count: allDeviceStatus.length,
            timestamp: new Date().toISOString(),
        });
    }
    catch (err) {
        console.error('[DeviceStatus] Error listing device statuses:', err);
        res.status(500).json({
            error: 'Failed to list device statuses',
            timestamp: new Date().toISOString(),
        });
    }
});
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        // Validate status
        const validStatuses = ['online', 'offline', 'degraded'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                error: 'Invalid or missing status. Must be one of: online, offline, degraded',
                valid_statuses: validStatuses,
                timestamp: new Date().toISOString(),
            });
        }
        const device = mockDevices.find((d) => d.id === id);
        if (!device) {
            return res.status(404).json({
                error: 'Device not found',
                device_id: id,
                timestamp: new Date().toISOString(),
            });
        }
        device.status = status;
        device.last_seen = new Date().toISOString();
        res.status(200).json({
            device_status: { id: device.id, status: device.status, last_seen: device.last_seen },
            message: `Device ${id} status updated to ${status}`,
            timestamp: new Date().toISOString(),
        });
    }
    catch (err) {
        console.error('[DeviceStatus] Error updating device status:', err);
        res.status(500).json({
            error: 'Failed to update device status',
            timestamp: new Date().toISOString(),
        });
    }
});
export default router;
