// Supabase Configuration
// IMPORTANT: Replace these with your actual Supabase project credentials
const SUPABASE_CONFIG = {
    url: 'https://fcwtnsaxhmoszxonwoct.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjd3Ruc2F4aG1vc3p4b253b2N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4ODg1ODgsImV4cCI6MjA2OTQ2NDU4OH0.NGBtfeajXqNf-6BJTc_nEsz_5Nngffrc1DS5tzZ6RPU',
    projectId: 'fcwtnsaxhmoszxonwoct'
};

// Create Supabase client
const supabase = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// API Configuration
const API_BASE_URL = `${SUPABASE_CONFIG.url}/functions/v1/make-server-8108af16`;

// Global state
window.AppState = {
    user: null,
    userProfile: null,
    accessToken: null,
    currentPage: 'dashboard',
    data: {
        users: [],
        products: [],
        transactions: [],
        analytics: null
    }
};

// Demo credentials for testing
const DEMO_CREDENTIALS = {
    admin: {
        email: 'admin@riceshop.com',
        password: 'admin123',
        role: 'admin'
    },
    manager: {
        email: 'manager@riceshop.com', 
        password: 'manager123',
        role: 'manager'
    },
    cashier: {
        email: 'cashier1@riceshop.com',
        password: 'cashier123', 
        role: 'cashier'
    }
};

// Utility functions
const Utils = {
    // Format currency
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    // Format date
    formatDate: (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Format date for display
    formatDateShort: (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    // Generate unique ID
    generateId: () => {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    },

    // Show loading state
    showLoading: (element) => {
        if (element) {
            element.innerHTML = '<div class="loading-spinner"></div>';
        }
    },

    // Hide loading state
    hideLoading: () => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    },

    // Show error message
    showError: (message, containerId = 'login-error') => {
        const errorElement = document.getElementById(containerId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    },

    // Hide error message
    hideError: (containerId = 'login-error') => {
        const errorElement = document.getElementById(containerId);
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
    },

    // Show success message
    showSuccess: (message) => {
        // Create temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.position = 'fixed';
        successDiv.style.top = '20px';
        successDiv.style.right = '20px';
        successDiv.style.zIndex = '9999';
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            document.body.removeChild(successDiv);
        }, 3000);
    },

    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Filter array by search term
    filterBySearch: (array, searchTerm, searchFields) => {
        if (!searchTerm) return array;
        
        const term = searchTerm.toLowerCase();
        return array.filter(item => {
            return searchFields.some(field => {
                const value = field.split('.').reduce((obj, key) => obj?.[key], item);
                return value?.toString().toLowerCase().includes(term);
            });
        });
    },

    // Get stock status
    getStockStatus: (stock) => {
        if (stock === 0) return 'out-of-stock';
        if (stock <= 10) return 'low-stock';
        return 'in-stock';
    },

    // Get stock status label
    getStockStatusLabel: (stock) => {
        if (stock === 0) return 'Out of Stock';
        if (stock <= 10) return 'Low Stock';
        return 'In Stock';
    },

    // Check if user has permission
    hasPermission: (requiredRole) => {
        const userRole = window.AppState.userProfile?.role;
        if (!userRole) return false;

        const roleHierarchy = {
            admin: 3,
            manager: 2,
            cashier: 1
        };

        return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
    },

    // Toggle sidebar on mobile
    toggleSidebar: () => {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('open');
        }
    },

    // Close sidebar on mobile
    closeSidebar: () => {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('open');
        }
    },

    // Update page visibility based on user role
    updatePageVisibility: () => {
        const userRole = window.AppState.userProfile?.role;
        const adminOnlyElements = document.querySelectorAll('.admin-only');
        
        adminOnlyElements.forEach(element => {
            if (userRole === 'admin' || userRole === 'manager') {
                element.style.display = '';
            } else {
                element.style.display = 'none';
            }
        });
    }
};

// Event helpers
const Events = {
    // Add event listener with cleanup
    on: (element, event, handler) => {
        if (element && typeof handler === 'function') {
            element.addEventListener(event, handler);
            return () => element.removeEventListener(event, handler);
        }
    },

    // Trigger custom event
    trigger: (eventName, data = {}) => {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    },

    // Listen for custom events
    listen: (eventName, handler) => {
        document.addEventListener(eventName, handler);
    }
};

// Initialize Lucide icons when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

console.log('Rice Shop POS Config loaded');