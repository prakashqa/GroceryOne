/**
 * NetworkPrinterModal Telugu Translation Integration Tests
 * Verifies that the Network Printer modal renders correctly in Telugu language
 */

import React from 'react';
import { Alert } from 'react-native';
import { waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../../../../__tests__/testUtils';
import NetworkPrinterModal from '../NetworkPrinterModal';
import i18n from '../../../../i18n/i18n.config';

// Mock the printer service
jest.mock('../../../../services/printer', () => ({
  networkPrinterService: {
    getSavedPrinters: jest.fn().mockReturnValue([]),
    getDiscoveredPrinters: jest.fn().mockReturnValue([]),
    onConnectionStatusChange: jest.fn().mockReturnValue(() => {}),
    discoverPrinters: jest.fn().mockResolvedValue([]),
    stopScan: jest.fn(),
    validateIpAddress: jest.fn().mockReturnValue(true),
    addManualPrinter: jest.fn().mockReturnValue({ id: '1', name: 'Test', ipAddress: '192.168.1.1', port: 9100 }),
    testConnection: jest.fn().mockResolvedValue(true),
    connect: jest.fn().mockResolvedValue(true),
    removeSavedPrinter: jest.fn(),
  },
  NetworkPrinter: {},
  NetworkConnectionStatus: {},
}));

describe('NetworkPrinterModal - Telugu Translation Integration', () => {
  const mockOnClose = jest.fn();
  const mockOnSelect = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    await i18n.changeLanguage('te');
  });

  afterAll(async () => {
    await i18n.changeLanguage('en');
  });

  it('should render header title in Telugu', async () => {
    const { getByText } = renderWithProviders(
      <NetworkPrinterModal
        visible={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    await waitFor(() => {
      expect(getByText('నెట్\u200cవర్క్ ప్రింటర్')).toBeTruthy();
    });
  });

  it('should render cancel button in Telugu', async () => {
    const { getByText } = renderWithProviders(
      <NetworkPrinterModal
        visible={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    await waitFor(() => {
      expect(getByText('రద్దు')).toBeTruthy(); // Cancel
    });
  });

  it('should render add manually section in Telugu', async () => {
    const { getByText } = renderWithProviders(
      <NetworkPrinterModal
        visible={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    await waitFor(() => {
      expect(getByText('ప్రింటర్\u200cను మాన్యువల్\u200cగా జోడించండి')).toBeTruthy();
    });
  });

  it('should render form labels in Telugu', async () => {
    const { getByText } = renderWithProviders(
      <NetworkPrinterModal
        visible={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    await waitFor(() => {
      expect(getByText('IP చిరునామా')).toBeTruthy();
      expect(getByText('పోర్ట్')).toBeTruthy();
      expect(getByText('ప్రింటర్ పేరు (ఐచ్ఛికం)')).toBeTruthy();
    });
  });

  it('should render add printer button in Telugu', async () => {
    const { getByText } = renderWithProviders(
      <NetworkPrinterModal
        visible={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    await waitFor(() => {
      expect(getByText('ప్రింటర్ జోడించు')).toBeTruthy();
    });
  });

  it('should render scan button in Telugu', async () => {
    const { getByText } = renderWithProviders(
      <NetworkPrinterModal
        visible={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    await waitFor(() => {
      expect(getByText('ప్రింటర్ల కోసం నెట్\u200cవర్క్ స్కాన్ చేయండి')).toBeTruthy();
    });
  });

  it('should render no printers found in Telugu', async () => {
    const { getByText } = renderWithProviders(
      <NetworkPrinterModal
        visible={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    await waitFor(() => {
      expect(getByText('ప్రింటర్లు కనుగొనబడలేదు')).toBeTruthy();
    });
  });

  it('should render common ports section in Telugu', async () => {
    const { getByText } = renderWithProviders(
      <NetworkPrinterModal
        visible={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    await waitFor(() => {
      expect(getByText('సాధారణ పోర్ట్\u200cలు')).toBeTruthy();
    });
  });

  it('should not contain English text for main UI elements', async () => {
    const { queryByText } = renderWithProviders(
      <NetworkPrinterModal
        visible={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    await waitFor(() => {
      expect(queryByText('Network Printer')).toBeNull();
      expect(queryByText('Add Printer Manually')).toBeNull();
      expect(queryByText('IP Address')).toBeNull();
      expect(queryByText('Printer Name (optional)')).toBeNull();
      expect(queryByText('Add Printer')).toBeNull();
      expect(queryByText('Scan Network for Printers')).toBeNull();
      expect(queryByText('No printers found')).toBeNull();
      expect(queryByText('Common Ports')).toBeNull();
      expect(queryByText('Cancel')).toBeNull();
    });
  });
});
