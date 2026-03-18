import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add token from localStorage if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("homefix_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || "Something went wrong";
    if (error.response?.status === 401) {
      localStorage.removeItem("homefix_token");
      localStorage.removeItem("homefix_user");
      window.location.href = "/login";
    }
    return Promise.reject({ message, status: error.response?.status });
  },
);

// Auth API
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),
  verifyToken: () => api.get("/auth/verify-token"),
  forgotPassword: (email) => api.post("/auth/forgotpassword", { email }),
  resetPassword: (token, password) =>
    api.put(`/auth/resetpassword/${token}`, { password }),
  updateProfile: (data) =>
    api.put("/auth/profile", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// Services API
export const servicesAPI = {
  getAll: () => api.get("/services"),
  getByType: (type, params) => api.get(`/services/${type}`, { params }),
  getProvider: (id) => api.get(`/services/provider/${id}`),
  search: (q) => api.get("/services/search", { params: { q } }),
};

// Bookings API
export const bookingsAPI = {
  createBooking: (data) => api.post("/bookings", data),
  getCustomerBookings: () => api.get("/bookings/customer"),
  getProviderBookings: () => api.get("/bookings/provider"),
  getById: (id) => api.get(`/bookings/${id}`),
  updateStatus: (id, status) => api.put(`/bookings/${id}/status`, { status }),
  cancel: (id, reason) => api.put(`/bookings/${id}/cancel`, { reason }),
  submitReview: (id, data) => api.post(`/bookings/${id}/review`, data),
  getAvailability: (providerId, date) =>
    api.get(`/bookings/availability/${providerId}`, { params: { date } }),
};

export const favoritesAPI = {
  toggle: (providerId) => api.post(`/favorites/${providerId}`),
  remove: (providerId) => api.delete(`/favorites/${providerId}`),
  getAll: () => api.get("/favorites"),
  check: (providerId) => api.get(`/favorites/${providerId}/check`),
};

export const providerAPI = {
  toggleAvailability: () => api.put("/providers/availability"),
  getProfile: () => api.get("/providers/me"),
};

// Payments API
export const paymentsAPI = {
  createOrder: (data) => api.post("/payments/create-order", data),
  verify: (data) => api.post("/payments/verify", data),
  getHistory: () => api.get("/payments/history"),
};

export default api;
