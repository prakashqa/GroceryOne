/**
 * Jest setup file
 */

import '@testing-library/react-native/extend-expect';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn(),
    Directions: {},
    GestureHandlerRootView: View,
  };
});

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const View = require('react-native').View;
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }: { children: unknown }) => children,
    SafeAreaConsumer: ({ children }: { children: (insets: typeof inset) => unknown }) =>
      children(inset),
    SafeAreaView: ({ children, ...props }: { children: unknown; [key: string]: unknown }) =>
      React.createElement(View, props, children),
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

// Mock react-native-screens
jest.mock('react-native-screens', () => {
  const React = require('react');
  const View = require('react-native').View;
  return {
    enableScreens: jest.fn(),
    Screen: View,
    ScreenContainer: View,
    ScreenStack: View,
    ScreenStackHeaderConfig: View,
    ScreenStackHeaderSubview: View,
    ScreenStackHeaderRightView: View,
    ScreenStackHeaderLeftView: View,
    ScreenStackHeaderCenterView: View,
    SearchBar: View,
    FullWindowOverlay: View,
    NativeScreen: View,
    NativeScreenContainer: View,
    NativeScreenNavigationContainer: View,
    ScreenContext: React.createContext(null),
  };
});

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

// Mock expo-constants
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {},
    },
    manifest: null,
    executionEnvironment: 'bare',
  },
}));

// Mock @react-native-community/datetimepicker
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) =>
      React.createElement(View, { testID: props.testID || 'date-time-picker', ...props }),
  };
});

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const View = require('react-native').View;
  const iconMock = View;
  return {
    MaterialCommunityIcons: iconMock,
    MaterialIcons: iconMock,
    Ionicons: iconMock,
    FontAwesome: iconMock,
    Feather: iconMock,
    AntDesign: iconMock,
    Entypo: iconMock,
  };
});

// Mock expo-print for system printing features
jest.mock('expo-print', () => ({
  printAsync: jest.fn().mockResolvedValue({}),
  selectPrinterAsync: jest.fn().mockResolvedValue({ name: 'Mock Printer', url: 'mock://printer' }),
  printToFileAsync: jest.fn().mockResolvedValue({ uri: 'file://mock.pdf' }),
}));

// Mock expo-secure-store for PIN storage
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-crypto for PIN hashing
jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn().mockResolvedValue('mockedhash123456'),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA-256',
  },
  getRandomBytes: jest.fn().mockReturnValue(
    new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
  ),
}));

// Mock react-native-thermal-receipt-printer-image-qr
jest.mock('react-native-thermal-receipt-printer-image-qr', () => ({
  BLEPrinter: {
    init: jest.fn().mockResolvedValue(true),
    getDeviceList: jest.fn().mockResolvedValue([
      { device_name: 'EPSON TM-T88', inner_mac_address: '00:11:22:33:44:55' },
      { device_name: 'Star TSP100', inner_mac_address: '00:11:22:33:44:66' },
    ]),
    connectPrinter: jest.fn().mockResolvedValue(true),
    printText: jest.fn().mockResolvedValue(true),
    printRawData: jest.fn().mockResolvedValue(true),
    printImageBase64: jest.fn().mockResolvedValue(true),
    closeConn: jest.fn().mockResolvedValue(true),
  },
  NetPrinter: {
    init: jest.fn().mockResolvedValue(true),
    getDeviceList: jest.fn().mockResolvedValue([]),
    connectPrinter: jest.fn().mockResolvedValue(true),
    printText: jest.fn().mockResolvedValue(true),
    closeConn: jest.fn().mockResolvedValue(true),
  },
  USBPrinter: {
    init: jest.fn().mockResolvedValue(true),
    getDeviceList: jest.fn().mockResolvedValue([
      { device_name: 'USB Thermal Printer', vendor_id: '1208', product_id: '0001' },
    ]),
    connectPrinter: jest.fn().mockResolvedValue(true),
    printText: jest.fn().mockResolvedValue(true),
    printRawData: jest.fn().mockResolvedValue(true),
    printImageBase64: jest.fn().mockResolvedValue(true),
    closeConn: jest.fn().mockResolvedValue(true),
  },
}));

// Mock react-native-tcp-socket
jest.mock('react-native-tcp-socket', () => {
  const EventEmitter = require('events');

  class MockSocket extends EventEmitter {
    destroyed = false;

    write(data: unknown, encoding?: unknown, callback?: (error?: Error) => void) {
      // Simulate successful write
      if (typeof encoding === 'function') {
        callback = encoding;
      }
      setTimeout(() => {
        if (callback) callback();
      }, 10);
      return true;
    }

    destroy() {
      this.destroyed = true;
      this.emit('close');
    }
  }

  return {
    createConnection: jest.fn((options: unknown, callback?: () => void) => {
      const socket = new MockSocket();
      // Simulate successful connection after short delay
      setTimeout(() => {
        if (callback) callback();
        socket.emit('connect');
      }, 50);
      return socket;
    }),
    Socket: MockSocket,
  };
});

// Mock react-native-gifted-charts
jest.mock('react-native-gifted-charts', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    BarChart: (props: unknown) => React.createElement(View, { testID: 'bar-chart', ...props }),
    LineChart: (props: unknown) => React.createElement(View, { testID: 'line-chart', ...props }),
    PieChart: (props: unknown) => React.createElement(View, { testID: 'pie-chart', ...props }),
  };
});

// Mock react-native-qrcode-svg
jest.mock('react-native-qrcode-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) =>
      React.createElement(View, { testID: 'qr-code', ...props }),
  };
});

// Mock react-native-linear-gradient
jest.mock('react-native-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props: unknown) => React.createElement(View, props);
});

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Svg: View,
    Circle: View,
    Ellipse: View,
    G: View,
    TSpan: View,
    TextPath: View,
    Path: View,
    Polygon: View,
    Polyline: View,
    Line: View,
    Rect: View,
    Use: View,
    Image: View,
    Symbol: View,
    Defs: View,
    LinearGradient: View,
    RadialGradient: View,
    Stop: View,
    ClipPath: View,
    Pattern: View,
    Mask: View,
    Text: View,
    default: View,
  };
});

// Mock Firebase
jest.mock('@react-native-firebase/app', () => ({
  initializeApp: jest.fn(),
}));

jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    hasPermission: jest.fn(() => Promise.resolve(true)),
    requestPermission: jest.fn(() => Promise.resolve(true)),
    getToken: jest.fn(() => Promise.resolve('mock-fcm-token')),
    onMessage: jest.fn(() => jest.fn()),
    onNotificationOpenedApp: jest.fn(() => jest.fn()),
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
  })),
}));

// Mock ReceiptBitmap native module (text-to-image for thermal printer Telugu printing)
import { NativeModules } from 'react-native';
NativeModules.ReceiptBitmap = {
  renderTextToImage: jest.fn().mockResolvedValue('mock-base64-bitmap-data'),
  renderTextToImages: jest.fn().mockResolvedValue(['mock-chunk-1', 'mock-chunk-2']),
};

// Silence specific warnings in tests
const originalError = console.error;
console.error = (...args: unknown[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render') ||
      args[0].includes('Warning: An update to') ||
      args[0].includes('act(...)'))
  ) {
    return;
  }
  originalError.call(console, ...args);
};

// Global test timeout
jest.setTimeout(10000);
