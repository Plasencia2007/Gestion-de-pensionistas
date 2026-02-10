"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Icons Components
const DashboardIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="7" height="9" x="3" y="3" rx="1" />
    <rect width="7" height="5" x="14" y="3" rx="1" />
    <rect width="7" height="9" x="14" y="12" rx="1" />
    <rect width="7" height="5" x="3" y="16" rx="1" />
  </svg>
);

const UsersIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const PlansIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M7 7h10" />
    <path d="M7 12h10" />
    <path d="M7 17h10" />
  </svg>
);

const ReportsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" x2="8" y1="13" y2="13" />
    <line x1="16" x2="8" y1="17" y2="17" />
    <line x1="10" x2="8" y1="9" y2="9" />
  </svg>
);

const SettingsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const KioskIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 19h16" />
    <path d="M4 15h16" />
    <path d="M4 11h16" />
    <path d="M4 7h16" />
    <rect width="20" height="20" x="2" y="2" rx="2" />
  </svg>
);

const AttendanceIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M3 10h18" />
    <path d="m9 16 2 2 4-4" />
  </svg>
);

const UserIconSmall = () => (
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
    className="opacity-50"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LogoutIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);

const MENU_ITEMS = [
  { label: "Panel de Control", href: "/dashboard", icon: <DashboardIcon /> },
  { label: "Estudiantes", href: "/dashboard/students", icon: <UsersIcon /> },
  {
    label: "Asistencias",
    href: "/dashboard/attendance",
    icon: <AttendanceIcon />,
  },
  {
    label: "Planes",
    href: "/dashboard/wip?feature=Planes",
    icon: <PlansIcon />,
  },
  {
    label: "Reportes",
    href: "/dashboard/wip?feature=Reportes",
    icon: <ReportsIcon />,
  },
  {
    label: "Configuración",
    href: "/dashboard/settings",
    icon: <SettingsIcon />,
  },
  {
    label: "Modo Kiosko",
    href: "/kiosk",
    icon: <KioskIcon />,
  },
];

export default function Sidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();

  return (
    <aside
      className={`
        bg-[#2A3F54] text-[#ECF0F1] flex flex-col h-[calc(100vh-56px)] sticky top-14 overflow-hidden shadow-2xl z-20 transition-all duration-300 ease-in-out
        ${collapsed ? "w-[70px]" : "w-[230px]"}
      `}
    >
      {/* Profile Section - Hidden when collapsed */}
      <div
        className={`
        p-5 flex items-center space-x-3 bg-gradient-to-b from-transparent to-[#1A2B3D]/10 transition-opacity duration-300
        ${collapsed ? "opacity-0 invisible h-0 p-0" : "opacity-100 visible h-auto"}
      `}
      >
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-xl bg-white border border-[#4F5F6F] overflow-hidden shadow-inner">
            <img
              src="/logo.png"
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#1ABB9C] border-2 border-[#2A3F54] rounded-full"></div>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-[#ADB2B7] font-bold uppercase tracking-wider leading-none mb-1">
            Bienvenido,
          </p>
          <p className="text-xs font-bold text-white truncate w-28">RIQUITO</p>
        </div>
      </div>

      {/* Navigation Header - Hidden/Mini when collapsed */}
      <div
        className={`px-5 pt-4 pb-2 transition-all ${collapsed ? "text-center px-0" : ""}`}
      >
        <p
          className={`text-[9px] text-[#5A6F82] font-black uppercase tracking-[0.25em] ${collapsed ? "hidden" : "block"}`}
        >
          Principal
        </p>
        {collapsed && <div className="h-px bg-[#3E4F5F]/40 mx-4 mt-2"></div>}
      </div>

      <nav className="flex-1 px-3 space-y-1 mt-1">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : ""}
              className={`
                flex items-center rounded-lg font-semibold transition-all group relative
                ${collapsed ? "justify-center px-0 py-3" : "px-4 py-2.5 space-x-3"}
                ${
                  isActive
                    ? "bg-[#3E4F5F] text-white shadow-lg shadow-black/10"
                    : "text-[#ADB2B7] hover:bg-[#3E4F5F]/40 hover:text-white"
                }
              `}
            >
              <span
                className={`transition-colors shrink-0 ${isActive ? "text-[#1ABB9C]" : "group-hover:text-[#1ABB9C]"}`}
              >
                {item.icon}
              </span>
              <span
                className={`text-[13px] whitespace-nowrap overflow-hidden transition-all duration-300 ${collapsed ? "w-0 opacity-0 invisible" : "w-auto opacity-100 visible"}`}
              >
                {item.label}
              </span>
              {!collapsed && isActive && (
                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-[#1ABB9C] shadow-[0_0_8px_#1ABB9C]"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div
        className={`p-4 bg-[#1A2B3D]/40 mt-auto transition-all ${collapsed ? "px-2" : ""}`}
      >
        <Link
          href="/"
          className={`
            flex items-center rounded-lg text-[#ADB2B7] hover:text-white hover:bg-rose-500/10 transition-all font-bold group
            ${collapsed ? "justify-center p-3" : "px-4 py-2.5 space-x-3"}
          `}
        >
          <span className="group-hover:text-rose-500 transition-colors shrink-0">
            <LogoutIcon />
          </span>
          <span
            className={`text-[13px] group-hover:text-rose-500 whitespace-nowrap overflow-hidden transition-all duration-300 ${collapsed ? "w-0 opacity-0 invisible" : "w-auto opacity-100 visible"}`}
          >
            Cerrar Sesión
          </span>
        </Link>
      </div>
    </aside>
  );
}
