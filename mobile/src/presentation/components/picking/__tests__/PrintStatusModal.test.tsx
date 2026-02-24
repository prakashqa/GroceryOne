/**
 * PrintStatusModal Component Tests
 * TDD: RED phase — these tests should fail until PrintStatusModal is implemented
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

// Mock theme
jest.mock('../../../theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
}));

// Mock useResponsiveStyles hook
jest.mock('../../../../hooks', () => ({
  useResponsiveStyles: require('../../../../__test-utils__/mocks/responsive.mock').mockUseResponsiveStyles,
}));

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValueOrParams?: string | Record<string, string>, params?: Record<string, string>) => {
      // Handle t(key, params) format where second arg is params object
      const actualParams = typeof defaultValueOrParams === 'object' ? defaultValueOrParams : params;

      const translations: Record<string, string> = {
        'picking.printStatus.sending': 'Sending to Printer',
        'picking.printStatus.sendingTo': `Sending to ${actualParams?.printerName || '{{printerName}}'}...`,
        'picking.printStatus.sendingGeneric': 'Sending to printer...',
        'picking.printStatus.success': 'Sent to Printer',
        'picking.printStatus.successMessage': 'Your picking list has been sent successfully!',
        'picking.printStatus.failed': 'Print Failed',
        'picking.printStatus.failedGeneric': 'An error occurred while printing.',
        'picking.printStatus.noPrinter': 'No Printer Connected',
        'picking.printStatus.noPrinterMessage': 'Connect a printer in Settings > Printer Settings.',
        'picking.printStatus.retry': 'Retry',
        'picking.printStatus.goToSettings': 'Go to Settings',
        'picking.printStatus.done': 'Done',
        'done': 'Done',
        'cancel': 'Cancel',
      };
      return translations[key] || (typeof defaultValueOrParams === 'string' ? defaultValueOrParams : key);
    },
  }),
}));

// Mock react-native-linear-gradient
jest.mock('react-native-linear-gradient', () => 'LinearGradient');

import PrintStatusModal from '../PrintStatusModal';

describe('PrintStatusModal', () => {
  const defaultProps = {
    visible: true,
    status: 'idle' as const,
    onClose: jest.fn(),
    testID: 'print-status-modal',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('printing state', () => {
    it('should render spinner and sending message', () => {
      const { getByTestId, getByText } = render(
        <PrintStatusModal {...defaultProps} status="printing" printerName="EPSON TM-T88" />
      );

      // ModalContainer uses testID-container for the inner wrapper
      expect(getByTestId('print-status-modal-container')).toBeTruthy();
      expect(getByText('Sending to Printer')).toBeTruthy();
      expect(getByTestId('print-status-modal-spinner')).toBeTruthy();
    });

    it('should display printer name when provided', () => {
      const { getByText } = render(
        <PrintStatusModal {...defaultProps} status="printing" printerName="EPSON TM-T88" />
      );

      expect(getByText('Sending to EPSON TM-T88...')).toBeTruthy();
    });

    it('should display generic message when no printer name', () => {
      const { getByText } = render(
        <PrintStatusModal {...defaultProps} status="printing" />
      );

      expect(getByText('Sending to printer...')).toBeTruthy();
    });

    it('should not show action buttons', () => {
      const { queryByTestId } = render(
        <PrintStatusModal {...defaultProps} status="printing" />
      );

      expect(queryByTestId('print-status-modal-done-btn')).toBeNull();
      expect(queryByTestId('print-status-modal-retry-btn')).toBeNull();
      expect(queryByTestId('print-status-modal-close-btn')).toBeNull();
    });
  });

  describe('success state', () => {
    it('should render success message with done button', () => {
      const { getByText, getByTestId } = render(
        <PrintStatusModal {...defaultProps} status="success" />
      );

      expect(getByText('Sent to Printer')).toBeTruthy();
      expect(getByText('Your picking list has been sent successfully!')).toBeTruthy();
      expect(getByTestId('print-status-modal-done-btn')).toBeTruthy();
    });

    it('should call onClose when done button is pressed', () => {
      const onClose = jest.fn();
      const { getByTestId } = render(
        <PrintStatusModal {...defaultProps} status="success" onClose={onClose} />
      );

      fireEvent.press(getByTestId('print-status-modal-done-btn'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should auto-dismiss after 2 seconds', () => {
      const onClose = jest.fn();
      render(
        <PrintStatusModal {...defaultProps} status="success" onClose={onClose} />
      );

      expect(onClose).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('failed state', () => {
    it('should render error message with retry and close buttons', () => {
      const { getByText, getByTestId } = render(
        <PrintStatusModal
          {...defaultProps}
          status="failed"
          errorMessage="Connection lost to printer"
        />
      );

      expect(getByText('Print Failed')).toBeTruthy();
      expect(getByText('Connection lost to printer')).toBeTruthy();
      expect(getByTestId('print-status-modal-retry-btn')).toBeTruthy();
      expect(getByTestId('print-status-modal-close-btn')).toBeTruthy();
    });

    it('should show generic error when no errorMessage provided', () => {
      const { getByText } = render(
        <PrintStatusModal {...defaultProps} status="failed" />
      );

      expect(getByText('An error occurred while printing.')).toBeTruthy();
    });

    it('should call onRetry when retry button is pressed', () => {
      const onRetry = jest.fn();
      const { getByTestId } = render(
        <PrintStatusModal {...defaultProps} status="failed" onRetry={onRetry} />
      );

      fireEvent.press(getByTestId('print-status-modal-retry-btn'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when close button is pressed', () => {
      const onClose = jest.fn();
      const { getByTestId } = render(
        <PrintStatusModal {...defaultProps} status="failed" onClose={onClose} />
      );

      fireEvent.press(getByTestId('print-status-modal-close-btn'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('no-printer state', () => {
    it('should render no printer message with settings and close buttons', () => {
      const { getByText, getByTestId } = render(
        <PrintStatusModal {...defaultProps} status="no-printer" />
      );

      expect(getByText('No Printer Connected')).toBeTruthy();
      expect(getByText('Connect a printer in Settings > Printer Settings.')).toBeTruthy();
      expect(getByTestId('print-status-modal-settings-btn')).toBeTruthy();
      expect(getByTestId('print-status-modal-close-btn')).toBeTruthy();
    });

    it('should call onGoToSettings when settings button is pressed', () => {
      const onGoToSettings = jest.fn();
      const { getByTestId } = render(
        <PrintStatusModal {...defaultProps} status="no-printer" onGoToSettings={onGoToSettings} />
      );

      fireEvent.press(getByTestId('print-status-modal-settings-btn'));
      expect(onGoToSettings).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when close button is pressed', () => {
      const onClose = jest.fn();
      const { getByTestId } = render(
        <PrintStatusModal {...defaultProps} status="no-printer" onClose={onClose} />
      );

      fireEvent.press(getByTestId('print-status-modal-close-btn'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('visibility', () => {
    it('should not render when visible is false', () => {
      const { queryByTestId } = render(
        <PrintStatusModal {...defaultProps} visible={false} status="success" />
      );

      // ModalContainer uses testID-container for the inner wrapper
      expect(queryByTestId('print-status-modal-container')).toBeNull();
    });

    it('should not render when status is idle', () => {
      const { queryByTestId } = render(
        <PrintStatusModal {...defaultProps} status="idle" />
      );

      expect(queryByTestId('print-status-modal-container')).toBeNull();
    });
  });
});
