import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  ChevronDown,
  User,
  LogOut,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import UserAvatar from "../common/UserAvatar";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowLoginDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-primary">HomeFix</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6">
          <Link
            to="/"
            className={`${
              isActive("/")
                ? "text-primary font-medium"
                : "text-gray-600 hover:text-primary"
            } transition font-medium`}
          >
            Home
          </Link>
          {(!isAuthenticated || user?.userType === "customer") && (
            <Link
              to="/services"
              className={`${
                isActive("/services")
                  ? "text-primary font-medium"
                  : "text-gray-600 hover:text-primary"
              } transition font-medium`}
            >
              Services
            </Link>
          )}

          {isAuthenticated && user?.userType === "admin" && (
            <Link
              to="/admin/dashboard"
              className={`${
                isActive("/admin/dashboard")
                  ? "text-primary font-medium"
                  : "text-gray-600 hover:text-primary"
              } transition font-medium`}
            >
              Admin Panel
            </Link>
          )}

          {isAuthenticated && user?.userType !== "admin" && (
            <Link
              to={
                user.userType === "provider"
                  ? "/provider-dashboard"
                  : "/customer-dashboard"
              }
              className={`${
                isActive("/customer-dashboard") ||
                isActive("/provider-dashboard")
                  ? "text-primary font-medium"
                  : "text-gray-600 hover:text-primary"
              } transition font-medium`}
            >
              {user.userType === "provider" ? "Dashboard" : "My Bookings"}
            </Link>
          )}

          {/* Auth Button / Dropdown */}
          <div
            className="relative group ml-4 pl-4 border-l border-gray-200"
            ref={dropdownRef}
          >
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowLoginDropdown(!showLoginDropdown)}
                  className="flex items-center gap-3 focus:outline-none"
                >
                  <UserAvatar user={user} className="w-9 h-9" />
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-semibold text-gray-700 leading-none">
                      {user?.name?.split(" ")[0]}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5 capitalize">
                      {user?.userType}
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${showLoginDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                {showLoginDropdown && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl py-2 border border-gray-100 ring-1 ring-black ring-opacity-5 z-50 animate-fade-in origin-top-right">
                    <div className="px-4 py-3 border-b border-gray-100 mb-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user?.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>

                    <Link
                      to={
                        user?.userType === "provider"
                          ? "/provider-dashboard"
                          : "/customer-dashboard"
                      }
                      onClick={() => setShowLoginDropdown(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setShowLoginDropdown(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Profile Settings
                    </Link>

                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowLoginDropdown(!showLoginDropdown)}
                  className="flex items-center gap-2 text-gray-700 font-medium hover:text-primary transition focus:outline-none px-4 py-2 rounded-full hover:bg-blue-50"
                >
                  <span>Login</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showLoginDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                {showLoginDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2 border border-blue-50 ring-1 ring-black ring-opacity-5 z-50 animate-fade-in origin-top-right">
                    <Link
                      to="/login?type=customer"
                      onClick={() => setShowLoginDropdown(false)}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-primary transition-colors"
                    >
                      Customer Login
                    </Link>
                    <Link
                      to="/login?type=provider"
                      onClick={() => setShowLoginDropdown(false)}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-primary transition-colors"
                    >
                      Provider Login
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-gray-600 focus:outline-none p-2 rounded hover:bg-gray-100"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-xl rounded-b-xl p-4 flex flex-col space-y-3 z-40 animate-fade-in border-t border-gray-100">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className={`${
              isActive("/")
                ? "text-primary font-medium bg-blue-50"
                : "text-gray-600 hover:bg-gray-50 hover:text-primary"
            } p-3 rounded-lg transition-colors`}
          >
            Home
          </Link>
          {(!isAuthenticated || user?.userType === "customer") && (
            <Link
              to="/services"
              onClick={() => setIsOpen(false)}
              className={`${
                isActive("/services")
                  ? "text-primary font-medium bg-blue-50"
                  : "text-gray-600 hover:bg-gray-50 hover:text-primary"
              } p-3 rounded-lg transition-colors`}
            >
              Services
            </Link>
          )}

          {isAuthenticated && (
            <Link
              to={
                user.userType === "provider"
                  ? "/provider-dashboard"
                  : "/customer-dashboard"
              }
              onClick={() => setIsOpen(false)}
              className={`${
                isActive("/customer-dashboard") ||
                isActive("/provider-dashboard")
                  ? "text-primary font-medium bg-blue-50"
                  : "text-gray-600 hover:bg-gray-50 hover:text-primary"
              } p-3 rounded-lg transition-colors`}
            >
              {user.userType === "provider" ? "Dashboard" : "My Bookings"}
            </Link>
          )}

          {isAuthenticated && (
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className={`${
                isActive("/profile")
                  ? "text-primary font-medium bg-blue-50"
                  : "text-gray-600 hover:bg-gray-50 hover:text-primary"
              } p-3 rounded-lg transition-colors flex items-center gap-2`}
            >
              <Settings className="w-5 h-5" />
              Profile Settings
            </Link>
          )}

          <div className="border-t border-gray-100 pt-3 mt-2">
            {!isAuthenticated ? (
              <>
                <p className="text-xs text-gray-400 uppercase font-bold mb-2 pl-3">
                  Login
                </p>
                <Link
                  to="/login?type=customer"
                  onClick={() => setIsOpen(false)}
                  className="block text-gray-700 hover:bg-blue-50 hover:text-primary p-3 rounded-lg transition-colors font-medium"
                >
                  Customer Login
                </Link>
                <Link
                  to="/login?type=provider"
                  onClick={() => setIsOpen(false)}
                  className="block text-gray-700 hover:bg-blue-50 hover:text-primary p-3 rounded-lg transition-colors font-medium"
                >
                  Provider Login
                </Link>
              </>
            ) : (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full text-red-600 hover:bg-red-50 p-3 rounded-lg transition font-medium"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
