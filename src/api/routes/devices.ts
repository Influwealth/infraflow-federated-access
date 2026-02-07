// src/api/routes/devices.ts
// InfraFlow Federated Access - Devices API
// Handles federated infrastructure device registration and telemetry

import { Router, Request, Response } from 'express';
import { Device } from '../../core/models';

const router = Router();

const mockDevices: Device[] = [
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

// GET /devices - List all devices
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, site_id, status } = req.query;

    let filteredDevices = [...mockDevices];

    // Filter by type
    if (type && typeof type === 'string') {
      filteredDevices = filteredDevices.filter((d) => d.type === type);
    }

    // Filter by site_id
    if (site_id && typeof site_id === 'string') {
      filteredDevices = filteredDevices.filter((d) => d.site_id === site_id);
    }

    // Filter by status
    if (status && typeof status === 'string') {
      filteredDevices = filteredDevices.filter((d) => d.status === status);
    }

    res.status(200).json({
      devices: filteredDevices,
      count: filteredDevices.length,
      filters: { type, site_id, status },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Devices] Error listing devices:', err);
    res.status(500).json({
      error: 'Failed to list devices',
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /devices - Register new device
router.post('/', async (req: Request, res: Response) => {
  try {
    const { type, site_id, metadata } = req.body;

    // Validation
    if (!type || !site_id) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['type', 'site_id'],
        timestamp: new Date().toISOString(),
      });
    }

    const validTypes = ['radio', 'compute', 'backhaul', 'power', 'storage'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid device type',
        valid_types: validTypes,
        timestamp: new Date().toISOString(),
      });
    }

    // Create new device
    const newDevice: Device = {
      id: `dev_${type}_${Date.now()}`,
      type,
      site_id,
      status: 'offline', // Starts offline until first heartbeat
      health: 0,
      last_seen: new Date().toISOString(),
      metadata: metadata || {},
    };

    mockDevices.push(newDevice);

    res.status(201).json({
      device: newDevice,
      message: 'Device registered successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Devices] Error registering device:', err);
    res.status(500).json({
      error: 'Failed to register device',
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /devices/:id - Get single device
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const device = mockDevices.find((d) => d.id === id);

    if (!device) {
      return res.status(404).json({
        error: 'Device not found',
        device_id: id,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json({
      device,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Devices] Error fetching device:', err);
    res.status(500).json({
      error: 'Failed to fetch device',
      timestamp: new Date().toISOString(),
    });
  }
});

// PUT /devices/:id/heartbeat - Update device heartbeat (telemetry)
router.put('/:id/heartbeat', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, health, metadata } = req.body;

    const device = mockDevices.find((d) => d.id === id);

    if (!device) {
      return res.status(404).json({
        error: 'Device not found',
        device_id: id,
        timestamp: new Date().toISOString(),
      });
    }

    // Update device state
    if (status) device.status = status;
    if (typeof health === 'number') device.health = health;
    if (metadata) device.metadata = { ...device.metadata, ...metadata };
    device.last_seen = new Date().toISOString();

    res.status(200).json({
      device,
      message: 'Heartbeat received',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Devices] Error processing heartbeat:', err);
    res.status(500).json({
      error: 'Failed to process heartbeat',
      timestamp: new Date().toISOString(),
    });
  }
});

// DELETE /devices/:id - Deregister device
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deviceIndex = mockDevices.findIndex((d) => d.id === id);

    if (deviceIndex === -1) {
      return res.status(404).json({
        error: 'Device not found',
        device_id: id,
        timestamp: new Date().toISOString(),
      });
    }

    const removedDevice = mockDevices.splice(deviceIndex, 1)[0];

    res.status(200).json({
      device: removedDevice,
      message: 'Device deregistered successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Devices] Error deregistering device:', err);
    res.status(500).json({
      error: 'Failed to deregister device',
      timestamp: new Date().toISOString(),
    });
  }
});

// Export router as default
export default router;