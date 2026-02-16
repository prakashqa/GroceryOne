/**
 * Bluetooth Printer Service Tests
 * TDD tests for Bluetooth printer discovery, connection, and printing
 */

import { Platform } from 'react-native';
import { BLEPrinter } from 'react-native-thermal-receipt-printer-image-qr';
import { BluetoothPrinterService } from '../BluetoothPrinterService';

describe('BluetoothPrinterService', () => {
  let service: BluetoothPrinterService;

  beforeEach(() => {
    service = new BluetoothPrinterService();
    jest.clearAllMocks();
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

  describe('reconnect before print', () => {
    it('should reconnect to the last connected device before printing', async () => {
      const devices = await service.getPairedDevices();
      const device = devices[0];

      await service.connect(device);

      // Clear mocks to track only calls made during print()
      (BLEPrinter.connectPrinter as jest.Mock).mockClear();

      const printJob = await service.print('Test content');

      // Should have reconnected (called connectPrinter with the device address)
      expect(BLEPrinter.connectPrinter).toHaveBeenCalledWith(device.address);
      // And then printed
      expect(BLEPrinter.printText).toHaveBeenCalledWith('Test content');
      expect(printJob.status).toBe('completed');
    });

    it('should reconnect to the last connected device before printing raw', async () => {
      const devices = await service.getPairedDevices();
      const device = devices[0];

      await service.connect(device);

      // Clear mocks to track only calls made during printRaw()
      (BLEPrinter.connectPrinter as jest.Mock).mockClear();

      const rawCommands = new Uint8Array([0x1b, 0x40]);
      const printJob = await service.printRaw(rawCommands);

      // Should have reconnected
      expect(BLEPrinter.connectPrinter).toHaveBeenCalledWith(device.address);
      expect(printJob.status).toBe('completed');
    });

    it('should set status to failed and not crash if reconnect fails', async () => {
      const devices = await service.getPairedDevices();
      const device = devices[0];

      await service.connect(device);

      // Simulate reconnect failure (printer turned off / out of range)
      (BLEPrinter.connectPrinter as jest.Mock).mockRejectedValueOnce(
        new Error('Bluetooth socket closed')
      );

      // Should NOT throw — should return a failed job instead
      const printJob = await service.print('Test content');

      expect(printJob.status).toBe('failed');
      expect(printJob.error).toContain('Failed to reconnect to printer');
    });

    it('should throw if no device was ever connected', async () => {
      // Don't connect — just try to print directly
      // The new ensureConnected() should throw 'No printer connected'
      await expect(service.print('Test content')).rejects.toThrow(
        'No printer connected'
      );
    });
  });

  describe('permission handling', () => {
    beforeEach(() => {
      // Simulate Android 12+ (API 31) where BLUETOOTH_CONNECT is required
      (Platform as any).OS = 'android';
      (Platform as any).Version = 31;
    });

    it('should request Bluetooth permissions before calling BLEPrinter.init()', async () => {
      // Mock requestBluetoothPermissions at the service level to return true
      const permSpy = jest.spyOn(service, 'requestBluetoothPermissions')
        .mockResolvedValue(true);

      await service.getPairedDevices();

      // Permissions should be requested before BLEPrinter operations
      expect(permSpy).toHaveBeenCalled();

      // And BLEPrinter.init() should have been called after permissions
      expect(BLEPrinter.init).toHaveBeenCalled();

      permSpy.mockRestore();
    });

    it('should return empty array from getPairedDevices when permissions denied', async () => {
      // Mock requestBluetoothPermissions at the service level to return false
      const permSpy = jest.spyOn(service, 'requestBluetoothPermissions')
        .mockResolvedValue(false);

      const devices = await service.getPairedDevices();

      expect(devices).toEqual([]);
      permSpy.mockRestore();
    });

    it('should not call BLEPrinter.getDeviceList when permissions denied', async () => {
      // Mock requestBluetoothPermissions at the service level to return false
      const permSpy = jest.spyOn(service, 'requestBluetoothPermissions')
        .mockResolvedValue(false);

      await service.getPairedDevices();

      expect(BLEPrinter.getDeviceList).not.toHaveBeenCalled();
      permSpy.mockRestore();
    });
  });
});
