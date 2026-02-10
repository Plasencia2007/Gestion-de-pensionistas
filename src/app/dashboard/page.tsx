"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    activeStudents: 0,
    consumosHoy: 0,
    ingresosMes: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          1,
        ).toISOString();
        const endOfMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0,
        ).toISOString();

        // 1. Active Students
        const { count: activeCount } = await supabase
          .from("students")
          .select("*", { count: "exact", head: true })
          .eq("active", true);

        // 2. Consumos Hoy
        const { count: todayCount } = await supabase
          .from("meal_logs")
          .select("*", { count: "exact", head: true })
          .gte("timestamp", today.toISOString());

        // 3. Ingresos Mes (Pagados)
        // Fetch paid logs
        const { data: paidLogs } = await supabase
          .from("meal_logs")
          .select("price")
          .eq("is_paid", true)
          .gte("payment_date", startOfMonth)
          .lte("payment_date", endOfMonth);

        // Fetch paid extras
        const { data: paidExtras } = await supabase
          .from("student_extras")
          .select("price")
          .eq("is_paid", true)
          .gte("payment_date", startOfMonth)
          .lte("payment_date", endOfMonth);

        const incomeLogs =
          paidLogs?.reduce((sum, log) => sum + (log.price || 0), 0) || 0;
        const incomeExtras =
          paidExtras?.reduce((sum, extra) => sum + (extra.price || 0), 0) || 0;

        // 4. Recent Activity
        const { data: activity } = await supabase
          .from("meal_logs")
          .select(
            `
            id,
            meal_type,
            timestamp,
            students (
              first_name,
              last_name
            )
          `,
          )
          .order("timestamp", { ascending: false })
          .limit(5);

        setStats({
          activeStudents: activeCount || 0,
          consumosHoy: todayCount || 0,
          ingresosMes: incomeLogs + incomeExtras,
        });

        if (activity) {
          setRecentActivity(
            activity.map((log: any) => ({
              id: log.id,
              name: log.students
                ? `${log.students.first_name} ${log.students.last_name}`
                : "Desconocido",
              service: log.meal_type,
              time: new Date(log.timestamp).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            })),
          );
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-up">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Panel de Control
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Resumen general del estado de los pensionistas hoy.
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/dashboard/students"
            className="bg-[#1ABB9C] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#16a085] transition-colors shadow-sm shadow-[#1ABB9C]/20"
          >
            + Nuevo Registro
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Estudiantes Activos"
          value={loading ? "..." : stats.activeStudents}
          icon={<UsersIcon />}
          color="blue"
          trend="Registrados"
        />
        <StatCard
          title="Consumos Hoy"
          value={loading ? "..." : stats.consumosHoy}
          icon={<UtensilsIcon />}
          color="emerald"
          trend="Servicios"
        />
        <StatCard
          title="Ingresos Mes"
          value={loading ? "..." : `S/ ${stats.ingresosMes.toFixed(2)}`}
          icon={<CreditCardIcon />}
          color="amber"
          trend="Cobrado"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-fit">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-base font-bold text-slate-800">
              Últimos Consumos
            </h2>
            <Link
              href="/dashboard/attendance"
              className="text-[#1ABB9C] font-semibold text-xs hover:underline uppercase tracking-wider"
            >
              Ver Historial Completo
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left bg-slate-50/30">
                  <th className="px-6 py-3 font-semibold text-slate-400 text-[11px] uppercase tracking-widest">
                    Estudiante
                  </th>
                  <th className="px-6 py-3 font-semibold text-slate-400 text-[11px] uppercase tracking-widest">
                    Servicio
                  </th>
                  <th className="px-6 py-3 font-semibold text-slate-400 text-[11px] uppercase tracking-widest text-right">
                    Hora
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center">
                      <div className="inline-block w-6 h-6 border-2 border-[#1ABB9C] border-t-transparent rounded-full animate-spin"></div>
                    </td>
                  </tr>
                ) : recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <ActivityRow
                      key={activity.id}
                      name={activity.name}
                      service={activity.service}
                      time={activity.time}
                    />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-8 text-center text-slate-400 text-sm"
                    >
                      No hay actividad reciente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-[#2A3F54] rounded-xl p-6 text-white card-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#1ABB9C]/10 rounded-full -mr-16 -mt-16 blur-3xl" />
            <h3 className="text-lg font-bold mb-2 relative z-10">
              Acción Rápida
            </h3>
            <p className="text-slate-400 text-sm mb-6 relative z-10">
              Gestione recargas y nuevos planes para sus pensionistas de forma
              inmediata.
            </p>
            <div className="space-y-3 relative z-10">
              <Link
                href="/dashboard/students"
                className="block text-center w-full bg-[#1ABB9C] hover:bg-[#16a085] text-white font-bold py-2.5 rounded-lg transition-all shadow-lg shadow-[#1ABB9C]/10 text-sm"
              >
                Gestionar Estudiantes
              </Link>
              <a
                href="/kiosk"
                className="flex items-center justify-center w-full bg-white/10 hover:bg-white hover:text-[#2A3F54] text-white border border-white/20 font-bold py-2.5 rounded-lg transition-all text-sm"
              >
                Acceso Estudiantes (Kiosko)
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}) {
  const colors: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50",
    emerald: "text-emerald-600 bg-emerald-50",
    rose: "text-rose-600 bg-rose-50",
    amber: "text-amber-600 bg-amber-50",
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className={`p-2.5 rounded-lg ${colors[color]}`}>{icon}</div>
        {trend && (
          <span
            className={`text-[10px] font-bold px-2 py-1 rounded-full ${trend.includes("+") ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-500"}`}
          >
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </p>
        <p className="text-2xl font-extrabold text-slate-800 mt-1">{value}</p>
      </div>
    </div>
  );
}

function ActivityRow({
  name,
  service,
  time,
}: {
  name: string;
  service: string;
  time: string;
}) {
  return (
    <tr className="group hover:bg-slate-50/50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-500 text-[10px] border border-slate-200">
            {name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <span className="font-semibold text-slate-700 text-sm">{name}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
          {service}
        </span>
      </td>
      <td className="px-6 py-4 text-right text-slate-400 text-xs font-medium">
        {time}
      </td>
    </tr>
  );
}

// Simple SVG Icons
const UsersIcon = () => (
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
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const UtensilsIcon = () => (
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
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <path d="M7 2v20" />
    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
  </svg>
);

const AlertIcon = () => (
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
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const CreditCardIcon = () => (
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
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);
