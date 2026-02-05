/**
 * Order Scanning Feature
 * Exports all public APIs for the paper order scanning feature
 */

// Types
export * from './types/scanning.types';

// Services
export { TextParser, textParser } from './services/TextParser';
export { FuzzyMatcher } from './services/FuzzyMatcher';
export { OcrService, createOcrService } from './services/OcrService';

// Store
export { default as scanReducer } from './store/scanSlice';
export * from './store/scanSlice';

// Screens
export { CameraCaptureScreen } from './screens/CameraCaptureScreen';
export { ScanReviewScreen } from './screens/ScanReviewScreen';

// Components
export { MatchStatusBadge } from './components/MatchStatusBadge';
export { ScannedItemRow } from './components/ScannedItemRow';
export { QuantityEditModal } from './components/QuantityEditModal';
