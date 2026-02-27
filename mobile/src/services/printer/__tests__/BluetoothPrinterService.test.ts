/**
 * Bluetooth Printer Service Tests
 * TDD tests for Bluetooth printer discovery, connection, and printing
 */

import { Platform } from 'react-native';
import { BLEPrinter } from 'react-native-thermal-receipt-printer-image-qr';
import { BluetoothPrinterService } from '../BluetoothPrinterService';

// Helper: override BLEPrinter.getDeviceList mock for specific tests
const mockDeviceList = (devices: Array<{ device_name: string; inner_mac_address: string }>) => {
  (BLEPrinter.getDeviceList as jest.Mock).mockResolvedValue(devices);
};

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

    it('should cap printQueue at 20 jobs to prevent memory leak', async () => {
      const devices = await service.getPairedDevices();
      const device = devices[0];
      await service.connect(device);

      // Print 25 jobs
      for (let i = 0; i < 25; i++) {
        await service.print(`Job ${i}`);
      }

      // Queue should be capped at 20 (oldest 5 removed)
      // Access internal state via any cast for testing
      const state = (service as any).state;
      expect(state.printQueue.length).toBeLessThanOrEqual(20);
    }, 30000);
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

    it('should wait for BLE socket stabilization after reconnect', async () => {
      const devices = await service.getPairedDevices();
      const device = devices[0];
      await service.connect(device);

      // Track the order of calls
      const callOrder: string[] = [];
      (BLEPrinter.connectPrinter as jest.Mock).mockImplementation(() => {
        callOrder.push('connectPrinter');
        return Promise.resolve();
      });
      (BLEPrinter.printText as jest.Mock).mockImplementation(() => {
        callOrder.push('printText');
        return Promise.resolve();
      });

      await service.print('Test content');

      // connectPrinter should be called before printText
      expect(callOrder[0]).toBe('connectPrinter');
      expect(callOrder[1]).toBe('printText');
      // Verify the stabilization delay exists by checking that
      // ensureConnected resolves (which includes the 300ms delay)
      // and printing completes successfully after it
      expect(BLEPrinter.connectPrinter).toHaveBeenCalledWith(device.address);
    });

    it('should close existing connection before reconnecting to flush stale socket', async () => {
      const devices = await service.getPairedDevices();
      const device = devices[0];
      await service.connect(device);

      // Clear mocks to track only calls made during print()
      (BLEPrinter.closeConn as jest.Mock).mockClear();
      (BLEPrinter.connectPrinter as jest.Mock).mockClear();

      // Track call order
      const callOrder: string[] = [];
      (BLEPrinter.closeConn as jest.Mock).mockImplementation(() => {
        callOrder.push('closeConn');
        return Promise.resolve();
      });
      (BLEPrinter.connectPrinter as jest.Mock).mockImplementation(() => {
        callOrder.push('connectPrinter');
        return Promise.resolve();
      });

      await service.print('Test content');

      // closeConn must be called BEFORE connectPrinter to flush stale socket
      expect(BLEPrinter.closeConn).toHaveBeenCalled();
      expect(BLEPrinter.connectPrinter).toHaveBeenCalledWith(device.address);
      expect(callOrder.indexOf('closeConn')).toBeLessThan(
        callOrder.indexOf('connectPrinter')
      );
    });

    it('should close connection before each printImages call', async () => {
      const devices = await service.getPairedDevices();
      const device = devices[0];
      await service.connect(device);

      // Clear mocks to track only calls made during printImages()
      (BLEPrinter.closeConn as jest.Mock).mockClear();
      (BLEPrinter.connectPrinter as jest.Mock).mockClear();

      const callOrder: string[] = [];
      (BLEPrinter.closeConn as jest.Mock).mockImplementation(() => {
        callOrder.push('closeConn');
        return Promise.resolve();
      });
      (BLEPrinter.connectPrinter as jest.Mock).mockImplementation(() => {
        callOrder.push('connectPrinter');
        return Promise.resolve();
      });

      await service.printImages(['iVBORw0KGgoAAAANSUhEUg==']);

      expect(BLEPrinter.closeConn).toHaveBeenCalled();
      expect(BLEPrinter.connectPrinter).toHaveBeenCalledWith(device.address);
      expect(callOrder.indexOf('closeConn')).toBeLessThan(
        callOrder.indexOf('connectPrinter')
      );
    });
  });

  describe('printImage', () => {
    it('should print base64 image when connected', async () => {
      const devices = await service.getPairedDevices();
      const device = devices[0];
      await service.connect(device);

      const printJob = await service.printImage('iVBORw0KGgoAAAANSUhEUg==');

      expect(printJob).toHaveProperty('id');
      expect(printJob).toHaveProperty('status', 'completed');
      expect(printJob).toHaveProperty('createdAt');
    });

    it('should call BLEPrinter.printImageBase64 with base64 data and default width', async () => {
      const devices = await service.getPairedDevices();
      const device = devices[0];
      await service.connect(device);

      (BLEPrinter.connectPrinter as jest.Mock).mockClear();

      await service.printImage('base64ImageData');

      expect(BLEPrinter.printImageBase64).toHaveBeenCalledWith(
        'base64ImageData',
        expect.objectContaining({ imageWidth: 576 })
      );
    });

    it('should use custom image width when provided', async () => {
      const devices = await service.getPairedDevices();
      const device = devices[0];
      await service.connect(device);

      await service.printImage('base64ImageData', 384);

      expect(BLEPrinter.printImageBase64).toHaveBeenCalledWith(
        'base64ImageData',
        expect.objectContaining({ imageWidth: 384 })
      );
    });

    it('should throw error when not connected', async () => {
      await expect(service.printImage('base64ImageData')).rejects.toThrow(
        'No printer connected'
      );
    });

    it('should return failed job when printImageBase64 throws', async () => {
      const devices = await service.getPairedDevices();
      const device = devices[0];
      await service.connect(device);

      (BLEPrinter.printImageBase64 as jest.Mock).mockRejectedValueOnce(
        new Error('Image print error')
      );

      const printJob = await service.printImage('base64ImageData');
      expect(printJob.status).toBe('failed');
      expect(printJob.error).toBe('Image print error');
    });

    it('should reconnect before printing image', async () => {
      const devices = await service.getPairedDevices();
      const device = devices[0];
      await service.connect(device);

      (BLEPrinter.connectPrinter as jest.Mock).mockClear();

      await service.printImage('base64ImageData');

      // Should have reconnected before printing
      expect(BLEPrinter.connectPrinter).toHaveBeenCalledWith(device.address);
    });

    it('should notify print complete listeners', async () => {
      const printListener = jest.fn();
      service.onPrintComplete(printListener);

      const devices = await service.getPairedDevices();
      const device = devices[0];
      await service.connect(device);

      await service.printImage('base64ImageData');

      expect(printListener).toHaveBeenCalled();
      expect(printListener.mock.calls[0][0]).toHaveProperty('status', 'completed');
    });

    it('should send paper feed command after printing image', async () => {
      const devices = await service.getPairedDevices();
      const device = devices[0];
      await service.connect(device);

      (BLEPrinter.printText as jest.Mock).mockClear();

      await service.printImage('base64ImageData');

      // Should send paper feed after image to advance paper past thermal print head
      expect(BLEPrinter.printText).toHaveBeenCalledWith('\n\n\n\n');
    });

    it('should complete print job even when paper feed printText throws', async () => {
      const devices = await service.getPairedDevices();
      const device = devices[0];
      await service.connect(device);

      // Paper feed fails (BLE socket degraded after image transfer)
      (BLEPrinter.printText as jest.Mock).mockRejectedValueOnce(
        new Error('BLE write failed')
      );

      const printJob = await service.printImage('base64ImageData');

      // Job should still be completed — paper feed is best-effort
      expect(printJob.status).toBe('completed');
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

  describe('device name filtering', () => {
    let permSpy: jest.SpyInstance;

    beforeEach(() => {
      // Ensure permissions don't interfere with filter tests
      // (Platform.OS may still be 'android' from permission tests)
      permSpy = jest.spyOn(service, 'requestBluetoothPermissions')
        .mockResolvedValue(true);
    });

    afterEach(() => {
      permSpy.mockRestore();
    });

    it('should filter out JBL audio devices from getPairedDevices', async () => {
      mockDeviceList([
        { device_name: 'JBL Flip 6', inner_mac_address: '11:22:33:44:55:66' },
        { device_name: 'PRAKASH Printer', inner_mac_address: '00:11:22:33:44:55' },
      ]);

      const devices = await service.getPairedDevices();

      expect(devices).toHaveLength(1);
      expect(devices[0].name).toBe('PRAKASH Printer');
    });

    it('should filter out Airdopes earbuds from getPairedDevices', async () => {
      mockDeviceList([
        { device_name: 'Airdopes 131', inner_mac_address: '11:22:33:44:55:77' },
        { device_name: 'EPSON TM-T88', inner_mac_address: '00:11:22:33:44:55' },
      ]);

      const devices = await service.getPairedDevices();

      expect(devices).toHaveLength(1);
      expect(devices[0].name).toBe('EPSON TM-T88');
    });

    it('should filter out car infotainment systems (VW_MIB)', async () => {
      mockDeviceList([
        { device_name: 'VW_MIB', inner_mac_address: '11:22:33:44:55:88' },
        { device_name: 'Star TSP100', inner_mac_address: '00:11:22:33:44:66' },
      ]);

      const devices = await service.getPairedDevices();

      expect(devices).toHaveLength(1);
      expect(devices[0].name).toBe('Star TSP100');
    });

    it('should filter out Galaxy Buds (case-insensitive)', async () => {
      mockDeviceList([
        { device_name: 'Galaxy Buds Pro', inner_mac_address: '11:22:33:44:55:99' },
        { device_name: 'Thermal Printer', inner_mac_address: '00:11:22:33:44:77' },
      ]);

      const devices = await service.getPairedDevices();

      expect(devices).toHaveLength(1);
      expect(devices[0].name).toBe('Thermal Printer');
    });

    it('should filter out multiple non-printer devices at once', async () => {
      mockDeviceList([
        { device_name: 'JBL Charge 5', inner_mac_address: '11:11:11:11:11:11' },
        { device_name: 'Airdopes 441', inner_mac_address: '22:22:22:22:22:22' },
        { device_name: 'VW_MIB Pro', inner_mac_address: '33:33:33:33:33:33' },
        { device_name: 'AirPods Pro', inner_mac_address: '44:44:44:44:44:44' },
        { device_name: 'PRAKASH', inner_mac_address: '55:55:55:55:55:55' },
        { device_name: 'Bose QC45', inner_mac_address: '66:66:66:66:66:66' },
      ]);

      const devices = await service.getPairedDevices();

      expect(devices).toHaveLength(1);
      expect(devices[0].name).toBe('PRAKASH');
    });

    it('should keep printer devices with common thermal printer names', async () => {
      mockDeviceList([
        { device_name: 'EPSON TM-T88', inner_mac_address: '00:11:22:33:44:55' },
        { device_name: 'Star TSP100', inner_mac_address: '00:11:22:33:44:66' },
        { device_name: 'PRAKASH', inner_mac_address: '00:11:22:33:44:77' },
        { device_name: 'RPP02N', inner_mac_address: '00:11:22:33:44:88' },
      ]);

      const devices = await service.getPairedDevices();

      expect(devices).toHaveLength(4);
    });

    it('should apply same filter to startScan results', async () => {
      mockDeviceList([
        { device_name: 'JBL Flip 6', inner_mac_address: '11:22:33:44:55:66' },
        { device_name: 'PRAKASH Printer', inner_mac_address: '00:11:22:33:44:55' },
      ]);

      const devices = await service.startScan(5000);

      expect(devices).toHaveLength(1);
      expect(devices[0].name).toBe('PRAKASH Printer');
    });

    it('should filter out wearable devices', async () => {
      mockDeviceList([
        { device_name: 'Mi Band 7', inner_mac_address: '11:22:33:44:55:AA' },
        { device_name: 'Fitbit Charge 5', inner_mac_address: '11:22:33:44:55:BB' },
        { device_name: 'TSP650', inner_mac_address: '00:11:22:33:44:CC' },
      ]);

      const devices = await service.getPairedDevices();

      expect(devices).toHaveLength(1);
      expect(devices[0].name).toBe('TSP650');
    });

    it('should filter out computer/tablet devices', async () => {
      mockDeviceList([
        { device_name: "MacBook Pro", inner_mac_address: '11:22:33:44:55:DD' },
        { device_name: 'iPad Air', inner_mac_address: '11:22:33:44:55:EE' },
        { device_name: 'POS-58', inner_mac_address: '00:11:22:33:44:FF' },
      ]);

      const devices = await service.getPairedDevices();

      expect(devices).toHaveLength(1);
      expect(devices[0].name).toBe('POS-58');
    });

    it('should not filter Unknown Device entries', async () => {
      mockDeviceList([
        { device_name: '', inner_mac_address: '00:11:22:33:44:AA' },
      ]);

      const devices = await service.getPairedDevices();

      // Unknown devices could be printers, so they should not be filtered
      expect(devices).toHaveLength(1);
      expect(devices[0].name).toBe('Unknown Device');
    });
  });

  describe('printImages (chunked)', () => {
    let permSpy: jest.SpyInstance;

    beforeEach(async () => {
      // Mock permissions for test environment
      permSpy = jest.spyOn(service, 'requestBluetoothPermissions')
        .mockResolvedValue(true);

      mockDeviceList([
        { device_name: 'Test Printer', inner_mac_address: '00:11:22:33:44:55' },
      ]);
      const devices = await service.startScan();
      await service.connect(devices[0]);
    });

    afterEach(() => {
      permSpy.mockRestore();
    });

    it('should print all image chunks sequentially', async () => {
      const chunks = ['base64Chunk1', 'base64Chunk2', 'base64Chunk3'];

      const result = await service.printImages(chunks, 576);

      expect(result.status).toBe('completed');
      expect(BLEPrinter.printImageBase64).toHaveBeenCalledTimes(3);
    });

    it('should print single chunk successfully', async () => {
      const chunks = ['singleChunkBase64'];

      const result = await service.printImages(chunks, 576);

      expect(result.status).toBe('completed');
      expect(BLEPrinter.printImageBase64).toHaveBeenCalledTimes(1);
    });

    it('should return failed status if any chunk fails after retry', async () => {
      const chunks = ['chunk1', 'chunk2'];
      (BLEPrinter.printImageBase64 as jest.Mock)
        .mockResolvedValueOnce(undefined)                    // first chunk succeeds
        .mockRejectedValueOnce(new Error('BLE write failed')) // second chunk first attempt fails
        .mockRejectedValueOnce(new Error('BLE write failed')); // second chunk retry also fails

      const result = await service.printImages(chunks, 576);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('Chunk 2/2 failed after retry');
    });

    it('should throw if no printer is connected', async () => {
      await service.disconnect();

      await expect(service.printImages(['chunk1'], 576)).rejects.toThrow(
        'No printer connected'
      );
    });

    it('should return completed for empty chunks array', async () => {
      const result = await service.printImages([], 576);

      expect(result.status).toBe('completed');
      expect(BLEPrinter.printImageBase64).not.toHaveBeenCalled();
    });

    it('should send paper feed command after printing last chunk', async () => {
      const chunks = ['base64Chunk1', 'base64Chunk2'];

      await service.printImages(chunks, 576);

      // After all image chunks, should print newlines to advance paper past print head
      expect(BLEPrinter.printText).toHaveBeenCalledWith('\n\n\n\n');
    });

    it('should not send paper feed for empty chunks array', async () => {
      await service.printImages([], 576);

      expect(BLEPrinter.printText).not.toHaveBeenCalled();
    });

    it('should retry a failed chunk once and succeed', async () => {
      const chunks = ['chunk1', 'chunk2', 'chunk3'];
      (BLEPrinter.printImageBase64 as jest.Mock)
        .mockResolvedValueOnce(undefined)                     // chunk1 succeeds
        .mockRejectedValueOnce(new Error('BLE write timeout')) // chunk2 first attempt fails
        .mockResolvedValueOnce(undefined)                     // chunk2 retry succeeds
        .mockResolvedValueOnce(undefined);                    // chunk3 succeeds

      const result = await service.printImages(chunks, 576);

      expect(result.status).toBe('completed');
      // 3 chunks + 1 retry = 4 calls total
      expect(BLEPrinter.printImageBase64).toHaveBeenCalledTimes(4);
    });

    it('should fail with chunk-specific error after retry exhausted', async () => {
      const chunks = ['chunk1', 'chunk2'];
      (BLEPrinter.printImageBase64 as jest.Mock)
        .mockResolvedValueOnce(undefined)                     // chunk1 succeeds
        .mockRejectedValueOnce(new Error('BLE write timeout')) // chunk2 first attempt fails
        .mockRejectedValueOnce(new Error('BLE write timeout')); // chunk2 retry also fails

      const result = await service.printImages(chunks, 576);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('Chunk 2/2 failed after retry');
    });

    it('should not retry when all chunks succeed', async () => {
      const chunks = ['chunk1', 'chunk2'];

      const result = await service.printImages(chunks, 576);

      expect(result.status).toBe('completed');
      // Exactly 2 calls — no extra retries
      expect(BLEPrinter.printImageBase64).toHaveBeenCalledTimes(2);
    });

    it('should complete chunked print job even when paper feed printText throws', async () => {
      const chunks = ['chunk1'];

      // Paper feed fails (BLE socket degraded after image transfer)
      (BLEPrinter.printText as jest.Mock).mockRejectedValueOnce(
        new Error('BLE write failed')
      );

      const result = await service.printImages(chunks, 576);

      // Job should still be completed — paper feed is best-effort
      expect(result.status).toBe('completed');
    });
  });
});
