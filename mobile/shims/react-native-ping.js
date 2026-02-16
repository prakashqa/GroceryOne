// Shim for react-native-ping
// This module is a peer dependency of react-native-thermal-receipt-printer-image-qr
// but is only used by NetPrinter (network printing). Our app only uses BLEPrinter
// and USBPrinter, so we stub it out to avoid bundler errors.
export default {
  start: () => Promise.resolve(0),
};
