import { API_PREFIX, DEFAULT_PORTS } from '@x10think/constants';
import axios from 'axios';

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? `http://localhost:${DEFAULT_PORTS.api}${API_PREFIX}`;

export const httpClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 10_000,
});
