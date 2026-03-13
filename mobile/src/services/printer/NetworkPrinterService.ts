/**
 * Network Printer Service
 * Handles network (WiFi/Ethernet) thermal printer discovery, connection, and printing
 *
 * Uses react-native-tcp-socket for TCP connections to RAW/JetDirect thermal printers (port 9100)
 * Designed for merchant thermal receipt printers (EPSON, Star, etc.)
 */

import { Platform } from 'react-native';

// Conditionally require native module — crashes on web
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TcpSocket = Platform.OS !== 'web'
  ? require('react-native-tcp-socket').default
  : null;

// Printer protocol type (only RAW TCP for thermal printers)
export type PrinterProtocol = 'raw';

// Network printer interface
export interface NetworkPrinter {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  isConnected: boolean;
  protocol?: PrinterProtocol; // 'raw' for thermal printers (port 9100)
}

// Print job interface
export interface NetworkPrintJob {
  id: string;
  content: string;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  createdAt: Date;
  error?: string;
}

// Optional printer info for print calls (when service state may not be set)
export interface PrinterInfo {
  ipAddress: string;
  name: string;
}

// Connection status
export type NetworkConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

// Service state
interface NetworkPrinterServiceState {
  isScanning: boolean;
  connectionStatus: NetworkConnectionStatus;
  connectedPrinter: NetworkPrinter | null;
  discoveredPrinters: NetworkPrinter[];
  savedPrinters: NetworkPrinter[];
  printQueue: NetworkPrintJob[];
}

// Event listeners
type PrinterDiscoveredListener = (printer: NetworkPrinter) => void;
type ConnectionStatusListener = (status: NetworkConnectionStatus) => void;
type ScanCompleteListener = (printers: NetworkPrinter[]) => void;
type PrintCompleteListener = (job: NetworkPrintJob) => void;

// Default port for RAW/JetDirect printing
const DEFAULT_PORT = 9100;

// IP validation regex
const IP_REGEX =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

// Connection timeout in milliseconds
const CONNECTION_TIMEOUT = 10000;
const PRINT_TIMEOUT = 30000;

// Maximum reconnection attempts
const MAX_RECONNECT_ATTEMPTS = 3;

/**
 * Format text for printing with ESC/POS commands (thermal/receipt printers)
 * Prepends ESC @ to reset printer state, normalizes line endings to CRLF,
 * and appends GS V 1 for partial paper cut.
 */
const formatPrintText = (text: string): string => {
  // ESC @ (0x1B 0x40) - Initialize/reset printer to default settings
  const escInit = '\x1B\x40';

  // Normalize line endings to CR+LF (standard for most network printers)
  const normalizedText = text.replace(/\r?\n/g, '\r\n');

  // GS V 1 (0x1D 0x56 0x01) - Partial paper cut (leaves a small connection)
  const paperCut = '\x1D\x56\x01';

  return escInit + normalizedText + '\r\n' + paperCut;
};

/**
 * Print via RAW socket on port 9100 for thermal printers
 */
const printViaRAWSocket = async (
  ipAddress: string,
  content: string,
  printerName: string
): Promise<{ success: boolean; error?: string }> => {
  return new Promise((resolve) => {
    try {
      console.log(`Sending print job via RAW socket to ${ipAddress}:9100`);

      // Create a new socket connection specifically for this print job
      const printSocket = TcpSocket.createConnection(
        {
          host: ipAddress,
          port: 9100,
        },
        () => {
          console.log('RAW socket connected for printing');

          // Format content for thermal printers (plain text with CRLF)
          const formattedContent = formatPrintText(content);
          console.log(`Sending ${formattedContent.length} bytes to thermal printer: ${printerName}`);

          // Send the data
          printSocket.write(formattedContent, 'utf8', (writeError) => {
            if (writeError) {
              console.error('RAW socket write error:', writeError);
              printSocket.destroy();
              resolve({ success: false, error: writeError.message });
            } else {
              console.log('Print data sent successfully to thermal printer');
              // Give the printer time to receive and process all data before closing
              setTimeout(() => {
                printSocket.destroy();
                resolve({ success: true });
              }, 1000);
            }
          });
        }
      );

      if (!printSocket) {
        resolve({ success: false, error: 'Failed to create socket' });
        return;
      }

      printSocket.on('error', (error: Error) => {
        console.error('RAW print socket error:', error);
        resolve({ success: false, error: error.message });
      });

      printSocket.on('timeout', () => {
        console.error('RAW print socket timeout');
        printSocket.destroy();
        resolve({ success: false, error: 'Connection timeout' });
      });

      // Set timeout if method exists (may not exist in mocks)
      if (typeof printSocket.setTimeout === 'function') {
        printSocket.setTimeout(30000);
      }
    } catch (error: any) {
      console.error('RAW print error:', error);
      resolve({ success: false, error: error.message || 'Print failed' });
    }
  });
};

class NetworkPrinterService {
  // Auto-reconnect flag
  private autoReconnect: boolean = true;

  // Last connected printer for reconnection attempts
  private lastConnectedPrinter: NetworkPrinter | null = null;

  private state: NetworkPrinterServiceState = {
    isScanning: false,
    connectionStatus: 'disconnected',
    connectedPrinter: null,
    discoveredPrinters: [],
    // No pre-configured printers - user adds their own thermal printers
    savedPrinters: [],
    printQueue: [],
  };

  // Active TCP socket connection
  private socket: TcpSocket.Socket | null = null;

  private printerDiscoveredListeners: PrinterDiscoveredListener[] = [];
  private connectionStatusListeners: ConnectionStatusListener[] = [];
  private scanCompleteListeners: ScanCompleteListener[] = [];
  private printCompleteListeners: PrintCompleteListener[] = [];

  // Network thermal printers discovered on scan (simulated for development)
  private simulatedNetworkPrinters: NetworkPrinter[] = [
    {
      id: 'net-001',
      name: 'EPSON TM-T88 (Network)',
      ipAddress: '192.168.0.50',
      port: 9100,
      isConnected: false,
    },
    {
      id: 'net-002',
      name: 'Star TSP100 (Network)',
      ipAddress: '192.168.0.51',
      port: 9100,
      isConnected: false,
    },
  ];

  /**
   * Validate IPv4 address format
   */
  validateIpAddress(ip: string): boolean {
    return IP_REGEX.test(ip);
  }

  /**
   * Format content for thermal receipt printers
   * All thermal printers use plain text with CRLF line endings
   * This method is exposed for testing and can be used to preview formatted content
   */
  formatContentForPrinter(content: string, _printerName: string): string {
    // All thermal printers use plain text with CRLF line endings
    return formatPrintText(content);
  }

  /**
   * Add a printer manually by IP address
   */
  addManualPrinter(
    ipAddress: string,
    port: number = DEFAULT_PORT,
    name?: string
  ): NetworkPrinter {
    if (!this.validateIpAddress(ipAddress)) {
      throw new Error('Invalid IP address');
    }

    // Check for duplicates
    const existingPrinter = this.state.savedPrinters.find(
      (p) => p.ipAddress === ipAddress && p.port === port
    );

    if (existingPrinter) {
      return existingPrinter;
    }

    const printer: NetworkPrinter = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name || `Printer @ ${ipAddress}:${port}`,
      ipAddress,
      port,
      isConnected: false,
    };

    this.state.savedPrinters.push(printer);
    return printer;
  }

  /**
   * Remove a saved printer by ID
   */
  removeSavedPrinter(printerId: string): void {
    this.state.savedPrinters = this.state.savedPrinters.filter(
      (p) => p.id !== printerId
    );
  }

  /**
   * Get list of saved printers
   */
  getSavedPrinters(): NetworkPrinter[] {
    return [...this.state.savedPrinters];
  }

  /**
   * Discover printers on the network (simulated mDNS/Bonjour discovery)
   */
  async discoverPrinters(timeoutMs: number = 5000): Promise<NetworkPrinter[]> {
    this.state.isScanning = true;
    this.state.discoveredPrinters = [];

    return new Promise((resolve) => {
      // Simulate discovering devices over time
      let printerIndex = 0;
      const interval = setInterval(() => {
        if (printerIndex < this.simulatedNetworkPrinters.length) {
          const printer = this.simulatedNetworkPrinters[printerIndex];
          this.state.discoveredPrinters.push(printer);

          // Notify listeners
          this.printerDiscoveredListeners.forEach((listener) =>
            listener(printer)
          );
          printerIndex++;
        }
      }, Math.min(timeoutMs / 4, 500));

      // Stop scan after timeout
      setTimeout(() => {
        clearInterval(interval);
        this.state.isScanning = false;

        // Notify scan complete listeners
        this.scanCompleteListeners.forEach((listener) =>
          listener(this.state.discoveredPrinters)
        );

        resolve(this.state.discoveredPrinters);
      }, timeoutMs);
    });
  }

  /**
   * Stop scanning for printers
   */
  stopScan(): void {
    this.state.isScanning = false;
  }

  /**
   * Check if currently scanning
   */
  isCurrentlyScanning(): boolean {
    return this.state.isScanning;
  }

  /**
   * Get discovered printers
   */
  getDiscoveredPrinters(): NetworkPrinter[] {
    return [...this.state.discoveredPrinters];
  }

  /**
   * Test connection to a printer without fully connecting
   * Opens a TCP socket to verify the printer is reachable, then closes it
   */
  async testConnection(printer: NetworkPrinter): Promise<boolean> {
    return new Promise((resolve) => {
      let resolved = false;
      let testSocket: TcpSocket.Socket | null = null;

      try {
        testSocket = TcpSocket.createConnection(
          {
            host: printer.ipAddress,
            port: printer.port,
          },
          () => {
            // Connection successful
            if (!resolved) {
              resolved = true;
              testSocket?.destroy();
              resolve(true);
            }
          }
        );

        // Check if socket was created successfully
        if (!testSocket) {
          resolved = true;
          resolve(false);
          return;
        }

        testSocket.on('error', () => {
          if (!resolved) {
            resolved = true;
            testSocket?.destroy();
            resolve(false);
          }
        });

        testSocket.on('timeout', () => {
          if (!resolved) {
            resolved = true;
            testSocket?.destroy();
            resolve(false);
          }
        });

        // Fallback timeout
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            testSocket?.destroy();
            resolve(false);
          }
        }, 5000);
      } catch (error: any) {
        // Check for native module not available error
        const errorMessage = error?.message || '';
        if (
          errorMessage.includes("'connect' of null") ||
          errorMessage.includes("'TcpSockets' of null")
        ) {
          console.error(
            'Network printing unavailable - requires development build. Run: npx expo run:android'
          );
        } else {
          console.error('Test connection error:', error);
        }
        resolved = true;
        testSocket?.destroy();
        resolve(false);
      }
    });
  }

  /**
   * Connect to a network printer via TCP socket
   */
  async connect(printer: NetworkPrinter): Promise<boolean> {
    // Disconnect existing connection if any
    if (this.socket) {
      await this.disconnect();
    }

    this.updateConnectionStatus('connecting');

    return new Promise((resolve, reject) => {
      let resolved = false;
      let timeoutId: ReturnType<typeof setTimeout>;

      try {
        this.socket = TcpSocket.createConnection(
          {
            host: printer.ipAddress,
            port: printer.port,
          },
          () => {
            // Connection successful
            if (!resolved) {
              resolved = true;
              clearTimeout(timeoutId);

              const connectedPrinter: NetworkPrinter = {
                ...printer,
                isConnected: true,
              };

              this.state.connectedPrinter = connectedPrinter;
              // Store for reconnection attempts
              this.lastConnectedPrinter = connectedPrinter;
              this.updateConnectionStatus('connected');
              resolve(true);
            }
          }
        );

        // Check if socket was created successfully
        if (!this.socket) {
          resolved = true;
          this.updateConnectionStatus('error');
          reject(
            new Error(
              'Failed to create socket connection. Please check if the app has network permissions.'
            )
          );
          return;
        }

        this.socket.on('error', (error) => {
          console.error('Printer connection error:', error);
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            this.socket?.destroy();
            this.socket = null;
            this.state.connectedPrinter = null;
            this.updateConnectionStatus('error');
            reject(new Error(`Failed to connect: ${error.message}`));
          }
        });

        this.socket.on('close', () => {
          // Socket closed - this could be a broken pipe scenario
          this.socket = null;
          if (this.state.connectionStatus === 'connected') {
            this.state.connectedPrinter = null;
            this.updateConnectionStatus('disconnected');
          }
        });

        this.socket.on('timeout', () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            this.socket?.destroy();
            this.socket = null;
            this.updateConnectionStatus('error');
            reject(new Error('Connection timeout'));
          }
        });

        // Fallback timeout
        timeoutId = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            this.socket?.destroy();
            this.socket = null;
            this.updateConnectionStatus('error');
            reject(new Error('Connection timeout'));
          }
        }, CONNECTION_TIMEOUT);
      } catch (error: any) {
        resolved = true;
        this.socket = null;
        this.updateConnectionStatus('error');

        // Handle native module not available (Expo Go or missing native build)
        const errorMessage = error?.message || '';
        if (
          errorMessage.includes("'connect' of null") ||
          errorMessage.includes("'TcpSockets' of null")
        ) {
          reject(
            new Error(
              'Network printing requires a development build. ' +
                'Please run: npx expo run:android'
            )
          );
          return;
        }

        reject(
          new Error(
            error instanceof Error
              ? error.message
              : 'Failed to initialize socket connection'
          )
        );
      }
    });
  }

  /**
   * Disconnect from current printer and close TCP socket
   */
  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.socket) {
        this.socket.destroy();
        this.socket = null;
      }
      this.state.connectedPrinter = null;
      this.updateConnectionStatus('disconnected');
      resolve();
    });
  }

  /**
   * Parse IP address, removing port if included (e.g., "192.168.1.100:9100" -> "192.168.1.100")
   */
  private parseIpAddress(address: string): string {
    // Remove port suffix if present (e.g., "192.168.1.100:9100" -> "192.168.1.100")
    const colonIndex = address.lastIndexOf(':');
    if (colonIndex > 0) {
      // Check if what's after the colon is a valid port number
      const possiblePort = address.substring(colonIndex + 1);
      if (/^\d+$/.test(possiblePort)) {
        return address.substring(0, colonIndex);
      }
    }
    return address;
  }

  /**
   * Print text content to the connected thermal printer
   * Uses RAW TCP socket on port 9100 for all thermal printers
   * Supports auto-reconnection on broken pipe errors
   *
   * @param content - The text content to print
   * @param printerInfo - Optional printer info (IP and name) to use when service state is not set.
   *                      This is useful when printer config comes from Redux/external state.
   */
  async print(content: string, printerInfo?: PrinterInfo): Promise<NetworkPrintJob> {
    const job: NetworkPrintJob = {
      id: `print-${Date.now()}`,
      content,
      status: 'pending',
      createdAt: new Date(),
    };

    this.state.printQueue.push(job);

    // Get printer info from: 1) explicit parameter, 2) connected printer, 3) last connected printer
    const printerName = printerInfo?.name || this.state.connectedPrinter?.name || this.lastConnectedPrinter?.name || '';
    const rawPrinterIP = printerInfo?.ipAddress || this.state.connectedPrinter?.ipAddress || this.lastConnectedPrinter?.ipAddress;

    // Parse IP address to remove port if included (e.g., "192.168.1.100:9100" -> "192.168.1.100")
    const printerIP = rawPrinterIP ? this.parseIpAddress(rawPrinterIP) : undefined;

    // Log for debugging
    console.log(`Print requested - Printer: ${printerName || '(unknown)'}, IP: ${printerIP || '(none)'} (raw: ${rawPrinterIP || '(none)'})`);

    if (!printerIP) {
      throw new Error('No printer IP address available. Please configure a printer in settings.');
    }

    // Use RAW TCP socket for thermal/receipt printers
    // Check if we need to reconnect (only if no explicit printer info provided)
    if (!printerInfo && (!this.state.connectedPrinter || !this.socket)) {
      // Attempt auto-reconnect if enabled and we have a last known printer
      if (this.autoReconnect && this.lastConnectedPrinter) {
        console.log('Connection lost. Attempting to reconnect...');
        const reconnected = await this.attemptReconnect();
        if (!reconnected) {
          throw new Error('No printer connected. Reconnection failed.');
        }
      } else {
        throw new Error('No printer connected');
      }
    }

    // If explicit printer info provided, use direct socket print
    if (printerInfo) {
      console.log(`Using direct RAW socket for thermal printer: ${printerName}`);
      return this.executeDirectPrint(job, content, printerIP, printerName);
    }

    return this.executePrint(job, content);
  }

  /**
   * Execute direct print for thermal printers when using explicit printer info
   * Creates a fresh connection for the print job
   */
  private async executeDirectPrint(
    job: NetworkPrintJob,
    content: string,
    ipAddress: string,
    printerName: string
  ): Promise<NetworkPrintJob> {
    job.status = 'printing';

    return new Promise((resolve) => {
      try {
        console.log(`Sending direct print job to ${ipAddress}:9100`);

        const printSocket = TcpSocket.createConnection(
          {
            host: ipAddress,
            port: 9100,
          },
          () => {
            console.log('Direct socket connected for thermal printing');

            // Format content for thermal printer (plain text with CRLF)
            const formattedContent = formatPrintText(content);
            console.log(`Sending ${formattedContent.length} bytes to ${printerName}`);

            printSocket.write(formattedContent, 'utf8', (writeError) => {
              if (writeError) {
                console.error('Direct socket write error:', writeError);
                printSocket.destroy();
                job.status = 'failed';
                job.error = writeError.message;
                this.printCompleteListeners.forEach((listener) => listener(job));
                resolve(job);
              } else {
                console.log('Print data sent successfully');
                setTimeout(() => {
                  printSocket.destroy();
                  job.status = 'completed';
                  this.printCompleteListeners.forEach((listener) => listener(job));
                  resolve(job);
                }, 1000);
              }
            });
          }
        );

        if (!printSocket) {
          job.status = 'failed';
          job.error = 'Failed to create socket';
          this.printCompleteListeners.forEach((listener) => listener(job));
          resolve(job);
          return;
        }

        printSocket.on('error', (error: Error) => {
          console.error('Direct print socket error:', error);
          job.status = 'failed';
          job.error = error.message;
          this.printCompleteListeners.forEach((listener) => listener(job));
          resolve(job);
        });

        printSocket.on('timeout', () => {
          console.error('Direct print socket timeout');
          printSocket.destroy();
          job.status = 'failed';
          job.error = 'Connection timeout';
          this.printCompleteListeners.forEach((listener) => listener(job));
          resolve(job);
        });

        if (typeof printSocket.setTimeout === 'function') {
          printSocket.setTimeout(30000);
        }
      } catch (error: any) {
        console.error('Direct print error:', error);
        job.status = 'failed';
        job.error = error.message || 'Print failed';
        this.printCompleteListeners.forEach((listener) => listener(job));
        resolve(job);
      }
    });
  }

  /**
   * Execute the actual print operation with broken pipe handling
   */
  private async executePrint(job: NetworkPrintJob, content: string, isRetry: boolean = false): Promise<NetworkPrintJob> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      job.status = 'printing';

      // Format text with proper line endings and form feed
      const printerName = this.state.connectedPrinter?.name || '';
      console.log('Sending print job to printer:', printerName);
      const printData = formatPrintText(content);

      // Timeout for print operation - set before try block so it's always defined
      const timeoutId = setTimeout(() => {
        if (job.status === 'printing') {
          job.status = 'failed';
          job.error = 'Print timeout';
          this.printCompleteListeners.forEach((listener) => listener(job));
          reject(new Error('Print timeout'));
        }
      }, PRINT_TIMEOUT);

      // Check socket validity before writing
      if (!this.socket) {
        clearTimeout(timeoutId);

        // Attempt reconnect if not already a retry
        if (!isRetry && this.autoReconnect && this.lastConnectedPrinter) {
          console.log('Socket not available. Attempting to reconnect before print...');
          const reconnected = await this.attemptReconnect();
          if (reconnected) {
            resolve(await this.executePrint(job, content, true));
            return;
          }
        }

        job.status = 'failed';
        job.error = 'Socket not connected';
        this.printCompleteListeners.forEach((listener) => listener(job));
        reject(new Error('Socket not connected'));
        return;
      }

      try {
        this.socket.write(printData, 'utf8', async (error) => {
          clearTimeout(timeoutId);

          if (error) {
            console.error('Print write error:', error);

            // Check if this is a broken pipe error and we should retry
            const isBrokenPipe = error.message?.toLowerCase().includes('broken pipe') ||
                                 error.message?.toLowerCase().includes('epipe') ||
                                 error.message?.toLowerCase().includes('econnreset');

            if (isBrokenPipe && !isRetry && this.autoReconnect && this.lastConnectedPrinter) {
              console.log('Broken pipe detected. Attempting to reconnect...');
              // Clean up the broken socket
              this.socket?.destroy();
              this.socket = null;
              this.state.connectedPrinter = null;

              const reconnected = await this.attemptReconnect();
              if (reconnected) {
                job.status = 'pending'; // Reset status for retry
                resolve(await this.executePrint(job, content, true));
                return;
              }
            }

            job.status = 'failed';
            job.error = error.message;
            this.printCompleteListeners.forEach((listener) => listener(job));
            reject(new Error(`Print failed: ${error.message}`));
          } else {
            job.status = 'completed';
            this.printCompleteListeners.forEach((listener) => listener(job));
            resolve(job);
          }
        });
      } catch (error) {
        clearTimeout(timeoutId);
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : 'Unknown error';
        this.printCompleteListeners.forEach((listener) => listener(job));
        reject(error);
      }
    });
  }

  /**
   * Print a base64-encoded PNG image via network printer.
   * Falls back to text printing since raw TCP does not natively support
   * image commands without ESC/POS raster encoding.
   *
   * For Telugu and other non-ASCII scripts, prefer using Bluetooth or USB
   * printers which have native printImageBase64 support.
   *
   * @param base64Image Base64-encoded PNG image data (no data URI prefix)
   * @param imageWidth Width in pixels (576 for 80mm, 384 for 58mm)
   * @param printerInfo Optional printer info for direct connection
   */
  async printImage(base64Image: string, imageWidth: number = 576, printerInfo?: PrinterInfo): Promise<NetworkPrintJob> {
    // Network printers via raw TCP need ESC/POS raster encoding for images.
    // For now, send the text content via the standard print path as a fallback.
    // TODO: Implement ESC/POS GS v 0 raster encoding for proper image printing
    console.warn('Network printer image mode not yet supported. Using text fallback.');
    return this.print('[Image print not supported on network printers. Please use Bluetooth.]', printerInfo);
  }

  /**
   * Print ESC/POS raw commands via TCP socket
   * Sends binary data directly to the printer
   * Supports auto-reconnection on broken pipe errors
   */
  async printRaw(commands: Uint8Array): Promise<NetworkPrintJob> {
    // Check if we need to reconnect
    if (!this.state.connectedPrinter || !this.socket) {
      // Attempt auto-reconnect if enabled and we have a last known printer
      if (this.autoReconnect && this.lastConnectedPrinter) {
        console.log('Connection lost. Attempting to reconnect...');
        const reconnected = await this.attemptReconnect();
        if (!reconnected) {
          throw new Error('No printer connected. Reconnection failed.');
        }
      } else {
        throw new Error('No printer connected');
      }
    }

    const job: NetworkPrintJob = {
      id: `print-${Date.now()}`,
      content: '[RAW ESC/POS DATA]',
      status: 'pending',
      createdAt: new Date(),
    };

    this.state.printQueue.push(job);

    return this.executeRawPrint(job, commands);
  }

  /**
   * Execute the actual raw print operation with broken pipe handling
   */
  private async executeRawPrint(job: NetworkPrintJob, commands: Uint8Array, isRetry: boolean = false): Promise<NetworkPrintJob> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      job.status = 'printing';

      // Convert Uint8Array to Buffer for socket write
      const buffer = Buffer.from(commands);

      // Timeout for print operation - set before try block so it's always defined
      const timeoutId = setTimeout(() => {
        if (job.status === 'printing') {
          job.status = 'failed';
          job.error = 'Print timeout';
          this.printCompleteListeners.forEach((listener) => listener(job));
          reject(new Error('Print timeout'));
        }
      }, PRINT_TIMEOUT);

      // Check socket validity before writing
      if (!this.socket) {
        clearTimeout(timeoutId);

        // Attempt reconnect if not already a retry
        if (!isRetry && this.autoReconnect && this.lastConnectedPrinter) {
          console.log('Socket not available. Attempting to reconnect before print...');
          const reconnected = await this.attemptReconnect();
          if (reconnected) {
            resolve(await this.executeRawPrint(job, commands, true));
            return;
          }
        }

        job.status = 'failed';
        job.error = 'Socket not connected';
        this.printCompleteListeners.forEach((listener) => listener(job));
        reject(new Error('Socket not connected'));
        return;
      }

      try {
        this.socket.write(buffer, undefined, async (error) => {
          clearTimeout(timeoutId);

          if (error) {
            console.error('Print raw write error:', error);

            // Check if this is a broken pipe error and we should retry
            const isBrokenPipe = error.message?.toLowerCase().includes('broken pipe') ||
                                 error.message?.toLowerCase().includes('epipe') ||
                                 error.message?.toLowerCase().includes('econnreset');

            if (isBrokenPipe && !isRetry && this.autoReconnect && this.lastConnectedPrinter) {
              console.log('Broken pipe detected. Attempting to reconnect...');
              // Clean up the broken socket
              this.socket?.destroy();
              this.socket = null;
              this.state.connectedPrinter = null;

              const reconnected = await this.attemptReconnect();
              if (reconnected) {
                job.status = 'pending'; // Reset status for retry
                resolve(await this.executeRawPrint(job, commands, true));
                return;
              }
            }

            job.status = 'failed';
            job.error = error.message;
            this.printCompleteListeners.forEach((listener) => listener(job));
            reject(new Error(`Print failed: ${error.message}`));
          } else {
            job.status = 'completed';
            this.printCompleteListeners.forEach((listener) => listener(job));
            resolve(job);
          }
        });
      } catch (error) {
        clearTimeout(timeoutId);
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : 'Unknown error';
        this.printCompleteListeners.forEach((listener) => listener(job));
        reject(error);
      }
    });
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): NetworkConnectionStatus {
    return this.state.connectionStatus;
  }

  /**
   * Get connected printer info
   */
  getConnectedPrinter(): NetworkPrinter | null {
    return this.state.connectedPrinter;
  }

  /**
   * Check if socket is currently connected and writable
   */
  isSocketConnected(): boolean {
    return this.socket !== null && this.state.connectionStatus === 'connected';
  }

  /**
   * Enable or disable auto-reconnection on connection loss
   */
  setAutoReconnect(enabled: boolean): void {
    this.autoReconnect = enabled;
  }

  /**
   * Get auto-reconnect setting
   */
  getAutoReconnect(): boolean {
    return this.autoReconnect;
  }

  /**
   * Simulate socket close for testing broken pipe scenarios
   * This method is used for testing purposes only
   */
  simulateSocketClose(): void {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    this.state.connectedPrinter = null;
    this.updateConnectionStatus('disconnected');
  }

  /**
   * Attempt to reconnect to the last known printer
   * Returns true if reconnection successful, false otherwise
   */
  private async attemptReconnect(): Promise<boolean> {
    if (!this.lastConnectedPrinter) {
      return false;
    }

    for (let attempt = 1; attempt <= MAX_RECONNECT_ATTEMPTS; attempt++) {
      try {
        console.log(`Reconnection attempt ${attempt}/${MAX_RECONNECT_ATTEMPTS}...`);
        const success = await this.connect(this.lastConnectedPrinter);
        if (success) {
          console.log('Reconnection successful');
          return true;
        }
      } catch (error) {
        console.error(`Reconnection attempt ${attempt} failed:`, error);
        // Wait a bit before next attempt (exponential backoff)
        if (attempt < MAX_RECONNECT_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
      }
    }

    console.error('All reconnection attempts failed');
    return false;
  }

  // Event listener management
  onPrinterDiscovered(listener: PrinterDiscoveredListener): () => void {
    this.printerDiscoveredListeners.push(listener);
    return () => {
      this.printerDiscoveredListeners = this.printerDiscoveredListeners.filter(
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

  private updateConnectionStatus(status: NetworkConnectionStatus): void {
    this.state.connectionStatus = status;
    this.connectionStatusListeners.forEach((listener) => listener(status));
  }
}

// Export singleton instance
export const networkPrinterService = new NetworkPrinterService();

// Export class for testing
export { NetworkPrinterService };
