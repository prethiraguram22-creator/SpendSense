/**
 * SpendSense Centralized Production API Service Layer
 * Connects directly to Node.js/Express PostgreSQL backend via VITE_API_BASE_URL.
 * Supports HttpOnly credentials and Authorization token header fallback.
 */

// Default to http://localhost:5000/api if running locally and VITE_API_BASE_URL not set
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined
  ? import.meta.env.VITE_API_BASE_URL
  : 'http://localhost:5000/api';

// In-memory token storage (never exposed in localStorage)
let inMemoryToken = null;

export const setAuthToken = (token) => {
  inMemoryToken = token;
  if (token) {
    sessionStorage.setItem('spendsense_session_active', '1');
  } else {
    sessionStorage.removeItem('spendsense_session_active');
  }
};

export const getAuthToken = () => inMemoryToken;

/**
 * Universal request wrapper with error handling and credentials
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(inMemoryToken ? { Authorization: `Bearer ${inMemoryToken}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Includes HttpOnly cookies
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error || errorData.message || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.details = errorData.details;
    throw error;
  }

  return await response.json();
}

export const apiService = {
  // Authentication
  async registerUser(userData) {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (res.token) setAuthToken(res.token);
    return res;
  },

  async loginUser(credentials) {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res.token) setAuthToken(res.token);
    return res;
  },

  async logoutUser() {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      setAuthToken(null);
    }
    return { success: true };
  },

  async getCurrentUser() {
    return request('/auth/me');
  },

  async forgotPassword(email) {
    return request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token, password) {
    return request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },

  // Transactions
  async getTransactions(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL') {
        params.append(k, v);
      }
    });
    const queryString = params.toString();
    return request(`/transactions${queryString ? `?${queryString}` : ''}`);
  },

  async createTransaction(transaction) {
    return request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  },

  async updateTransaction(id, updates) {
    return request(`/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async deleteTransaction(id) {
    return request(`/transactions/${id}`, {
      method: 'DELETE',
    });
  },

  // Budgets
  async getBudgets(month) {
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    return request(`/budgets${query}`);
  },

  async createBudget(budget) {
    return request('/budgets', {
      method: 'POST',
      body: JSON.stringify(budget),
    });
  },

  async updateBudget(id, updates) {
    return request(`/budgets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async deleteBudget(id) {
    return request(`/budgets/${id}`, {
      method: 'DELETE',
    });
  },

  // Savings Goals
  async getSavingsGoals() {
    return request('/goals');
  },

  async createSavingsGoal(goal) {
    return request('/goals', {
      method: 'POST',
      body: JSON.stringify(goal),
    });
  },

  async updateSavingsGoal(id, updates) {
    return request(`/goals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async deleteSavingsGoal(id) {
    return request(`/goals/${id}`, {
      method: 'DELETE',
    });
  },

  async contributeSavingsGoal(id, amount) {
    return request(`/goals/${id}/contribute`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  // Dashboard & Analytics
  async getDashboardSummary(month) {
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    return request(`/dashboard/summary${query}`);
  },

  async getSpendingAnalytics(month) {
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    return request(`/analytics/spending${query}`);
  },

  async getMonthlyAnalytics(months = 6) {
    return request(`/analytics/monthly?months=${months}`);
  },

  // User Profile & Settings
  async updateProfile(profileData) {
    return request('/user/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
  },

  async updateNotifications(pref) {
    return request('/user/notifications', {
      method: 'PATCH',
      body: JSON.stringify(pref),
    });
  },

  async changePassword(passwords) {
    return request('/user/change-password', {
      method: 'POST',
      body: JSON.stringify(passwords),
    });
  },

  async deleteAccount() {
    return request('/user/account', {
      method: 'DELETE',
    });
  },
};
