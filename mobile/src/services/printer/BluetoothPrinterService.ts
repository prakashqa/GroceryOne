/**
 * Bluetooth Printer Service
 * Handles Bluetooth device discovery, connection, and printing for thermal printers
 * Uses react-native-thermal-receipt-printer-image-qr for real Bluetooth communication
 */

import { Platform, Alert } from 'react-native';
// eslint-disable-next-line react-native/split-platform-components
import { PermissionsAndroid } from 'react-native';
import { BLEPrinter } from 'react-native-thermal-receipt-printer-image-qr';

// Bluetooth device interface
export interface BluetoothDevice {
  id: string;
  name: string;
  address: string;
  rssi?: number; // Signal strength
  isPaired: boolean;
  isConnected: boolean;
}

// Print job interface
export interface PrintJob {
  id: string;
  content: string;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  createdAt: Date;
  error?: string;
}

// Connection status
export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

// Service state
interface PrinterServiceState {
  isScanning: boolean;
  isBluetoothEnabled: boolean;
  connectionStatus: ConnectionStatus;
  connectedDevice: BluetoothDevice | null;
  discoveredDevices: BluetoothDevice[];
  printQueue: PrintJob[];
}

// Event listeners
type DeviceDiscoveredListener = (device: BluetoothDevice) => void;
type ConnectionStatusListener = (status: ConnectionStatus) => void;
type ScanCompleteListener = (devices: BluetoothDevice[]) => void;
type PrintCompleteListener = (job: PrintJob) => void;

class BluetoothPrinterService {
  private state: PrinterServiceState = {
    isScanning: false,
    isBluetoothEnabled: false,
    connectionStatus: 'disconnected',
    connectedDevice: null,
    discoveredDevices: [],
    printQueue: [],
  };

  private isInitialized: boolean = false;

  private deviceDiscoveredListeners: DeviceDiscoveredListener[] = [];
  private connectionStatusListeners: ConnectionStatusListener[] = [];
  private scanCompleteListeners: ScanCompleteListener[] = [];
  private printCompleteListeners: PrintCompleteListener[] = [];

  /**
   * Initialize the BLE printer module
   * Requests Bluetooth permissions before calling native init to prevent
   * crashes on Android 12+ where BLUETOOTH_CONNECT is required.
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      const hasPermission = await this.requestBluetoothPermissions();
      if (!hasPermission) {
        throw new Error('Bluetooth permissions not granted');
      }
      try {
        await BLEPrinter.init();
        this.isInitialized = true;
      } catch (error) {
        console.error('Failed to initialize BLEPrinter:', error);
        throw error;
      }
    }
  }

  /**
   * Map library device format to BluetoothDevice interface
   */
  private mapToBluetoothDevice(rawDevice: {
    device_name?: string;
    inner_mac_address: string;
  }): BluetoothDevice {
    return {
      id: rawDevice.inner_mac_address,
      name: rawDevice.device_name || 'Unknown Device',
      address: rawDevice.inner_mac_address,
      isPaired: true,
      isConnected: false,
    };
  }

  /**
   * Blocklist patterns for known non-printer Bluetooth devices.
   * Case-insensitive match against device name.
   * Uses a blocklist (exclude known non-printers) rather than a whitelist
   * because thermal printer names vary widely and a whitelist would miss many.
   */
  private static readonly NON_PRINTER_PATTERNS: RegExp[] = [
    // Audio devices
    /\bJBL\b/i,
    /\bAirPods\b/i,
    /\bAirdopes\b/i,
    /\bGalaxy Buds\b/i,
    /\bBose\b/i,
    /\bBeats\b/i,
    /\bSony WH/i,
    /\bSony WF/i,
    /\bJabra\b/i,
    /\bSennheiser\b/i,
    /\bSoundcore\b/i,
    // Car infotainment
    /\bVW_MIB\b/i,
    /\bBMW\b/i,
    /\bMercedes\b/i,
    /\bCar Audio\b/i,
    /\bCarPlay\b/i,
    // Wearables
    /\bWatch\b/i,
    /\bMi Band\b/i,
    /\bFitbit\b/i,
    /\bGarmin\b/i,
    // Computers / tablets
    /\bMacBook\b/i,
    /\bLaptop\b/i,
    /\biPad\b/i,
  ];

  /**
   * Filter out known non-printer devices from the device list.
   * Devices with empty/missing names ("Unknown Device") are kept since
   * they could be printers without a proper Bluetooth name.
   */
  private filterPrinterDevices(devices: BluetoothDevice[]): BluetoothDevice[] {
    return devices.filter((device) => {
      // Keep unknown devices — they could be unnamed printers
      if (!device.name || device.name === 'Unknown Device') {
        return true;
      }
      // Exclude devices matching any non-printer pattern
      return !BluetoothPrinterService.NON_PRINTER_PATTERNS.some(
        (pattern) => pattern.test(device.name)
      );
    });
  }

  /**
   * Check and request Bluetooth permissions (Android)
   */
  async requestBluetoothPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        // For Android 12+ (API 31+), need BLUETOOTH_SCAN and BLUETOOTH_CONNECT
        if (Platform.Version >= 31) {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ]);

          const allGranted = Object.values(granted).every(
            (status) => status === PermissionsAndroid.RESULTS.GRANTED
          );

          return allGranted;
        } else {
          // For older Android versions
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Bluetooth Permission',
              message:
                'GroceryOne needs access to Bluetooth to connect to printers.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (err) {
        console.error('Error requesting Bluetooth permissions:', err);
        return false;
      }
    }
    // iOS permissions are handled through Info.plist
    return true;
  }

  /**
   * Check if Bluetooth is enabled on the device
   */
  async isBluetoothEnabled(): Promise<boolean> {
    try {
      await this.ensureInitialized();
      this.state.isBluetoothEnabled = true;
      return true;
    } catch {
      this.state.isBluetoothEnabled = false;
      return false;
    }
  }

  /**
   * Enable Bluetooth (Android only, prompts user)
   */
  async enableBluetooth(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Enable Bluetooth',
        'Please enable Bluetooth in your device settings to connect to printers.',
        [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'OK', onPress: () => resolve(true) },
        ]
      );
    });
  }

  /**
   * Start scanning for Bluetooth devices
   * Returns paired/bonded BLE devices via the native library
   */
  async startScan(_timeoutMs: number = 10000): Promise<BluetoothDevice[]> {
    const hasPermission = await this.requestBluetoothPermissions();
    if (!hasPermission) {
      throw new Error('Bluetooth permissions not granted');
    }

    this.state.isScanning = true;
    this.state.discoveredDevices = [];

    try {
      await this.ensureInitialized();

      const rawDevices = await BLEPrinter.getDeviceList();

      const allDevices: BluetoothDevice[] = (rawDevices || []).map(
        (d: { device_name?: string; inner_mac_address: string }) =>
          this.mapToBluetoothDevice(d)
      );

      // Filter out known non-printer devices (earbuds, car audio, etc.)
      const devices = this.filterPrinterDevices(allDevices);

      this.state.discoveredDevices = devices;

      // Notify device discovered listeners for each device
      devices.forEach((device) => {
        this.deviceDiscoveredListeners.forEach((listener) => listener(device));
      });

      // Notify scan complete listeners
      this.scanCompleteListeners.forEach((listener) => listener(devices));

      return devices;
    } catch (error) {
      console.error('Bluetooth scan error:', error);
      throw error;
    } finally {
      this.state.isScanning = false;
    }
  }

  /**
   * Stop scanning for devices
   */
  stopScan(): void {
    this.state.isScanning = false;
  }

  /**
   * Get list of paired/bonded devices
   * Requests Bluetooth permissions before accessing device list to prevent
   * crashes on Android 12+ where BLUETOOTH_CONNECT is required.
   */
  async getPairedDevices(): Promise<BluetoothDevice[]> {
    try {
      const hasPermission = await this.requestBluetoothPermissions();
      if (!hasPermission) {
        console.warn('Bluetooth permissions not granted, returning empty device list');
        return [];
      }
      await this.ensureInitialized();
      const rawDevices = await BLEPrinter.getDeviceList();
      const allDevices = (rawDevices || []).map(
        (d: { device_name?: string; inner_mac_address: string }) =>
          this.mapToBluetoothDevice(d)
      );
      return this.filterPrinterDevices(allDevices);
    } catch (error) {
      console.error('Error getting paired devices:', error);
      return [];
    }
  }

  /**
   * Connect to a Bluetooth device
   */
  async connect(device: BluetoothDevice): Promise<boolean> {
    this.updateConnectionStatus('connecting');

    try {
      await this.ensureInitialized();
      await BLEPrinter.connectPrinter(device.address);

      const connectedDevice: BluetoothDevice = {
        ...device,
        isConnected: true,
      };

      this.state.connectedDevice = connectedDevice;
      this.updateConnectionStatus('connected');

      return true;
    } catch (error) {
      console.error('Bluetooth connect error:', error);
      this.updateConnectionStatus('error');
      return false;
    }
  }

  /**
   * Disconnect from current device
   */
  async disconnect(): Promise<void> {
    try {
      await BLEPrinter.closeConn();
    } catch (error) {
      console.error('Bluetooth disconnect error:', error);
    }
    this.state.connectedDevice = null;
    this.updateConnectionStatus('disconnected');
  }

  /**
   * Ensure we have an active BLE connection by reconnecting to the last device.
   * BLE connections can silently drop; the native layer may hold a stale socket
   * with a null OutputStream. Reconnecting creates a fresh socket, preventing
   * native NullPointerException crashes in BLEPrinterAdapter.printRawData().
   */
  private async ensureConnected(): Promise<void> {
    if (!this.state.connectedDevice) {
      throw new Error('No printer connected');
    }
    try {
      await this.ensureInitialized();
      await BLEPrinter.connectPrinter(this.state.connectedDevice.address);
    } catch (error) {
      this.updateConnectionStatus('error');
      throw new Error(
        'Failed to reconnect to printer: ' + (error as Error).message
      );
    }
  }

  /**
   * Print text content to the connected printer
   * Reconnects before printing to ensure the native BLE socket is alive.
   */
  async print(content: string): Promise<PrintJob> {
    if (!this.state.connectedDevice) {
      throw new Error('No printer connected');
    }

    const job: PrintJob = {
      id: `print-${Date.now()}`,
      content,
      status: 'pending',
      createdAt: new Date(),
    };

    this.state.printQueue.push(job);
    job.status = 'printing';

    try {
      await this.ensureConnected();
      await BLEPrinter.printText(content);
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
   * Print ESC/POS commands (for thermal printers)
   * Reconnects before printing to ensure the native BLE socket is alive.
   */
  async printRaw(commands: Uint8Array): Promise<PrintJob> {
    if (!this.state.connectedDevice) {
      throw new Error('No printer connected');
    }

    const job: PrintJob = {
      id: `print-${Date.now()}`,
      content: '[RAW ESC/POS DATA]',
      status: 'pending',
      createdAt: new Date(),
    };

    this.state.printQueue.push(job);
    job.status = 'printing';

    try {
      await this.ensureConnected();
      // Convert Uint8Array to hex string for the library
      const hexString = Array.from(commands)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      await BLEPrinter.printRawData(hexString);
      job.status = 'completed';
    } catch (error: any) {
      job.status = 'failed';
      job.error = error.message || 'Raw print failed';
    }

    this.printCompleteListeners.forEach((listener) => listener(job));
    return job;
  }

  /**
   * Print a base64-encoded image to the connected printer.
   * Used for receipts containing non-ASCII text (e.g., Telugu) that cannot
   * be rendered by the printer's built-in single-byte codepage fonts.
   * The image is pre-rendered on the device where the OS natively renders Telugu.
   * Reconnects before printing to ensure the native BLE socket is alive.
   *
   * @param base64Image Base64-encoded PNG image data (no data URI prefix)
   * @param imageWidth Width in pixels (576 for 80mm, 384 for 58mm)
   */
  async printImage(base64Image: string, imageWidth: number = 576): Promise<PrintJob> {
    if (!this.state.connectedDevice) {
      throw new Error('No printer connected');
    }

    const job: PrintJob = {
      id: `print-img-${Date.now()}`,
      content: '[IMAGE RECEIPT]',
      status: 'pending',
      createdAt: new Date(),
    };

    this.state.printQueue.push(job);
    job.status = 'printing';

    try {
      await this.ensureConnected();
      await BLEPrinter.printImageBase64(base64Image, {
        imageWidth: imageWidth,
      });
      job.status = 'completed';
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
  getConnectionStatus(): ConnectionStatus {
    return this.state.connectionStatus;
  }

  /**
   * Get connected device info
   */
  getConnectedDevice(): BluetoothDevice | null {
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
  getDiscoveredDevices(): BluetoothDevice[] {
    return this.state.discoveredDevices;
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

  onScanComplete(listener: ScanCompleteListener): () => void {
    this.scanCompleteListeners.push(listener);
    return () => {
      this.scanCompleteListeners = this.scanCompleteListeners.filter(
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

  private updateConnectionStatus(status: ConnectionStatus): void {
    this.state.connectionStatus = status;
    this.connectionStatusListeners.forEach((listener) => listener(status));
  }
}

// Export singleton instance
export const bluetoothPrinterService = new BluetoothPrinterService();

// Export class for testing
export { BluetoothPrinterService };
