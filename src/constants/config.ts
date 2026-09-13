import { Platform } from 'react-native';

/**
 * Networking Configuration for Mobile API
 *
 * Supports:
 * 1. Physical Device via USB (using `adb reverse tcp:5000 tcp:5000` -> 127.0.0.1:5000)
 * 2. Physical Device via Wi-Fi (10.39.170.191:5000)
 * 3. Android Emulator (10.0.2.2:5000)
 * 4. iOS Simulator (localhost:5000)
 */

// Machine's Wi-Fi IP address (for local development fallback)
export const DEV_MACHINE_WIFI_IP = '10.39.170.191';

// Live production Render backend URL
export const LIVE_BACKEND_URL = 'https://ssc-cgl-app-backend.onrender.com/api';

// Candidate URLs in priority order:
// In release build (!__DEV__), strictly use live cloud backend.
// In dev mode (__DEV__), allow auto-discovery fallbacks.
export const API_CANDIDATE_URLS: string[] = __DEV__
  ? [
      LIVE_BACKEND_URL,
      'http://127.0.0.1:5000/api',
      'http://localhost:5000/api',
      `http://${DEV_MACHINE_WIFI_IP}:5000/api`,
      'http://10.0.2.2:5000/api',
    ]
  : [LIVE_BACKEND_URL];

// Default base URL fallback for local development
export const DEFAULT_DEV_URL =
  Platform.OS === 'android'
    ? 'http://127.0.0.1:5000/api'
    : 'http://localhost:5000/api';

// Active base URL: default to Live Cloud Backend
export let API_BASE_URL = LIVE_BACKEND_URL;

export const setApiBaseUrl = (url: string) => {
  API_BASE_URL = url;
};

export const APP_CONFIG = {
  appName: 'SSC CGL Practice',
  apiTimeoutMs: 15000,
};

