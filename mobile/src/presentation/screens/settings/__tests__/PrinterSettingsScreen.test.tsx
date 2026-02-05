/**
 * PrinterSettingsScreen Tests
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../../../__tests__/testUtils';
import PrinterSettingsScreen from '../PrinterSettingsScreen';

describe('PrinterSettingsScreen', () => {
  it('should render printer enable toggle', () => {
    const { getByText, getByTestId } = renderWithProviders(
      <PrinterSettingsScreen />
    );

    expect(getByText('Enable Printing')).toBeTruthy();
    expect(getByTestId('printer-enable-toggle-switch')).toBeTruthy();
  });

  it('should hide connection options when printer is disabled', () => {
    const { queryByText } = renderWithProviders(<PrinterSettingsScreen />);

    expect(queryByText('Bluetooth')).toBeNull();
    expect(queryByText('Network/WiFi')).toBeNull();
  });

  it('should show connection options when printer is enabled', () => {
    const { getByTestId, getByText } = renderWithProviders(
      <PrinterSettingsScreen />
    );

    fireEvent(getByTestId('printer-enable-toggle-switch'), 'valueChange', true);

    expect(getByText('Bluetooth')).toBeTruthy();
    expect(getByText('Network/WiFi')).toBeTruthy();
  });

  it('should show paper size options when printer is enabled', () => {
    const { getByTestId, getByText } = renderWithProviders(
      <PrinterSettingsScreen />
    );

    fireEvent(getByTestId('printer-enable-toggle-switch'), 'valueChange', true);

    expect(getByText('80mm (Standard)')).toBeTruthy();
    expect(getByText('58mm (Compact)')).toBeTruthy();
    expect(getByText('A4 (Full Page)')).toBeTruthy();
  });

  it('should show print format options when printer is enabled', () => {
    const { getByTestId, getByText } = renderWithProviders(
      <PrinterSettingsScreen />
    );

    fireEvent(getByTestId('printer-enable-toggle-switch'), 'valueChange', true);

    expect(getByText('Receipt Style')).toBeTruthy();
    expect(getByText('Detailed List')).toBeTruthy();
    expect(getByText('Compact')).toBeTruthy();
  });

  it('should show test print button when printer is enabled', () => {
    const { getByTestId, getByText } = renderWithProviders(
      <PrinterSettingsScreen />
    );

    fireEvent(getByTestId('printer-enable-toggle-switch'), 'valueChange', true);

    expect(getByText('Test Print')).toBeTruthy();
  });

  it('should update connection type in store', () => {
    const { getByTestId, store } = renderWithProviders(
      <PrinterSettingsScreen />
    );

    fireEvent(getByTestId('printer-enable-toggle-switch'), 'valueChange', true);
    fireEvent.press(getByTestId('connection-type-option-bluetooth'));

    const state = store.getState() as { settings: { printer: { connectionType: string } } };
    expect(state.settings.printer.connectionType).toBe('bluetooth');
  });

  it('should update paper size in store', () => {
    const { getByTestId, store } = renderWithProviders(
      <PrinterSettingsScreen />
    );

    fireEvent(getByTestId('printer-enable-toggle-switch'), 'valueChange', true);
    fireEvent.press(getByTestId('paper-size-option-58mm'));

    const state = store.getState() as { settings: { printer: { paperSize: string } } };
    expect(state.settings.printer.paperSize).toBe('58mm');
  });

  it('should update print format in store', () => {
    const { getByTestId, store } = renderWithProviders(
      <PrinterSettingsScreen />
    );

    fireEvent(getByTestId('printer-enable-toggle-switch'), 'valueChange', true);
    fireEvent.press(getByTestId('print-format-option-detailed'));

    const state = store.getState() as { settings: { printer: { printFormat: string } } };
    expect(state.settings.printer.printFormat).toBe('detailed');
  });
});
