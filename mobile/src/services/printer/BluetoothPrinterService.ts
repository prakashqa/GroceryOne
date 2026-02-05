/**
 * Bluetooth Printer Service
 * Handles Bluetooth device discovery, connection, and printing for thermal printers
 *
 * Note: This service provides an abstraction layer for Bluetooth printing.
 * In a production app, you would integrate with a native Bluetooth library like:
 * - react-native-bluetooth-escpos-printer
 * - react-native-thermal-receipt-printer
 * - expo-bluetooth (when available)
 *
 * For now, this provides the interface and simulated functionality
 * that can be connected to actual Bluetooth APIs.
 */

import { Platform, Alert } from 'react-native';
// eslint-disable-next-line react-native/split-platform-components
import { PermissionsAndroid } from 'react-native';

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

  private deviceDiscoveredListeners: DeviceDiscoveredListener[] = [];
  private connectionStatusListeners: ConnectionStatusListener[] = [];
  private scanCompleteListeners: ScanCompleteListener[] = [];
  private printCompleteListeners: PrintCompleteListener[] = [];

  // Simulated paired devices (for demo purposes)
  private simulatedPairedDevices: BluetoothDevice[] = [
    {
      id: 'bt-001',
      name: 'EPSON TM-T88',
      address: '00:11:22:33:44:55',
      rssi: -45,
      isPaired: true,
      isConnected: false,
    },
    {
      id: 'bt-002',
      name: 'Star TSP100',
      address: '00:11:22:33:44:66',
      rssi: -60,
      isPaired: true,
      isConnected: false,
    },
    {
      id: 'bt-003',
      name: 'Generic Thermal Printer',
      address: '00:11:22:33:44:77',
      rssi: -70,
      isPaired: true,
      isConnected: false,
    },
  ];

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
    // In a real implementation, this would check the actual Bluetooth state
    // For demo, we'll return true
    this.state.isBluetoothEnabled = true;
    return true;
  }

  /**
   * Enable Bluetooth (Android only, prompts user)
   */
  async enableBluetooth(): Promise<boolean> {
    // In a real implementation, this would prompt the user to enable Bluetooth
    // For now, we simulate it
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
   */
  async startScan(timeoutMs: number = 10000): Promise<BluetoothDevice[]> {
    const hasPermission = await this.requestBluetoothPermissions();
    if (!hasPermission) {
      throw new Error('Bluetooth permissions not granted');
    }

    const isEnabled = await this.isBluetoothEnabled();
    if (!isEnabled) {
      const enabled = await this.enableBluetooth();
      if (!enabled) {
        throw new Error('Bluetooth is not enabled');
      }
    }

    this.state.isScanning = true;
    this.state.discoveredDevices = [];

    // In a real implementation, this would use the Bluetooth API to scan
    // For demo, we simulate device discovery
    return new Promise((resolve) => {
      // Simulate discovering devices over time
      let deviceIndex = 0;
      const interval = setInterval(() => {
        if (deviceIndex < this.simulatedPairedDevices.length) {
          const device = this.simulatedPairedDevices[deviceIndex];
          this.state.discoveredDevices.push(device);

          // Notify listeners
          this.deviceDiscoveredListeners.forEach((listener) => listener(device));
          deviceIndex++;
        }
      }, 1000);

      // Stop scan after timeout
      setTimeout(() => {
        clearInterval(interval);
        this.state.isScanning = false;

        // Notify scan complete listeners
        this.scanCompleteListeners.forEach((listener) =>
          listener(this.state.discoveredDevices)
        );

        resolve(this.state.discoveredDevices);
      }, timeoutMs);
    });
  }

  /**
   * Stop scanning for devices
   */
  stopScan(): void {
    this.state.isScanning = false;
  }

  /**
   * Get list of paired/bonded devices
   */
  async getPairedDevices(): Promise<BluetoothDevice[]> {
    // In a real implementation, this would get bonded devices from the system
    return this.simulatedPairedDevices;
  }

  /**
   * Connect to a Bluetooth device
   */
  async connect(device: BluetoothDevice): Promise<boolean> {
    this.updateConnectionStatus('connecting');

    return new Promise((resolve) => {
      // Simulate connection delay
      setTimeout(() => {
        // Update device state
        const connectedDevice = {
          ...device,
          isConnected: true,
        };

        this.state.connectedDevice = connectedDevice;
        this.updateConnectionStatus('connected');

        resolve(true);
      }, 1500);
    });
  }

  /**
   * Disconnect from current device
   */
  async disconnect(): Promise<void> {
    if (this.state.connectedDevice) {
      this.state.connectedDevice = null;
      this.updateConnectionStatus('disconnected');
    }
  }

  /**
   * Print text content to the connected printer
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

    return new Promise((resolve) => {
      // Update job status
      job.status = 'printing';

      // Simulate print time based on content length
      const printTime = Math.min(content.length * 10, 3000);

      setTimeout(() => {
        job.status = 'completed';

        // Notify listeners
        this.printCompleteListeners.forEach((listener) => listener(job));

        resolve(job);
      }, printTime);
    });
  }

  /**
   * Print ESC/POS commands (for thermal printers)
   */
  async printRaw(_commands: Uint8Array): Promise<PrintJob> {
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

    return new Promise((resolve) => {
      job.status = 'printing';

      setTimeout(() => {
        job.status = 'completed';
        this.printCompleteListeners.forEach((listener) => listener(job));
        resolve(job);
      }, 2000);
    });
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
