"use client";

import { useState, useEffect } from "react";
import { MOCK_STUDENTS } from "@/src/data/mock";
import Link from "next/link";
import { Student } from "@/src/types";

// Meal time ranges
const MEAL_SCHEDULE = {
  desayuno: {
    start: 6,
    end: 11,
    label: "Desayuno",
    icon: "light_mode",
    time: "07:00 AM - 10:30 AM",
  },
  almuerzo: {
    start: 12,
    end: 17,
    label: "Almuerzo",
    icon: "lunch_dining",
    time: "12:00 PM - 02:30 PM",
  },
  cena: {
    start: 18,
    end: 22,
    label: "Cena",
    icon: "dark_mode",
    time: "06:00 PM - 08:30 PM",
  },
};

type MealType = keyof typeof MEAL_SCHEDULE;

export default function KioskPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [lastAction, setLastAction] = useState<{
    student: string;
    meal: string;
  } | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [activeMeal, setActiveMeal] = useState<MealType | null>(null);
  const [mounted, setMounted] = useState(false);

  // Update time and determine active meal
  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      const hour = now.getHours();
      let foundMeal: MealType | null = null;

      if (
        hour >= MEAL_SCHEDULE.desayuno.start &&
        hour < MEAL_SCHEDULE.desayuno.end
      )
        foundMeal = "desayuno";
      else if (
        hour >= MEAL_SCHEDULE.almuerzo.start &&
        hour < MEAL_SCHEDULE.almuerzo.end
      )
        foundMeal = "almuerzo";
      else if (
        hour >= MEAL_SCHEDULE.cena.start &&
        hour < MEAL_SCHEDULE.cena.end
      )
        foundMeal = "cena";

      setActiveMeal(foundMeal);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredStudents = MOCK_STUDENTS.filter((s) => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    return (
      s.active &&
      (fullName.includes(searchTerm.toLowerCase()) ||
        s.code.includes(searchTerm))
    );
  });

  const handleRegisterMeal = () => {
    if (!selectedStudent || !activeMeal) return;

    const studentName = `${selectedStudent.firstName} ${selectedStudent.lastName}`;
    const mealLabel = MEAL_SCHEDULE[activeMeal].label;

    setLastAction({
      student: studentName,
      meal: mealLabel,
    });
    setCountdown(3);
    setSelectedStudent(null);
    setSearchTerm("");

    // Countdown logic
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setLastAction(null);
          return 3;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFB] text-slate-800 font-sans flex flex-col relative overflow-hidden">
      {/* Background layer with blur if success */}
      <div
        className={`flex flex-col flex-1 transition-all duration-500 ${lastAction ? "blur-md opacity-20 scale-[0.98] pointer-events-none" : ""}`}
      >
        {/* SaaS Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-3 lg:px-20">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between">
            {/* Left Side: Brand and Breadcrumb */}
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-[#1abc9c] transition-colors font-bold text-sm tracking-wider"
              >
                <ArrowLeftIcon />
                <span className="uppercase tracking-widest whitespace-nowrap">
                  Volver
                </span>
              </Link>

              <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

              <div className="flex items-center gap-3">
                <div className="bg-[#1abc9c] p-1.5 rounded-lg shadow-sm shadow-[#1abc9c]/50 text-white shrink-0">
                  <LogoIconPrimary />
                </div>
                <div className="hidden xs:block">
                  <h1 className="text-lg font-extrabold tracking-tight text-slate-900 uppercase leading-none">
                    PENSION<span className="text-[#1abc9c]">ADMIN</span>
                  </h1>
                  <p className="text-[10px] font-semibold text-slate-400 mt-1 tracking-widest uppercase">
                    Kiosk Pro v3.0
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side Info */}
            <div className="flex items-center gap-8">
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Estado del Sistema
                </span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-sm font-semibold text-[#1abc9c]">
                    Operativo
                  </span>
                </div>
              </div>
              {activeMeal && (
                <div className="bg-emerald-50 border border-emerald-100 px-4 py-1.5 rounded-full">
                  <span className="text-emerald-600 text-xs font-bold tracking-wide uppercase">
                    {MEAL_SCHEDULE[activeMeal].label} ACTIVO
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-6xl mx-auto px-6 py-10 w-full">
          {!selectedStudent ? (
            /* List Interface */
            <div className="w-full flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-700">
              <div className="w-full max-w-2xl mx-auto mb-12">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-[#1abc9c]/60 group-focus-within:text-[#1abc9c]">
                    <SearchIconLarge />
                  </div>
                  <input
                    className="block w-full pl-16 pr-6 py-6 bg-white border-0 rounded-2xl shadow-xl shadow-[#1abc9c]/5 ring-1 ring-[#1abc9c]/10 focus:ring-4 focus:ring-[#1abc9c]/20 transition-all text-xl font-medium placeholder:text-slate-400"
                    placeholder="Busca por nombre o escanea ID..."
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-200">
                        <th className="px-8 py-5 text-left font-semibold">
                          Estudiante
                        </th>
                        <th className="px-8 py-5 text-left font-semibold">
                          Matrícula
                        </th>
                        <th className="px-8 py-5 text-left font-semibold">
                          Plan
                        </th>
                        <th className="px-8 py-5 text-right font-semibold">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <tr
                            key={student.id}
                            onClick={() => setSelectedStudent(student)}
                            className={`cursor-pointer transition-all hover:bg-slate-50`}
                          >
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-[#1abc9c]/10 flex items-center justify-center text-[#1abc9c] font-bold text-lg border border-[#1abc9c]/20">
                                  {student.firstName[0]}
                                  {student.lastName[0]}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 text-base">
                                    {student.firstName} {student.lastName}
                                  </div>
                                  <div className="text-xs text-slate-500 font-medium tracking-tight">
                                    Activo ahora
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5 font-mono text-sm font-semibold text-[#1abc9c]">
                              {student.code}
                            </td>
                            <td className="px-8 py-5">
                              <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold uppercase">
                                Pensionista G-1
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right text-slate-300">
                              <CheckIconCircle size={24} />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-8 py-20 text-center">
                            <p className="text-slate-300 font-bold uppercase tracking-[0.3em] text-xs">
                              Sin resultados
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* Profile Detail View */
            <div className="animate-in fade-in transition-all duration-300 max-w-5xl mx-auto">
              {/* Student Profile Header */}
              <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-[#1abc9c] flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-[#1abc9c]/20 overflow-hidden">
                      {selectedStudent.firstName[0]}
                      {selectedStudent.lastName[0]}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-md border-2 border-slate-50">
                      <VerifiedIcon />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold text-slate-800 mb-0.5 leading-tight">
                      {selectedStudent.firstName} {selectedStudent.lastName}
                    </h1>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                        <BadgeIcon /> {selectedStudent.code}
                      </span>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wider">
                        Pensionista G-1
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right md:block hidden">
                  <h2 className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-0.5">
                    Registro Automático
                  </h2>
                  <div className="flex items-center justify-end gap-2 text-sm font-bold text-slate-500">
                    <CalendarTodayIcon />
                    <span>
                      {currentTime.toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Meal Services Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MealCard
                  type="desayuno"
                  isActive={activeMeal === "desayuno"}
                  isDone={
                    activeMeal !== "desayuno" &&
                    currentTime.getHours() >= MEAL_SCHEDULE.desayuno.end
                  }
                  onMark={handleRegisterMeal}
                />
                <MealCard
                  type="almuerzo"
                  isActive={activeMeal === "almuerzo"}
                  isDone={
                    activeMeal !== "almuerzo" &&
                    currentTime.getHours() >= MEAL_SCHEDULE.almuerzo.end
                  }
                  onMark={handleRegisterMeal}
                />
                <MealCard
                  type="cena"
                  isActive={activeMeal === "cena"}
                  isDone={
                    activeMeal !== "cena" &&
                    currentTime.getHours() >= MEAL_SCHEDULE.cena.end
                  }
                  onMark={handleRegisterMeal}
                />
              </div>

              {/* Attendance Actions Footer */}
              <div className="mt-6 bg-white border border-slate-100 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Acciones de Registro
                </p>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 font-bold text-[9px] transition-all uppercase tracking-widest">
                    Log
                  </button>
                  <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-[#1abc9c] hover:border-[#1abc9c] hover:bg-[#1abc9c]/5 font-bold text-[9px] transition-all uppercase tracking-widest flex items-center gap-1.5">
                    <PrintIcon /> Voucher
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Profile Selection Bottom Bar */}
        {selectedStudent && (
          <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 px-8 py-4 flex items-center justify-between z-40 lg:px-24 shadow-[0_-15px_30px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-100 shrink-0 shadow-sm">
                <UserIconSmall />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                  Terminal Activa
                </p>
                <p className="text-sm font-black text-slate-700 tracking-tight">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-6 py-2.5 rounded-xl text-slate-500 font-bold hover:text-slate-700 hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px]"
              >
                Cerrar
              </button>
              <button
                onClick={handleRegisterMeal}
                disabled={!activeMeal}
                className="px-8 py-3 bg-[#1abc9c] text-white rounded-xl font-black shadow-lg shadow-[#1abc9c]/20 hover:bg-emerald-600 transition-all uppercase tracking-widest text-xs flex items-center gap-2 disabled:bg-slate-200 disabled:shadow-none"
              >
                <CheckIconSmallNav />
                Confirmar {activeMeal && MEAL_SCHEDULE[activeMeal].label}
              </button>
            </div>
          </div>
        )}

        {/* Background layer closing tag */}
      </div>

      {/* Success Modal Overlay */}
      {lastAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d1b19]/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-[540px] bg-white rounded-3xl shadow-2xl border-t-[10px] border-[#13ecc8] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-500">
            <div className="flex flex-col items-center justify-center p-10 text-center">
              {/* Success Icon */}
              <div className="mb-6 p-5 rounded-full bg-[#13ecc8]/10 text-[#13ecc8] animate-bounce">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="80"
                  height="80"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h1 className="text-[#0d1b19] text-3xl font-extrabold leading-tight tracking-tight mb-3 uppercase">
                ¡Registro Confirmado!
              </h1>
              <p className="text-slate-500 text-lg font-medium mb-10">
                Tu{" "}
                <span className="text-[#13ecc8] font-bold">
                  {lastAction.meal}
                </span>{" "}
                ha sido registrado con éxito.
              </p>
              <div className="bg-slate-50 w-full py-5 px-6 rounded-2xl border border-slate-100 shadow-inner">
                <p className="text-[#13ecc8] text-xl font-black italic">
                  Buen provecho,{" "}
                  <span className="text-[#0d1b19] not-italic font-extrabold">
                    {lastAction.student}
                  </span>
                </p>
              </div>
            </div>

            {/* Auto-dismissal Section */}
            <div className="bg-white px-10 pb-10 mt-auto">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-[10px] font-bold flex items-center gap-2 uppercase tracking-widest">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Regresando en{" "}
                  <span className="text-slate-700 font-black">
                    {countdown}s
                  </span>
                </span>
                <span className="text-slate-300 text-[9px] font-black uppercase tracking-[0.3em]">
                  Auto-Reset
                </span>
              </div>
              {/* Progress Bar Container */}
              <div className="w-full h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                <div
                  className="h-full bg-[#13ecc8] rounded-full transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(19,236,200,0.5)]"
                  style={{ width: `${(countdown / 3) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-50/50 py-4 text-center border-t border-slate-100">
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">
                Terminal de Registro #024 • Gestión de Pensionistas
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MealCard({
  type,
  isActive,
  isDone,
  onMark,
}: {
  type: MealType;
  isActive: boolean;
  isDone: boolean;
  onMark: () => void;
}) {
  const schedule = MEAL_SCHEDULE[type];

  if (isActive) {
    return (
      <div className="bg-white border-2 border-[#1abc9c] rounded-2xl p-5 flex flex-col items-center shadow-[0_5px_15px_-5px_rgba(26,188,156,0.2)] relative z-10 transition-all hover:translate-y-[-2px]">
        <div className="absolute -top-3 bg-[#1abc9c] text-white text-[9px] font-black px-3 py-1 rounded-full tracking-widest uppercase">
          Activo
        </div>
        <div className="w-12 h-12 rounded-xl bg-[#1abc9c]/10 flex items-center justify-center text-[#1abc9c] mb-3">
          <MealIcon type={type} />
        </div>
        <h3 className="text-base font-black text-slate-800 mb-1 uppercase tracking-tight">
          {schedule.label}
        </h3>
        <p className="text-[10px] font-bold text-[#1abc9c] mb-4 uppercase tracking-wider">
          {schedule.time}
        </p>
        <div className="w-full">
          <button
            onClick={onMark}
            className="w-full bg-[#1abc9c] hover:bg-emerald-600 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md shadow-[#1abc9c]/20 group"
          >
            <CheckIconCircle
              size={18}
              className="transition-transform group-hover:scale-110"
            />
            <span className="tracking-tight text-sm uppercase">
              Marcar ahora
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white border border-slate-100 rounded-2xl p-5 flex flex-col items-center transition-all ${isDone ? "opacity-60 grayscale-[0.5]" : "opacity-60"}`}
    >
      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 mb-3 border border-slate-50">
        <MealIcon type={type} inactive />
      </div>
      <h3 className="text-sm font-bold text-slate-600 mb-0.5 uppercase tracking-tight">
        {schedule.label}
      </h3>
      <p className="text-[9px] font-medium text-slate-400 mb-4 uppercase tracking-widest">
        {schedule.time}
      </p>
      <div className="w-full">
        <div className="flex items-center gap-2 text-slate-400 bg-slate-50 px-3 py-2 rounded-lg w-full justify-center border border-slate-100">
          <span className="text-[9px] font-bold tracking-widest uppercase">
            {isDone ? "Cerrado" : "Próximamente"}
          </span>
        </div>
      </div>
    </div>
  );
}

const MealIcon = ({
  type,
  inactive,
}: {
  type: MealType;
  inactive?: boolean;
}) => {
  const color = inactive
    ? "currentColor"
    : type === "desayuno"
      ? "#EAB308"
      : type === "almuerzo"
        ? "#1abc9c"
        : "#8B5CF6";

  if (type === "desayuno")
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
    );
  if (type === "almuerzo")
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 13h18M5 13c0-3.5 3-6.5 7-6.5s7 3 7 6.5M7 13v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1M12 6.5V3" />
      </svg>
    );
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3a6.36 6.36 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
};

/* SaaS Corporate Icons */
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

const LogoIconPrimary = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 13h18M5 13c0-4.5 3-8.5 7-8.5s7 4 7 8.5v3H5v-3z" />
    <path d="M6 16v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2" />
  </svg>
);

const SearchIconLarge = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const CheckIconCircle = ({ size = 20, className = "" }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const VerifiedIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#1abc9c"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const BadgeIcon = () => (
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
    <path d="M16 2a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v20l6-3 6 3V2z" />
    <circle cx="10" cy="8" r="3" />
  </svg>
);

const CalendarTodayIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#1abc9c"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ClockHistoryIcon = () => (
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
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const LockClockIcon = () => (
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
    <circle cx="12" cy="12" r="10" />
    <rect width="6" height="5" x="9" y="10" rx="1" />
  </svg>
);

const PrintIcon = () => (
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
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect width="12" height="8" x="6" y="14" />
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
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const CheckIconSmallNav = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const CheckIconLarge = ({ color }: { color: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
