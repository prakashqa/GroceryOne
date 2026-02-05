/**
 * Bluetooth Printer Service Tests
 * TDD tests for Bluetooth printer discovery, connection, and printing
 */

import { BluetoothPrinterService } from '../BluetoothPrinterService';

describe('BluetoothPrinterService', () => {
  let service: BluetoothPrinterService;

  beforeEach(() => {
    service = new BluetoothPrinterService();
  });

  describe('initial state', () => {
    it('should have disconnected connection status initially', () => {
      expect(service.getConnectionStatus()).toBe('disconnected');
    });

    it('should have no connected device initially', () => {
      expect(service.getConnectedDevice()).toBeNull();
    });

    it('should not be scanning initially', () => {
      expect(service.isCurrentlyScanning()).toBe(false);
    });

    it('should have empty discovered devices initially', () => {
      expect(service.getDiscoveredDevices()).toEqual([]);
    });
  });

  describe('getPairedDevices', () => {
    it('should return list of simulated paired devices', async () => {
      const devices = await service.getPairedDevices();

      expect(devices).toBeInstanceOf(Array);
      expect(devices.length).toBeGreaterThan(0);

      // Check device structure
      const device = devices[0];
      expect(device).toHaveProperty('id');
      expect(device).toHaveProperty('name');
      expect(device).toHaveProperty('address');
      expect(device).toHaveProperty('isPaired');
      expect(device.isPaired).toBe(true);
    });
  });

  describe('connect', () => {
    it('should connect to a device and update connection status', async () => {
      const devices = await service.getPairedDevices();
      const device = devices[0];

      const connected = await service.connect(device);

      expect(connected).toBe(true);
      expect(service.getConnectionStatus()).toBe('connected');
      expect(service.getConnectedDevice()).not.toBeNull();
      expect(service.getConnectedDevice()?.id).toBe(device.id);
    });

    it('should mark device as connected', async () => {
      const devices = await service.getPairedDevices();
      const device = devices[0];

      await service.connect(device);

      const connectedDevice = service.getConnectedDevice();
      expect(connectedDevice?.isConnected).toBe(true);
    });
  });

  describe('disconnect', () => {
    it('should disconnect and update connection status', async () => {
      const devices = await service.getPairedDevices();
      const device = devices[0];

      await service.connect(device);
      expect(service.getConnectionStatus()).toBe('connected');

      await service.disconnect();

      expect(service.getConnectionStatus()).toBe('disconnected');
      expect(service.getConnectedDevice()).toBeNull();
    });
  });

  describe('print', () => {
    it('should print content when connected', async () => {
      const devices = await service.getPairedDevices();
      const device = devices[0];

      await service.connect(device);

      const testContent = 'Test print content\nLine 2';
      const printJob = await service.print(testContent);

      expect(printJob).toHaveProperty('id');
      expect(printJob).toHaveProperty('content', testContent);
      expect(printJob).toHaveProperty('status', 'completed');
      expect(printJob).toHaveProperty('createdAt');
    });

    it('should throw error when not connected', async () => {
      const testContent = 'Test print content';

      await expect(service.print(testContent)).rejects.toThrow(
        'No printer connected'
      );
    });
  });

  describe('printRaw', () => {
    it('should print raw commands when connected', async () => {
      const devices = await service.getPairedDevices();
      const device = devices[0];

      await service.connect(device);

      const rawCommands = new Uint8Array([0x1b, 0x40]); // ESC @
      const printJob = await service.printRaw(rawCommands);

      expect(printJob.status).toBe('completed');
    });

    it('should throw error when not connected', async () => {
      const rawCommands = new Uint8Array([0x1b, 0x40]);

      await expect(service.printRaw(rawCommands)).rejects.toThrow(
        'No printer connected'
      );
    });
  });

  describe('event listeners', () => {
    it('should notify connection status listeners on connect', async () => {
      const statusListener = jest.fn();
      service.onConnectionStatusChange(statusListener);

      const devices = await service.getPairedDevices();
      const device = devices[0];

      await service.connect(device);

      expect(statusListener).toHaveBeenCalledWith('connecting');
      expect(statusListener).toHaveBeenCalledWith('connected');
    });

    it('should notify connection status listeners on disconnect', async () => {
      const statusListener = jest.fn();

      const devices = await service.getPairedDevices();
      const device = devices[0];

      await service.connect(device);

      service.onConnectionStatusChange(statusListener);
      await service.disconnect();

      expect(statusListener).toHaveBeenCalledWith('disconnected');
    });

    it('should allow unsubscribing from listeners', async () => {
      const statusListener = jest.fn();
      const unsubscribe = service.onConnectionStatusChange(statusListener);

      unsubscribe();

      const devices = await service.getPairedDevices();
      const device = devices[0];

      await service.connect(device);

      // Should not be called after unsubscribe
      expect(statusListener).not.toHaveBeenCalled();
    });

    it('should notify print complete listeners', async () => {
      const printListener = jest.fn();
      service.onPrintComplete(printListener);

      const devices = await service.getPairedDevices();
      const device = devices[0];

      await service.connect(device);
      await service.print('Test content');

      expect(printListener).toHaveBeenCalled();
      expect(printListener.mock.calls[0][0]).toHaveProperty(
        'status',
        'completed'
      );
    });
  });

  describe('stopScan', () => {
    it('should stop scanning', () => {
      service.stopScan();
      expect(service.isCurrentlyScanning()).toBe(false);
    });
  });
});
