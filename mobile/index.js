/**
 * Expo Entry Point for Monorepo
 */

// Catch unhandled errors on web for debugging
if (typeof document !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('error', (e) => {
    document.body.innerHTML = `<pre style="color:red;padding:20px;white-space:pre-wrap;">RUNTIME ERROR:\n${e.message}\n\n${e.filename}:${e.lineno}</pre>`;
  });
  window.addEventListener('unhandledrejection', (e) => {
    document.body.innerHTML = `<pre style="color:red;padding:20px;white-space:pre-wrap;">UNHANDLED PROMISE:\n${e.reason?.message || e.reason}\n\n${e.reason?.stack || ''}</pre>`;
  });
}

import { registerRootComponent } from 'expo';
import App from './src/App';

registerRootComponent(App);
