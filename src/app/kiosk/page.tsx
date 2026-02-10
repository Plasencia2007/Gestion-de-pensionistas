"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Student } from "@/src/types";
import { supabase } from "@/src/lib/supabase";

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
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
      } else {
        setAuthLoading(false);
      }
    };
    checkUser();
  }, [router]);
  const [lastAction, setLastAction] = useState<{
    student: string;
    meal: string;
    status: "Verificado" | "Aviso";
  } | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [activeMeal, setActiveMeal] = useState<MealType | null>(null);
  const [mounted, setMounted] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [todayLogs, setTodayLogs] = useState<
    Record<string, { type: string; status: string; id: string }[]>
  >({});
  const [todayExtras, setTodayExtras] = useState<
    Record<string, { id: string; title: string; price: number }[]>
  >({});
  const [filterStatus, setFilterStatus] = useState<
    "todos" | "desayuno" | "almuerzo" | "cena" | "extras"
  >("todos");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [hasExtra, setHasExtra] = useState(false);
  const [extraNotes, setExtraNotes] = useState("");

  // New states for adding extras
  const [newExtraTitle, setNewExtraTitle] = useState("");
  const [newExtraPrice, setNewExtraPrice] = useState("");
  const [isAddingExtra, setIsAddingExtra] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setMounted(true);

    const checkFullscreen = () => {
      const isFull = !!document.fullscreenElement;
      const isF11 =
        window.innerWidth >= screen.width &&
        window.innerHeight >= screen.height;
      setIsFullscreen(isFull || isF11);
    };

    document.addEventListener("fullscreenchange", checkFullscreen);
    window.addEventListener("resize", checkFullscreen);
    checkFullscreen();

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
    return () => {
      clearInterval(timer);
      document.removeEventListener("fullscreenchange", checkFullscreen);
      window.removeEventListener("resize", checkFullscreen);
    };
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
        dni: s.dni || "",
        email: s.email || "",
        phone: s.phone || "",
        parentPhone: s.parent_phone || "",
        address: s.address || "",
        birthDate: s.birth_date || "",
        career: s.career || "",
        joinedDate: s.created_at || new Date().toISOString(),
        subscribedMeals: s.subscribed_meals || [],
        notes: s.notes || "",
        avatar: s.avatar_url,
        active: s.active,
      }));
      setStudents(mappedStudents);

      const studentIds = mappedStudents.map((s) => s.id);
      if (studentIds.length > 0) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // Fetch Meal Logs
        const { data: logsData } = await supabase
          .from("meal_logs")
          .select("id, student_id, meal_type, status")
          .in("student_id", studentIds)
          .gte("timestamp", startOfDay.toISOString());

        // Fetch Extras Logs
        const { data: extrasData } = await supabase
          .from("student_extras")
          .select("id, student_id, title, price")
          .in("student_id", studentIds)
          .gte("created_at", startOfDay.toISOString());

        // AUTO-SYNC: Ensure every subscribed meal has a physical log today
        const logsToInsert: any[] = [];
        const currentLogs = logsData || [];

        mappedStudents.forEach((student) => {
          const studentLogs = currentLogs.filter(
            (l) => l.student_id === student.id,
          );
          student.subscribedMeals.forEach((mealLabel) => {
            const exists = studentLogs.some((l) => l.meal_type === mealLabel);
            if (!exists) {
              logsToInsert.push({
                student_id: student.id,
                meal_type: mealLabel,
                status: "Verificado",
                timestamp: new Date().toISOString(),
              });
            }
          });
        });

        if (logsToInsert.length > 0) {
          const { data: insertedData, error: syncError } = await supabase
            .from("meal_logs")
            .insert(logsToInsert)
            .select();

          if (!syncError && insertedData) {
            currentLogs.push(...insertedData);
          }
        }

        const logMap: Record<
          string,
          { type: string; status: string; id: string }[]
        > = {};
        currentLogs.forEach((log) => {
          if (!logMap[log.student_id]) logMap[log.student_id] = [];
          logMap[log.student_id].push({
            type: log.meal_type,
            status: log.status,
            id: log.id,
          });
        });
        setTodayLogs(logMap);

        // Map Extras
        const extrasMap: Record<
          string,
          { id: string; title: string; price: number }[]
        > = {};
        (extrasData || []).forEach((extra: any) => {
          if (!extrasMap[extra.student_id]) extrasMap[extra.student_id] = [];
          extrasMap[extra.student_id].push({
            id: extra.id,
            title: extra.title,
            price: extra.price,
          });
        });
        setTodayExtras(extrasMap);
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

  // ... (keeping existing meal logic) ...

  const handleRegisterMeal = async (
    mealTypeOverride?: MealType,
    statusOverride: "Verificado" | "Aviso" = "Verificado",
  ) => {
    // ... (logic remains) ...
    const typeToRegister = mealTypeOverride || activeMeal;
    if (!selectedStudent || !typeToRegister) return;

    const mealLabel = MEAL_SCHEDULE[typeToRegister].label;
    const existingLog = todayLogs[selectedStudent.id]?.find(
      (log) => log.type === mealLabel,
    );
    // ...
    // Block if already verified AND we are trying to verify again
    if (
      existingLog &&
      existingLog.status === "Verificado" &&
      statusOverride === "Verificado"
    ) {
      alert("Este servicio ya fue registrado hoy para este estudiante.");
      return;
    }

    setLoading(true);

    const logData = {
      student_id: selectedStudent.id,
      meal_type: mealLabel,
      status: statusOverride,
      timestamp: new Date().toISOString(),
      has_extra: statusOverride === "Verificado" ? hasExtra : false,
      extra_notes:
        statusOverride === "Verificado" && hasExtra ? extraNotes : null,
    };

    let query;
    if (existingLog && existingLog.id) {
      // Update
      query = supabase
        .from("meal_logs")
        .update(logData)
        .eq("id", existingLog.id);
    } else {
      // Insert
      query = supabase.from("meal_logs").insert([logData]);
    }

    const { error } = await query;

    if (error) {
      console.error("Error registering meal:", error);
      alert("Error al registrar: " + error.message);
      setLoading(false);
      return;
    }

    const studentName = `${selectedStudent.firstName} ${selectedStudent.lastName}`;

    if (statusOverride === "Aviso") {
      setToastMessage(`¡Cobro de ${mealLabel} anulado con éxito!`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      // Removed: setSelectedStudent(null); -> Keep student selected
      // Removed: setSearchTerm("");
      setHasExtra(false);
      setExtraNotes("");
      setLoading(false);
      fetchStudents(); // Refresh data to update UI state
    } else {
      setLastAction({
        student: studentName,
        meal: mealLabel,
        status: "Verificado",
      });
      setCountdown(3);
      setSelectedStudent(null);
      setSearchTerm("");
      setHasExtra(false);
      setExtraNotes("");
      setLoading(false);
      fetchStudents();

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
    }
  };

  if (!mounted || authLoading)
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1ABB9C]"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-slate-800 font-sans flex flex-col relative overflow-hidden">
      {/* Discreet Toast Notification - Moved to Top Right as requested */}
      {showToast && (
        <div className="fixed top-28 right-8 z-[100] animate-in slide-in-from-right duration-500">
          <div className="bg-[#1ABB9C] text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-white/20 backdrop-blur-md">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <CheckIconCircle size={20} />
            </div>
            <p className="font-extrabold uppercase tracking-widest text-sm">
              {toastMessage}
            </p>
          </div>
        </div>
      )}

      <div
        className={`flex flex-col flex-1 transition-all duration-500 ${lastAction ? "blur-md opacity-20 scale-[0.98] pointer-events-none" : ""}`}
      >
        <header className="sticky top-0 z-40 bg-[#2A3F54] backdrop-blur-md border-b border-white/10 px-6 py-4 lg:px-20 shadow-xl">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div
                className={`flex items-center gap-6 transition-all duration-300 ${isFullscreen ? "opacity-0 invisible w-0 -ml-6" : "opacity-100 visible"}`}
              >
                {selectedStudent ? (
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white transition-colors font-bold text-sm tracking-wider"
                  >
                    <ArrowLeftIcon />
                    <span className="uppercase tracking-widest whitespace-nowrap">
                      Volver
                    </span>
                  </button>
                ) : (
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white transition-colors font-bold text-sm tracking-wider"
                  >
                    <ArrowLeftIcon />
                    <span className="uppercase tracking-widest whitespace-nowrap">
                      Volver
                    </span>
                  </Link>
                )}
              </div>

              <div className="h-8 w-px bg-white/10 hidden sm:block"></div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg shadow-sm shadow-black/20 overflow-hidden shrink-0">
                  <img
                    src="/logo.png"
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="hidden xs:block">
                  <h1 className="text-lg font-extrabold tracking-tight text-white uppercase leading-none">
                    RIQUITO<span className="text-[#1ABB9C]">.PE</span>
                  </h1>
                  <p className="text-[10px] font-semibold text-slate-400 mt-1 tracking-widest uppercase">
                    Sistema de Pensionistas
                  </p>
                </div>
              </div>
            </div>

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
                              {todayLogs[student.id]?.some(
                                (log) =>
                                  log.type ===
                                    MEAL_SCHEDULE[activeMeal || "desayuno"]
                                      .label && log.status === "Verificado",
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
              <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-[#1ABB9C] flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-[#1ABB9C]/20 overflow-hidden transition-transform hover:scale-105">
                      {selectedStudent.firstName[0]}
                      {selectedStudent.lastName[0]}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-md border-2 border-slate-50">
                      <VerifiedIcon />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-slate-800 mb-1 leading-tight tracking-tight">
                      {selectedStudent.firstName} {selectedStudent.lastName}
                    </h1>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-400 flex items-center gap-2 uppercase tracking-[0.2em]">
                        <BadgeIcon /> {selectedStudent.code}
                      </span>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                      <span className="text-[10px] font-black bg-[#2A3F54]/5 text-[#2A3F54] px-3 py-1 rounded-full uppercase tracking-widest border border-[#2A3F54]/10">
                        Pensionista G-1
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <h2 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1">
                      Registro Automático
                    </h2>
                    <div className="flex items-center justify-end gap-2 text-xs font-black text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
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

                  <button
                    onClick={() => {
                      setLoading(true);
                      fetchStudents();
                    }}
                    disabled={loading}
                    className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-[#1ABB9C] hover:border-[#1ABB9C] transition-all shadow-sm active:scale-95 disabled:opacity-50 group"
                    title="Actualizar datos"
                  >
                    <RefreshIcon
                      className={`transition-transform duration-700 ${loading ? "animate-spin" : "group-hover:rotate-180"}`}
                    />
                  </button>

                  <button
                    onClick={() => setSelectedStudent(null)}
                    disabled={loading}
                    className={`flex items-center gap-2 px-8 py-4 bg-white border border-slate-200 rounded-2xl text-slate-500 font-black uppercase tracking-widest text-[10px] shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] group ${isFullscreen ? "opacity-0 invisible w-0 p-0 overflow-hidden ml-0" : "opacity-100 visible"}`}
                  >
                    <div className="transition-transform group-hover:-translate-x-1">
                      <ArrowLeftIcon />
                    </div>
                    Volver al Listado
                  </button>
                </div>
              </div>

              {/* Meal Services Grid */}
              <div
                className={`grid grid-cols-1 gap-6 ${
                  selectedStudent.subscribedMeals.length === 1
                    ? "max-w-md mx-auto"
                    : selectedStudent.subscribedMeals.length === 2
                      ? "md:grid-cols-2 max-w-4xl mx-auto"
                      : "md:grid-cols-3"
                }`}
              >
                {(Object.keys(MEAL_SCHEDULE) as MealType[])
                  .filter((type) =>
                    selectedStudent.subscribedMeals.includes(
                      MEAL_SCHEDULE[type].label,
                    ),
                  )
                  .map((type) => {
                    const label = MEAL_SCHEDULE[type].label;
                    const studentLogs = todayLogs[selectedStudent.id] || [];
                    const isRegistered = studentLogs.some(
                      (log) =>
                        log.type === label && log.status === "Verificado",
                    );
                    const hasAviso = studentLogs.some(
                      (log) => log.type === label && log.status === "Aviso",
                    );

                    return (
                      <MealCard
                        key={type}
                        type={type}
                        isActive={activeMeal === type}
                        onMark={() => handleRegisterMeal(type, "Verificado")}
                        onAviso={() => handleRegisterMeal(type, "Aviso")}
                        isRegistered={isRegistered}
                        hasAviso={hasAviso}
                      />
                    );
                  })}
              </div>

              {/* Extras Section */}
              <div className="mt-12 bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-slate-700 uppercase tracking-tight flex items-center gap-3">
                    <span className="p-2 bg-amber-50 text-amber-500 rounded-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </span>
                    Consumos Extras
                  </h3>
                  {!isAddingExtra && (
                    <button
                      onClick={() => setIsAddingExtra(true)}
                      className="px-6 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center gap-2"
                    >
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
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>{" "}
                      Agregar Extra
                    </button>
                  )}
                </div>

                {/* Add Extra Form */}
                {isAddingExtra && (
                  <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100 mb-8 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                          Producto
                        </label>
                        <input
                          type="text"
                          value={newExtraTitle}
                          onChange={(e) => setNewExtraTitle(e.target.value)}
                          placeholder="Ej. Gaseosa, Galleta..."
                          className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 font-bold text-slate-700 outline-none transition-all placeholder:font-medium placeholder:text-slate-300"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                          Precio (S/)
                        </label>
                        <input
                          type="number"
                          value={newExtraPrice}
                          onChange={(e) => setNewExtraPrice(e.target.value)}
                          placeholder="0.00"
                          step="0.10"
                          className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 font-bold text-slate-700 outline-none transition-all placeholder:font-medium placeholder:text-slate-300"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => {
                          setIsAddingExtra(false);
                          setNewExtraTitle("");
                          setNewExtraPrice("");
                        }}
                        className="px-6 py-3 bg-white border border-slate-200 text-slate-400 font-bold rounded-xl hover:bg-slate-50 transition-colors uppercase text-[10px] tracking-widest"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={async () => {
                          if (!newExtraTitle || !newExtraPrice) return;

                          const title = newExtraTitle;
                          const price = parseFloat(newExtraPrice);

                          if (isNaN(price) || price <= 0) {
                            alert("Precio inválido");
                            return;
                          }

                          const tempId = Math.random().toString();
                          const newExtra = {
                            id: tempId,
                            title,
                            price,
                          };

                          setTodayExtras((prev) => ({
                            ...prev,
                            [selectedStudent.id]: [
                              ...(prev[selectedStudent.id] || []),
                              newExtra,
                            ],
                          }));

                          setIsAddingExtra(false);
                          setNewExtraTitle("");
                          setNewExtraPrice("");

                          const { data, error } = await supabase
                            .from("student_extras")
                            .insert({
                              student_id: selectedStudent.id,
                              title,
                              price,
                            })
                            .select()
                            .single();

                          if (error) {
                            console.error("Error saving extra:", error);
                            alert("Error al guardar extra");
                          } else {
                            setTodayExtras((prev) => {
                              const list = prev[selectedStudent.id] || [];
                              return {
                                ...prev,
                                [selectedStudent.id]: list.map((e) =>
                                  e.id === tempId ? { ...e, id: data.id } : e,
                                ),
                              };
                            });

                            setToastMessage(`Extra agregado: ${title}`);
                            setShowToast(true);
                            setTimeout(() => setShowToast(false), 3000);
                          }
                        }}
                        disabled={!newExtraTitle || !newExtraPrice}
                        className="px-8 py-3 bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all uppercase text-[10px] tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                )}

                {/* List of Extras */}
                <div className="space-y-3">
                  {(todayExtras[selectedStudent.id] || []).length > 0 ? (
                    (todayExtras[selectedStudent.id] || []).map((extra) => (
                      <div
                        key={extra.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-amber-200 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-700">
                              {extra.title}
                            </p>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              Extra Kiosko
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <span className="font-black text-slate-700 text-lg">
                            S/ {extra.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 opacity-50">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Sin extras registrados hoy
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
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
                {lastAction.status === "Aviso"
                  ? "¡Cargo Anulado!"
                  : "¡Consumo Confirmado!"}
              </h1>
              <p className="text-slate-500 text-lg font-medium mb-10">
                El estado de tu{" "}
                <span className="text-[#13ecc8] font-bold">
                  {lastAction.meal}
                </span>{" "}
                ha sido actualizado.
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
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ... (icons)

function MealCard({
  type,
  isActive,
  onMark,
  onAviso,
  isRegistered,
  hasAviso,
}: {
  type: MealType;
  isActive: boolean;
  onMark: () => void;
  onAviso: () => void;
  isRegistered: boolean;
  hasAviso: boolean;
}) {
  const schedule = MEAL_SCHEDULE[type];
  const isSuccess = isRegistered && !hasAviso;
  const isAviso = hasAviso;

  return (
    <div
      className={`bg-white border rounded-[3rem] p-8 flex flex-col items-center shadow-[0_15px_60px_-15px_rgba(42,63,84,0.1)] relative overflow-hidden group transition-all duration-500 hover:translate-y-[-4px] hover:shadow-[0_30px_70px_-15px_rgba(42,63,84,0.15)] ${
        isSuccess
          ? "border-emerald-100/50"
          : isAviso
            ? "border-amber-100/50"
            : "border-slate-100"
      }`}
    >
      {/* Background Decorative Gradient */}
      <div
        className={`absolute inset-x-0 bottom-0 h-2 transition-all duration-500 ${
          isSuccess
            ? "bg-gradient-to-r from-[#1ABB9C] to-[#0D8E75]"
            : isAviso
              ? "bg-gradient-to-r from-amber-400 to-orange-500"
              : "bg-slate-200"
        }`}
      ></div>

      {/* Active Header Badge */}
      {isActive && !isSuccess && !isAviso && (
        <div className="absolute top-0 inset-x-0 flex justify-center">
          <div className="bg-gradient-to-r from-[#1ABB9C] to-[#16a085] text-white text-[9px] font-black px-8 py-2 rounded-b-2xl tracking-[0.25em] uppercase shadow-lg z-20 animate-in slide-in-from-top-2">
            Servicio Abierto
          </div>
        </div>
      )}

      {/* Status Icons */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        {isSuccess && (
          <div className="p-1.5 bg-emerald-50 rounded-full text-[#1ABB9C] border border-emerald-100 animate-in zoom-in-50 duration-500">
            <CheckIconCircle size={18} />
          </div>
        )}
        {isAviso && (
          <div className="p-1.5 bg-amber-50 rounded-full text-amber-500 border border-amber-100 animate-in zoom-in-50 duration-500">
            <ClockHistoryIcon size={18} />
          </div>
        )}
      </div>

      {/* Icon Area */}
      <div className="relative mt-4 mb-6">
        <div
          className={`w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${
            isSuccess
              ? "bg-gradient-to-br from-[#1ABB9C] to-[#0D8E75] text-white shadow-xl shadow-[#1ABB9C]/30"
              : isAviso
                ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xl shadow-amber-500/30"
                : "bg-slate-50 text-slate-400 border border-slate-100"
          }`}
        >
          <MealIcon type={type} inactive={!isSuccess && !isAviso} />
        </div>
        {isActive && !isSuccess && !isAviso && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full animate-pulse shadow-md"></div>
        )}
      </div>

      <h3 className="text-xl font-black text-[#2A3F54] mb-2 uppercase tracking-tight">
        {schedule.label}
      </h3>

      {/* Modern Status Badge */}
      <div
        className={`text-[9px] font-black mb-8 uppercase tracking-[0.25em] px-4 py-1.5 rounded-xl border transition-all duration-500 ${
          isSuccess
            ? "text-[#1ABB9C] bg-emerald-50 border-emerald-100/50"
            : isAviso
              ? "text-amber-600 bg-amber-50 border-amber-100/50"
              : "text-slate-400 bg-slate-50 border-slate-100"
        }`}
      >
        {isSuccess
          ? "Consumo Confirmado"
          : isAviso
            ? "Cobro Anulado"
            : "No Registrado"}
      </div>

      {/* Action Section */}
      <div className="w-full mt-auto">
        {!isAviso ? (
          <div className="space-y-4">
            <button
              onClick={onAviso}
              className={`w-full font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] uppercase tracking-widest text-[10px] shadow-sm border ${
                isSuccess
                  ? "bg-white text-amber-500 border-amber-100 hover:bg-amber-50 hover:border-amber-200"
                  : "bg-amber-500 text-white border-amber-400 hover:bg-amber-600 shadow-amber-500/10"
              }`}
            >
              <ClockHistoryIcon size={16} />
              <span>{isSuccess ? "Cambiar a Aviso" : "Anular Cobro"}</span>
            </button>
            {isSuccess && (
              <div className="flex items-center justify-center gap-2 text-emerald-500">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">
                  Servicio Guardado
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full bg-slate-50 border border-slate-100 text-slate-400 font-black py-4 rounded-2xl flex flex-col items-center justify-center gap-1">
            <span className="text-[10px] uppercase tracking-widest">
              Gesto Cancelado
            </span>
            <span className="text-[8px] opacity-60 tracking-[0.2em]">
              Sincronizado Hoy
            </span>
          </div>
        )}
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
  const color = inactive ? "currentColor" : "white"; // Now white because they will be used inside gradient backgrounds when active

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

function CheckIconCircle({ size = 20, className = "" }) {
  return (
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
}

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

function ClockHistoryIcon({ size = 16 }: { size?: number }) {
  return (
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
}

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

const StarIcon = ({ size = 20 }: { size?: number }) => (
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
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const PlusIcon = ({ size = 20 }: { size?: number }) => (
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
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const TrashIcon = ({ size = 20 }: { size?: number }) => (
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
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const RefreshIcon = ({
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
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);
