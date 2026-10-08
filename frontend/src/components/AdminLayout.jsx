import React from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  LogOut,
  ShieldCheck,
  CalendarDays,
  Tag,
} from "lucide-react";

const AdminLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/admin/customers", label: "Customers", icon: Users },
    { path: "/admin/providers", label: "Providers", icon: Briefcase },
    { path: "/admin/coupons", label: "Coupons", icon: Tag },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#0F2747] text-white shadow-xl flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between md:justify-start gap-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-[#0F766E]" />
            <div>
              <h1 className="text-xl font-black tracking-wider text-white">HomeFix</h1>
              <p className="text-[10px] text-teal-300 font-bold uppercase tracking-wider">Control Center</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible space-x-2 md:space-x-0 md:space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 shrink-0 text-sm font-bold ${
                isActive(item.path)
                  ? "bg-[#0F766E] text-white shadow-md"
                  : "text-slate-300 hover:bg-[#0A1D35] hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 hidden md:block">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-xl bg-[#0F766E] flex items-center justify-center text-white font-black">
              {user?.name?.charAt(0) || "A"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate text-white">{user?.name || "Admin"}</p>
              <p className="text-[11px] text-slate-400 font-semibold">Super Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        <header className="bg-white border-b border-slate-200/80 p-4 sticky top-0 z-10 flex justify-between items-center px-4 sm:px-8 shadow-2xs">
          <h2 className="text-xl font-black text-[#0F2747]">
            {navItems.find((i) => isActive(i.path))?.label || "Overview"}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-slate-500 font-semibold hidden sm:block">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {new Date().toLocaleTimeString("en-US", {
                  timeZone: "Asia/Kolkata",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}{" "}
                IST
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="md:hidden p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>
        <div className="p-4 sm:p-6 lg:p-8 flex-1 w-full max-w-[1920px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
