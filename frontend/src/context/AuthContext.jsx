import { useState, useEffect, useCallback, useMemo } from "react";
import { authAPI } from "../services/api";
import { AuthContext } from "./AuthContextTypes";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [providerProfile, setProviderProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("homefix_token"));

  const checkAuth = useCallback(async () => {
    try {
      const storedUser = localStorage.getItem("homefix_user");
      const storedToken = localStorage.getItem("homefix_token");

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
        setIsAuthenticated(true);

        // Verify token with backend
        try {
          const res = await authAPI.getMe();
          setUser(res.user);
          setProviderProfile(res.providerProfile);
          localStorage.setItem("homefix_user", JSON.stringify(res.user));
        } catch {
          // Token expired, but keep demo mode working
        }
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (email, password) => {
    try {
      const res = await authAPI.login({ email, password });
      setUser(res.user);
      setToken(res.token);
      setIsAuthenticated(true);
      localStorage.setItem("homefix_token", res.token);
      localStorage.setItem("homefix_user", JSON.stringify(res.user));
      return { success: true, user: res.user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, []);

  const register = useCallback(async (data) => {
    try {
      const res = await authAPI.register(data);
      setUser(res.user);
      setToken(res.token);
      setIsAuthenticated(true);
      localStorage.setItem("homefix_token", res.token);
      localStorage.setItem("homefix_user", JSON.stringify(res.user));
      return { success: true, user: res.user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // Silent
    }
    setUser(null);
    setToken(null);
    setProviderProfile(null);
    setIsAuthenticated(false);
    localStorage.removeItem("homefix_token");
    localStorage.removeItem("homefix_user");
  }, []);

  // Demo login (works without backend)
  const demoLogin = useCallback((userType) => {
    const demoUser = {
      _id: userType === "customer" ? "demo_customer" : "demo_provider",
      name: userType === "customer" ? "Priya Menon" : "Rajesh Kumar",
      email:
        userType === "customer"
          ? "customer@homefix.demo"
          : "rajesh@homefix.demo",
      phone: userType === "customer" ? "9876500000" : "9876543201",
      userType,
      isVerified: true,
    };
    const demoToken = "demo_token";
    setUser(demoUser);
    setToken(demoToken);
    setIsAuthenticated(true);
    localStorage.setItem("homefix_user", JSON.stringify(demoUser));
    localStorage.setItem("homefix_token", demoToken);
    return { success: true, user: demoUser };
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      providerProfile,
      loading,
      isAuthenticated,
      login,
      register,
      logout,
      demoLogin,
    }),
    [
      user,
      token,
      providerProfile,
      loading,
      isAuthenticated,
      login,
      register,
      logout,
      demoLogin,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
