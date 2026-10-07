import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const loginType = searchParams.get("type") || "customer";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(email, password, loginType);
    setLoading(false);

    if (result.success) {
      toast.success("Welcome back!");
      if (result.user.userType === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate(
          result.user.userType === "provider"
            ? "/provider-dashboard"
            : "/customer-dashboard",
        );
      }
    } else {
      toast.error(result.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center pt-16 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 animate-fade-in-up">
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#0F2747] to-[#0F766E] rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-xl">H</span>
              </div>
              <span className="text-2xl font-bold text-[#0F2747]">
                Home<span className="gradient-text">Fix</span>
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-[#0F2747]">Welcome Back</h1>
            <p className="text-sm text-slate-500 mt-1">
              {loginType === "provider"
                ? "Login to manage your bookings"
                : loginType === "admin"
                  ? "Login to access the admin panel"
                  : "Login to book services"}
            </p>
          </div>

          {/* Tab Toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
            <Link
              to="/login?type=customer"
              className={`flex-1 py-2.5 text-sm font-medium text-center rounded-lg transition-all ${
                loginType === "customer"
                  ? "bg-white shadow-xs text-[#0F766E] font-semibold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Customer
            </Link>
            <Link
              to="/login?type=provider"
              className={`flex-1 py-2.5 text-sm font-medium text-center rounded-lg transition-all ${
                loginType === "provider"
                  ? "bg-white shadow-xs text-[#0F766E] font-semibold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Provider
            </Link>
            <Link
              to="/login?type=admin"
              className={`flex-1 py-2.5 text-sm font-medium text-center rounded-lg transition-all ${
                loginType === "admin"
                  ? "bg-white shadow-xs text-[#0F766E] font-semibold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Admin
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0F766E] focus:border-transparent outline-none transition-all text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0F766E] focus:border-transparent outline-none transition-all text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="flex justify-end mt-1">
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-[#0F766E] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#0F766E] hover:bg-[#0B5F59] text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-slate-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-[#0F766E] font-medium hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
