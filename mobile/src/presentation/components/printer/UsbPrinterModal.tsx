/**
 * USB Printer Selection Modal
 * Modal for discovering and selecting USB printers
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
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import {
  usbPrinterService,
  UsbDevice,
  UsbConnectionStatus,
} from '../../../services/printer';

interface UsbPrinterModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (device: UsbDevice) => void;
  currentPrinterId?: string | null;
}

const UsbPrinterModal: React.FC<UsbPrinterModalProps> = ({
  visible,
  onClose,
  onSelect,
  currentPrinterId,
}) => {
  const theme = useTheme();
  const { t } = useTranslation('profile');
  const [devices, setDevices] = useState<UsbDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [, setConnectionStatus] =
    useState<UsbConnectionStatus>('disconnected');
  const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(
    null
  );

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!visible) {
      setIsScanning(false);
      setConnectingDeviceId(null);
    }
  }, [visible]);

  // Listen for connection status changes
  useEffect(() => {
    const unsubscribe = usbPrinterService.onConnectionStatusChange(
      (status) => {
        setConnectionStatus(status);
        if (status === 'connected' || status === 'error') {
          setConnectingDeviceId(null);
        }
      }
    );

    return unsubscribe;
  }, []);

  const handleScan = useCallback(async () => {
    setIsScanning(true);
    setDevices([]);

    try {
      const discoveredDevices = await usbPrinterService.discoverDevices();
      setDevices(discoveredDevices);
    } catch (error: any) {
      Alert.alert(
        t('settings.printer.usbModal.scanError', 'Scan Error'),
        error.message || t('settings.printer.usbModal.scanErrorMessage', 'Failed to scan for USB devices. Please try again.'),
        [{ text: t('common:ok', 'OK') }]
      );
    } finally {
      setIsScanning(false);
    }
  }, [t]);

  const handleSelectDevice = useCallback(
    async (device: UsbDevice) => {
      setConnectingDeviceId(device.id);

      try {
        const connected = await usbPrinterService.connect(device);
        if (connected) {
          onSelect(device);
          onClose();
        } else {
          Alert.alert(
            t('settings.printer.usbModal.connectionFailed', 'Connection Failed'),
            t(
              'settings.printer.usbModal.connectionFailedMessage',
              `Could not connect to ${device.name}. Please check the USB connection.`
            ),
            [{ text: t('common:ok', 'OK') }]
          );
        }
      } catch (error: any) {
        Alert.alert(
          t('settings.printer.usbModal.connectionError', 'Connection Error'),
          error.message || t('settings.printer.usbModal.connectionErrorMessage', 'Failed to connect to USB printer.'),
          [{ text: t('common:ok', 'OK') }]
        );
      } finally {
        setConnectingDeviceId(null);
      }
    },
    [onSelect, onClose, t]
  );

  const renderDeviceItem = useCallback(
    ({ item }: { item: UsbDevice }) => {
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
          testID={`usb-device-${item.id}`}
        >
          <View style={styles.deviceInfo}>
            <View style={styles.deviceHeader}>
              <Text
                style={[
                  styles.deviceIcon,
                  { backgroundColor: theme.colors.primaryLight + '30' },
                ]}
              >
                🔌
              </Text>
              <View style={styles.deviceTextContainer}>
                <Text
                  style={[styles.deviceName, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {item.name || 'Unknown USB Device'}
                </Text>
                <Text
                  style={[
                    styles.deviceAddress,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  VID: {item.vendorId} / PID: {item.productId}
                </Text>
              </View>
            </View>

            <View style={styles.deviceStatus}>
              {isConnecting ? (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.primary}
                />
              ) : null}

              {isSelected && !isConnecting && (
                <Text style={[styles.checkmark, { color: theme.colors.primary }]}>
                  ✓
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [currentPrinterId, connectingDeviceId, theme, handleSelectDevice]
  );

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
            testID="usb-modal-cancel"
          >
            <Text style={[styles.closeText, { color: theme.colors.primary }]}>
              {t('common:cancel', 'Cancel')}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            {t('settings.printer.usbModal.title', 'USB Printer')}
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
            onPress={handleScan}
            disabled={isScanning}
            activeOpacity={0.8}
            testID="usb-scan-button"
          >
            {isScanning && (
              <ActivityIndicator
                size="small"
                color="#fff"
                style={styles.scanSpinner}
              />
            )}
            <Text style={styles.scanButtonText}>
              {isScanning
                ? t('settings.printer.usbModal.scanning', 'Scanning...')
                : t('settings.printer.usbModal.scanDevices', 'Scan for USB Devices')}
            </Text>
          </TouchableOpacity>

          {isScanning && (
            <Text
              style={[styles.scanningText, { color: theme.colors.textSecondary }]}
            >
              {t('settings.printer.usbModal.scanningHint', 'Scanning for connected USB printers...')}
            </Text>
          )}
        </View>

        {/* Device List */}
        <View style={styles.listSection}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}
          >
            {devices.length > 0
              ? t('settings.printer.usbModal.availableDevices', {
                  count: devices.length,
                  defaultValue: `Available USB Printers (${devices.length})`,
                })
              : t('settings.printer.usbModal.noDevicesFound', 'No USB printers found')}
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
                  <Text style={styles.emptyIcon}>🔌</Text>
                  <Text
                    style={[styles.emptyText, { color: theme.colors.textSecondary }]}
                  >
                    {t(
                      'settings.printer.usbModal.emptyHint',
                      'Connect a thermal printer via USB OTG cable, then tap scan.'
                    )}
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
            {t('settings.printer.usbModal.tips', 'Tips')}
          </Text>
          <Text
            style={[styles.helpText, { color: theme.colors.textSecondary }]}
          >
            {t('settings.printer.usbModal.tipOtg', '• Use a USB OTG adapter to connect the printer')}
          </Text>
          <Text
            style={[styles.helpText, { color: theme.colors.textSecondary }]}
          >
            {t('settings.printer.usbModal.tipPower', '• Make sure the printer is powered on')}
          </Text>
          <Text
            style={[styles.helpText, { color: theme.colors.textSecondary }]}
          >
            {t('settings.printer.usbModal.tipDriver', '• Most ESC/POS thermal printers are supported')}
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
  checkmark: {
    fontSize: 20,
    fontWeight: '700',
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

export default UsbPrinterModal;
