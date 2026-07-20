import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Dynamically determine the API baseURL depending on the platform
const getBaseURL = () => {
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }
    if (Platform.OS === 'web') {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        return `http://${host}:3001/api`;
    }
    // Fallback to local IP for physical mobile devices on Wi-Fi
    return 'http://192.168.1.16:3001/api';
};

const baseURL = getBaseURL();

const api = axios.create({
    baseURL,
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token!);
        }
    });
    failedQueue = [];
};

let authFailureCallback: (() => void) | null = null;

export const setAuthFailureCallback = (callback: () => void) => {
    authFailureCallback = callback;
};

// Add a request interceptor to inject the auth token
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            const tenantId = await AsyncStorage.getItem('tenantId');
            if (tenantId) {
                config.headers['x-tenant-id'] = tenantId;
            }
        } catch (e) {
            console.error('Error reading tokens from AsyncStorage', e);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle unauthorized errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest.url?.includes('/auth/login') &&
            !originalRequest.url?.includes('/auth/refresh-token')
        ) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await AsyncStorage.getItem('refreshToken');

                if (!refreshToken) {
                    throw new Error('No refresh token found');
                }

                const res = await axios.post(
                    `${baseURL}/auth/refresh-token`,
                    { refreshToken }
                );

                const newToken = res.data.token;

                await AsyncStorage.setItem('token', newToken);

                originalRequest.headers.Authorization = `Bearer ${newToken}`;

                const tenantId = await AsyncStorage.getItem('tenantId');
                if (tenantId) {
                    originalRequest.headers['x-tenant-id'] = tenantId;
                }

                processQueue(null, newToken);
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                await AsyncStorage.removeItem('token');
                await AsyncStorage.removeItem('refreshToken');
                await AsyncStorage.removeItem('tenantId');
                await AsyncStorage.removeItem('encalm_user');

                if (authFailureCallback) {
                    authFailureCallback();
                }

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
