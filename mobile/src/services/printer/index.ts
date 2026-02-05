/**
 * Printer Services Export
 */

export {
  bluetoothPrinterService,
  BluetoothPrinterService,
  type BluetoothDevice,
  type PrintJob,
  type ConnectionStatus,
} from './BluetoothPrinterService';

export {
  networkPrinterService,
  NetworkPrinterService,
  type NetworkPrinter,
  type NetworkPrintJob,
  type NetworkConnectionStatus,
} from './NetworkPrinterService';
