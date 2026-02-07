export type AccountId = string;

export interface Account {
  id: AccountId;
  name: string;
  type: 'person' | 'org';
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  id: string;
  type: 'radio' | 'compute' | 'backhaul' | 'power' | 'storage';
  site_id: string;
  status: 'online' | 'offline' | 'degraded';
  health: number; // 0-100
  last_seen: string;
  metadata?: Record<string, unknown>;
}

export interface DeviceStatus {
  id: string;
  status: 'online' | 'offline' | 'degraded';
  last_seen: string;
}