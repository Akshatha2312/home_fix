import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const AdminRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // Check if user is authenticated and has admin role
  if (user && user.userType === "admin") {
    return <Outlet />;
  }

  // Redirect to login if not admin
  return <Navigate to="/login" replace />;
};

export default AdminRoute;
