import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  UserPlus,
  MapPin,
  Briefcase,
  IndianRupee,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { SERVICE_TYPES } from "../config/constants";
import toast from "react-hot-toast";

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const [userType, setUserType] = useState(
    searchParams.get("type") || "customer",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    serviceType: "plumber",
    experience: "",
    pricePerHour: "",
    area: "",
    pincode: "",
    description: "",
  });

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const result = await register({ ...form, userType });
    setLoading(false);

    if (result.success) {
      toast.success("Account created successfully!");
      navigate(
        userType === "provider" ? "/provider-dashboard" : "/customer-dashboard",
      );
    } else {
      toast.error(result.message || "Registration failed");
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-6 px-4 bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className={`w-full ${userType === "provider" ? "max-w-3xl" : "max-w-md"} my-auto transition-all duration-300`}>
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-7 animate-fade-in-up">
          <div className="text-center mb-4">
            <Link to="/" className="inline-flex items-center gap-2 mb-3">
              <div className="w-9 h-9 bg-gradient-to-br from-[#0F2747] to-[#0F766E] rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <span className="text-xl font-bold text-[#0F2747]">
                Home<span className="gradient-text">Fix</span>
              </span>
            </Link>
            <h1 className="text-xl font-bold text-[#0F2747]">Create Account</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Join HomeFix as a customer or provider
            </p>
          </div>

          {/* Type Toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-4">
            <button
              onClick={() => setUserType("customer")}
              className={`flex-1 py-2 text-xs font-medium text-center rounded-lg transition-all cursor-pointer ${
                userType === "customer"
                  ? "bg-white shadow-xs text-[#0F766E] font-semibold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              🏠 Customer
            </button>
            <button
              onClick={() => setUserType("provider")}
              className={`flex-1 py-2 text-xs font-medium text-center rounded-lg transition-all cursor-pointer ${
                userType === "provider"
                  ? "bg-white shadow-xs text-[#0F766E] font-semibold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              🔧 Service Provider
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {userType === "provider" ? (
              /* TWO COLUMN LAYOUT FOR PROVIDER REGISTRATION ON DESKTOP */
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* LEFT COLUMN: ACCOUNT CREDENTIALS */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
                      1. Account Info
                    </p>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          name="name"
                          required
                          value={form.name}
                          onChange={handleChange}
                          placeholder="Your full name"
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#0F766E] focus:border-transparent outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          name="phone"
                          required
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="98765 43210"
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#0F766E] focus:border-transparent outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          required
                          value={form.email}
                          onChange={handleChange}
                          placeholder="you@example.com"
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#0F766E] focus:border-transparent outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          required
                          value={form.password}
                          onChange={handleChange}
                          placeholder="Min 6 characters"
                          className="w-full pl-9 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#0F766E] focus:border-transparent outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {form.password.length > 0 && (
                        <div className="mt-1.5 space-y-0.5">
                          <div className="flex gap-1 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                form.password.length < 6
                                  ? "w-1/3 bg-red-500"
                                  : form.password.length < 10 || !/[0-9!@#$%^&*]/.test(form.password)
                                    ? "w-2/3 bg-amber-500"
                                    : "w-full bg-emerald-500"
                              }`}
                            ></div>
                          </div>
                          <span className="text-[10px] text-gray-500 block text-right font-medium">
                            {form.password.length < 6
                              ? "Weak (min 6 chars)"
                              : form.password.length < 10 || !/[0-9!@#$%^&*]/.test(form.password)
                                ? "Medium"
                                : "Strong"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT COLUMN: PROVIDER DETAILS */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
                      2. Service Details
                    </p>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Service Type
                      </label>
                      <select
                        name="serviceType"
                        value={form.serviceType}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#0F766E] focus:border-transparent outline-none font-semibold text-[#172033]"
                      >
                        {SERVICE_TYPES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.icon} {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Experience (Years)
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          name="experience"
                          min="0"
                          value={form.experience}
                          onChange={handleChange}
                          placeholder="e.g. 5"
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#0F766E] focus:border-transparent outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Hourly Rate (₹)
                      </label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          name="pricePerHour"
                          min="0"
                          value={form.pricePerHour}
                          onChange={handleChange}
                          placeholder="e.g. 500"
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#0F766E] focus:border-transparent outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Primary Service Area
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          name="area"
                          value={form.area}
                          onChange={handleChange}
                          placeholder="e.g. Koramangala, Indiranagar"
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#0F766E] focus:border-transparent outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* FULL WIDTH SECTION: ABOUT & SUBMIT */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    About Your Experience & Services
                  </label>
                  <textarea
                    name="description"
                    rows={2}
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Brief description of your expertise and specialization..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#0F766E] focus:border-transparent outline-none resize-none"
                  />
                </div>
              </div>
            ) : (
              /* CUSTOMER REGISTRATION FORM (COMPACT) */
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        required
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#0F766E] focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="98765 43210"
                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#0F766E] focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#0F766E] focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Min 6 characters"
                      className="w-full pl-9 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#0F766E] focus:border-transparent outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {form.password.length > 0 && (
                    <div className="mt-1.5 space-y-1">
                      <div className="flex gap-1 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            form.password.length < 6
                              ? "w-1/3 bg-red-500"
                              : form.password.length < 10 || !/[0-9!@#$%^&*]/.test(form.password)
                                ? "w-2/3 bg-amber-500"
                                : "w-full bg-emerald-500"
                          }`}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-gray-500">
                        <span>Password Strength:</span>
                        <span className="font-semibold capitalize">
                          {form.password.length < 6
                            ? "Too Weak (min 6 chars)"
                            : form.password.length < 10 || !/[0-9!@#$%^&*]/.test(form.password)
                              ? "Medium"
                              : "Strong"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#0F766E] hover:bg-[#0B5F59] text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-4 text-xs text-slate-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#0F766E] font-medium hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
