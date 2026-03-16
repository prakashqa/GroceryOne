/**
 * Printer Selection Modal
 * Modal for discovering and selecting Bluetooth printers
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../../theme';
import {
  bluetoothPrinterService,
  BluetoothDevice,
  ConnectionStatus,
} from '../../../services/printer';

interface PrinterSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (device: BluetoothDevice) => void;
  currentPrinterId?: string | null;
}

const PrinterSelectionModal: React.FC<PrinterSelectionModalProps> = ({
  visible,
  onClose,
  onSelect,
  currentPrinterId,
}) => {
  const theme = useTheme();
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [, setConnectionStatus] =
    useState<ConnectionStatus>('disconnected');
  const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(
    null
  );

  // On modal open: show only the saved printer (if any), not all paired devices.
  // User must tap "Scan for Printers" to discover devices.
  // This prevents showing earbuds, car audio, etc. that are paired but not printers.
  useEffect(() => {
    if (visible) {
      if (currentPrinterId) {
        loadSavedPrinterOnly();
      } else {
        setDevices([]);
      }
    } else {
      // Reset state when modal closes
      setIsScanning(false);
      setConnectingDeviceId(null);
    }
  }, [visible, currentPrinterId]);

  // Listen for connection status changes
  useEffect(() => {
    const unsubscribe = bluetoothPrinterService.onConnectionStatusChange(
      (status) => {
        setConnectionStatus(status);
        if (status === 'connected' || status === 'error') {
          setConnectingDeviceId(null);
        }
      }
    );

    return unsubscribe;
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // @ts-expect-error TS6133: kept for future use
  const _loadPairedDevices = async () => {
    try {
      const pairedDevices = await bluetoothPrinterService.getPairedDevices();
      setDevices(pairedDevices);
    } catch (error) {
      console.error('Error loading paired devices:', error);
    }
  };

  const loadSavedPrinterOnly = async () => {
    try {
      const pairedDevices = await bluetoothPrinterService.getPairedDevices();
      const savedPrinter = pairedDevices.filter(
        (d) => d.id === currentPrinterId
      );
      setDevices(savedPrinter);
    } catch (error) {
      console.error('Error loading saved printer:', error);
      setDevices([]);
    }
  };

  const handleScan = useCallback(async () => {
    setIsScanning(true);
    setDevices([]);

    try {
      const discoveredDevices = await bluetoothPrinterService.startScan(8000);
      setDevices(discoveredDevices);
    } catch (error: any) {
      Alert.alert(
        'Scan Error',
        error.message || 'Failed to scan for devices. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsScanning(false);
    }
  }, []);

  const handleStopScan = useCallback(() => {
    bluetoothPrinterService.stopScan();
    setIsScanning(false);
  }, []);

  const handleSelectDevice = useCallback(
    async (device: BluetoothDevice) => {
      setConnectingDeviceId(device.id);

      try {
        const connected = await bluetoothPrinterService.connect(device);
        if (connected) {
          onSelect(device);
          onClose();
        } else {
          Alert.alert(
            'Connection Failed',
            `Could not connect to ${device.name}. Please try again.`,
            [{ text: 'OK' }]
          );
        }
      } catch (error: any) {
        Alert.alert(
          'Connection Error',
          error.message || 'Failed to connect to printer.',
          [{ text: 'OK' }]
        );
      } finally {
        setConnectingDeviceId(null);
      }
    },
    [onSelect, onClose]
  );

  const renderDeviceItem = useCallback(
    ({ item }: { item: BluetoothDevice }) => {
      const isSelected = item.id === currentPrinterId;
      const isConnecting = item.id === connectingDeviceId;

      return (
        <TouchableOpacity
          style={[
            styles.deviceItem,
            {
              backgroundColor: isSelected
                ? theme.colors.primaryLight + '20'
                : theme.colors.surface,
              borderColor: isSelected
                ? theme.colors.primary
                : theme.colors.border,
            },
          ]}
          onPress={() => handleSelectDevice(item)}
          disabled={isConnecting}
          activeOpacity={0.7}
        >
          <View style={styles.deviceInfo}>
            <View style={styles.deviceHeader}>
              <Text
                style={[
                  styles.deviceIcon,
                  { backgroundColor: theme.colors.primaryLight + '30' },
                ]}
              >
                🖨️
              </Text>
              <View style={styles.deviceTextContainer}>
                <Text
                  style={[styles.deviceName, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {item.name || 'Unknown Device'}
                </Text>
                <Text
                  style={[
                    styles.deviceAddress,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {item.address}
                </Text>
              </View>
            </View>

            <View style={styles.deviceStatus}>
              {isConnecting ? (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.primary}
                />
              ) : item.isPaired ? (
                <View
                  style={[
                    styles.pairedBadge,
                    { backgroundColor: theme.colors.success + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.pairedText,
                      { color: theme.colors.success },
                    ]}
                  >
                    Paired
                  </Text>
                </View>
              ) : null}

              {isSelected && !isConnecting && (
                <Text style={[styles.checkmark, { color: theme.colors.primary }]}>
                  ✓
                </Text>
              )}
            </View>
          </View>

          {item.rssi !== undefined && (
            <View style={styles.signalContainer}>
              <Text
                style={[
                  styles.signalText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Signal: {getSignalStrength(item.rssi)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [currentPrinterId, connectingDeviceId, theme, handleSelectDevice]
  );

  const getSignalStrength = (rssi: number): string => {
    if (rssi >= -50) return 'Excellent';
    if (rssi >= -60) return 'Good';
    if (rssi >= -70) return 'Fair';
    return 'Weak';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.closeText, { color: theme.colors.primary }]}>
              Cancel
            </Text>
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Select Printer
          </Text>

          <View style={styles.closeButton} />
        </View>

        {/* Scan Button */}
        <View style={styles.scanSection}>
          <TouchableOpacity
            style={[
              styles.scanButton,
              {
                backgroundColor: isScanning
                  ? theme.colors.error
                  : theme.colors.primary,
              },
            ]}
            onPress={isScanning ? handleStopScan : handleScan}
            activeOpacity={0.8}
          >
            {isScanning && (
              <ActivityIndicator
                size="small"
                color="#fff"
                style={styles.scanSpinner}
              />
            )}
            <Text style={styles.scanButtonText}>
              {isScanning ? 'Stop Scanning' : 'Scan for Printers'}
            </Text>
          </TouchableOpacity>

          {isScanning && (
            <Text
              style={[styles.scanningText, { color: theme.colors.textSecondary }]}
            >
              Searching for nearby Bluetooth printers...
            </Text>
          )}
        </View>

        {/* Device List */}
        <View style={styles.listSection}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}
          >
            {devices.length > 0
              ? `Available Printers (${devices.length})`
              : 'No printers found'}
          </Text>

          <FlatList
            data={devices}
            renderItem={renderDeviceItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              !isScanning ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>🔍</Text>
                  <Text
                    style={[styles.emptyText, { color: theme.colors.textSecondary }]}
                  >
                    Tap &quot;Scan for Printers&quot; to discover nearby Bluetooth printers
                  </Text>
                </View>
              ) : null
            }
          />
        </View>

        {/* Help Text */}
        <View
          style={[
            styles.helpSection,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text style={[styles.helpTitle, { color: theme.colors.text }]}>
            💡 Tips
          </Text>
          <Text
            style={[styles.helpText, { color: theme.colors.textSecondary }]}
          >
            • Make sure your printer is turned on and in pairing mode
          </Text>
          <Text
            style={[styles.helpText, { color: theme.colors.textSecondary }]}
          >
            • Keep your device close to the printer for better connection
          </Text>
          <Text
            style={[styles.helpText, { color: theme.colors.textSecondary }]}
          >
            • If the printer doesn&apos;t appear, try pairing it in device settings
            first
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 60,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scanSection: {
    padding: 16,
    alignItems: 'center',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
  },
  scanSpinner: {
    marginRight: 8,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scanningText: {
    marginTop: 12,
    fontSize: 14,
  },
  listSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 16,
  },
  deviceItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 22,
    marginRight: 12,
    overflow: 'hidden',
    lineHeight: 44,
  },
  deviceTextContainer: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  deviceAddress: {
    fontSize: 13,
  },
  deviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pairedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  pairedText: {
    fontSize: 12,
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 20,
    fontWeight: '700',
  },
  signalContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  signalText: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  helpSection: {
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
});

export default PrinterSelectionModal;
