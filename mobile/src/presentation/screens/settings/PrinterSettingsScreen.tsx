/**
 * Printer Settings Screen
 * Printer configuration for picking list printing with Bluetooth support
 */

import React, { useCallback, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../theme';
import {
  SettingsSection,
  SettingsToggle,
  SettingsRadioGroup,
  SettingsRow,
} from '../../components/settings';
import {
  PrinterSelectionModal,
  NetworkPrinterModal,
  UsbPrinterModal,
} from '../../components/printer';
import {
  selectPrinter,
  setPrinterEnabled,
  setPrinterConnectionType,
  setSelectedPrinter,
  setPrinterConnectionStatus,
  setAutoPrint,
  setPaperSize,
  setImageWidthDots,
  setPrintFormat,
  PrinterConnectionType,
  PaperSize,
  PrintFormat,
} from '../../../store/slices/settingsSlice';
import { saveSettings } from '../../../utils/storage/settingsStorage';
import { selectTenant } from '../../../store/slices/tenantSlice';
import {
  bluetoothPrinterService,
  BluetoothDevice,
  networkPrinterService,
  NetworkPrinter,
  usbPrinterService,
  UsbDevice,
} from '../../../services/printer';
import {
  generatePickingListReceipt,
  DEFAULT_MERCHANT,
} from '../../../domain/utils/receiptGenerator';

// Option values - labels and descriptions will be translated at render time
const connectionTypeValues: PrinterConnectionType[] = ['bluetooth', 'network', 'usb'];
const paperSizeValues: PaperSize[] = ['80mm', '58mm'];
const imageWidthValues: number[] = [576, 832];
const printFormatValues: PrintFormat[] = ['receipt', 'detailed', 'compact'];

const PrinterSettingsScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { t } = useTranslation('profile');
  const printer = useSelector(selectPrinter);
  const tenant = useSelector(selectTenant);

  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [showUsbModal, setShowUsbModal] = useState(false);
  const [isTestPrinting, setIsTestPrinting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Translated options - memoized to avoid re-creating on each render
  const connectionTypeOptions = useMemo(() => connectionTypeValues.map((value) => ({
    value,
    label: t(`settings.printer.${value}`, value),
    description: t(`settings.printer.${value}Description`, ''),
  })), [t]);

  const paperSizeOptions = useMemo(() => paperSizeValues.map((value) => ({
    value,
    label: t(`settings.printer.paperSize${value}`, value),
    description: t(`settings.printer.paperSize${value}Description`, ''),
  })), [t]);

  const _imageWidthOptions = useMemo(() => imageWidthValues.map((value) => ({
    value,
    label: value === 576 ? 'Standard (203 DPI) (Recommended)' : 'HD (300 DPI)',
    description: value === 576
      ? 'Most thermal printers (recommended)'
      : 'High-resolution 300 DPI printers only',
  })), []);

  const printFormatOptions = useMemo(() => printFormatValues.map((value) => ({
    value,
    label: t(`settings.printer.format${value}`, value),
    description: t(`settings.printer.format${value}Description`, ''),
  })), [t]);

  // Connection status indicator colors
  const getConnectionStatusColor = () => {
    switch (printer.connectionStatus) {
      case 'connected':
        return theme.colors.success;
      case 'connecting':
        return theme.colors.warning;
      case 'error':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getConnectionStatusText = () => {
    switch (printer.connectionStatus) {
      case 'connected':
        return t('settings.printer.statusConnected', 'Connected');
      case 'connecting':
        return t('settings.printer.statusConnecting', 'Connecting...');
      case 'error':
        return t('settings.printer.statusError', 'Connection Error');
      default:
        return t('settings.printer.statusDisconnected', 'Disconnected');
    }
  };

  // Listen for connection status changes from both services
  useEffect(() => {
    const unsubscribeBluetooth =
      bluetoothPrinterService.onConnectionStatusChange((status) => {
        if (printer.connectionType === 'bluetooth') {
          dispatch(
            setPrinterConnectionStatus(
              status as 'disconnected' | 'connecting' | 'connected' | 'error'
            )
          );
        }
      });

    const unsubscribeNetwork = networkPrinterService.onConnectionStatusChange(
      (status) => {
        if (printer.connectionType === 'network') {
          dispatch(
            setPrinterConnectionStatus(
              status as 'disconnected' | 'connecting' | 'connected' | 'error'
            )
          );
        }
      }
    );

    const unsubscribeUsb = usbPrinterService.onConnectionStatusChange(
      (status) => {
        if (printer.connectionType === 'usb') {
          dispatch(
            setPrinterConnectionStatus(
              status as 'disconnected' | 'connecting' | 'connected' | 'error'
            )
          );
        }
      }
    );

    return () => {
      unsubscribeBluetooth();
      unsubscribeNetwork();
      unsubscribeUsb();
    };
  }, [dispatch, printer.connectionType]);

  const handleEnableToggle = useCallback(
    async (value: boolean) => {
      dispatch(setPrinterEnabled(value));

      // If disabling, also disconnect
      if (!value && printer.connectionStatus === 'connected') {
        if (printer.connectionType === 'bluetooth') {
          await bluetoothPrinterService.disconnect();
        } else if (printer.connectionType === 'network') {
          await networkPrinterService.disconnect();
        } else if (printer.connectionType === 'usb') {
          await usbPrinterService.disconnect();
        }
        dispatch(setPrinterConnectionStatus('disconnected'));
      }

      if (tenant?.slug) {
        try {
          await saveSettings({
            printer: { ...printer, enabled: value },
          }, tenant.slug);
        } catch (error) {
          console.error('Failed to save printer settings:', error);
        }
      }
    },
    [dispatch, printer, tenant?.slug]
  );

  const handleConnectionTypeSelect = useCallback(
    async (value: PrinterConnectionType) => {
      // If switching connection type, disconnect current printer
      if (printer.connectionStatus === 'connected') {
        if (printer.connectionType === 'bluetooth') {
          await bluetoothPrinterService.disconnect();
        } else if (printer.connectionType === 'network') {
          await networkPrinterService.disconnect();
        } else if (printer.connectionType === 'usb') {
          await usbPrinterService.disconnect();
        }
        dispatch(setPrinterConnectionStatus('disconnected'));
        dispatch(setSelectedPrinter(null));
      }

      dispatch(setPrinterConnectionType(value));
      if (tenant?.slug) {
        try {
          await saveSettings({
            printer: { ...printer, connectionType: value },
          }, tenant.slug);
        } catch (error) {
          console.error('Failed to save printer settings:', error);
        }
      }
    },
    [dispatch, printer, tenant?.slug]
  );

  const handlePaperSizeSelect = useCallback(
    async (value: PaperSize) => {
      dispatch(setPaperSize(value));
      if (tenant?.slug) {
        try {
          await saveSettings({
            printer: { ...printer, paperSize: value },
          }, tenant.slug);
        } catch (error) {
          console.error('Failed to save printer settings:', error);
        }
      }
    },
    [dispatch, printer, tenant?.slug]
  );

  const _handleImageWidthSelect = useCallback(
    async (value: number) => {
      dispatch(setImageWidthDots(value));
      if (tenant?.slug) {
        try {
          await saveSettings({
            printer: { ...printer, imageWidthDots: value },
          }, tenant.slug);
        } catch (error) {
          console.error('Failed to save printer settings:', error);
        }
      }
    },
    [dispatch, printer, tenant?.slug]
  );

  const handlePrintFormatSelect = useCallback(
    async (value: PrintFormat) => {
      dispatch(setPrintFormat(value));
      if (tenant?.slug) {
        try {
          await saveSettings({
            printer: { ...printer, printFormat: value },
          }, tenant.slug);
        } catch (error) {
          console.error('Failed to save printer settings:', error);
        }
      }
    },
    [dispatch, printer, tenant?.slug]
  );

  const handleAutoPrintToggle = useCallback(
    async (value: boolean) => {
      dispatch(setAutoPrint(value));
      if (tenant?.slug) {
        try {
          await saveSettings({
            printer: { ...printer, autoPrint: value },
          }, tenant.slug);
        } catch (error) {
          console.error('Failed to save printer settings:', error);
        }
      }
    },
    [dispatch, printer, tenant?.slug]
  );

  const handleSelectPrinter = useCallback(() => {
    if (printer.connectionType === 'bluetooth') {
      setShowPrinterModal(true);
    } else if (printer.connectionType === 'network') {
      setShowNetworkModal(true);
    } else if (printer.connectionType === 'usb') {
      setShowUsbModal(true);
    }
  }, [printer.connectionType]);

  const handlePrinterSelected = useCallback(
    async (device: BluetoothDevice) => {
      dispatch(
        setSelectedPrinter({
          id: device.id,
          name: device.name,
          address: device.address,
        })
      );
      dispatch(setPrinterConnectionStatus('connected'));

      if (tenant?.slug) {
        try {
          await saveSettings({
            printer: {
              ...printer,
              selectedPrinterId: device.id,
              selectedPrinterName: device.name,
              selectedPrinterAddress: device.address,
              connectionStatus: 'connected',
            },
          }, tenant.slug);
        } catch (error) {
          console.error('Failed to save printer settings:', error);
        }
      }
    },
    [dispatch, printer, tenant?.slug]
  );

  const handleNetworkPrinterSelected = useCallback(
    async (networkPrinter: NetworkPrinter) => {
      dispatch(
        setSelectedPrinter({
          id: networkPrinter.id,
          name: networkPrinter.name,
          address: `${networkPrinter.ipAddress}:${networkPrinter.port}`,
        })
      );
      dispatch(setPrinterConnectionStatus('connected'));

      if (tenant?.slug) {
        try {
          await saveSettings({
            printer: {
              ...printer,
              selectedPrinterId: networkPrinter.id,
              selectedPrinterName: networkPrinter.name,
              selectedPrinterAddress: `${networkPrinter.ipAddress}:${networkPrinter.port}`,
              connectionStatus: 'connected',
            },
          }, tenant.slug);
        } catch (error) {
          console.error('Failed to save printer settings:', error);
        }
      }
    },
    [dispatch, printer, tenant?.slug]
  );

  const handleUsbPrinterSelected = useCallback(
    async (device: UsbDevice) => {
      dispatch(
        setSelectedPrinter({
          id: device.id,
          name: device.name,
          address: `${device.vendorId}:${device.productId}`,
        })
      );
      dispatch(setPrinterConnectionStatus('connected'));

      if (tenant?.slug) {
        try {
          await saveSettings({
            printer: {
              ...printer,
              selectedPrinterId: device.id,
              selectedPrinterName: device.name,
              selectedPrinterAddress: `${device.vendorId}:${device.productId}`,
              connectionStatus: 'connected',
            },
          }, tenant.slug);
        } catch (error) {
          console.error('Failed to save printer settings:', error);
        }
      }
    },
    [dispatch, printer, tenant?.slug]
  );

  const handleDisconnect = useCallback(async () => {
    Alert.alert(
      t('settings.printer.disconnect', 'Disconnect Printer'),
      t(
        'settings.printer.disconnectConfirm',
        `Are you sure you want to disconnect from ${printer.selectedPrinterName}?`
      ),
      [
        { text: t('common:cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('settings.printer.disconnect', 'Disconnect'),
          style: 'destructive',
          onPress: async () => {
            if (printer.connectionType === 'bluetooth') {
              await bluetoothPrinterService.disconnect();
            } else if (printer.connectionType === 'network') {
              await networkPrinterService.disconnect();
            } else if (printer.connectionType === 'usb') {
              await usbPrinterService.disconnect();
            }
            dispatch(setPrinterConnectionStatus('disconnected'));
            dispatch(setSelectedPrinter(null));

            if (tenant?.slug) {
              try {
                await saveSettings({
                  printer: {
                    ...printer,
                    selectedPrinterId: null,
                    selectedPrinterName: null,
                    selectedPrinterAddress: null,
                    connectionStatus: 'disconnected',
                  },
                }, tenant.slug);
              } catch (error) {
                console.error('Failed to save printer settings:', error);
              }
            }
          },
        },
      ]
    );
  }, [dispatch, printer, t, tenant?.slug]);

  const handleReconnect = useCallback(async () => {
    if (!printer.selectedPrinterId || !printer.selectedPrinterAddress) {
      Alert.alert(
        t('settings.printer.noSavedPrinter', 'No Saved Printer'),
        t(
          'settings.printer.selectPrinterFirst',
          'Please select a printer first.'
        ),
        [{ text: t('common:ok', 'OK') }]
      );
      return;
    }

    setIsConnecting(true);
    dispatch(setPrinterConnectionStatus('connecting'));

    try {
      let connected = false;

      if (printer.connectionType === 'bluetooth') {
        const device: BluetoothDevice = {
          id: printer.selectedPrinterId,
          name: printer.selectedPrinterName || 'Unknown',
          address: printer.selectedPrinterAddress,
          isPaired: true,
          isConnected: false,
        };
        connected = await bluetoothPrinterService.connect(device);
      } else if (printer.connectionType === 'network') {
        // Parse IP:port from selectedPrinterAddress
        const [ipAddress, portStr] = printer.selectedPrinterAddress.split(':');
        const port = parseInt(portStr, 10) || 9100;

        const networkPrinter: NetworkPrinter = {
          id: printer.selectedPrinterId,
          name: printer.selectedPrinterName || 'Unknown',
          ipAddress,
          port,
          isConnected: false,
        };
        connected = await networkPrinterService.connect(networkPrinter);
      } else if (printer.connectionType === 'usb') {
        // Parse vendorId:productId from selectedPrinterAddress
        const [vendorId, productId] = printer.selectedPrinterAddress.split(':');
        const usbDevice: UsbDevice = {
          id: printer.selectedPrinterId,
          name: printer.selectedPrinterName || 'Unknown',
          vendorId,
          productId,
          isConnected: false,
        };
        connected = await usbPrinterService.connect(usbDevice);
      }

      if (connected) {
        dispatch(setPrinterConnectionStatus('connected'));
      } else {
        dispatch(setPrinterConnectionStatus('error'));
        Alert.alert(
          t('settings.printer.connectionFailed', 'Connection Failed'),
          t(
            'settings.printer.tryAgain',
            'Could not connect to the printer. Please try again.'
          ),
          [{ text: t('common:ok', 'OK') }]
        );
      }
    } catch (error: any) {
      dispatch(setPrinterConnectionStatus('error'));
      Alert.alert(
        t('settings.printer.connectionError', 'Connection Error'),
        error.message || 'Failed to connect to printer.',
        [{ text: t('common:ok', 'OK') }]
      );
    } finally {
      setIsConnecting(false);
    }
  }, [dispatch, printer, t]);

  const handleTestPrint = useCallback(async () => {
    if (printer.connectionStatus !== 'connected') {
      Alert.alert(
        t('settings.printer.notConnected', 'Printer Not Connected'),
        t(
          'settings.printer.connectFirst',
          'Please connect to a printer before testing.'
        ),
        [{ text: t('common:ok', 'OK') }]
      );
      return;
    }

    setIsTestPrinting(true);

    try {
      // Generate a test receipt
      const testReceipt = generatePickingListReceipt({
        merchantInfo: DEFAULT_MERCHANT,
        items: [
          {
            name: 'Test Item 1',
            quantity: 2,
            unit: 'kg',
            categoryId: 'test',
            categoryName: 'Test Category',
            categoryIcon: '🧪',
          },
          {
            name: 'Test Item 2',
            quantity: 1,
            unit: 'pcs',
            categoryId: 'test',
            categoryName: 'Test Category',
            categoryIcon: '🧪',
          },
        ],
        paperWidth: printer.paperSize,
      });

      let printJob;
      if (printer.connectionType === 'bluetooth') {
        printJob = await bluetoothPrinterService.print(testReceipt);
      } else if (printer.connectionType === 'network') {
        printJob = await networkPrinterService.print(testReceipt);
      } else if (printer.connectionType === 'usb') {
        printJob = await usbPrinterService.print(testReceipt);
      } else {
        throw new Error('No printer connection type selected');
      }

      if (printJob.status === 'completed') {
        Alert.alert(
          t('settings.printer.testSuccess', 'Test Print Successful'),
          t(
            'settings.printer.testSuccessMessage',
            'The test page was sent to the printer successfully.'
          ),
          [{ text: t('common:ok', 'OK') }]
        );
      } else {
        Alert.alert(
          t('settings.printer.testFailed', 'Test Print Failed'),
          printJob.error || 'An error occurred while printing.',
          [{ text: t('common:ok', 'OK') }]
        );
      }
    } catch (error: any) {
      Alert.alert(
        t('settings.printer.testError', 'Print Error'),
        error.message || 'Failed to print test page.',
        [{ text: t('common:ok', 'OK') }]
      );
    } finally {
      setIsTestPrinting(false);
    }
  }, [printer, t]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { padding: theme.spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Enable Printing */}
        <SettingsSection title={t('settings.printer.general', 'General')}>
          <SettingsToggle
            label={t('settings.printer.enabled', 'Enable Printing')}
            description={t(
              'settings.printer.enabledDescription',
              'Allow printing picking lists'
            )}
            icon="printer"
            value={printer.enabled}
            onValueChange={handleEnableToggle}
            testID="printer-enable-toggle"
          />
        </SettingsSection>

        {/* Connection Settings - Only show when enabled */}
        {printer.enabled && (
          <>
            <SettingsSection
              title={t('settings.printer.connection', 'Connection')}
            >
              <SettingsRadioGroup<PrinterConnectionType>
                options={connectionTypeOptions}
                selectedValue={
                  printer.connectionType === 'none'
                    ? 'bluetooth'
                    : printer.connectionType
                }
                onSelect={handleConnectionTypeSelect}
                testID="connection-type"
              />

              {/* Printer Selection Row */}
              <SettingsRow
                label={t('settings.printer.selectPrinter', 'Select Printer')}
                value={
                  printer.selectedPrinterName ||
                  t('settings.printer.noPrinter', 'None')
                }
                onPress={handleSelectPrinter}
                hasChevron
                testID="printer-select-row"
              />

              {/* Connection Status */}
              {printer.selectedPrinterName && (
                <View
                  style={[
                    styles.statusContainer,
                    {
                      backgroundColor: theme.colors.surface,
                      padding: theme.spacing.md,
                      borderRadius: theme.borderRadius.md,
                      marginTop: theme.spacing.smd,
                    },
                  ]}
                >
                  <View style={styles.statusRow}>
                    <View style={styles.statusLeft}>
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor: getConnectionStatusColor(),
                            marginRight: theme.spacing.sm,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: getConnectionStatusColor(),
                            fontSize: theme.typography.fontSize.md,
                            fontWeight: theme.typography.fontWeight.semibold,
                          },
                        ]}
                      >
                        {getConnectionStatusText()}
                      </Text>
                    </View>

                    {printer.connectionStatus === 'connected' ? (
                      <TouchableOpacity
                        style={[
                          styles.disconnectButton,
                          {
                            borderColor: theme.colors.error,
                            paddingVertical: theme.spacing.xs + 2,
                            paddingHorizontal: theme.spacing.smd,
                            borderRadius: theme.borderRadius.sm,
                          },
                        ]}
                        onPress={handleDisconnect}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.disconnectText,
                            {
                              color: theme.colors.error,
                              fontSize: theme.typography.fontSize.sm,
                              fontWeight: theme.typography.fontWeight.medium,
                            },
                          ]}
                        >
                          {t('settings.printer.disconnect', 'Disconnect')}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.reconnectButton,
                          {
                            backgroundColor: theme.colors.primary,
                            paddingVertical: theme.spacing.xs + 2,
                            paddingHorizontal: theme.spacing.smd,
                            borderRadius: theme.borderRadius.sm,
                          },
                        ]}
                        onPress={handleReconnect}
                        disabled={isConnecting}
                        activeOpacity={0.7}
                      >
                        {isConnecting ? (
                          <ActivityIndicator size="small" color={theme.colors.textInverse} />
                        ) : (
                          <Text style={[styles.reconnectText, {
                              color: theme.colors.textInverse,
                              fontSize: theme.typography.fontSize.sm,
                              fontWeight: theme.typography.fontWeight.medium,
                            }]}>
                            {t('settings.printer.reconnect', 'Reconnect')}
                          </Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>

                  {printer.lastConnectedAt && (
                    <Text
                      style={[
                        styles.lastConnected,
                        {
                          color: theme.colors.textSecondary,
                          fontSize: theme.typography.fontSize.sm,
                          marginTop: theme.spacing.sm,
                        },
                      ]}
                    >
                      {t('settings.printer.lastConnected', 'Last connected:')} {' '}
                      {new Date(printer.lastConnectedAt).toLocaleString()}
                    </Text>
                  )}
                </View>
              )}

              {/* Test Print Button */}
              <View style={[styles.buttonContainer, { padding: theme.spacing.md }]}>
                <TouchableOpacity
                  style={[
                    styles.testButton,
                    {
                      backgroundColor:
                        printer.connectionStatus === 'connected'
                          ? theme.colors.primary
                          : theme.colors.textSecondary,
                      borderRadius: theme.borderRadius.md,
                      paddingVertical: theme.spacing.smd + 2,
                      paddingHorizontal: theme.spacing.lg,
                      minHeight: theme.buttonHeights.md,
                    },
                  ]}
                  onPress={handleTestPrint}
                  activeOpacity={0.8}
                  disabled={
                    isTestPrinting || printer.connectionStatus !== 'connected'
                  }
                  testID="test-print-button"
                >
                  {isTestPrinting ? (
                    <ActivityIndicator size="small" color={theme.colors.textInverse} />
                  ) : (
                    <Text
                      style={[
                        styles.testButtonText,
                        {
                          color: theme.colors.textInverse,
                          fontSize: theme.typography.fontSize.lg,
                          fontWeight: theme.typography.fontWeight.semibold,
                        },
                      ]}
                    >
                      {t('settings.printer.testPrint', 'Test Print')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </SettingsSection>

            {/* Paper Size */}
            <SettingsSection
              title={t('settings.printer.paperSize', 'Paper Size')}
            >
              <SettingsRadioGroup<PaperSize>
                options={paperSizeOptions}
                selectedValue={printer.paperSize}
                onSelect={handlePaperSizeSelect}
                testID="paper-size"
              />
            </SettingsSection>

            {/* Print Width (DPI) */}
            <SettingsSection
              title="Print Width"
            >
              <SettingsRadioGroup<any>
                options={_imageWidthOptions}
                selectedValue={printer.imageWidthDots || 832}
                onSelect={_handleImageWidthSelect}
                testID="image-width"
              />
            </SettingsSection>

            {/* Print Format */}
            <SettingsSection
              title={t('settings.printer.printFormat', 'Print Format')}
            >
              <SettingsRadioGroup<PrintFormat>
                options={printFormatOptions}
                selectedValue={printer.printFormat}
                onSelect={handlePrintFormatSelect}
                testID="print-format"
              />
            </SettingsSection>

            {/* Additional Options */}
            <SettingsSection
              title={t('settings.printer.options', 'Print Options')}
            >
              <SettingsToggle
                label={t('settings.printer.autoPrint', 'Auto Print')}
                description={t(
                  'settings.printer.autoPrintDescription',
                  'Automatically print when cart is finalized'
                )}
                icon="flash"
                value={printer.autoPrint}
                onValueChange={handleAutoPrintToggle}
                testID="auto-print-toggle"
              />
            </SettingsSection>
          </>
        )}
      </ScrollView>

      {/* Bluetooth Printer Selection Modal */}
      <PrinterSelectionModal
        visible={showPrinterModal}
        onClose={() => setShowPrinterModal(false)}
        onSelect={handlePrinterSelected}
        currentPrinterId={printer.selectedPrinterId}
      />

      {/* Network Printer Selection Modal */}
      <NetworkPrinterModal
        visible={showNetworkModal}
        onClose={() => setShowNetworkModal(false)}
        onSelect={handleNetworkPrinterSelected}
        currentPrinterId={printer.selectedPrinterId}
      />

      {/* USB Printer Selection Modal */}
      <UsbPrinterModal
        visible={showUsbModal}
        onClose={() => setShowUsbModal(false)}
        onSelect={handleUsbPrinterSelected}
        currentPrinterId={printer.selectedPrinterId}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    // padding applied via theme.spacing.md inline
  },
  statusContainer: {
    // padding, borderRadius, marginTop applied via theme tokens inline
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    // marginRight applied via theme.spacing.sm inline
  },
  statusText: {
    // fontSize, fontWeight applied via theme tokens inline
  },
  disconnectButton: {
    // paddingVertical, paddingHorizontal, borderRadius applied via theme tokens inline
    borderWidth: 1,
  },
  disconnectText: {
    // fontSize, fontWeight applied via theme tokens inline
  },
  reconnectButton: {
    // paddingVertical, paddingHorizontal, borderRadius applied via theme tokens inline
    minWidth: 90,
    alignItems: 'center',
  },
  reconnectText: {
    // color, fontSize, fontWeight applied via theme tokens inline
  },
  lastConnected: {
    // fontSize, marginTop applied via theme tokens inline
  },
  buttonContainer: {
    // padding applied via theme.spacing.md inline
  },
  testButton: {
    // paddingVertical, paddingHorizontal, minHeight applied via theme tokens inline
    alignItems: 'center',
    justifyContent: 'center',
  },
  testButtonText: {
    // fontSize, fontWeight applied via theme tokens inline
  },
});

export default PrinterSettingsScreen;
