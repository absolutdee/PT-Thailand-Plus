// apiUtils.js - Utility functions for API calls and request handling

import axios from 'axios';
import { getCachedData, setCachedData, invalidateCache } from './cacheUtils';

class ApiUtils {
    constructor() {
        this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        this.timeout = 30000; // 30 seconds
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1 second
        
        // Create axios instance
        this.axiosInstance = this.createAxiosInstance();
        this.setupInterceptors();
    }

    // Create axios instance with default config
    createAxiosInstance() {
        return axios.create({
            baseURL: this.baseURL,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            withCredentials: true,
        });
    }

    // Setup request and response interceptors
    setupInterceptors() {
        // Request interceptor
        this.axiosInstance.interceptors.request.use(
            (config) => {
                // Add auth token if available
                const token = this.getAuthToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }

                // Add request ID for tracking
                config.headers['X-Request-ID'] = this.generateRequestId();

                // Add timestamp
                config.metadata = { startTime: new Date() };

                // Log request in development
                if (process.env.NODE_ENV === 'development') {
                    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
                }

                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.axiosInstance.interceptors.response.use(
            (response) => {
                // Calculate request duration
                const duration = new Date() - response.config.metadata.startTime;

                // Log response in development
                if (process.env.NODE_ENV === 'development') {
                    console.log(`API Response: ${response.config.url} (${duration}ms)`, response.data);
                }

                return response;
            },
            async (error) => {
                const originalRequest = error.config;

                // Handle 401 Unauthorized
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        await this.refreshToken();
                        return this.axiosInstance(originalRequest);
                    } catch (refreshError) {
                        this.handleAuthError();
                        return Promise.reject(refreshError);
                    }
                }

                // Handle network errors with retry
                if (!error.response && originalRequest._retryCount < this.retryAttempts) {
                    originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
                    
                    await this.delay(this.retryDelay * originalRequest._retryCount);
                    return this.axiosInstance(originalRequest);
                }

                return Promise.reject(this.formatError(error));
            }
        );
    }

    // GET request with caching
    async get(url, options = {}) {
        const { params, cache = false, cacheKey, cacheDuration = 300000, ...config } = options;

        // Check cache if enabled
        if (cache) {
            const cachedData = getCachedData(cacheKey || url);
            if (cachedData) {
                return { data: cachedData, cached: true };
            }
        }

        try {
            const response = await this.axiosInstance.get(url, { params, ...config });
            
            // Cache the response if caching is enabled
            if (cache) {
                setCachedData(cacheKey || url, response.data, cacheDuration);
            }

            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // POST request
    async post(url, data, config = {}) {
        try {
            const response = await this.axiosInstance.post(url, data, config);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // PUT request
    async put(url, data, config = {}) {
        try {
            const response = await this.axiosInstance.put(url, data, config);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // PATCH request
    async patch(url, data, config = {}) {
        try {
            const response = await this.axiosInstance.patch(url, data, config);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // DELETE request
    async delete(url, config = {}) {
        try {
            const response = await this.axiosInstance.delete(url, config);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // Upload file
    async uploadFile(url, file, onProgress, additionalData = {}) {
        const formData = new FormData();
        formData.append('file', file);

        // Append additional data
        Object.keys(additionalData).forEach(key => {
            formData.append(key, additionalData[key]);
        });

        try {
            const response = await this.axiosInstance.post(url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    if (onProgress) {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        onProgress(percentCompleted);
                    }
                },
            });

            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // Upload multiple files
    async uploadMultipleFiles(url, files, onProgress, additionalData = {}) {
        const formData = new FormData();
        
        files.forEach((file, index) => {
            formData.append('files', file);
        });

        // Append additional data
        Object.keys(additionalData).forEach(key => {
            formData.append(key, additionalData[key]);
        });

        try {
            const response = await this.axiosInstance.post(url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    if (onProgress) {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        onProgress(percentCompleted);
                    }
                },
            });

            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // Download file
    async downloadFile(url, filename) {
        try {
            const response = await this.axiosInstance.get(url, {
                responseType: 'blob',
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            return true;
        } catch (error) {
            throw error;
        }
    }

    // Batch requests
    async batchRequests(requests) {
        try {
            const promises = requests.map(request => {
                const { method, url, data, config } = request;
                return this.axiosInstance[method.toLowerCase()](url, data, config);
            });

            const responses = await Promise.allSettled(promises);
            
            return responses.map((response, index) => ({
                ...requests[index],
                success: response.status === 'fulfilled',
                data: response.status === 'fulfilled' ? response.value.data : null,
                error: response.status === 'rejected' ? this.formatError(response.reason) : null,
            }));
        } catch (error) {
            throw error;
        }
    }

    // Cancel request
    createCancelToken() {
        return axios.CancelToken.source();
    }

    // Check if error is cancel error
    isCancel(error) {
        return axios.isCancel(error);
    }

    // Format error for consistent error handling
    formatError(error) {
        if (error.response) {
            // Server responded with error
            return {
                status: error.response.status,
                message: error.response.data?.message || error.message,
                errors: error.response.data?.errors || {},
                code: error.response.data?.code || error.code,
            };
        } else if (error.request) {
            // Request made but no response
            return {
                status: 0,
                message: 'Network error. Please check your connection.',
                code: 'NETWORK_ERROR',
            };
        } else {
            // Something else happened
            return {
                status: 0,
                message: error.message || 'An unexpected error occurred',
                code: 'UNKNOWN_ERROR',
            };
        }
    }

    // Get auth token
    getAuthToken() {
        // Try to get from localStorage first
        const token = localStorage.getItem('authToken');
        if (token) return token;

        // Try to get from sessionStorage
        return sessionStorage.getItem('authToken');
    }

    // Set auth token
    setAuthToken(token, remember = true) {
        if (remember) {
            localStorage.setItem('authToken', token);
        } else {
            sessionStorage.setItem('authToken', token);
        }
    }

    // Remove auth token
    removeAuthToken() {
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
    }

    // Refresh token
    async refreshToken() {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await this.post('/auth/refresh', { refreshToken });
            this.setAuthToken(response.accessToken);
            
            return response.accessToken;
        } catch (error) {
            this.removeAuthToken();
            throw error;
        }
    }

    // Handle auth error
    handleAuthError() {
        this.removeAuthToken();
        invalidateCache();
        
        // Redirect to login
        if (window.location.pathname !== '/signin') {
            window.location.href = '/signin';
        }
    }

    // Generate request ID
    generateRequestId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Delay utility
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Create query string from object
    createQueryString(params) {
        if (!params || Object.keys(params).length === 0) {
            return '';
        }

        const queryString = Object.keys(params)
            .filter(key => params[key] !== undefined && params[key] !== null)
            .map(key => {
                const value = params[key];
                if (Array.isArray(value)) {
                    return value.map(v => `${encodeURIComponent(key)}[]=${encodeURIComponent(v)}`).join('&');
                }
                return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
            })
            .join('&');

        return queryString ? `?${queryString}` : '';
    }

    // Parse query string to object
    parseQueryString(queryString) {
        const params = new URLSearchParams(queryString);
        const result = {};

        for (const [key, value] of params) {
            if (key.endsWith('[]')) {
                const arrayKey = key.slice(0, -2);
                if (!result[arrayKey]) {
                    result[arrayKey] = [];
                }
                result[arrayKey].push(value);
            } else {
                result[key] = value;
            }
        }

        return result;
    }

    // Set custom headers
    setCustomHeaders(headers) {
        Object.keys(headers).forEach(key => {
            this.axiosInstance.defaults.headers.common[key] = headers[key];
        });
    }

    // Remove custom headers
    removeCustomHeaders(headerKeys) {
        headerKeys.forEach(key => {
            delete this.axiosInstance.defaults.headers.common[key];
        });
    }

    // Request with timeout
    async requestWithTimeout(request, timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await request({ signal: controller.signal });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }
}

// Export singleton instance
const apiUtils = new ApiUtils();
export default apiUtils;

// Export individual methods
export const {
    get,
    post,
    put,
    patch,
    delete: deleteRequest,
    uploadFile,
    uploadMultipleFiles,
    downloadFile,
    batchRequests,
    createCancelToken,
    isCancel,
    setAuthToken,
    removeAuthToken,
    createQueryString,
    parseQueryString,
    setCustomHeaders,
    removeCustomHeaders,
} = apiUtils;
