/**
 * USB Printer Service Tests
 * TDD tests for USB printer discovery, connection, and printing
 */

import { UsbPrinterService } from '../UsbPrinterService';
import { ESC_POS } from '../BluetoothPrinterService';

describe('UsbPrinterService', () => {
  let service: UsbPrinterService;

  beforeEach(() => {
    service = new UsbPrinterService();
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

  describe('discoverDevices', () => {
    it('should initialize USBPrinter before scanning', async () => {
      const { USBPrinter } = require('react-native-thermal-receipt-printer-image-qr');
      await service.discoverDevices();
      expect(USBPrinter.init).toHaveBeenCalled();
    });

    it('should return list of USB devices', async () => {
      const devices = await service.discoverDevices();
      expect(devices.length).toBe(1);
      expect(devices[0].name).toBe('USB Thermal Printer');
      expect(devices[0].vendorId).toBe('1208');
      expect(devices[0].productId).toBe('0001');
    });

    it('should notify device discovered listeners', async () => {
      const listener = jest.fn();
      service.onDeviceDiscovered(listener);

      await service.discoverDevices();

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ vendorId: '1208' })
      );
    });

    it('should update discovered devices state', async () => {
      const devices = await service.discoverDevices();
      expect(service.getDiscoveredDevices()).toEqual(devices);
    });
  });

  describe('connect', () => {
    it('should connect to USB device using vendorId and productId', async () => {
      const { USBPrinter } = require('react-native-thermal-receipt-printer-image-qr');
      const devices = await service.discoverDevices();

      await service.connect(devices[0]);

      expect(USBPrinter.connectPrinter).toHaveBeenCalledWith('1208', '0001');
      expect(service.getConnectionStatus()).toBe('connected');
    });

    it('should update connected device info', async () => {
      const devices = await service.discoverDevices();
      await service.connect(devices[0]);

      const connectedDevice = service.getConnectedDevice();
      expect(connectedDevice).not.toBeNull();
      expect(connectedDevice?.isConnected).toBe(true);
      expect(connectedDevice?.vendorId).toBe('1208');
    });

    it('should handle connection failure', async () => {
      const { USBPrinter } = require('react-native-thermal-receipt-printer-image-qr');
      USBPrinter.connectPrinter.mockRejectedValueOnce(new Error('Connection failed'));

      const devices = await service.discoverDevices();
      const result = await service.connect(devices[0]);

      expect(result).toBe(false);
      expect(service.getConnectionStatus()).toBe('error');
    });
  });

  describe('disconnect', () => {
    it('should disconnect and update status', async () => {
      const { USBPrinter } = require('react-native-thermal-receipt-printer-image-qr');
      const devices = await service.discoverDevices();

      await service.connect(devices[0]);
      expect(service.getConnectionStatus()).toBe('connected');

      await service.disconnect();

      expect(USBPrinter.closeConn).toHaveBeenCalled();
      expect(service.getConnectionStatus()).toBe('disconnected');
      expect(service.getConnectedDevice()).toBeNull();
    });
  });

  describe('print', () => {
    it('should print content when connected', async () => {
      const { USBPrinter } = require('react-native-thermal-receipt-printer-image-qr');
      const devices = await service.discoverDevices();
      await service.connect(devices[0]);

      const job = await service.print('Test receipt content');

      expect(USBPrinter.printText).toHaveBeenCalledWith(
        expect.stringContaining('Test receipt content')
      );
      expect(job.status).toBe('completed');
      expect(job.content).toBe('Test receipt content');
    });

    it('should throw error when not connected', async () => {
      await expect(service.print('Test')).rejects.toThrow(
        'No printer connected'
      );
    });

    it('should notify print complete listeners', async () => {
      const listener = jest.fn();
      service.onPrintComplete(listener);

      const devices = await service.discoverDevices();
      await service.connect(devices[0]);
      await service.print('Test content');

      expect(listener).toHaveBeenCalled();
      expect(listener.mock.calls[0][0]).toHaveProperty('status', 'completed');
    });
  });

  describe('printRaw', () => {
    it('should print raw commands when connected', async () => {
      const devices = await service.discoverDevices();
      await service.connect(devices[0]);

      const rawCommands = new Uint8Array([0x1b, 0x40]); // ESC @
      const job = await service.printRaw(rawCommands);

      expect(job.status).toBe('completed');
    });

    it('should throw error when not connected', async () => {
      const rawCommands = new Uint8Array([0x1b, 0x40]);
      await expect(service.printRaw(rawCommands)).rejects.toThrow(
        'No printer connected'
      );
    });
  });

  describe('ensureConnected (reconnect before print)', () => {
    it('should reconnect to the last connected device before printing', async () => {
      const { USBPrinter } = require('react-native-thermal-receipt-printer-image-qr');
      const devices = await service.discoverDevices();
      await service.connect(devices[0]);

      // Clear mocks to track only calls made during print()
      (USBPrinter.connectPrinter as jest.Mock).mockClear();

      const printJob = await service.print('Test content');

      // Should have reconnected (called connectPrinter with vendorId and productId)
      expect(USBPrinter.connectPrinter).toHaveBeenCalledWith('1208', '0001');
      expect(USBPrinter.printText).toHaveBeenCalled();
      expect(printJob.status).toBe('completed');
    });

    it('should reconnect before printRaw', async () => {
      const { USBPrinter } = require('react-native-thermal-receipt-printer-image-qr');
      const devices = await service.discoverDevices();
      await service.connect(devices[0]);

      (USBPrinter.connectPrinter as jest.Mock).mockClear();

      const rawCommands = new Uint8Array([0x1b, 0x40]);
      const printJob = await service.printRaw(rawCommands);

      expect(USBPrinter.connectPrinter).toHaveBeenCalledWith('1208', '0001');
      expect(printJob.status).toBe('completed');
    });

    it('should return failed job when reconnect fails', async () => {
      const { USBPrinter } = require('react-native-thermal-receipt-printer-image-qr');
      const devices = await service.discoverDevices();
      await service.connect(devices[0]);

      // Simulate reconnect failure
      (USBPrinter.connectPrinter as jest.Mock).mockRejectedValueOnce(
        new Error('USB device disconnected')
      );

      const printJob = await service.print('Test content');

      expect(printJob.status).toBe('failed');
      expect(printJob.error).toContain('Failed to reconnect');
    });
  });

  describe('printImage', () => {
    it('should print base64 image when connected', async () => {
      const devices = await service.discoverDevices();
      await service.connect(devices[0]);

      const printJob = await service.printImage('iVBORw0KGgoAAAANSUhEUg==');

      expect(printJob).toHaveProperty('id');
      expect(printJob).toHaveProperty('status', 'completed');
      expect(printJob).toHaveProperty('createdAt');
    });

    it('should call USBPrinter.printImageBase64 with base64 data and default width', async () => {
      const { USBPrinter } = require('react-native-thermal-receipt-printer-image-qr');
      const devices = await service.discoverDevices();
      await service.connect(devices[0]);

      await service.printImage('base64ImageData');

      expect(USBPrinter.printImageBase64).toHaveBeenCalledWith(
        'base64ImageData',
        expect.objectContaining({ imageWidth: 576 })
      );
    });

    it('should use custom image width when provided', async () => {
      const { USBPrinter } = require('react-native-thermal-receipt-printer-image-qr');
      const devices = await service.discoverDevices();
      await service.connect(devices[0]);

      await service.printImage('base64ImageData', 384);

      expect(USBPrinter.printImageBase64).toHaveBeenCalledWith(
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
      const { USBPrinter } = require('react-native-thermal-receipt-printer-image-qr');
      const devices = await service.discoverDevices();
      await service.connect(devices[0]);

      (USBPrinter.printImageBase64 as jest.Mock).mockRejectedValueOnce(
        new Error('Image print error')
      );

      const printJob = await service.printImage('base64ImageData');
      expect(printJob.status).toBe('failed');
      expect(printJob.error).toBe('Image print error');
    });

    it('should reconnect before printing image', async () => {
      const { USBPrinter } = require('react-native-thermal-receipt-printer-image-qr');
      const devices = await service.discoverDevices();
      await service.connect(devices[0]);

      (USBPrinter.connectPrinter as jest.Mock).mockClear();

      await service.printImage('base64ImageData');

      expect(USBPrinter.connectPrinter).toHaveBeenCalledWith('1208', '0001');
    });

    it('should notify print complete listeners', async () => {
      const printListener = jest.fn();
      service.onPrintComplete(printListener);

      const devices = await service.discoverDevices();
      await service.connect(devices[0]);

      await service.printImage('base64ImageData');

      expect(printListener).toHaveBeenCalled();
      expect(printListener.mock.calls[0][0]).toHaveProperty('status', 'completed');
    });

    it('should send atomic feed-and-cut (GS V B 6) after printing image', async () => {
      const { USBPrinter } = require('react-native-thermal-receipt-printer-image-qr');
      const devices = await service.discoverDevices();
      await service.connect(devices[0]);

      (USBPrinter.printRawData as jest.Mock).mockClear();

      await service.printImage('base64ImageData');

      // Use atomic feed-then-cut rather than two separate commands so the
      // receipt's end advances past the cutter before the blade fires.
      expect(USBPrinter.printRawData).toHaveBeenCalledWith(ESC_POS.FEED_AND_CUT);
      expect(USBPrinter.printRawData).not.toHaveBeenCalledWith(ESC_POS.FEED_4_LINES);
      expect(USBPrinter.printRawData).not.toHaveBeenCalledWith(ESC_POS.CUT_PARTIAL);
    });

    it('should not fail print job if auto-cut command fails', async () => {
      const { USBPrinter } = require('react-native-thermal-receipt-printer-image-qr');
      const devices = await service.discoverDevices();
      await service.connect(devices[0]);

      // Auto-cut fails (printer has no cutter)
      (USBPrinter.printRawData as jest.Mock).mockRejectedValueOnce(
        new Error('Cut command not supported')
      );

      const printJob = await service.printImage('base64ImageData');

      // Job should still be completed — auto-cut is best-effort
      expect(printJob.status).toBe('completed');
    });
  });

  describe('event listeners', () => {
    it('should notify connection status listeners on connect', async () => {
      const listener = jest.fn();
      service.onConnectionStatusChange(listener);

      const devices = await service.discoverDevices();
      await service.connect(devices[0]);

      expect(listener).toHaveBeenCalledWith('connecting');
      expect(listener).toHaveBeenCalledWith('connected');
    });

    it('should notify connection status listeners on disconnect', async () => {
      const listener = jest.fn();

      const devices = await service.discoverDevices();
      await service.connect(devices[0]);

      service.onConnectionStatusChange(listener);
      await service.disconnect();

      expect(listener).toHaveBeenCalledWith('disconnected');
    });

    it('should allow unsubscribing from listeners', async () => {
      const listener = jest.fn();
      const unsub = service.onConnectionStatusChange(listener);

      unsub();

      const devices = await service.discoverDevices();
      await service.connect(devices[0]);

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
