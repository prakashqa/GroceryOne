/**
 * Network Printer Modal
 * Modal for discovering and configuring network (WiFi/Ethernet) printers
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
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import {
  networkPrinterService,
  NetworkPrinter,
  NetworkConnectionStatus,
} from '../../../services/printer';

interface NetworkPrinterModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (printer: NetworkPrinter) => void;
  currentPrinterId?: string | null;
}

const NetworkPrinterModal: React.FC<NetworkPrinterModalProps> = ({
  visible,
  onClose,
  onSelect,
  currentPrinterId,
}) => {
  const theme = useTheme();
  const { t } = useTranslation('profile');
  const [printers, setPrinters] = useState<NetworkPrinter[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [, setConnectionStatus] =
    useState<NetworkConnectionStatus>('disconnected');
  const [connectingPrinterId, setConnectingPrinterId] = useState<string | null>(
    null
  );
  const [testingPrinterId, setTestingPrinterId] = useState<string | null>(null);

  // Manual IP input state
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('9100');
  const [printerName, setPrinterName] = useState('');
  const [ipError, setIpError] = useState('');

  // Load saved printers when modal opens
  useEffect(() => {
    if (visible) {
      loadPrinters();
    } else {
      // Reset state when modal closes
      setIsScanning(false);
      setConnectingPrinterId(null);
      setTestingPrinterId(null);
      setIpAddress('');
      setPort('9100');
      setPrinterName('');
      setIpError('');
    }
  }, [visible]);

  // Listen for connection status changes
  useEffect(() => {
    const unsubscribe = networkPrinterService.onConnectionStatusChange(
      (status) => {
        setConnectionStatus(status);
        if (status === 'connected' || status === 'error') {
          setConnectingPrinterId(null);
        }
      }
    );

    return unsubscribe;
  }, []);

  const loadPrinters = () => {
    const savedPrinters = networkPrinterService.getSavedPrinters();
    const discoveredPrinters = networkPrinterService.getDiscoveredPrinters();

    // Combine saved and discovered printers, avoiding duplicates
    const allPrinters = [...savedPrinters];
    discoveredPrinters.forEach((dp) => {
      if (!allPrinters.find((p) => p.ipAddress === dp.ipAddress && p.port === dp.port)) {
        allPrinters.push(dp);
      }
    });

    setPrinters(allPrinters);
  };

  const handleScan = useCallback(async () => {
    setIsScanning(true);

    try {
      await networkPrinterService.discoverPrinters(8000);
      loadPrinters();
    } catch (error: any) {
      Alert.alert(
        t('settings.printer.networkModal.scanError'),
        error.message || t('settings.printer.networkModal.scanErrorMessage'),
        [{ text: 'OK' }]
      );
    } finally {
      setIsScanning(false);
    }
  }, []);

  const handleStopScan = useCallback(() => {
    networkPrinterService.stopScan();
    setIsScanning(false);
  }, []);

  const handleAddManualPrinter = useCallback(() => {
    // Validate IP
    if (!networkPrinterService.validateIpAddress(ipAddress)) {
      setIpError(t('settings.printer.networkModal.invalidIp'));
      return;
    }

    // Validate port
    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      setIpError(t('settings.printer.networkModal.invalidPort'));
      return;
    }

    setIpError('');

    try {
      const printer = networkPrinterService.addManualPrinter(
        ipAddress,
        portNum,
        printerName || undefined
      );

      // Clear inputs
      setIpAddress('');
      setPort('9100');
      setPrinterName('');

      // Reload printers list
      loadPrinters();

      Alert.alert(t('settings.printer.networkModal.printerAdded'), t('settings.printer.networkModal.printerAddedMessage', { name: printer.name }), [
        { text: 'OK' },
      ]);
    } catch (error: any) {
      setIpError(error.message || t('settings.printer.networkModal.connectionErrorMessage'));
    }
  }, [ipAddress, port, printerName]);

  const handleTestConnection = useCallback(async (printer: NetworkPrinter) => {
    setTestingPrinterId(printer.id);

    try {
      const isReachable = await networkPrinterService.testConnection(printer);
      if (isReachable) {
        Alert.alert(
          t('settings.printer.networkModal.connectionTest'),
          t('settings.printer.networkModal.connectionSuccess', { name: printer.name }),
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          t('settings.printer.networkModal.connectionTest'),
          t('settings.printer.networkModal.connectionFailed', { name: printer.name }),
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert(
        t('settings.printer.networkModal.connectionTestFailed'),
        error.message || t('settings.printer.networkModal.connectionTestFailedMessage'),
        [{ text: 'OK' }]
      );
    } finally {
      setTestingPrinterId(null);
    }
  }, []);

  const handleSelectPrinter = useCallback(
    async (printer: NetworkPrinter) => {
      setConnectingPrinterId(printer.id);

      try {
        const connected = await networkPrinterService.connect(printer);
        if (connected) {
          onSelect(printer);
          onClose();
        } else {
          Alert.alert(
            t('settings.printer.networkModal.connectionFailedTitle'),
            t('settings.printer.networkModal.connectionFailedMessage', { name: printer.name }),
            [{ text: 'OK' }]
          );
        }
      } catch (error: any) {
        Alert.alert(
          t('settings.printer.networkModal.connectionError'),
          error.message || t('settings.printer.networkModal.connectionErrorMessage'),
          [{ text: 'OK' }]
        );
      } finally {
        setConnectingPrinterId(null);
      }
    },
    [onSelect, onClose]
  );

  const handleRemovePrinter = useCallback((printer: NetworkPrinter) => {
    Alert.alert(
      t('settings.printer.networkModal.removePrinter'),
      t('settings.printer.networkModal.removePrinterConfirm', { name: printer.name }),
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('settings.printer.networkModal.remove'),
          style: 'destructive',
          onPress: () => {
            networkPrinterService.removeSavedPrinter(printer.id);
            loadPrinters();
          },
        },
      ]
    );
  }, []);

  const renderPrinterItem = useCallback(
    ({ item }: { item: NetworkPrinter }) => {
      const isSelected = item.id === currentPrinterId;
      const isConnecting = item.id === connectingPrinterId;
      const isTesting = item.id === testingPrinterId;

      return (
        <View
          style={[
            styles.printerItem,
            {
              backgroundColor: isSelected
                ? theme.colors.primaryLight + '20'
                : theme.colors.surface,
              borderColor: isSelected
                ? theme.colors.primary
                : theme.colors.border,
            },
          ]}
        >
          <View style={styles.printerInfo}>
            <View style={styles.printerHeader}>
              <Text
                style={[
                  styles.printerIcon,
                  { backgroundColor: theme.colors.primaryLight + '30' },
                ]}
              >
                🌐
              </Text>
              <View style={styles.printerTextContainer}>
                <Text
                  style={[styles.printerName, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {item.name || t('settings.printer.networkModal.unknownPrinter')}
                </Text>
                <Text
                  style={[
                    styles.printerAddress,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {item.ipAddress}:{item.port}
                </Text>
              </View>
            </View>

            <View style={styles.printerActions}>
              {/* Test Connection Button */}
              <TouchableOpacity
                style={[
                  styles.testButton,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}
                onPress={() => handleTestConnection(item)}
                disabled={isTesting || isConnecting}
              >
                {isTesting ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <Text style={[styles.testButtonText, { color: theme.colors.primary }]}>
                    {t('settings.printer.networkModal.test')}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Select/Connect Button */}
              <TouchableOpacity
                style={[
                  styles.selectButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => handleSelectPrinter(item)}
                disabled={isConnecting || isTesting}
              >
                {isConnecting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.selectButtonText}>
                    {isSelected ? t('settings.printer.networkModal.reconnect') : t('settings.printer.networkModal.select')}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Remove Button */}
              {item.id.startsWith('manual-') && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemovePrinter(item)}
                  disabled={isConnecting}
                >
                  <Text style={[styles.removeText, { color: theme.colors.error }]}>
                    X
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {isSelected && !isConnecting && (
            <View style={styles.selectedBadge}>
              <Text style={[styles.checkmark, { color: theme.colors.primary }]}>
                {t('settings.printer.networkModal.current')}
              </Text>
            </View>
          )}
        </View>
      );
    },
    [
      currentPrinterId,
      connectingPrinterId,
      testingPrinterId,
      theme,
      t,
      handleSelectPrinter,
      handleTestConnection,
      handleRemovePrinter,
    ]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
              {t('common:cancel')}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            {t('settings.printer.networkModal.title')}
          </Text>

          <View style={styles.closeButton} />
        </View>

        {/* Manual IP Input Section */}
        <View
          style={[
            styles.inputSection,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('settings.printer.networkModal.addManually')}
          </Text>

          <View style={styles.inputRow}>
            <View style={styles.ipInputContainer}>
              <Text
                style={[styles.inputLabel, { color: theme.colors.textSecondary }]}
              >
                {t('settings.printer.networkModal.ipAddress')}
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    borderColor: ipError ? theme.colors.error : theme.colors.border,
                  },
                ]}
                placeholder="192.168.1.100"
                placeholderTextColor={theme.colors.textSecondary}
                value={ipAddress}
                onChangeText={(text) => {
                  setIpAddress(text);
                  setIpError('');
                }}
                keyboardType="numeric"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.portInputContainer}>
              <Text
                style={[styles.inputLabel, { color: theme.colors.textSecondary }]}
              >
                {t('settings.printer.networkModal.port')}
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
                placeholder="9100"
                placeholderTextColor={theme.colors.textSecondary}
                value={port}
                onChangeText={setPort}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.nameInputContainer}>
            <Text
              style={[styles.inputLabel, { color: theme.colors.textSecondary }]}
            >
              {t('settings.printer.networkModal.printerNameOptional')}
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              placeholder="Office Printer"
              placeholderTextColor={theme.colors.textSecondary}
              value={printerName}
              onChangeText={setPrinterName}
            />
          </View>

          {ipError ? (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {ipError}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[
              styles.addButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handleAddManualPrinter}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>{t('settings.printer.networkModal.addPrinter')}</Text>
          </TouchableOpacity>
        </View>

        {/* Scan Button */}
        <View style={styles.scanSection}>
          <TouchableOpacity
            style={[
              styles.scanButton,
              {
                backgroundColor: isScanning
                  ? theme.colors.error
                  : theme.colors.primaryLight,
              },
            ]}
            onPress={isScanning ? handleStopScan : handleScan}
            activeOpacity={0.8}
          >
            {isScanning && (
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
                style={styles.scanSpinner}
              />
            )}
            <Text
              style={[
                styles.scanButtonText,
                { color: isScanning ? '#fff' : theme.colors.primary },
              ]}
            >
              {isScanning ? t('settings.printer.networkModal.stopScanning') : t('settings.printer.networkModal.scanNetwork')}
            </Text>
          </TouchableOpacity>

          {isScanning && (
            <Text
              style={[styles.scanningText, { color: theme.colors.textSecondary }]}
            >
              {t('settings.printer.networkModal.searchingPrinters')}
            </Text>
          )}
        </View>

        {/* Printer List */}
        <View style={styles.listSection}>
          <Text
            style={[styles.listTitle, { color: theme.colors.textSecondary }]}
          >
            {printers.length > 0
              ? t('settings.printer.networkModal.availablePrinters', { count: printers.length })
              : t('settings.printer.networkModal.noPrintersFound')}
          </Text>

          <FlatList
            data={printers}
            renderItem={renderPrinterItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              !isScanning ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>🖨️</Text>
                  <Text
                    style={[
                      styles.emptyText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {t('settings.printer.networkModal.emptyHint')}
                  </Text>
                </View>
              ) : null
            }
          />
        </View>

        {/* Help Section */}
        <View
          style={[styles.helpSection, { backgroundColor: theme.colors.surface }]}
        >
          <Text style={[styles.helpTitle, { color: theme.colors.text }]}>
            {t('settings.printer.networkModal.commonPorts')}
          </Text>
          <Text
            style={[styles.helpText, { color: theme.colors.textSecondary }]}
          >
            {t('settings.printer.networkModal.portRaw')}
          </Text>
          <Text
            style={[styles.helpText, { color: theme.colors.textSecondary }]}
          >
            {t('settings.printer.networkModal.portLpr')}
          </Text>
          <Text
            style={[styles.helpText, { color: theme.colors.textSecondary }]}
          >
            {t('settings.printer.networkModal.portIpp')}
          </Text>
        </View>
      </KeyboardAvoidingView>
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
  inputSection: {
    padding: 16,
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  ipInputContainer: {
    flex: 2,
    marginRight: 12,
  },
  portInputContainer: {
    flex: 1,
  },
  nameInputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 12,
  },
  addButton: {
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scanSection: {
    padding: 16,
    alignItems: 'center',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
  },
  scanSpinner: {
    marginRight: 8,
  },
  scanButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  scanningText: {
    marginTop: 10,
    fontSize: 13,
  },
  listSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 16,
  },
  printerItem: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  printerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  printerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  printerIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 20,
    marginRight: 10,
    overflow: 'hidden',
    lineHeight: 40,
  },
  printerTextContainer: {
    flex: 1,
  },
  printerName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  printerAddress: {
    fontSize: 12,
  },
  printerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  selectButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    marginLeft: 8,
    padding: 6,
  },
  removeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  selectedBadge: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  checkmark: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  helpSection: {
    padding: 14,
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
  },
  helpTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  helpText: {
    fontSize: 12,
    lineHeight: 18,
  },
});

export default NetworkPrinterModal;
