import axios, { type AxiosRequestConfig } from 'axios';
import { ENV } from '@/constants/env';
import { toApiError } from './errors';
import { tokenStore } from './token-store';

export const http = axios.create({
  baseURL: ENV.apiBaseUrl,
  timeout: ENV.requestTimeoutMs,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

http.interceptors.request.use((config) => {
  const token = tokenStore.get()?.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error);
    if (apiError.kind === 'unauthorized' && tokenStore.get()) tokenStore.emitSessionExpired();
    return Promise.reject(apiError);
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
