/**
 * Receipt Preview Modal
 * Displays picking list preview with monospace font for proper alignment
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../theme';
import { stripFormatMarkers } from '../../../domain/utils/receiptGenerator';

interface ReceiptPreviewModalProps {
  visible: boolean;
  receiptText: string;
  title: string;
  onClose: () => void;
  onPrint: () => void;
  isPrinting?: boolean;
  printButtonText?: string;
  cancelButtonText?: string;
}

const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  visible,
  receiptText,
  title,
  onClose,
  onPrint,
  isPrinting = false,
  printButtonText = 'Print Now',
  cancelButtonText = 'Cancel',
}) => {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
            style={styles.headerButton}
            onPress={onClose}
            activeOpacity={0.7}
            disabled={isPrinting}
          >
            <Text style={[styles.cancelText, { color: theme.colors.primary }]}>
              {cancelButtonText}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            {title}
          </Text>

          <TouchableOpacity
            style={[
              styles.headerButton,
              styles.printButton,
              { backgroundColor: theme.colors.primary },
              isPrinting && styles.printButtonDisabled,
            ]}
            onPress={onPrint}
            activeOpacity={0.7}
            disabled={isPrinting}
          >
            {isPrinting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.printText}>{printButtonText}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Receipt Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          <View
            style={[
              styles.receiptContainer,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Text
              style={[
                styles.receiptText,
                { color: theme.colors.text },
              ]}
            >
              {stripFormatMarkers(receiptText)}
            </Text>
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.footerButton,
              styles.cancelButton,
              { borderColor: theme.colors.border },
            ]}
            onPress={onClose}
            activeOpacity={0.7}
            disabled={isPrinting}
          >
            <Text style={[styles.footerButtonText, { color: theme.colors.text }]}>
              {cancelButtonText}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.footerButton,
              styles.footerPrintButton,
              { backgroundColor: theme.colors.primary },
              isPrinting && styles.printButtonDisabled,
            ]}
            onPress={onPrint}
            activeOpacity={0.7}
            disabled={isPrinting}
          >
            {isPrinting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.footerPrintText}>{printButtonText}</Text>
            )}
          </TouchableOpacity>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  printButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 80,
  },
  printButtonDisabled: {
    opacity: 0.6,
  },
  printText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  receiptContainer: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  receiptText: {
    // Use monospace font for proper alignment
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: 0,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    gap: 12,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footerPrintButton: {
    flex: 1,
  },
  footerPrintText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReceiptPreviewModal;
