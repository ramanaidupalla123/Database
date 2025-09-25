class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Forms
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Delete account event listeners
        document.getElementById('delete-account-btn').addEventListener('click', () => {
            this.showDeleteModal();
        });

        document.getElementById('confirm-delete-btn').addEventListener('click', () => {
            this.handleDeleteAccount();
        });

        document.getElementById('cancel-delete-btn').addEventListener('click', () => {
            this.hideDeleteModal();
        });

        // Close modal when clicking outside
        document.getElementById('delete-modal').addEventListener('click', (e) => {
            if (e.target.id === 'delete-modal') {
                this.hideDeleteModal();
            }
        });
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        document.querySelectorAll('.form').forEach(form => {
            form.classList.toggle('active', form.id === `${tabName}-form`);
        });
    }

    async handleRegister() {
        const formData = {
            username: document.getElementById('register-username').value,
            email: document.getElementById('register-email').value,
            password: document.getElementById('register-password').value
        };

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage('register-message', '🎉 Registration successful!', 'success');
                document.getElementById('registerForm').reset();
                setTimeout(() => {
                    this.switchTab('login');
                }, 1000);
            } else {
                this.showMessage('register-message', '❌ ' + data.message, 'error');
            }
        } catch (error) {
            this.showMessage('register-message', '❌ An error occurred', 'error');
        }
    }

    async handleLogin() {
        const formData = {
            email: document.getElementById('login-email').value,
            password: document.getElementById('login-password').value
        };

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                this.currentUser = data.user;
                this.showDashboard();
            } else {
                this.showMessage('login-message', '❌ ' + data.message, 'error');
            }
        } catch (error) {
            this.showMessage('login-message', '❌ An error occurred', 'error');
        }
    }

    async checkAuthStatus() {
        const token = localStorage.getItem('token');
        
        if (token) {
            try {
                const response = await fetch('/api/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    this.currentUser = await response.json();
                    this.showDashboard();
                } else {
                    localStorage.removeItem('token');
                }
            } catch (error) {
                localStorage.removeItem('token');
            }
        }
    }

    showDashboard() {
        document.querySelectorAll('.form').forEach(form => form.classList.remove('active'));
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        
        document.getElementById('dashboard').classList.remove('hidden');
        
        // Update user information
        document.getElementById('user-name').textContent = this.currentUser.username;
        document.getElementById('user-email').textContent = this.currentUser.email;
        
        // Update cards information
        this.updateUserCards();
    }

    updateUserCards() {
        document.getElementById('user-id').textContent = 
            (this.currentUser._id || this.currentUser.id).substring(0, 8) + '...';
        document.getElementById('table-username').textContent = this.currentUser.username;
        document.getElementById('table-email').textContent = this.currentUser.email;
        
        const createdDate = this.currentUser.createdAt ? 
            new Date(this.currentUser.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) : 
            new Date().toLocaleDateString();
        document.getElementById('user-created').textContent = createdDate;
    }

    handleLogout() {
        localStorage.removeItem('token');
        this.currentUser = null;
        
        document.getElementById('dashboard').classList.add('hidden');
        this.hideDeleteModal();
        this.switchTab('login');
        document.getElementById('loginForm').reset();
    }

    showDeleteModal() {
        console.log('Showing delete modal');
        const modal = document.getElementById('delete-modal');
        modal.classList.add('show');
    }

    hideDeleteModal() {
        console.log('Hiding delete modal');
        const modal = document.getElementById('delete-modal');
        modal.classList.remove('show');
    }

    async handleDeleteAccount() {
        const token = localStorage.getItem('token');
        
        if (!token) {
            this.showMessage('login-message', '❌ Please login again', 'error');
            this.hideDeleteModal();
            return;
        }

        try {
            console.log('Sending delete request...');
            
            const response = await fetch('/api/auth/delete-account', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            console.log('Delete response:', data);

            if (response.ok) {
                console.log('Account deletion successful');
                
                // Hide modal first
                this.hideDeleteModal();
                
                // Show success message
                this.showMessage('login-message', '✅ Account deleted successfully!', 'success');
                
                // Wait a bit then logout and redirect
                setTimeout(() => {
                    this.handleLogout();
                    
                    // Show final message
                    setTimeout(() => {
                        this.showMessage('login-message', '🗑️ Account permanently deleted!', 'success');
                    }, 500);
                }, 1000);
                
            } else {
                console.log('Delete failed:', data.message);
                this.showMessage('login-message', '❌ ' + data.message, 'error');
                this.hideDeleteModal();
            }
        } catch (error) {
            console.error('Delete account error:', error);
            this.showMessage('login-message', '❌ Network error', 'error');
            this.hideDeleteModal();
        }
    }

    showMessage(elementId, message, type) {
        const messageEl = document.getElementById(elementId);
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;
        
        setTimeout(() => {
            messageEl.textContent = '';
            messageEl.className = 'message';
        }, 5000);
    }
}

// Initialize the auth system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AuthSystem();
});