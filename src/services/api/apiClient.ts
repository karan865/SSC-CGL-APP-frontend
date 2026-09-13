import {
  API_BASE_URL,
  API_CANDIDATE_URLS,
  setApiBaseUrl,
  APP_CONFIG,
} from '../../constants/config';
import { ApiResponse } from '../../types/api';

export class ApiError extends Error {
  public errors?: any[];
  public status?: number;

  constructor(message: string, status?: number, errors?: any[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
}

let isDiscovering = false;
let verifiedWorkingUrl: string | null = null;

/**
 * Probes candidate URLs to find the accessible backend host.
 */
export const discoverWorkingBaseUrl = async (): Promise<string> => {
  if (verifiedWorkingUrl) return verifiedWorkingUrl;
  if (isDiscovering) return API_BASE_URL;

  isDiscovering = true;
  try {
    for (const candidate of API_CANDIDATE_URLS) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`${candidate}/health`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (res.ok) {
          verifiedWorkingUrl = candidate;
          setApiBaseUrl(candidate);
          return candidate;
        }
      } catch {
        // Continue to next candidate
      }
    }
  } finally {
    isDiscovering = false;
  }

  return API_BASE_URL;
};

import { getGuestId } from '../guestService';

/**
 * Centralized API client for all mobile network requests.
 */
export const request = async <T = any>(
  endpoint: string,
  options: RequestOptions = {},
  isRetry = false
): Promise<T> => {
  const currentBase = verifiedWorkingUrl || API_BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${currentBase}${cleanEndpoint}`;
  const method = options.method || 'GET';

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-guest-id': getGuestId(),
    ...(options.headers || {}),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), APP_CONFIG.apiTimeoutMs);

  try {
    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: controller.signal,
    };

    if (options.body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    const json: ApiResponse<T> = await response.json().catch(() => {
      throw new ApiError('Unable to process server response.', response.status);
    });

    if (!response.ok || !json.success) {
      const errorMessage = json.message || 'Something went wrong.';
      throw new ApiError(errorMessage, response.status, json.errors);
    }

    // Mark this candidate as verified working
    verifiedWorkingUrl = currentBase;
    return json.data as T;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    // If initial attempt failed, attempt candidate auto-discovery once
    if (!isRetry) {
      const discoveredUrl = await discoverWorkingBaseUrl();
      if (discoveredUrl !== currentBase) {
        return request<T>(endpoint, options, true);
      }
    }

    if (error.name === 'AbortError') {
      throw new ApiError('Request timed out. Please check backend is running and reachable.');
    }

    throw new ApiError('Network connection issue. Please check your internet connection or backend server status.');
  }
};

export const apiClient = {
  get: <T = any>(endpoint: string, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'GET', headers }),

  post: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'POST', body, headers }),

  patch: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'PATCH', body, headers }),
};
