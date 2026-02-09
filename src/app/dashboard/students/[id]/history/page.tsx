"use client";

import { use, useState, useEffect } from "react";
import { MOCK_STUDENTS, MOCK_MEAL_LOGS } from "@/src/data/mock";
import { Student, MealLog } from "@/src/types";
import Link from "next/link";

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

  useEffect(() => {
    const found = MOCK_STUDENTS.find((s) => s.id === id);
    if (found) setStudent(found);
    // Initialize logs with mock data
    setLogs(MOCK_MEAL_LOGS);
  }, [id]);

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

  const handleToggleStatus = (logId: string) => {
    setLogs((prev) =>
      prev.map((log) => {
        if (log.id === logId) {
          return {
            ...log,
            status: log.status === "Anulado" ? "Verificado" : "Anulado",
          };
        }
        return log;
      }),
    );
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
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (logDate < start) matchesDate = false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(0, 0, 0, 0);
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
              {student.firstName} {student.lastName}
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
          <button className="flex-1 md:flex-none px-6 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-amber-500 hover:text-amber-500 transition-all shadow-sm">
            Histórico de Pagos
          </button>
          <button className="flex-1 md:flex-none px-6 py-4 bg-[#1ABB9C] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#16a085] transition-all shadow-lg shadow-[#1ABB9C]/20 flex items-center justify-center gap-2">
            <DownloadIcon /> Exportar PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters - More compact */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm space-y-8">
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                Filtrar Servicio
              </h4>
              <div className="flex flex-col gap-2">
                {(["Todos", "Desayuno", "Almuerzo", "Cena"] as const).map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`w-full px-5 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all text-left flex items-center justify-between group ${
                        activeTab === tab
                          ? "bg-[#1ABB9C] text-white shadow-md border-transparent"
                          : "bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100"
                      }`}
                    >
                      {tab}
                      <span
                        className={`text-[8px] px-2 py-0.5 rounded-full ${
                          activeTab === tab
                            ? "bg-white/20 text-white"
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
            </div>

            <div className="pt-8 border-t border-slate-100">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                Rango de Fecha
              </h4>
              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute -top-1.5 left-3 px-1.5 bg-white text-[7px] font-black text-[#1ABB9C] uppercase tracking-widest z-10 border border-slate-100 rounded-full">
                    Desde
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-600 outline-none focus:border-[#1ABB9C] transition-all"
                  />
                </div>
                <div className="relative">
                  <span className="absolute -top-1.5 left-3 px-1.5 bg-white text-[7px] font-black text-[#1ABB9C] uppercase tracking-widest z-10 border border-slate-100 rounded-full">
                    Hasta
                  </span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-600 outline-none focus:border-[#1ABB9C] transition-all"
                  />
                </div>
                <button
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setActiveTab("Todos");
                  }}
                  className="w-full py-3 bg-rose-50 text-rose-500 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                >
                  <FilterIcon size={12} /> Limpiar Filtros
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#2A3F54] rounded-[2rem] p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                Observaciones
              </h4>
              <p className="text-[11px] text-slate-300 font-medium leading-relaxed italic">
                {student.notes ||
                  "No hay notas adicionales enviadas para este expediente."}
              </p>
            </div>
          </div>
        </div>

        {/* Audit Log Display */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <HistoryIcon size={18} className="text-[#1ABB9C]" />
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none">
                  Bitácora de Consumo
                </h3>
              </div>
              <p className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                Mostrando{" "}
                <span className="text-[#1ABB9C]">{filteredLogs.length}</span>{" "}
                registros
              </p>
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
                            className={`flex items-center gap-3 ${log.status === "Anulado" ? "opacity-50" : ""}`}
                          >
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                log.mealType === "Desayuno"
                                  ? "bg-amber-100 text-amber-600 shadow-sm shadow-amber-100/50"
                                  : log.mealType === "Almuerzo"
                                    ? "bg-emerald-100 text-emerald-600 shadow-sm shadow-emerald-100/50"
                                    : "bg-indigo-100 text-indigo-600 shadow-sm shadow-indigo-100/50"
                              }`}
                            >
                              <ClockIcon size={16} />
                            </div>
                            <div>
                              <span
                                className={`text-sm font-black text-slate-800 block ${log.status === "Anulado" ? "line-through" : ""}`}
                              >
                                {log.mealType}
                              </span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                Kiosko Principal
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          {log.status === "Anulado" ? (
                            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-rose-50 text-rose-500 text-[9px] font-black uppercase tracking-widest rounded-xl border border-rose-100">
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                              Anulado
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-xl border border-emerald-100">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                              Verificado
                            </div>
                          )}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-3">
                            <p className="hidden xl:block font-mono text-[9px] text-slate-300 font-bold tracking-tighter bg-slate-50 px-2 py-1 rounded border border-slate-100">
                              ID-{log.id}
                            </p>
                            <button
                              onClick={() => handleToggleStatus(log.id)}
                              className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border ${
                                log.status === "Anulado"
                                  ? "bg-emerald-500 text-white border-transparent hover:bg-emerald-600 shadow-lg shadow-emerald-500/10"
                                  : "bg-white text-rose-500 border-rose-100 hover:bg-rose-500 hover:text-white shadow-sm"
                              }`}
                            >
                              {log.status === "Anulado"
                                ? "Restaurar"
                                : "Anular"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-24 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 text-slate-200 border-2 border-dashed border-slate-200">
                            <HistoryIcon size={32} />
                          </div>
                          <h5 className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">
                            No se encontraron registros de auditoría
                          </h5>
                          <p className="text-slate-300 text-[9px] mt-1 font-medium italic">
                            Intente ajustar los filtros de fecha o servicio en
                            el panel lateral.
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

const ClockIcon = ({ size = 20 }: { size?: number }) => (
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
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const FilterIcon = ({ size = 18 }: { size?: number }) => (
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
  >
    <path d="M3 21h18" />
    <path d="M6 8v10" />
    <path d="M10 13v5" />
    <path d="M14 6v12" />
    <path d="M18 11v7" />
  </svg>
);

const WalletIcon = ({ size = 20 }: { size?: number }) => (
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
  >
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const TrendingIcon = ({ size = 20 }: { size?: number }) => (
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
  >
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

const DownloadIcon = () => (
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
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
