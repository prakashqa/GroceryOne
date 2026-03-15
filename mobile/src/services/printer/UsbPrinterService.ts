/**
 * USB Printer Service
 * Handles USB device discovery, connection, and printing for thermal printers
 * Uses react-native-thermal-receipt-printer-image-qr USBPrinter module
 */

import { Platform } from 'react-native';

// Conditionally require native module — crashes on web
/* eslint-disable @typescript-eslint/no-var-requires */
const USBPrinter = Platform.OS !== 'web'
  ? require('react-native-thermal-receipt-printer-image-qr').USBPrinter
  : null;
/* eslint-enable @typescript-eslint/no-var-requires */

// Reuse ESC/POS Base64 constants from BluetoothPrinterService
import { ESC_POS } from './BluetoothPrinterService';

// USB device interface
export interface UsbDevice {
  id: string;
  name: string;
  vendorId: string;
  productId: string;
  isConnected: boolean;
}

// USB print job interface
export interface UsbPrintJob {
  id: string;
  content: string;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  createdAt: Date;
  error?: string;
}

// USB connection status
export type UsbConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

// Service state
interface UsbPrinterServiceState {
  isScanning: boolean;
  connectionStatus: UsbConnectionStatus;
  connectedDevice: UsbDevice | null;
  discoveredDevices: UsbDevice[];
  printQueue: UsbPrintJob[];
}

// Event listeners
type DeviceDiscoveredListener = (device: UsbDevice) => void;
type ConnectionStatusListener = (status: UsbConnectionStatus) => void;
type PrintCompleteListener = (job: UsbPrintJob) => void;

class UsbPrinterService {
  private state: UsbPrinterServiceState = {
    isScanning: false,
    connectionStatus: 'disconnected',
    connectedDevice: null,
    discoveredDevices: [],
    printQueue: [],
  };

  private isInitialized: boolean = false;

  private deviceDiscoveredListeners: DeviceDiscoveredListener[] = [];
  private connectionStatusListeners: ConnectionStatusListener[] = [];
  private printCompleteListeners: PrintCompleteListener[] = [];

  /**
   * Initialize the USB printer module
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      try {
        await USBPrinter.init();
        this.isInitialized = true;
      } catch (error) {
        console.error('Failed to initialize USBPrinter:', error);
        throw error;
      }
    }
  }

  /**
   * Ensure we have an active USB connection by reconnecting to the last device.
   * USB connections can be lost if the device is unplugged or enters power save.
   * Reconnecting creates a fresh connection, preventing stale state errors.
   */
  private async ensureConnected(): Promise<void> {
    if (!this.state.connectedDevice) {
      throw new Error('No printer connected');
    }
    try {
      await this.ensureInitialized();
      await USBPrinter.connectPrinter(
        this.state.connectedDevice.vendorId,
        this.state.connectedDevice.productId
      );
    } catch (error) {
      this.updateConnectionStatus('error');
      throw new Error(
        'Failed to reconnect to printer: ' + (error as Error).message
      );
    }
  }

  /**
   * Map library device format to UsbDevice interface
   */
  private mapToUsbDevice(rawDevice: {
    device_name?: string;
    vendor_id: string;
    product_id: string;
  }): UsbDevice {
    return {
      id: `${rawDevice.vendor_id}-${rawDevice.product_id}`,
      name: rawDevice.device_name || `USB Printer (${rawDevice.vendor_id})`,
      vendorId: String(rawDevice.vendor_id),
      productId: String(rawDevice.product_id),
      isConnected: false,
    };
  }

  /**
   * Discover connected USB devices
   */
  async discoverDevices(): Promise<UsbDevice[]> {
    this.state.isScanning = true;
    this.state.discoveredDevices = [];

    try {
      await this.ensureInitialized();

      const rawDevices = await USBPrinter.getDeviceList();

      const devices: UsbDevice[] = (rawDevices || []).map(
        (d: { device_name?: string; vendor_id: string; product_id: string }) =>
          this.mapToUsbDevice(d)
      );

      this.state.discoveredDevices = devices;

      // Notify device discovered listeners for each device
      devices.forEach((device) => {
        this.deviceDiscoveredListeners.forEach((listener) => listener(device));
      });

      return devices;
    } catch (error) {
      console.error('USB scan error:', error);
      throw error;
    } finally {
      this.state.isScanning = false;
    }
  }

  /**
   * Connect to a USB device
   */
  async connect(device: UsbDevice): Promise<boolean> {
    this.updateConnectionStatus('connecting');

    try {
      await this.ensureInitialized();
      await USBPrinter.connectPrinter(device.vendorId, device.productId);

      this.state.connectedDevice = { ...device, isConnected: true };
      this.updateConnectionStatus('connected');

      return true;
    } catch (error) {
      console.error('USB connect error:', error);
      this.updateConnectionStatus('error');
      return false;
    }
  }

  /**
   * Disconnect from current device
   */
  async disconnect(): Promise<void> {
    try {
      await USBPrinter.closeConn();
    } catch (error) {
      console.error('USB disconnect error:', error);
    }
    this.state.connectedDevice = null;
    this.updateConnectionStatus('disconnected');
  }

  /**
   * Print text content to the connected USB printer
   */
  async print(content: string): Promise<UsbPrintJob> {
    if (!this.state.connectedDevice) {
      throw new Error('No printer connected');
    }

    const job: UsbPrintJob = {
      id: `print-${Date.now()}`,
      content,
      status: 'pending',
      createdAt: new Date(),
    };

    this.state.printQueue.push(job);
    job.status = 'printing';

    try {
      await this.ensureConnected();
      await USBPrinter.printText(content);
      job.status = 'completed';
    } catch (error: any) {
      job.status = 'failed';
      job.error = error.message || 'Print failed';
    }

    // Notify listeners
    this.printCompleteListeners.forEach((listener) => listener(job));
    return job;
  }

  /**
   * Print ESC/POS raw commands
   */
  async printRaw(commands: Uint8Array): Promise<UsbPrintJob> {
    if (!this.state.connectedDevice) {
      throw new Error('No printer connected');
    }

    const job: UsbPrintJob = {
      id: `print-${Date.now()}`,
      content: '[RAW ESC/POS DATA]',
      status: 'pending',
      createdAt: new Date(),
    };

    this.state.printQueue.push(job);
    job.status = 'printing';

    try {
      await this.ensureConnected();
      const hexString = Array.from(commands)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      await USBPrinter.printRawData(hexString);
      job.status = 'completed';
    } catch (error: any) {
      job.status = 'failed';
      job.error = error.message || 'Raw print failed';
    }

    this.printCompleteListeners.forEach((listener) => listener(job));
    return job;
  }

  /**
   * Print a base64-encoded image to the connected USB printer.
   * Used for receipts containing non-ASCII text (e.g., Telugu) that cannot
   * be rendered by the printer's built-in single-byte codepage fonts.
   * Reconnects before printing to ensure the USB connection is alive.
   *
   * @param base64Image Base64-encoded PNG image data (no data URI prefix)
   * @param imageWidth Width in pixels (576 for 80mm, 384 for 58mm)
   */
  async printImage(base64Image: string, imageWidth: number = 576): Promise<UsbPrintJob> {
    if (!this.state.connectedDevice) {
      throw new Error('No printer connected');
    }

    const job: UsbPrintJob = {
      id: `print-img-${Date.now()}`,
      content: '[IMAGE RECEIPT]',
      status: 'pending',
      createdAt: new Date(),
    };

    this.state.printQueue.push(job);
    job.status = 'printing';

    try {
      await this.ensureConnected();
      await USBPrinter.printImageBase64(base64Image, {
        imageWidth: imageWidth,
      });
      job.status = 'completed';

      // Paper feed: ESC d 4 (feed 4 lines) via printRawData with Base64 encoding.
      try {
        await USBPrinter.printRawData(ESC_POS.FEED_4_LINES);
      } catch {
        // Swallow paper feed errors — don't fail the print job
      }

      // Auto-cut: GS V 1 (partial paper cut) via printRawData with Base64 encoding.
      try {
        await USBPrinter.printRawData(ESC_POS.CUT_PARTIAL);
      } catch {
        // Swallow cut errors — printer may not have a cutter
      }
    } catch (error: any) {
      job.status = 'failed';
      job.error = error.message || 'Image print failed';
    }

    this.printCompleteListeners.forEach((listener) => listener(job));
    return job;
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): UsbConnectionStatus {
    return this.state.connectionStatus;
  }

  /**
   * Get connected device info
   */
  getConnectedDevice(): UsbDevice | null {
    return this.state.connectedDevice;
  }

  /**
   * Check if currently scanning
   */
  isCurrentlyScanning(): boolean {
    return this.state.isScanning;
  }

  /**
   * Get discovered devices
   */
  getDiscoveredDevices(): UsbDevice[] {
    return [...this.state.discoveredDevices];
  }

  // Event listener management
  onDeviceDiscovered(listener: DeviceDiscoveredListener): () => void {
    this.deviceDiscoveredListeners.push(listener);
    return () => {
      this.deviceDiscoveredListeners = this.deviceDiscoveredListeners.filter(
        (l) => l !== listener
      );
    };
  }

  onConnectionStatusChange(listener: ConnectionStatusListener): () => void {
    this.connectionStatusListeners.push(listener);
    return () => {
      this.connectionStatusListeners = this.connectionStatusListeners.filter(
        (l) => l !== listener
      );
    };
  }

  onPrintComplete(listener: PrintCompleteListener): () => void {
    this.printCompleteListeners.push(listener);
    return () => {
      this.printCompleteListeners = this.printCompleteListeners.filter(
        (l) => l !== listener
      );
    };
  }

  private updateConnectionStatus(status: UsbConnectionStatus): void {
    this.state.connectionStatus = status;
    this.connectionStatusListeners.forEach((listener) => listener(status));
  }
}

// Export singleton instance
export const usbPrinterService = new UsbPrinterService();

// Export class for testing
export { UsbPrinterService };
