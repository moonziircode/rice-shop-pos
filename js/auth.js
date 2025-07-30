// Authentication Module
const Auth = {
    // Initialize authentication
    init: () => {
        Auth.checkExistingSession();
        Auth.setupEventListeners();
    },

    // Setup event listeners
    setupEventListeners: () => {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            Events.on(loginForm, 'submit', Auth.handleLogin);
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            Events.on(logoutBtn, 'click', Auth.handleLogout);
        }
    },

    // Check for existing session
    checkExistingSession: async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (session && session.user) {
                window.AppState.user = session.user;
                window.AppState.accessToken = session.access_token;
                
                // Fetch user profile
                await Auth.fetchUserProfile();
                Auth.showMainApp();
            } else {
                Auth.showLoginPage();
            }
        } catch (error) {
            console.error('Session check error:', error);
            Auth.showLoginPage();
        } finally {
            Utils.hideLoading();
        }
    },

    // Handle login form submission
    handleLogin: async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        Utils.hideError();
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/signin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Sign in failed');
            }

            window.AppState.user = data.user;
            window.AppState.accessToken = data.access_token;
            
            // Fetch user profile
            await Auth.fetchUserProfile();
            Auth.showMainApp();
            
            Utils.showSuccess('Login successful!');
            
        } catch (error) {
            console.error('Login error:', error);
            Utils.showError(error.message);
        }
    },

    // Fetch user profile
    fetchUserProfile: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/users`, {
                headers: {
                    'Authorization': `Bearer ${window.AppState.accessToken}`
                }
            });

            if (response.ok) {
                const { users } = await response.json();
                const profile = users.find(u => u.id === window.AppState.user.id);
                window.AppState.userProfile = profile;
                
                Auth.updateUserDisplay();
                Utils.updatePageVisibility();
            }
        } catch (error) {
            console.error('Fetch profile error:', error);
        }
    },

    // Handle logout
    handleLogout: async () => {
        try {
            await supabase.auth.signOut();
            
            window.AppState.user = null;
            window.AppState.userProfile = null;
            window.AppState.accessToken = null;
            
            Auth.showLoginPage();
            Utils.showSuccess('Logged out successfully');
            
        } catch (error) {
            console.error('Logout error:', error);
        }
    },

    // Show login page
    showLoginPage: () => {
        document.getElementById('login-page').classList.remove('hidden');
        document.getElementById('main-app').classList.add('hidden');
        
        // Clear form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.reset();
        }
        Utils.hideError();
    },

    // Show main app
    showMainApp: () => {
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        
        // Initialize app modules
        Navigation.init();
        Dashboard.init();
        Products.init();
        Transactions.init();
        Users.init();
    },

    // Update user display in sidebar
    updateUserDisplay: () => {
        const userNameEl = document.getElementById('user-name');
        const userRoleEl = document.getElementById('user-role');
        
        if (userNameEl && window.AppState.userProfile) {
            userNameEl.textContent = window.AppState.userProfile.name;
        }
        
        if (userRoleEl && window.AppState.userProfile) {
            userRoleEl.textContent = window.AppState.userProfile.role;
        }
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        return !!window.AppState.accessToken;
    },

    // Get current user
    getCurrentUser: () => {
        return window.AppState.user;
    },

    // Get current user profile
    getCurrentUserProfile: () => {
        return window.AppState.userProfile;
    }
};

// Navigation Module
const Navigation = {
    // Initialize navigation
    init: () => {
        Navigation.setupEventListeners();
        Navigation.setActivePage(window.AppState.currentPage);
    },

    // Setup event listeners
    setupEventListeners: () => {
        // Navigation items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            Events.on(item, 'click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                if (page) {
                    Navigation.navigateToPage(page);
                }
            });
        });

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebar-toggle');
        if (sidebarToggle) {
            Events.on(sidebarToggle, 'click', Utils.toggleSidebar);
        }

        // Close sidebar when clicking main content on mobile
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            Events.on(mainContent, 'click', Utils.closeSidebar);
        }
    },

    // Navigate to page
    navigateToPage: (page) => {
        // Check permissions
        if (page === 'users' && !Utils.hasPermission('manager')) {
            Utils.showError('Access denied. Insufficient permissions.');
            return;
        }

        window.AppState.currentPage = page;
        Navigation.setActivePage(page);
        Navigation.showPageContent(page);
        Utils.closeSidebar();
    },

    // Set active navigation item
    setActivePage: (page) => {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.dataset.page === page) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    },

    // Show page content
    showPageContent: (page) => {
        const pageContents = document.querySelectorAll('.page-content');
        pageContents.forEach(content => {
            content.classList.remove('active');
        });

        const activePage = document.getElementById(`${page}-page`);
        if (activePage) {
            activePage.classList.add('active');
        }

        // Load page data if needed
        switch (page) {
            case 'dashboard':
                Dashboard.loadData();
                break;
            case 'products':
                Products.loadData();
                break;
            case 'transactions':
                Transactions.loadData();
                break;
            case 'users':
                Users.loadData();
                break;
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});

console.log('Rice Shop POS Auth loaded');