// API Module for handling all backend requests
const API = {
    // Generic request handler
    request: async (endpoint, options = {}) => {
        const url = `${API_BASE_URL}${endpoint}`;
        
        const defaultHeaders = {
            'Content-Type': 'application/json',
        };

        // Add authorization header if user is authenticated
        if (window.AppState.accessToken) {
            defaultHeaders['Authorization'] = `Bearer ${window.AppState.accessToken}`;
        }

        const config = {
            headers: { ...defaultHeaders, ...options.headers },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || `Request failed with status ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    },

    // Authentication API
    auth: {
        signin: async (email, password) => {
            return API.request('/auth/signin', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
                },
                body: JSON.stringify({ email, password })
            });
        },

        signup: async (userData) => {
            return API.request('/auth/signup', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
        }
    },

    // Users API
    users: {
        getAll: async () => {
            return API.request('/users');
        },

        create: async (userData) => {
            return API.request('/auth/signup', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
        },

        update: async (userId, userData) => {
            return API.request(`/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
        },

        delete: async (userId) => {
            return API.request(`/users/${userId}`, {
                method: 'DELETE'
            });
        }
    },

    // Products API
    products: {
        getAll: async () => {
            return API.request('/products');
        },

        create: async (productData) => {
            return API.request('/products', {
                method: 'POST',
                body: JSON.stringify(productData)
            });
        },

        update: async (productId, productData) => {
            return API.request(`/products/${productId}`, {
                method: 'PUT',
                body: JSON.stringify(productData)
            });
        },

        delete: async (productId) => {
            return API.request(`/products/${productId}`, {
                method: 'DELETE'
            });
        }
    },

    // Transactions API
    transactions: {
        getAll: async () => {
            return API.request('/transactions');
        },

        create: async (transactionData) => {
            return API.request('/transactions', {
                method: 'POST',
                body: JSON.stringify(transactionData)
            });
        }
    },

    // Analytics API
    analytics: {
        getSales: async () => {
            return API.request('/analytics/sales');
        }
    },

    // Health check
    health: async () => {
        return API.request('/health');
    }
};

// Data Cache Module
const DataCache = {
    cache: new Map(),
    
    // Set cache with expiry
    set: (key, data, expiryMinutes = 5) => {
        const expiry = Date.now() + (expiryMinutes * 60 * 1000);
        DataCache.cache.set(key, { data, expiry });
    },

    // Get from cache
    get: (key) => {
        const cached = DataCache.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() > cached.expiry) {
            DataCache.cache.delete(key);
            return null;
        }
        
        return cached.data;
    },

    // Clear cache
    clear: (key) => {
        if (key) {
            DataCache.cache.delete(key);
        } else {
            DataCache.cache.clear();
        }
    },

    // Clear expired entries
    cleanup: () => {
        const now = Date.now();
        for (const [key, value] of DataCache.cache.entries()) {
            if (now > value.expiry) {
                DataCache.cache.delete(key);
            }
        }
    }
};

// Data loading with cache
const DataLoader = {
    // Load users with cache
    loadUsers: async (forceRefresh = false) => {
        const cacheKey = 'users';
        
        if (!forceRefresh) {
            const cached = DataCache.get(cacheKey);
            if (cached) {
                window.AppState.data.users = cached.users || [];
                return cached;
            }
        }

        try {
            const response = await API.users.getAll();
            window.AppState.data.users = response.users || [];
            DataCache.set(cacheKey, response);
            return response;
        } catch (error) {
            console.error('Failed to load users:', error);
            throw error;
        }
    },

    // Load products with cache
    loadProducts: async (forceRefresh = false) => {
        const cacheKey = 'products';
        
        if (!forceRefresh) {
            const cached = DataCache.get(cacheKey);
            if (cached) {
                window.AppState.data.products = cached.products || [];
                return cached;
            }
        }

        try {
            const response = await API.products.getAll();
            window.AppState.data.products = response.products || [];
            DataCache.set(cacheKey, response);
            return response;
        } catch (error) {
            console.error('Failed to load products:', error);
            throw error;
        }
    },

    // Load transactions with cache
    loadTransactions: async (forceRefresh = false) => {
        const cacheKey = 'transactions';
        
        if (!forceRefresh) {
            const cached = DataCache.get(cacheKey);
            if (cached) {
                window.AppState.data.transactions = cached.transactions || [];
                return cached;
            }
        }

        try {
            const response = await API.transactions.getAll();
            window.AppState.data.transactions = response.transactions || [];
            DataCache.set(cacheKey, response);
            return response;
        } catch (error) {
            console.error('Failed to load transactions:', error);
            throw error;
        }
    },

    // Load analytics with cache
    loadAnalytics: async (forceRefresh = false) => {
        const cacheKey = 'analytics';
        
        if (!forceRefresh) {
            const cached = DataCache.get(cacheKey);
            if (cached) {
                window.AppState.data.analytics = cached;
                return cached;
            }
        }

        try {
            const response = await API.analytics.getSales();
            window.AppState.data.analytics = response;
            DataCache.set(cacheKey, response, 2); // Cache for 2 minutes
            return response;
        } catch (error) {
            console.error('Failed to load analytics:', error);
            throw error;
        }
    }
};

// Error Handler
const ErrorHandler = {
    // Handle API errors
    handle: (error, context = '') => {
        console.error(`${context} error:`, error);
        
        let message = 'An unexpected error occurred';
        
        if (error.message) {
            message = error.message;
        }
        
        // Handle specific error types
        if (error.message.includes('Unauthorized') || error.message.includes('401')) {
            message = 'Session expired. Please login again.';
            // Redirect to login
            Auth.handleLogout();
            return;
        }
        
        if (error.message.includes('403')) {
            message = 'Access denied. Insufficient permissions.';
        }
        
        if (error.message.includes('404')) {
            message = 'Resource not found.';
        }
        
        if (error.message.includes('500')) {
            message = 'Server error. Please try again later.';
        }
        
        Utils.showError(message);
    }
};

// Cleanup cache periodically
setInterval(() => {
    DataCache.cleanup();
}, 5 * 60 * 1000); // Every 5 minutes

console.log('Rice Shop POS API loaded');