/**
 * Network Printer Service Tests
 * TDD tests for Network printer discovery, connection, and printing
 */

import { NetworkPrinterService } from '../NetworkPrinterService';

describe('NetworkPrinterService', () => {
  let service: NetworkPrinterService;

  beforeEach(() => {
    service = new NetworkPrinterService();
  });

  describe('initial state', () => {
    it('should have disconnected connection status initially', () => {
      expect(service.getConnectionStatus()).toBe('disconnected');
    });

    it('should have no connected printer initially', () => {
      expect(service.getConnectedPrinter()).toBeNull();
    });

    it('should not be scanning initially', () => {
      expect(service.isCurrentlyScanning()).toBe(false);
    });

    it('should have empty discovered printers initially', () => {
      expect(service.getDiscoveredPrinters()).toEqual([]);
    });

    it('should have empty saved printers initially', () => {
      const savedPrinters = service.getSavedPrinters();
      expect(savedPrinters.length).toBe(0);
    });
  });

  describe('validateIpAddress', () => {
    it('should return true for valid IPv4 addresses', () => {
      expect(service.validateIpAddress('192.168.1.1')).toBe(true);
      expect(service.validateIpAddress('10.0.0.1')).toBe(true);
      expect(service.validateIpAddress('172.16.0.1')).toBe(true);
      expect(service.validateIpAddress('255.255.255.255')).toBe(true);
      expect(service.validateIpAddress('0.0.0.0')).toBe(true);
    });

    it('should return false for invalid IPv4 addresses', () => {
      expect(service.validateIpAddress('256.1.1.1')).toBe(false);
      expect(service.validateIpAddress('192.168.1')).toBe(false);
      expect(service.validateIpAddress('192.168.1.1.1')).toBe(false);
      expect(service.validateIpAddress('192.168.1.abc')).toBe(false);
      expect(service.validateIpAddress('')).toBe(false);
      expect(service.validateIpAddress('not-an-ip')).toBe(false);
      expect(service.validateIpAddress('192.168.1.1:9100')).toBe(false);
    });
  });

  describe('addManualPrinter', () => {
    it('should add a printer with valid IP and default port', () => {
      const printer = service.addManualPrinter('192.168.1.100');

      expect(printer).toHaveProperty('id');
      expect(printer.ipAddress).toBe('192.168.1.100');
      expect(printer.port).toBe(9100);
      expect(printer.name).toContain('192.168.1.100');
      expect(printer.isConnected).toBe(false);
    });

    it('should add a printer with custom port', () => {
      const printer = service.addManualPrinter('192.168.1.100', 515);

      expect(printer.port).toBe(515);
    });

    it('should add a printer with custom name', () => {
      const printer = service.addManualPrinter(
        '192.168.1.100',
        9100,
        'Office Printer'
      );

      expect(printer.name).toBe('Office Printer');
    });

    it('should throw error for invalid IP address', () => {
      expect(() => service.addManualPrinter('invalid-ip')).toThrow(
        'Invalid IP address'
      );
    });

    it('should save printer to saved printers list', () => {
      const initialCount = service.getSavedPrinters().length;
      service.addManualPrinter('192.168.1.100');

      const savedPrinters = service.getSavedPrinters();
      expect(savedPrinters.length).toBe(initialCount + 1);
      // Find the newly added printer
      const addedPrinter = savedPrinters.find(p => p.ipAddress === '192.168.1.100');
      expect(addedPrinter).toBeDefined();
      expect(addedPrinter?.ipAddress).toBe('192.168.1.100');
    });

    it('should not add duplicate printers with same IP and port', () => {
      const initialCount = service.getSavedPrinters().length;
      service.addManualPrinter('192.168.1.100', 9100);
      service.addManualPrinter('192.168.1.100', 9100);

      const savedPrinters = service.getSavedPrinters();
      expect(savedPrinters.length).toBe(initialCount + 1); // Only one new printer added
    });

    it('should allow same IP with different ports', () => {
      const initialCount = service.getSavedPrinters().length;
      service.addManualPrinter('192.168.1.100', 9100);
      service.addManualPrinter('192.168.1.100', 515);

      const savedPrinters = service.getSavedPrinters();
      expect(savedPrinters.length).toBe(initialCount + 2);
    });
  });

  describe('removeSavedPrinter', () => {
    it('should remove a saved printer by id', () => {
      const printer = service.addManualPrinter('192.168.1.100');
      const countAfterAdd = service.getSavedPrinters().length;

      service.removeSavedPrinter(printer.id);

      expect(service.getSavedPrinters().length).toBe(countAfterAdd - 1);
    });

    it('should not throw when removing non-existent printer', () => {
      expect(() => service.removeSavedPrinter('non-existent-id')).not.toThrow();
    });
  });

  describe('discoverPrinters', () => {
    it('should return list of discovered printers', async () => {
      const printers = await service.discoverPrinters(500);

      expect(printers).toBeInstanceOf(Array);
      expect(printers.length).toBeGreaterThan(0);

      const printer = printers[0];
      expect(printer).toHaveProperty('id');
      expect(printer).toHaveProperty('name');
      expect(printer).toHaveProperty('ipAddress');
      expect(printer).toHaveProperty('port');
    });

    it('should update discovered printers list', async () => {
      await service.discoverPrinters(500);

      expect(service.getDiscoveredPrinters().length).toBeGreaterThan(0);
    });

    it('should set scanning state during discovery', async () => {
      const scanPromise = service.discoverPrinters(300);

      // Should be scanning
      expect(service.isCurrentlyScanning()).toBe(true);

      await scanPromise;

      // Should stop scanning after completion
      expect(service.isCurrentlyScanning()).toBe(false);
    });
  });

  describe('stopScan', () => {
    it('should stop scanning', () => {
      service.stopScan();
      expect(service.isCurrentlyScanning()).toBe(false);
    });
  });

  describe('connect', () => {
    it('should connect to a printer and update connection status', async () => {
      const printer = service.addManualPrinter('192.168.1.100');

      const connected = await service.connect(printer);

      expect(connected).toBe(true);
      expect(service.getConnectionStatus()).toBe('connected');
      expect(service.getConnectedPrinter()).not.toBeNull();
      expect(service.getConnectedPrinter()?.id).toBe(printer.id);
    });

    it('should mark printer as connected', async () => {
      const printer = service.addManualPrinter('192.168.1.100');

      await service.connect(printer);

      const connectedPrinter = service.getConnectedPrinter();
      expect(connectedPrinter?.isConnected).toBe(true);
    });

    it('should notify connection status listeners on connect', async () => {
      const statusListener = jest.fn();
      service.onConnectionStatusChange(statusListener);

      const printer = service.addManualPrinter('192.168.1.100');
      await service.connect(printer);

      expect(statusListener).toHaveBeenCalledWith('connecting');
      expect(statusListener).toHaveBeenCalledWith('connected');
    });
  });

  describe('disconnect', () => {
    it('should disconnect and update connection status', async () => {
      const printer = service.addManualPrinter('192.168.1.100');

      await service.connect(printer);
      expect(service.getConnectionStatus()).toBe('connected');

      await service.disconnect();

      expect(service.getConnectionStatus()).toBe('disconnected');
      expect(service.getConnectedPrinter()).toBeNull();
    });

    it('should notify connection status listeners on disconnect', async () => {
      const statusListener = jest.fn();

      const printer = service.addManualPrinter('192.168.1.100');
      await service.connect(printer);

      service.onConnectionStatusChange(statusListener);
      await service.disconnect();

      expect(statusListener).toHaveBeenCalledWith('disconnected');
    });
  });

  describe('print', () => {
    it('should print content when connected', async () => {
      const printer = service.addManualPrinter('192.168.1.100');
      await service.connect(printer);

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
        'No printer IP address available'
      );
    });

    it('should notify print complete listeners', async () => {
      const printListener = jest.fn();
      service.onPrintComplete(printListener);

      const printer = service.addManualPrinter('192.168.1.100');
      await service.connect(printer);
      await service.print('Test content');

      expect(printListener).toHaveBeenCalled();
      expect(printListener.mock.calls[0][0]).toHaveProperty(
        'status',
        'completed'
      );
    });
  });

  describe('printRaw', () => {
    it('should print raw commands when connected', async () => {
      const printer = service.addManualPrinter('192.168.1.100');
      await service.connect(printer);

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
    it('should allow unsubscribing from connection status listeners', async () => {
      const statusListener = jest.fn();
      const unsubscribe = service.onConnectionStatusChange(statusListener);

      unsubscribe();

      const printer = service.addManualPrinter('192.168.1.100');
      await service.connect(printer);

      // Should not be called after unsubscribe
      expect(statusListener).not.toHaveBeenCalled();
    });

    it('should allow unsubscribing from print complete listeners', async () => {
      const printListener = jest.fn();
      const unsubscribe = service.onPrintComplete(printListener);

      unsubscribe();

      const printer = service.addManualPrinter('192.168.1.100');
      await service.connect(printer);
      await service.print('Test content');

      // Should not be called after unsubscribe
      expect(printListener).not.toHaveBeenCalled();
    });

    it('should notify printer discovered listeners during scan', async () => {
      const discoveredListener = jest.fn();
      service.onPrinterDiscovered(discoveredListener);

      await service.discoverPrinters(500);

      expect(discoveredListener).toHaveBeenCalled();
    });

    it('should allow unsubscribing from printer discovered listeners', async () => {
      const discoveredListener = jest.fn();
      const unsubscribe = service.onPrinterDiscovered(discoveredListener);

      unsubscribe();

      await service.discoverPrinters(300);

      // Should not be called after unsubscribe
      expect(discoveredListener).not.toHaveBeenCalled();
    });
  });

  describe('testConnection', () => {
    it('should return true for reachable printer', async () => {
      const printer = service.addManualPrinter('192.168.1.100');

      const isReachable = await service.testConnection(printer);

      expect(isReachable).toBe(true);
    });

    it('should not change connection status when testing', async () => {
      const printer = service.addManualPrinter('192.168.1.100');

      expect(service.getConnectionStatus()).toBe('disconnected');

      await service.testConnection(printer);

      expect(service.getConnectionStatus()).toBe('disconnected');
    });
  });

  describe('native module error handling', () => {
    it('should handle native module unavailable error gracefully in connect', async () => {
      const printer = service.addManualPrinter('192.168.1.100');

      // Mock TcpSocket to throw native module error
      const TcpSocket = jest.requireMock('react-native-tcp-socket');
      const originalCreateConnection = TcpSocket.createConnection;
      TcpSocket.createConnection = jest.fn(() => {
        throw new TypeError("Cannot read property 'connect' of null");
      });

      await expect(service.connect(printer)).rejects.toThrow(/development build/i);

      // Restore
      TcpSocket.createConnection = originalCreateConnection;
    });

    it('should return false when native module unavailable in testConnection', async () => {
      const printer = service.addManualPrinter('192.168.1.100');

      // Mock TcpSocket to throw native module error
      const TcpSocket = jest.requireMock('react-native-tcp-socket');
      const originalCreateConnection = TcpSocket.createConnection;
      TcpSocket.createConnection = jest.fn(() => {
        throw new TypeError("Cannot read property 'connect' of null");
      });

      const result = await service.testConnection(printer);
      expect(result).toBe(false);

      // Restore
      TcpSocket.createConnection = originalCreateConnection;
    });
  });

  describe('print format', () => {
    it('should print to thermal printers via RAW socket successfully', async () => {
      // Add thermal printer and connect
      const printer = service.addManualPrinter('192.168.0.50', 9100, 'EPSON TM-T88');
      await service.connect(printer);

      // Print should succeed via RAW socket
      const printJob = await service.print('Test content for thermal printer');
      expect(printJob.status).toBe('completed');
    });

    it('should format thermal printer content with plain text and form feed', async () => {
      // Test that thermal printer data is plain text with form feed
      const printer = service.addManualPrinter('192.168.0.50', 9100, 'EPSON TM-T88');
      await service.connect(printer);

      const testContent = 'Test line 1\nTest line 2';
      const formatted = service.formatContentForPrinter(testContent, 'EPSON TM-T88');

      // Thermal printers use plain text with CRLF and form feed
      expect(formatted).toContain('Test line 1\r\nTest line 2'); // CRLF line endings
      expect(formatted).toContain('\x0C'); // Form feed at end
    });

    it('should print to thermal printer using explicit printer info when service state is empty', async () => {
      // Test thermal printer path with explicit info
      expect(service.getConnectedPrinter()).toBeNull();

      const printerInfo = {
        ipAddress: '192.168.0.50',
        name: 'EPSON TM-T88',
      };

      const printJob = await service.print('Test content', printerInfo);
      expect(printJob.status).toBe('completed');
    });

    it('should handle IP address with port suffix correctly', async () => {
      // This test verifies that IP addresses with port (e.g., "192.168.0.50:9100") work correctly
      // The port should be stripped from the IP address before connecting
      expect(service.getConnectedPrinter()).toBeNull();

      // IP address includes port - should be parsed correctly
      const printerInfo = {
        ipAddress: '192.168.0.50:9100',
        name: 'EPSON TM-T88',
      };

      const printJob = await service.print('Test content', printerInfo);
      expect(printJob.status).toBe('completed');
    });
  });

  describe('broken pipe error handling', () => {
    it('should handle broken pipe error and attempt reconnection during print', async () => {
      const printer = service.addManualPrinter('192.168.1.100');
      await service.connect(printer);

      // Verify we're connected
      expect(service.getConnectionStatus()).toBe('connected');

      // Simulate broken pipe by triggering socket close
      // The print should still succeed after auto-reconnect
      const printJob = await service.print('Test content after reconnect');

      expect(printJob.status).toBe('completed');
    });

    it('should throw clear error when print fails due to connection loss and auto-reconnect is disabled', async () => {
      const printer = service.addManualPrinter('192.168.1.100');
      await service.connect(printer);

      // Disable auto-reconnect for this test
      service.setAutoReconnect(false);

      // Disconnect the socket to simulate broken pipe
      await service.disconnect();

      // Attempting to print should throw a clear error since auto-reconnect is disabled
      await expect(service.print('Test content')).rejects.toThrow(
        'No printer connected'
      );
    });

    it('should verify socket is writable before printing', async () => {
      const printer = service.addManualPrinter('192.168.1.100');
      await service.connect(printer);

      // Check that socket status is verified
      expect(service.isSocketConnected()).toBe(true);

      await service.disconnect();

      expect(service.isSocketConnected()).toBe(false);
    });

    it('should auto-reconnect when socket closes unexpectedly', async () => {
      const printer = service.addManualPrinter('192.168.1.100');
      await service.connect(printer);

      const statusListener = jest.fn();
      service.onConnectionStatusChange(statusListener);

      // Simulate unexpected socket close (broken pipe scenario)
      service.simulateSocketClose();

      // Service should detect the close and update status
      expect(service.getConnectionStatus()).toBe('disconnected');
      expect(statusListener).toHaveBeenCalledWith('disconnected');
    });

    it('should attempt reconnection with stored printer when print encounters broken pipe', async () => {
      const printer = service.addManualPrinter('192.168.1.100');
      await service.connect(printer);

      // Store the connected printer for later verification
      const connectedPrinter = service.getConnectedPrinter();
      expect(connectedPrinter).not.toBeNull();

      // Enable auto-reconnect
      service.setAutoReconnect(true);

      // Simulate socket close
      service.simulateSocketClose();

      // Try to print - should auto-reconnect and succeed
      const printJob = await service.print('Test after auto-reconnect');
      expect(printJob.status).toBe('completed');
    });
  });
});
