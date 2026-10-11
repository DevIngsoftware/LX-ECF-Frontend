import axios, { type AxiosRequestConfig } from 'axios';
import { ENV } from '@/constants/env';
import { toApiError } from './errors';
import { tokenStore } from './token-store';
import { ENDPOINTS } from '@/services/api/endpoints';
import type { AuthTokens } from '@/types/account';

type RetryableRequest = AxiosRequestConfig & { _retry?: boolean };
const publicAuthPaths = [
  ENDPOINTS.auth.login, ENDPOINTS.auth.register, ENDPOINTS.auth.refresh, ENDPOINTS.auth.logout,
  ENDPOINTS.auth.verifyEmail, ENDPOINTS.auth.forgot, ENDPOINTS.auth.reset,
];
const isPublicAuthRequest = (url?: string) => publicAuthPaths.some((path) => url?.startsWith(path));
let refreshPromise: Promise<AuthTokens> | null = null;

export const http = axios.create({
  baseURL: ENV.apiBaseUrl,
  timeout: ENV.requestTimeoutMs,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

http.interceptors.request.use((config) => {
  const token = tokenStore.get()?.accessToken;
  if (token && !isPublicAuthRequest(config.url)) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && error.config) {
      const request = error.config as RetryableRequest;
      if (!isPublicAuthRequest(request.url) && tokenStore.isAuthenticated()) {
        if (!request._retry) {
          request._retry = true;
          try {
            refreshPromise ??= http.post<{ tokens: AuthTokens }>(ENDPOINTS.auth.refresh)
              .then((response) => response.data.tokens)
              .finally(() => { refreshPromise = null; });
            tokenStore.set(await refreshPromise);
            return http.request(request);
          } catch {
            tokenStore.emitSessionExpired();
          }
        } else {
          tokenStore.emitSessionExpired();
        }
      }
    }
    return Promise.reject(toApiError(error));
  },
);

export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.get<T>(url, config);
  return data;
}

export async function post<T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.post<T>(url, body, config);
  return data;
}

export async function put<T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.put<T>(url, body, config);
  return data;
}

export async function patch<T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.patch<T>(url, body, config);
  return data;
}

export async function del<T = void>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.delete<T>(url, config);
  return data;
}

export async function getBlob(url: string, config?: AxiosRequestConfig): Promise<Blob> {
  const { data } = await http.get<Blob>(url, { ...config, responseType: 'blob' });
  return data;
}
