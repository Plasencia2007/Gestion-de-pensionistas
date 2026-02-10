"use client";

import { useState } from "react";
import Sidebar from "@/src/components/dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F7F7F7]">
      {/* Top Header - Full Width with Rich Navy Theme */}
      <header className="h-14 bg-[#2A3F54] border-b border-[#3E4F5F]/50 flex items-center justify-between px-4 sticky top-0 z-30 shadow-lg shadow-black/20">
        <div className="flex items-center space-x-4">
          {/* Brand Logo Section */}
          <div
            className={`flex items-center transition-all duration-300 ${isCollapsed ? "w-[70px] justify-center" : "w-[214px]"}`}
          >
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center mr-3 shadow-lg shadow-black/10 shrink-0 overflow-hidden">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-full h-full object-cover"
              />
            </div>
            {!isCollapsed && (
              <h2 className="text-sm font-extrabold text-white tracking-tight whitespace-nowrap overflow-hidden">
                RIQUITO
              </h2>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-[#ADB2B7] hover:text-white transition-colors p-2 hover:bg-[#3E4F5F]/50 rounded-lg group"
            title={isCollapsed ? "Abrir menú" : "Cerrar menú"}
          >
            <div className="group-active:scale-90 transition-transform">
              <MenuIcon />
            </div>
          </button>

          <div className="relative hidden md:block pl-2">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#ADB2B7]">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Buscar..."
              className="bg-[#3E4F5F]/40 border border-[#3E4F5F]/60 text-white placeholder-[#ADB2B7] rounded-lg pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1ABB9C]/30 focus:border-[#1ABB9C] w-64 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="relative">
            <div
              onClick={toggleProfile}
              className="flex items-center space-x-3 pl-4 border-l border-[#3E4F5F]/50 group cursor-pointer hover:opacity-100 transition-all py-1"
            >
              <div className="flex flex-col items-end hidden lg:flex">
                <span className="text-xs font-bold text-white leading-tight">
                  RIQUITO
                </span>
                <span className="text-[10px] text-[#ADB2B7] font-medium leading-tight">
                  Administrador
                </span>
              </div>
              <div className="w-9 h-9 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm relative group-hover:border-[#1ABB9C] transition-colors">
                <img
                  src="/logo.png"
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <span
                className={`text-[#ADB2B7] group-hover:text-white transition-all transform hidden sm:block ${isProfileOpen ? "rotate-180" : ""}`}
              >
                <ChevronDownIcon />
              </span>
            </div>

            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsProfileOpen(false)}
                ></div>
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 py-2 z-50 animate-in slide-up duration-300">
                  <div className="px-4 py-3 border-b border-slate-50 mb-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Cuenta de Usuario
                    </p>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">
                      admin@pensionadmin.com
                    </p>
                  </div>

                  <button className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-600 hover:bg-[#1ABB9C]/5 hover:text-[#1ABB9C] transition-all flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                      <UserIconSmall />
                    </div>
                    Mi Perfil
                  </button>
                  <button className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-600 hover:bg-[#1ABB9C]/5 hover:text-[#1ABB9C] transition-all flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                      <SettingsIconSmall />
                    </div>
                    Configuración
                  </button>
                  <button className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-600 hover:bg-[#1ABB9C]/5 hover:text-[#1ABB9C] transition-all flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                      <ShieldIcon />
                    </div>
                    Seguridad
                  </button>

                  <div className="h-px bg-slate-100 my-2 mx-2"></div>

                  <button className="w-full px-4 py-2.5 text-left text-xs font-black text-rose-500 hover:bg-rose-50 transition-all flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-rose-100/50 flex items-center justify-center text-rose-500">
                      <LogoutIconSmall />
                    </div>
                    Cerrar Sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Below Header */}
        <Sidebar collapsed={isCollapsed} />

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#F8FAF9]">
          <div className="max-w-[1400px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

function NavIconButton({
  icon,
  badge,
  color,
  dark,
  onClick,
}: {
  icon: React.ReactNode;
  badge?: string;
  color: string;
  dark?: boolean;
  onClick?: () => void;
}) {
  const badgeColors: Record<string, string> = {
    emerald: "bg-[#1ABB9C]",
    rose: "bg-rose-500",
  };

  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg transition-all relative ${
        dark
          ? "text-[#ADB2B7] hover:text-white hover:bg-[#3E4F5F]/50"
          : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
      }`}
    >
      {icon}
      {badge && (
        <span
          className={`absolute top-1.5 right-1.5 ${badgeColors[color]} text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 ${dark ? "border-[#2A3F54]" : "border-white"}`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function NotificationItem({
  title,
  desc,
  time,
  icon,
  color,
}: {
  title: string;
  desc: string;
  time: string;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    emerald: "bg-[#1ABB9C]/10 text-[#1ABB9C]",
    rose: "bg-rose-50/50 text-rose-500",
    blue: "bg-blue-50 text-blue-500",
    amber: "bg-amber-50 text-amber-500",
    slate: "bg-slate-100 text-slate-500",
    orange: "bg-orange-50 text-orange-500",
  };

  return (
    <button className="w-full px-5 py-4 text-left hover:bg-slate-50 transition-all border-b border-slate-50 flex gap-4 group">
      <div
        className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${colorClasses[color]} group-hover:scale-110 transition-transform`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-0.5">
          <h5 className="text-xs font-black text-slate-800 tracking-tight">
            {title}
          </h5>
          <span className="text-[9px] font-bold text-slate-400">{time}</span>
        </div>
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed truncate">
          {desc}
        </p>
      </div>
    </button>
  );
}

const MenuIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const MailIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.53 5.5a2.41 2.41 0 0 1-2.94 0L2 7" />
  </svg>
);

const BellIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const UserIconSmall = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SettingsIconSmall = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ShieldIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const LogoutIconSmall = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);
const ShieldIconSmall = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const UsersIconSmall = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CalendarIconSmall = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);
