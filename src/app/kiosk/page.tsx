"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Student } from "@/src/types";
import { supabase } from "@/src/lib/supabase";

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
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [todayLogs, setTodayLogs] = useState<Record<string, string[]>>({});

  // Extra servicies states
  const [hasExtra, setHasExtra] = useState(false);
  const [extraNotes, setExtraNotes] = useState("");

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

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("students")
      .select("*")
      .eq("active", true)
      .order("first_name", { ascending: true })
      .limit(10);

    if (searchTerm && searchTerm.trim()) {
      query = query.or(
        `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`,
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching students:", error);
    } else {
      const mappedStudents: Student[] = (data || []).map((s: any) => ({
        id: s.id,
        firstName: s.first_name,
        lastName: s.last_name,
        code: s.code,
        dni: s.dni,
        email: s.email,
        phone: s.phone,
        address: s.address,
        birthDate: s.birth_date,
        joinedDate: s.joined_date,
        notes: s.notes,
        active: s.active,
        avatar: s.avatar_url,
      }));
      setStudents(mappedStudents);

      // Fetch today's logs for these students
      const studentIds = mappedStudents.map((s) => s.id);
      if (studentIds.length > 0) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const { data: logsData } = await supabase
          .from("meal_logs")
          .select("student_id, meal_type")
          .in("student_id", studentIds)
          .gte("timestamp", startOfDay.toISOString());

        const logMap: Record<string, string[]> = {};
        logsData?.forEach((log) => {
          if (!logMap[log.student_id]) logMap[log.student_id] = [];
          logMap[log.student_id].push(log.meal_type);
        });
        setTodayLogs(logMap);
      }
    }
    setLoading(false);
  }, [searchTerm]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchStudents();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [fetchStudents]);

  const handleRegisterMeal = async () => {
    if (!selectedStudent || !activeMeal) return;

    // Prevention: Check if already registered
    const mealLabel = MEAL_SCHEDULE[activeMeal].label;
    if (todayLogs[selectedStudent.id]?.includes(mealLabel)) {
      alert("Este servicio ya fue registrado hoy para este estudiante.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("meal_logs").insert([
      {
        student_id: selectedStudent.id,
        meal_type: mealLabel,
        status: "Verificado",
        timestamp: new Date().toISOString(),
        has_extra: hasExtra,
        extra_notes: hasExtra ? extraNotes : null,
      },
    ]);

    if (error) {
      console.error("Error registering meal:", error);
      alert("Error al registrar: " + error.message);
      setLoading(false);
      return;
    }

    const studentName = `${selectedStudent.firstName} ${selectedStudent.lastName}`;

    setLastAction({
      student: studentName,
      meal: mealLabel,
    });
    setCountdown(3);

    // Update local todayLogs state
    setTodayLogs((prev) => ({
      ...prev,
      [selectedStudent.id]: [...(prev[selectedStudent.id] || []), mealLabel],
    }));

    setSelectedStudent(null);
    setSearchTerm("");
    // fetchStudents will be triggered by searchTerm change or we can call it directly
    fetchStudents();
    setHasExtra(false);
    setExtraNotes("");
    setLoading(false);

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
    <div className="min-h-screen bg-[#F0F2F5] text-slate-800 font-sans flex flex-col relative overflow-hidden">
      {/* Background layer with blur if success */}
      <div
        className={`flex flex-col flex-1 transition-all duration-500 ${lastAction ? "blur-md opacity-20 scale-[0.98] pointer-events-none" : ""}`}
      >
        {/* SaaS Header */}
        <header className="sticky top-0 z-40 bg-[#2A3F54] backdrop-blur-md border-b border-white/10 px-6 py-4 lg:px-20 shadow-xl">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between">
            {/* Left Side: Brand and Breadcrumb */}
            <div className="flex items-center gap-6">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white transition-colors font-bold text-sm tracking-wider"
              >
                <ArrowLeftIcon />
                <span className="uppercase tracking-widest whitespace-nowrap">
                  Volver
                </span>
              </Link>

              <div className="h-8 w-px bg-white/10 hidden sm:block"></div>

              <div className="flex items-center gap-3">
                <div className="bg-[#1ABB9C] p-1.5 rounded-lg shadow-sm shadow-[#1ABB9C]/50 text-white shrink-0">
                  <LogoIconPrimary />
                </div>
                <div className="hidden xs:block">
                  <h1 className="text-lg font-extrabold tracking-tight text-white uppercase leading-none">
                    PENSION<span className="text-[#1ABB9C]">ADMIN</span>
                  </h1>
                  <p className="text-[10px] font-semibold text-slate-400 mt-1 tracking-widest uppercase">
                    Kiosk Pro v3.0
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side Info */}
            <div className="flex items-center gap-8">
              <div className="hidden md:flex flex-col items-end mr-2 text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Estado del Sistema
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <span className="text-xs font-black text-[#1ABB9C] uppercase tracking-widest">
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
                <div className="relative group transition-all duration-500">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-[#1ABB9C] group-focus-within:scale-110 transition-transform">
                    <SearchIconLarge />
                  </div>
                  <input
                    className="block w-full pl-16 pr-6 py-6 bg-white border border-slate-200 rounded-[2rem] shadow-[0_20px_50px_rgba(42,63,84,0.1)] focus:ring-4 focus:ring-[#1ABB9C]/10 focus:border-[#1ABB9C] transition-all text-xl font-bold placeholder:text-slate-300 text-slate-700"
                    placeholder="Escribe el nombre o escanea el código..."
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 hidden sm:block">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Listo para escanear
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-[0_10px_40px_rgba(42,63,84,0.05)]">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                        <th className="px-10 py-6 text-left">Pensionista</th>
                        <th className="px-10 py-6 text-left">
                          Código de Matrícula
                        </th>
                        <th className="px-10 py-6 text-left">
                          Plan de Servicio
                        </th>
                        <th className="px-10 py-6 text-right">Estado Hoy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="px-8 py-24 text-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-12 h-12 border-4 border-[#1ABB9C]/10 border-t-[#1ABB9C] rounded-full animate-spin"></div>
                              <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">
                                Consultando Base de Datos...
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : students.length > 0 ? (
                        students.map((student) => (
                          <tr
                            key={student.id}
                            onClick={() => setSelectedStudent(student)}
                            className="group cursor-pointer transition-all hover:bg-[#1ABB9C]/[0.02] relative"
                          >
                            <td className="px-10 py-6">
                              <div className="flex items-center gap-5">
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-white to-slate-50 flex items-center justify-center text-[#2A3F54] font-black text-xl border border-slate-200 shadow-sm transition-transform group-hover:scale-105 group-hover:border-[#1ABB9C]/30">
                                  {student.firstName[0]}
                                  {student.lastName[0]}
                                </div>
                                <div>
                                  <div className="font-extrabold text-[#2A3F54] text-lg tracking-tight group-hover:text-[#1ABB9C] transition-colors">
                                    {student.firstName} {student.lastName}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                      Activo
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-10 py-6">
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100 text-slate-500 font-mono text-xs font-black tracking-widest">
                                {student.code}
                              </div>
                            </td>
                            <td className="px-10 py-6">
                              <span className="px-4 py-2 rounded-xl bg-[#2A3F54]/5 text-[#2A3F54] text-[10px] font-black uppercase tracking-widest border border-[#2A3F54]/10">
                                PENSIONISTA G-1
                              </span>
                            </td>
                            <td className="px-10 py-6 text-right">
                              {todayLogs[student.id]?.includes(
                                MEAL_SCHEDULE[activeMeal || "desayuno"].label,
                              ) ? (
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-[#1ABB9C] rounded-full border border-emerald-100 font-black text-[10px] uppercase tracking-widest animate-in zoom-in-95">
                                  <CheckIconCircle size={14} />
                                  Listo
                                </div>
                              ) : (
                                <div className="text-slate-200 flex items-center justify-end group-hover:text-[#1ABB9C]/20 transition-colors">
                                  <CheckIconCircle size={24} />
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-8 py-32 text-center">
                            <div className="flex flex-col items-center gap-4 opacity-30">
                              <LogoIconPrimary />
                              <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-xs">
                                {searchTerm
                                  ? "Sin resultados"
                                  : "Esperando Escaneo"}
                              </p>
                            </div>
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
                    <div className="w-16 h-16 rounded-2xl bg-[#1ABB9C] flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-[#1ABB9C]/20 overflow-hidden">
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
                  isRegistered={todayLogs[selectedStudent.id]?.includes(
                    MEAL_SCHEDULE.desayuno.label,
                  )}
                />
                <MealCard
                  type="almuerzo"
                  isActive={activeMeal === "almuerzo"}
                  isDone={
                    activeMeal !== "almuerzo" &&
                    currentTime.getHours() >= MEAL_SCHEDULE.almuerzo.end
                  }
                  onMark={handleRegisterMeal}
                  isRegistered={todayLogs[selectedStudent.id]?.includes(
                    MEAL_SCHEDULE.almuerzo.label,
                  )}
                />
                <MealCard
                  type="cena"
                  isActive={activeMeal === "cena"}
                  isDone={
                    activeMeal !== "cena" &&
                    currentTime.getHours() >= MEAL_SCHEDULE.cena.end
                  }
                  onMark={handleRegisterMeal}
                  isRegistered={todayLogs[selectedStudent.id]?.includes(
                    MEAL_SCHEDULE.cena.label,
                  )}
                />
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

            {/* Extras Toggle and Notes (Only for Lunch) */}
            {activeMeal === "almuerzo" && (
              <div className="flex-1 max-w-2xl mx-8 flex items-center gap-6 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-2 rounded-2xl shrink-0">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    ¿Ración Extra?
                  </span>
                  <button
                    onClick={() => {
                      setHasExtra(!hasExtra);
                      if (!hasExtra) setExtraNotes(""); // Reset on enable
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${hasExtra ? "bg-[#1ABB9C]" : "bg-slate-200"}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hasExtra ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                </div>

                {hasExtra && (
                  <div className="flex-1 flex gap-2 animate-in zoom-in-95 duration-300">
                    {["Doble plato", "Presa", "Doble entrada"].map((option) => (
                      <button
                        key={option}
                        onClick={() => setExtraNotes(option)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm ${
                          extraNotes === option
                            ? "bg-[#1ABB9C] text-white border-transparent"
                            : "bg-white text-slate-400 border-slate-200 hover:border-[#1ABB9C]/30 hover:text-[#1ABB9C]"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-6 py-2.5 rounded-xl text-slate-500 font-bold hover:text-slate-700 hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px]"
              >
                Cerrar
              </button>
              <button
                onClick={handleRegisterMeal}
                disabled={
                  !activeMeal ||
                  loading ||
                  todayLogs[selectedStudent.id]?.includes(
                    MEAL_SCHEDULE[activeMeal].label,
                  )
                }
                className={`px-8 py-3 rounded-xl font-black shadow-lg transition-all uppercase tracking-widest text-xs flex items-center gap-2 disabled:shadow-none ${
                  todayLogs[selectedStudent.id]?.includes(
                    activeMeal ? MEAL_SCHEDULE[activeMeal].label : "",
                  )
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-[#1ABB9C] text-white shadow-[#1ABB9C]/20 hover:bg-emerald-600"
                }`}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : todayLogs[selectedStudent.id]?.includes(
                    activeMeal ? MEAL_SCHEDULE[activeMeal].label : "",
                  ) ? (
                  <CheckIconCircle size={16} />
                ) : (
                  <CheckIconSmallNav />
                )}
                {loading
                  ? "Registrando..."
                  : todayLogs[selectedStudent.id]?.includes(
                        activeMeal ? MEAL_SCHEDULE[activeMeal].label : "",
                      )
                    ? "Ya Registrado"
                    : `Confirmar ${activeMeal && MEAL_SCHEDULE[activeMeal].label}`}
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
  isRegistered,
  onMark,
}: {
  type: MealType;
  isActive: boolean;
  isDone: boolean;
  isRegistered?: boolean;
  onMark: () => void;
}) {
  const schedule = MEAL_SCHEDULE[type];

  if (isRegistered) {
    return (
      <div className="bg-white border border-emerald-100 rounded-[2.5rem] p-8 flex flex-col items-center shadow-[0_20px_60px_rgba(26,187,156,0.1)] relative overflow-hidden group border-b-[8px] border-b-[#1ABB9C]">
        <div className="absolute top-4 right-4 text-[#1ABB9C] animate-in zoom-in duration-500">
          <CheckIconCircle size={24} />
        </div>
        <div className="w-16 h-16 rounded-[1.5rem] bg-[#1ABB9C] flex items-center justify-center text-white mb-5 shadow-lg shadow-[#1ABB9C]/30 transition-transform group-hover:scale-110">
          <MealIcon type={type} />
        </div>
        <h3 className="text-xl font-black text-[#2A3F54] mb-1 uppercase tracking-tight">
          {schedule.label}
        </h3>
        <p className="text-[10px] font-black text-[#1ABB9C] mb-6 uppercase tracking-[0.3em] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
          VERIFICADO HOY
        </p>
        <div className="w-full mt-auto">
          <div className="w-full bg-slate-50 border border-slate-100 text-slate-400 font-black py-4 rounded-2xl flex items-center justify-center gap-3 text-xs uppercase tracking-widest cursor-not-allowed">
            SERVICIO COMPLETADO
          </div>
        </div>
      </div>
    );
  }

  if (isActive) {
    return (
      <div className="bg-white border-2 border-[#1ABB9C] rounded-[2.5rem] p-8 flex flex-col items-center shadow-[0_32px_80px_-16px_rgba(26,187,156,0.2)] relative z-10 transition-all hover:translate-y-[-4px] border-b-[8px] border-b-[#1ABB9C]">
        <div className="absolute -top-3 bg-gradient-to-r from-[#1ABB9C] to-[#16a085] text-white text-[10px] font-black px-6 py-1.5 rounded-full tracking-[0.2em] uppercase shadow-lg">
          Servicio Activo
        </div>
        <div className="w-16 h-16 rounded-[1.5rem] bg-[#1ABB9C]/10 flex items-center justify-center text-[#1ABB9C] mb-5 group-hover:scale-110 transition-transform">
          <MealIcon type={type} />
        </div>
        <h3 className="text-xl font-black text-[#2A3F54] mb-1 uppercase tracking-tight">
          {schedule.label}
        </h3>
        <p className="text-[10px] font-black text-[#1ABB9C] mb-8 uppercase tracking-[0.2em]">
          {schedule.time}
        </p>
        <div className="w-full mt-auto">
          <button
            onClick={onMark}
            className="w-full bg-[#1ABB9C] hover:bg-[#16a085] text-white font-black py-4 rounded-[1.2rem] flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl shadow-[#1ABB9C]/30 group inline-flex"
          >
            <CheckIconCircle
              size={20}
              className="transition-transform group-hover:scale-125"
            />
            <span className="tracking-[0.1em] text-xs uppercase">
              MARCAR ASISTENCIA
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white/50 border border-slate-200 rounded-[2.5rem] p-8 flex flex-col items-center transition-all ${isDone ? "grayscale-[0.8] opacity-50" : "opacity-70"}`}
    >
      <div className="w-14 h-14 rounded-[1.2rem] bg-slate-100 flex items-center justify-center text-slate-300 mb-5 border border-slate-200 shadow-inner">
        <MealIcon type={type} inactive />
      </div>
      <h3 className="text-lg font-black text-slate-500 mb-1 uppercase tracking-tight">
        {schedule.label}
      </h3>
      <p className="text-[9px] font-black text-slate-400 mb-6 uppercase tracking-widest">
        {schedule.time}
      </p>
      <div className="w-full mt-auto">
        <div className="flex items-center gap-2 text-slate-400 bg-slate-100 px-4 py-3 rounded-xl w-full justify-center border border-slate-200 shadow-inner">
          <span className="text-[9px] font-black tracking-[0.2em] uppercase">
            {isDone ? "SERVICIO CERRADO" : "PRÓXIMAMENTE"}
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
        ? "#1ABB9C"
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
    <path d="m22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const VerifiedIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#1ABB9C"
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
    stroke="#1ABB9C"
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
