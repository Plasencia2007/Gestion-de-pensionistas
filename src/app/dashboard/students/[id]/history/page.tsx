"use client";

import { use, useState, useEffect, useCallback } from "react";
import { Student, MealLog } from "@/src/types";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function StudentHistoryPage({ params }: PageProps) {
  const { id } = use(params);
  const [student, setStudent] = useState<Student | null>(null);
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [activeTab, setActiveTab] = useState<
    "Todos" | "Desayuno" | "Almuerzo" | "Cena"
  >("Todos");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const fetchStudentData = useCallback(async () => {
    // 1. Fetch Student Profile
    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .select("*")
      .eq("id", id)
      .single();

    if (studentError) {
      console.error("Error fetching student:", studentError);
    } else if (studentData) {
      setStudent({
        id: studentData.id,
        firstName: studentData.first_name,
        lastName: studentData.last_name,
        code: studentData.code,
        dni: studentData.dni,
        email: studentData.email,
        phone: studentData.phone,
        address: studentData.address,
        birthDate: studentData.birth_date,
        joinedDate: studentData.joined_date,
        notes: studentData.notes,
        active: studentData.active,
        avatar: studentData.avatar_url,
      });
    }

    // 2. Fetch Meal Logs
    const { data: logsData, error: logsError } = await supabase
      .from("meal_logs")
      .select("*")
      .eq("student_id", id)
      .order("timestamp", { ascending: false });

    if (logsError) {
      console.error("Error fetching logs:", logsError);
    } else {
      const mappedLogs: MealLog[] = (logsData || []).map((log: any) => ({
        id: log.id,
        studentId: log.student_id,
        mealType: log.meal_type,
        timestamp: log.timestamp,
        status: log.status,
        hasExtra: log.has_extra,
        extraNotes: log.extra_notes,
      }));
      setLogs(mappedLogs);
    }
  }, [id]);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1ABB9C]"></div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
          Cargando expediente...
        </p>
      </div>
    );
  }

  const handleToggleStatus = async (logId: string, currentStatus: string) => {
    const newStatus = currentStatus === "Anulado" ? "Verificado" : "Anulado";

    const { error } = await supabase
      .from("meal_logs")
      .update({ status: newStatus })
      .eq("id", logId);

    if (error) {
      console.error("Error updating status:", error);
      alert("Error al actualizar el estado");
    } else {
      setLogs((prev) =>
        prev.map((log) =>
          log.id === logId ? { ...log, status: newStatus as any } : log,
        ),
      );
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (
      !window.confirm(
        "¿Estás seguro de que deseas eliminar este registro permanentemente?",
      )
    )
      return;

    const { error } = await supabase.from("meal_logs").delete().eq("id", logId);

    if (error) {
      console.error("Error deleting log:", error);
      alert("Error al eliminar el registro");
    } else {
      setLogs((prev) => prev.filter((log) => log.id !== logId));
    }
  };

  const filteredLogs = logs
    .filter((log) => {
      const matchesStudent = log.studentId === student.id;
      const matchesTab = activeTab === "Todos" || log.mealType === activeTab;

      let matchesDate = true;
      if (startDate || endDate) {
        const logDate = new Date(log.timestamp);
        logDate.setHours(0, 0, 0, 0);

        if (startDate) {
          const [y, m, d] = startDate.split("-").map(Number);
          const start = new Date(y, m - 1, d);
          if (logDate < start) matchesDate = false;
        }
        if (endDate) {
          const [y, m, d] = endDate.split("-").map(Number);
          const end = new Date(y, m - 1, d);
          if (logDate > end) matchesDate = false;
        }
      }

      return matchesStudent && matchesTab && matchesDate;
    })
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

  return (
    <div className="space-y-8 animate-in fade-in slide-up duration-500 pb-20">
      {/* Header - More Professional Admin Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard/students"
            className="w-12 h-12 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 hover:text-[#1ABB9C] hover:border-[#1ABB9C] transition-all"
          >
            <ArrowLeftIcon />
          </Link>
          <div>
            <p className="text-[10px] font-black text-[#1ABB9C] uppercase tracking-[0.3em] mb-1">
              Panel de Auditoría
            </p>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              {student.firstName.split(" ")[0]} {student.lastName.split(" ")[0]}
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-slate-500 text-xs font-medium">
                Estudiante ID:{" "}
                <span className="text-slate-800 font-bold">{student.code}</span>
              </p>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
              <p className="text-slate-500 text-xs font-medium">
                DNI:{" "}
                <span className="text-slate-800 font-bold">{student.dni}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-6 py-4 bg-[#1ABB9C] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#16a085] transition-all shadow-lg shadow-[#1ABB9C]/20 flex items-center justify-center gap-2">
            <DownloadIcon /> Exportar PDF
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Superior Actions Bar */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[#1ABB9C] rounded-full"></div>
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
              Panel de Filtrado
            </h4>
          </div>

          <div className="flex items-center gap-4">
            <div className="group flex items-center gap-4 bg-white border border-slate-200 px-5 py-2.5 rounded-2xl shadow-sm hover:border-[#1ABB9C]/40 hover:shadow-md transition-all focus-within:ring-4 focus-within:ring-[#1ABB9C]/5">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-[#1ABB9C] uppercase tracking-widest mb-0.5">
                  Desde
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none w-32 cursor-pointer"
                />
              </div>
              <div className="w-px h-6 bg-slate-100"></div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-[#1ABB9C] uppercase tracking-widest mb-0.5">
                  Hasta
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none w-32 cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setActiveTab("Todos");
              }}
              className="h-12 w-12 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-rose-500 hover:border-rose-200 hover:shadow-lg transition-all group shadow-sm active:scale-95"
              title="Limpiar filtros"
            >
              <FilterIcon
                size={18}
                className="transition-transform group-hover:rotate-180 duration-500"
              />
            </button>
          </div>
        </div>

        {/* Audit Log Display */}
        <div className="w-full">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col min-h-[600px]">
            <div className="p-5 px-8 border-b border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-6 bg-slate-50/[0.3]">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-[#1ABB9C]/10 rounded-2xl border border-[#1ABB9C]/20 shadow-[0_0_15px_rgba(26,187,156,0.1)]">
                  <HistoryIcon size={18} className="text-[#1ABB9C]" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black text-[#2A3F54] uppercase tracking-widest leading-none">
                    Historial
                  </h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Consumo Diario
                  </p>
                </div>
              </div>

              {/* Integrated Meal Filters */}
              <div className="flex items-center gap-1.5 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50 shadow-inner">
                {(["Todos", "Desayuno", "Almuerzo", "Cena"] as const).map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-5 py-2 text-[9px] font-black uppercase tracking-widest rounded-[1rem] transition-all flex items-center gap-3 ${
                        activeTab === tab
                          ? "bg-[#1ABB9C] text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] scale-[1.02]"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {tab}
                      <span
                        className={`text-[8px] flex items-center justify-center min-w-[18px] h-[18px] rounded-full font-bold transition-colors ${
                          activeTab === tab
                            ? "bg-white text-[#1ABB9C] shadow-sm shadow-[#1ABB9C]/20"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {
                          logs.filter(
                            (l) =>
                              l.studentId === student.id &&
                              (tab === "Todos" || l.mealType === tab),
                          ).length
                        }
                      </span>
                    </button>
                  ),
                )}
              </div>

              <div className="hidden xl:block">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1ABB9C]"></div>
                  <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest">
                    <span className="text-[#1ABB9C]">
                      {filteredLogs.length}
                    </span>{" "}
                    Registros
                  </p>
                </div>
              </div>
            </div>

            <div className="p-0 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Fecha / Día
                    </th>
                    <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Servicio Marcado
                    </th>
                    <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Estado Auditoría
                    </th>
                    <th className="px-8 py-5 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className={`group transition-all ${log.status === "Anulado" ? "bg-slate-50/50 grayscale opacity-60" : "hover:bg-[#1ABB9C]/[0.03]"}`}
                      >
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div
                            className={`flex items-center gap-5 transition-all ${log.status === "Anulado" ? "line-through decoration-slate-300" : ""}`}
                          >
                            <div
                              className={`w-12 h-12 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center shadow-sm group-hover:scale-105 transition-transform ${log.status === "Anulado" ? "border-dashed" : ""}`}
                            >
                              <p className="text-[14px] font-black text-slate-800 leading-none">
                                {new Date(log.timestamp).getDate()}
                              </p>
                              <p className="text-[8px] font-black text-[#1ABB9C] uppercase">
                                {new Date(log.timestamp).toLocaleDateString(
                                  "es-ES",
                                  { month: "short" },
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-700">
                                {new Date(log.timestamp)
                                  .toLocaleDateString("es-ES", {
                                    weekday: "long",
                                  })
                                  .toUpperCase()}
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                {new Date(log.timestamp).toLocaleTimeString(
                                  "es-ES",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div
                            className={`flex items-center gap-4 transition-all ${log.status === "Anulado" ? "opacity-50 grayscale" : ""}`}
                          >
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                                log.mealType === "Desayuno"
                                  ? "bg-amber-50 text-amber-500 border border-amber-100/50"
                                  : log.mealType === "Almuerzo"
                                    ? "bg-emerald-50 text-emerald-500 border border-emerald-100/50"
                                    : "bg-indigo-50 text-indigo-500 border border-indigo-100/50"
                              }`}
                            >
                              <ClockIcon
                                size={18}
                                className="transition-transform group-hover:scale-110"
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-sm font-black text-slate-700 transition-all ${log.status === "Anulado" ? "line-through text-slate-400" : "group-hover:text-[#1ABB9C]"}`}
                                >
                                  {log.mealType}
                                </span>
                                {log.hasExtra && (
                                  <span className="text-[7px] font-black text-white bg-rose-500 px-1.5 py-0.5 rounded-md uppercase tracking-widest animate-pulse">
                                    Extra
                                  </span>
                                )}
                              </div>
                              {log.hasExtra && log.extraNotes ? (
                                <p
                                  className="text-[9px] font-medium text-slate-400 italic mt-0.5 max-w-[150px] truncate"
                                  title={log.extraNotes}
                                >
                                  "{log.extraNotes}"
                                </p>
                              ) : (
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 block">
                                  Kiosko Central
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {log.status === "Anulado" ? (
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50/50 text-rose-500 text-[8px] font-black uppercase tracking-widest rounded-xl border border-rose-100/30">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.4)]"></div>
                                Anulado
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest rounded-xl border border-emerald-100/50">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                                Verificado
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                handleToggleStatus(log.id, log.status)
                              }
                              className={`px-5 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border ${
                                log.status === "Anulado"
                                  ? "bg-[#1ABB9C] text-white border-transparent hover:bg-[#16a085] shadow-lg shadow-[#1ABB9C]/20"
                                  : "bg-white text-slate-400 border-slate-200 hover:text-[#1ABB9C] hover:border-[#1ABB9C]/30 hover:bg-[#1ABB9C]/5"
                              }`}
                            >
                              {log.status === "Anulado"
                                ? "Restaurar"
                                : "Anular"}
                            </button>
                            <button
                              onClick={() => handleDeleteLog(log.id)}
                              className="h-8 w-8 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all group shadow-sm"
                              title="Eliminar registro"
                            >
                              <TrashIcon
                                size={14}
                                className="group-hover:scale-110 transition-transform"
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-24 text-center">
                        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
                          <div className="w-24 h-24 bg-slate-50/50 rounded-[2.5rem] flex items-center justify-center mb-8 text-slate-200 border-2 border-dashed border-slate-200/50 relative">
                            <HistoryIcon size={32} className="opacity-40" />
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#1ABB9C] shadow-sm border border-slate-100">
                              <FilterIcon size={14} />
                            </div>
                          </div>
                          <h5 className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">
                            Sin registros encontrados
                          </h5>
                          <p className="text-slate-300 text-[9px] mt-2 font-medium italic max-w-xs leading-relaxed">
                            No hay actividad para los filtros seleccionados.
                            Intente ajustar el rango de fechas en el panel
                            superior.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-auto p-8 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <p>© 2026 Admin Panel - Sistema de Gestión de Pensionistas</p>
              <div className="flex gap-4">
                <button className="hover:text-[#1ABB9C] transition-colors">
                  Soporte Técnico
                </button>
                <button className="hover:text-[#1ABB9C] transition-colors">
                  Preguntas Frecuentes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Internal SVG Icons
const ArrowLeftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const HistoryIcon = ({
  size = 16,
  className = "",
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </svg>
);

const ClockIcon = ({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const FilterIcon = ({
  size = 18,
  className = "",
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 21h18" />
    <path d="M6 8v10" />
    <path d="M10 13v5" />
    <path d="M14 6v12" />
    <path d="M18 11v7" />
  </svg>
);

const WalletIcon = ({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const TrendingIcon = ({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

const DownloadIcon = ({ className = "" }: { className?: string }) => (
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
    className={className}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const TrashIcon = ({
  size = 18,
  className = "",
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);
