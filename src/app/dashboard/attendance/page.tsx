"use client";

import { useState, useEffect, useCallback } from "react";
import { Student } from "@/src/types";
import { supabase } from "@/src/lib/supabase";
import {
  UsersIcon,
  SearchIcon,
  CheckIconCircle,
} from "@/src/app/dashboard/students/page";

const MEAL_SCHEDULE = {
  desayuno: {
    label: "Desayuno",
    time: "07:00 AM - 10:30 AM",
    color: "blue",
    icon: (size = 24) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
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
    ),
  },
  almuerzo: {
    label: "Almuerzo",
    time: "12:00 PM - 02:30 PM",
    color: "emerald",
    icon: (size = 24) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3h18v18H3z" />
        <path d="M12 8v8" />
        <path d="M8 12h8" />
      </svg>
    ),
  },
  cena: {
    label: "Cena",
    time: "06:00 PM - 08:30 PM",
    color: "indigo",
    icon: (size = 24) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    ),
  },
};

type MealType = keyof typeof MEAL_SCHEDULE;

export default function AttendancePage() {
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [todayLogs, setTodayLogs] = useState<Record<string, string[]>>({});
  const [hasExtra, setHasExtra] = useState(false);
  const [extraNotes, setExtraNotes] = useState("");
  const [activeMeal, setActiveMeal] = useState<MealType | null>(null);

  // Extras & Filters State
  const [filterStatus, setFilterStatus] = useState<
    "todos" | "desayuno" | "almuerzo" | "cena" | "extras"
  >("todos");
  const [todayExtras, setTodayExtras] = useState<
    Record<string, { id: string; title: string; price: number }[]>
  >({});
  const [isAddingExtra, setIsAddingExtra] = useState(false);
  const [newExtraTitle, setNewExtraTitle] = useState("");
  const [newExtraPrice, setNewExtraPrice] = useState("");

  const determineActiveMeal = useCallback(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) return "desayuno";
    if (hour >= 11 && hour < 17) return "almuerzo";
    if (hour >= 17 && hour < 23) return "cena";
    return null;
  }, []);

  useEffect(() => {
    setActiveMeal(determineActiveMeal());
  }, [determineActiveMeal]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("students")
      .select("*")
      .eq("active", true)
      .order("first_name", { ascending: true });

    if (searchTerm) {
      query = query.or(
        `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`,
      );
    }

    const { data, error } = await query;
    if (!error && data) {
      const mapped: Student[] = data.map((s: any) => ({
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
        joinedDate: s.joined_date || s.created_at,
        subscribedMeals: s.subscribed_meals || [],
        notes: s.notes || "",
        active: s.active,
        avatar: s.avatar_url,
      }));
      setStudents(mapped);

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      threeDaysAgo.setHours(0, 0, 0, 0);

      // Fetch Logs
      const { data: logs } = await supabase
        .from("meal_logs")
        .select("student_id, status, meal_type, created_at")
        .in(
          "student_id",
          mapped.map((s) => s.id),
        )
        .gte("created_at", threeDaysAgo.toISOString());

      // AUTO-SYNC LOGIC (3-day window, Skip Saturdays)
      const logsToInsert: any[] = [];
      const currentLogMap: Record<string, string[]> = {};

      logs?.forEach((log) => {
        const logDate = new Date(log.created_at).toLocaleDateString("sv");
        const key = `${log.student_id}_${logDate}`;
        if (!currentLogMap[key]) currentLogMap[key] = [];
        currentLogMap[key].push(log.meal_type);
      });

      // Check last 3 days (today, yesterday, day before)
      for (let i = 0; i < 3; i++) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - i);
        const isSaturday = checkDate.getDay() === 6;

        if (!isSaturday) {
          const dateStr = checkDate.toLocaleDateString("sv");
          const timestamp = checkDate.toISOString();

          mapped.forEach((student) => {
            student.subscribedMeals.forEach((mealLabel) => {
              const key = `${student.id}_${dateStr}`;
              if (!currentLogMap[key]?.includes(mealLabel)) {
                logsToInsert.push({
                  student_id: student.id,
                  meal_type: mealLabel,
                  status: "Verificado",
                  timestamp: timestamp,
                });
              }
            });
          });
        }
      }

      if (logsToInsert.length > 0) {
        const { error: syncError } = await supabase
          .from("meal_logs")
          .insert(logsToInsert);
        if (!syncError) {
          logsToInsert.forEach((newLog) => {
            const isToday =
              new Date(newLog.timestamp).toLocaleDateString("sv") ===
              new Date().toLocaleDateString("sv");
            if (isToday) {
              logs?.push({
                student_id: newLog.student_id,
                status: newLog.status,
                meal_type: newLog.meal_type,
                created_at: newLog.timestamp,
              });
            }
          });
        }
      }

      const logMap: Record<string, string[]> = {};
      logs?.forEach((log) => {
        if (!logMap[log.student_id]) logMap[log.student_id] = [];
        logMap[log.student_id].push(`${log.meal_type}_${log.status}`);
      });
      setTodayLogs(logMap);

      // Fetch Extras
      const { data: extrasData } = await supabase
        .from("student_extras")
        .select("id, student_id, title, price")
        .gte("created_at", startOfDay.toISOString());

      const extrasMap: Record<
        string,
        { id: string; title: string; price: number }[]
      > = {};
      extrasData?.forEach((extra: any) => {
        if (!extrasMap[extra.student_id]) extrasMap[extra.student_id] = [];
        extrasMap[extra.student_id].push({
          id: extra.id,
          title: extra.title,
          price: extra.price,
        });
      });
      setTodayExtras(extrasMap);
    }
    setLoading(false);
  }, [searchTerm]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Handlers
  const handleRegisterExtra = async () => {
    if (!selectedStudent || !newExtraTitle || !newExtraPrice) return;

    const { data, error } = await supabase
      .from("student_extras")
      .insert({
        student_id: selectedStudent.id,
        title: newExtraTitle,
        price: parseFloat(newExtraPrice),
      })
      .select()
      .single();

    if (error) {
      alert("Error al registrar extra");
    } else if (data) {
      setTodayExtras((prev) => ({
        ...prev,
        [selectedStudent.id]: [
          ...(prev[selectedStudent.id] || []),
          { id: data.id, title: data.title, price: data.price },
        ],
      }));
      setNewExtraTitle("");
      setNewExtraPrice("");
      setIsAddingExtra(false);
    }
  };

  const handleDeleteExtra = async (extraId: string) => {
    if (!selectedStudent) return;
    if (!confirm("¿Eliminar este extra?")) return;

    const { error } = await supabase
      .from("student_extras")
      .delete()
      .eq("id", extraId);

    if (error) {
      alert("Error al eliminar extra");
    } else {
      setTodayExtras((prev) => ({
        ...prev,
        [selectedStudent.id]: prev[selectedStudent.id].filter(
          (e) => e.id !== extraId,
        ),
      }));
    }
  };

  const handleRegister = async (
    studentId: string,
    mealLabel: string,
    status: "Verificado" | "Aviso",
    extra?: { hasExtra: boolean; notes: string },
  ) => {
    const { error } = await supabase.from("meal_logs").insert({
      student_id: studentId,
      meal_type: mealLabel,
      status: status,
      has_extra: extra?.hasExtra || false,
      extra_notes: extra?.notes || "",
    });

    if (!error) {
      setTodayLogs((prev) => ({
        ...prev,
        [studentId]: [...(prev[studentId] || []), `${mealLabel}_${status}`],
      }));
      setHasExtra(false);
      setExtraNotes("");
    }
  };

  // derived state
  const filteredStudents = students.filter((student) => {
    if (filterStatus === "todos") return true;

    if (filterStatus === "extras") {
      return (todayExtras[student.id]?.length || 0) > 0;
    }

    const logs = todayLogs[student.id] || [];
    const label = MEAL_SCHEDULE[filterStatus as MealType]?.label;
    if (!label) return true;

    return logs.some((log) => log.includes(`${label}_Verificado`));
  });

  const counts = {
    todos: students.length,
    desayuno: students.filter((s) =>
      todayLogs[s.id]?.some((l) => l.includes("Desayuno_Verificado")),
    ).length,
    almuerzo: students.filter((s) =>
      todayLogs[s.id]?.some((l) => l.includes("Almuerzo_Verificado")),
    ).length,
    cena: students.filter((s) =>
      todayLogs[s.id]?.some((l) => l.includes("Cena_Verificado")),
    ).length,
    extras: students.filter((s) => (todayExtras[s.id]?.length || 0) > 0).length,
  };

  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-[#F8FAF9]">
      {!selectedStudent ? (
        <div className="p-8">
          <header className="mb-12">
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">
              Control de Asistencias
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">
              Busca un alumno para registrar su consumo o aviso
            </p>
          </header>

          <div className="flex flex-col md:flex-row gap-6 mb-10 items-center">
            <div className="relative group max-w-2xl w-full">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#1ABB9C] transition-colors">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                className="w-full pl-16 pr-8 py-6 bg-white border-2 border-slate-100 rounded-[2rem] text-slate-700 font-bold tracking-tight shadow-sm transition-all focus:border-[#1ABB9C] focus:ring-4 focus:ring-[#1ABB9C]/5 outline-none text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-slate-100 shadow-sm overflow-x-auto max-w-full">
              {[
                { key: "todos", label: "TODOS" },
                { key: "desayuno", label: "DESAYUNO" },
                { key: "almuerzo", label: "ALMUERZO" },
                { key: "cena", label: "CENA" },
                { key: "extras", label: "EXTRAS" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilterStatus(tab.key as any)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    filterStatus === tab.key
                      ? "bg-[#1ABB9C] text-white shadow-lg shadow-[#1ABB9C]/30"
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[9px] ${
                      filterStatus === tab.key
                        ? "bg-white text-[#1ABB9C]"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {counts[tab.key as keyof typeof counts]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                  <th className="px-10 py-6 text-left">Pensionista</th>
                  <th className="px-10 py-6 text-left">Código</th>
                  <th className="px-10 py-6 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="py-24 text-center">
                      Cargando...
                    </td>
                  </tr>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className="group cursor-pointer hover:bg-slate-50 transition-all"
                    >
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-[#1ABB9C]/10 group-hover:text-[#1ABB9C] transition-colors">
                            {student.firstName[0]}
                            {student.lastName[0]}
                          </div>
                          <div>
                            <p className="font-black text-slate-700 text-lg tracking-tight group-hover:text-[#1ABB9C] transition-colors">
                              {student.firstName} {student.lastName}
                            </p>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                              {student.career}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <span className="font-mono text-xs font-bold text-slate-500">
                          {student.code}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right text-slate-300">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="inline group-hover:text-[#1ABB9C] transition-colors"
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-32 text-center opacity-20">
                      <UsersIcon />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Detailed View for Encargado */
        <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button
            onClick={() => setSelectedStudent(null)}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-800 transition-colors font-black uppercase tracking-widest text-[11px] mb-8"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Volver
          </button>

          <div className="flex items-center gap-6 mb-12">
            <div className="w-20 h-20 rounded-3xl bg-[#1ABB9C] text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-[#1ABB9C]/20">
              {selectedStudent.firstName[0]}
              {selectedStudent.lastName[0]}
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tighter">
                {selectedStudent.firstName} {selectedStudent.lastName}
              </h2>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-3 py-1 bg-white border border-slate-100 rounded-lg">
                  {selectedStudent.code}
                </span>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-3 py-1 bg-white border border-slate-100 rounded-lg">
                  {selectedStudent.career}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-8">
            {new Date().getDay() === 6 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center">
                <h3 className="text-xl font-black text-amber-600 uppercase tracking-tight mb-2">
                  Sábado - Día de Extras
                </h3>
                <p className="text-slate-500 font-medium text-sm">
                  Hoy no se sirven comidas regulares (Desayuno, Almuerzo, Cena).
                  Solo se registran consumos extras.
                </p>
              </div>
            ) : (
              <div
                className={`grid grid-cols-1 gap-8 ${
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
                    const meal = MEAL_SCHEDULE[type];
                    const isActive = activeMeal === type;
                    const logs = todayLogs[selectedStudent.id] || [];
                    const hasEaten = logs.includes(`${meal.label}_Verificado`);
                    const hasAviso = logs.includes(`${meal.label}_Aviso`);

                    return (
                      <div
                        key={type}
                        className={`relative bg-white rounded-[3.5rem] p-10 border-2 transition-all duration-500 overflow-hidden ${
                          isActive
                            ? "border-[#1ABB9C] shadow-2xl scale-105 z-10"
                            : "border-slate-100 shadow-sm opacity-90"
                        }`}
                      >
                        {isActive && (
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 px-6 py-2 bg-[#1ABB9C] text-white font-black uppercase tracking-widest text-[9px] rounded-b-2xl shadow-lg">
                            Horario Actual
                          </div>
                        )}

                        <div className="flex flex-col items-center text-center">
                          <div
                            className={`w-20 h-20 rounded-3xl mb-8 flex items-center justify-center ${
                              isActive
                                ? "bg-[#1ABB9C]/10 text-[#1ABB9C]"
                                : "bg-slate-50 text-slate-300"
                            }`}
                          >
                            {meal.icon(32)}
                          </div>

                          <h3 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">
                            {meal.label}
                          </h3>
                          <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mb-10">
                            {meal.time}
                          </p>

                          {hasEaten ? (
                            <div className="w-full p-6 bg-emerald-50 text-emerald-600 rounded-3xl border border-emerald-100 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                              <CheckIconCircle size={18} /> Consumo Registrado
                            </div>
                          ) : hasAviso ? (
                            <div className="w-full p-6 bg-amber-50 text-amber-600 rounded-3xl border border-amber-100 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                              Aviso Registrado
                            </div>
                          ) : (
                            <div className="w-full flex flex-col gap-4">
                              {type === "almuerzo" && (
                                <div className="flex flex-col gap-4 mb-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                      ¿Ración Extra?
                                    </span>
                                    <button
                                      onClick={() => setHasExtra(!hasExtra)}
                                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hasExtra ? "bg-[#1ABB9C]" : "bg-slate-200"}`}
                                    >
                                      <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hasExtra ? "translate-x-6" : "translate-x-1"}`}
                                      />
                                    </button>
                                  </div>
                                  {hasExtra && (
                                    <div className="flex flex-wrap gap-2 animate-in zoom-in-95">
                                      {[
                                        "Doble plato",
                                        "Presa",
                                        "Doble entrada",
                                      ].map((opt) => (
                                        <button
                                          key={opt}
                                          onClick={() => setExtraNotes(opt)}
                                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${extraNotes === opt ? "bg-[#1ABB9C] text-white border-transparent" : "bg-white text-slate-400 border-slate-200"}`}
                                        >
                                          {opt}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                              <button
                                onClick={() =>
                                  handleRegister(
                                    selectedStudent.id,
                                    meal.label,
                                    "Verificado",
                                    type === "almuerzo"
                                      ? { hasExtra, notes: extraNotes }
                                      : undefined,
                                  )
                                }
                                className="w-full py-4 bg-[#1ABB9C] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-[#1ABB9C]/20 hover:bg-emerald-600 transition-all active:scale-95"
                              >
                                Marcar Asistencia
                              </button>
                              <button
                                onClick={() =>
                                  handleRegister(
                                    selectedStudent.id,
                                    meal.label,
                                    "Aviso",
                                  )
                                }
                                className="w-full py-4 bg-white text-[#1ABB9C] border-2 border-[#1ABB9C]/20 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#1ABB9C]/5 transition-all"
                              >
                                Registrar Aviso
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Extras Section */}
          <div className="mt-12 bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-700 uppercase tracking-tight flex items-center gap-3">
                <span className="p-2 bg-amber-50 text-amber-500 rounded-lg">
                  <StarIcon size={20} />
                </span>
                Consumos Extras
              </h3>
              {!isAddingExtra && (
                <button
                  onClick={() => setIsAddingExtra(true)}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center gap-2"
                >
                  <PlusIcon size={16} /> Agregar Extra
                </button>
              )}
            </div>

            {/* List of Extras */}
            <div className="space-y-3 mb-6">
              {(todayExtras[selectedStudent.id] || []).length > 0 ? (
                (todayExtras[selectedStudent.id] || []).map((extra) => (
                  <div
                    key={extra.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-amber-200 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-amber-500 font-bold border border-slate-100 shadow-sm">
                        <StarIcon size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-700">
                          {extra.title}
                        </p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Registrado hoy
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="font-black text-slate-700 text-lg">
                        S/ {extra.price.toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleDeleteExtra(extra.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        title="Eliminar Extra"
                      >
                        <TrashIcon size={18} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 font-medium italic border-2 border-dashed border-slate-100 rounded-2xl">
                  No hay extras registrados hoy
                </div>
              )}
            </div>

            {/* Add Extra Form */}
            {isAddingExtra && (
              <div className="bg-amber-50/50 p-6 rounded-[2rem] border border-amber-100 animate-in fade-in slide-in-from-top-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">
                      Concepto / Producto
                    </label>
                    <input
                      type="text"
                      value={newExtraTitle}
                      onChange={(e) => setNewExtraTitle(e.target.value)}
                      placeholder="Ej: Gaseosa, Galleta, Segundo plato..."
                      className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:font-normal"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">
                      Precio (S/)
                    </label>
                    <input
                      type="number"
                      step="0.10"
                      value={newExtraPrice}
                      onChange={(e) => setNewExtraPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:font-normal"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setIsAddingExtra(false);
                      setNewExtraTitle("");
                      setNewExtraPrice("");
                    }}
                    className="px-6 py-3 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleRegisterExtra}
                    disabled={!newExtraTitle || !newExtraPrice}
                    className="px-8 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                  >
                    Guardar Extra
                  </button>
                </div>
              </div>
            )}
          </div>

          <footer className="mt-16 p-8 bg-[#2A3F54] rounded-[2.5rem] text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl transition-transform group-hover:scale-110" />
            <div className="relative flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-[#1ABB9C]/20 flex items-center justify-center text-[#1ABB9C]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-widest mb-1">
                  Lógica de Facturación Automática
                </h4>
                <p className="text-slate-300 text-xs font-medium leading-relaxed max-w-2xl">
                  Si un pensionista no registra **Asistencia** ni **Aviso de
                  Inasistencia**, el sistema asumirá su presencia por defecto
                  según su plan contratado y se realizará el cobro normal sin
                  descuentos a fin de mes.
                </p>
              </div>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}

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
