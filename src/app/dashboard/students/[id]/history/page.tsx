"use client";

import { use, useState, useEffect, useCallback, Fragment } from "react";
import { Student, MealLog, StudentExtra } from "@/src/types";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import { calculateDailyTotal } from "@/src/lib/pricing";

interface PageProps {
  params: Promise<{ id: string }>;
}

type HistoryItem =
  | { type: "log"; data: MealLog }
  | { type: "extra"; data: StudentExtra };

export default function StudentHistoryPage({ params }: PageProps) {
  const { id } = use(params);
  const [student, setStudent] = useState<Student | null>(null);
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [extras, setExtras] = useState<StudentExtra[]>([]);
  const [activeTab, setActiveTab] = useState<
    "Todos" | "Desayuno" | "Almuerzo" | "Cena" | "Extras"
  >("Todos");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showPaid, setShowPaid] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentRange, setPaymentRange] = useState({
    start: new Date().toLocaleDateString("sv").split(" ")[0],
    end: new Date().toLocaleDateString("sv").split(" ")[0],
  });

  // Custom Modals State
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "success",
  });

  const calculateDebt = useCallback(() => {
    const unpaidLogs = logs.filter(
      (l) => !l.isPaid && l.status !== "Anulado" && l.status !== "Aviso",
    );
    const unpaidExtras = extras.filter((e) => !e.isPaid);

    // Group logs by date
    const logsByDate = unpaidLogs.reduce(
      (acc, log) => {
        const date = new Date(log.timestamp).toLocaleDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(log);
        return acc;
      },
      {} as Record<string, MealLog[]>,
    );

    let mealsDebt = 0;
    Object.values(logsByDate).forEach((dayLogs) => {
      mealsDebt += calculateDailyTotal(
        dayLogs.map((l) => ({ type: l.mealType, status: l.status })),
      );
    });

    const extrasDebt = unpaidExtras.reduce((sum, e) => sum + e.price, 0);
    return mealsDebt + extrasDebt;
  }, [logs, extras]);

  const currentDebt = calculateDebt();

  const calculatePaymentDebt = useCallback(() => {
    if (!paymentRange.start || !paymentRange.end) return 0;

    const start = new Date(paymentRange.start + "T00:00:00");
    const end = new Date(paymentRange.end + "T23:59:59");

    const unpaidLogs = logs.filter((l) => {
      if (l.isPaid || l.status === "Anulado" || l.status === "Aviso")
        return false;
      const logDate = new Date(l.timestamp);
      return logDate >= start && logDate <= end;
    });

    const unpaidExtras = extras.filter((e) => {
      if (e.isPaid) return false;
      const extraDate = new Date(e.createdAt);
      return extraDate >= start && extraDate <= end;
    });

    // Group logs by date
    const logsByDate = unpaidLogs.reduce(
      (acc, log) => {
        const date = new Date(log.timestamp).toLocaleDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(log);
        return acc;
      },
      {} as Record<string, MealLog[]>,
    );

    let mealsDebt = 0;
    Object.values(logsByDate).forEach((dayLogs) => {
      mealsDebt += calculateDailyTotal(
        dayLogs.map((l) => ({ type: l.mealType, status: l.status })),
      );
    });

    const extrasDebt = unpaidExtras.reduce((sum, e) => sum + e.price, 0);
    return mealsDebt + extrasDebt;
  }, [logs, extras, paymentRange]);

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
        dni: studentData.dni || "",
        email: studentData.email || "",
        phone: studentData.phone || "",
        address: studentData.address || "",
        birthDate: studentData.birth_date || "",
        career: studentData.career || "",
        joinedDate: studentData.joined_date || studentData.created_at,
        subscribedMeals: studentData.subscribed_meals || [],
        notes: studentData.notes || "",
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
      const dbLogs: MealLog[] = (logsData || []).map((log: any) => ({
        id: log.id,
        studentId: log.student_id,
        mealType: log.meal_type,
        timestamp: log.timestamp,
        status: log.status,
        hasExtra: log.has_extra,
        extraNotes: log.extra_notes,
        isPaid: log.is_paid,
        paymentDate: log.payment_date,
      }));

      // 3. Physical Sync: Multi-day window (Ensures Friday/Sunday backfill, skips Saturdays)
      const finalDbLogs = [...dbLogs];
      const logsToInsert: any[] = [];

      for (let i = 0; i < 3; i++) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - i);
        const isSaturday = checkDate.getDay() === 6;

        if (studentData && studentData.subscribed_meals && !isSaturday) {
          const dateStr = checkDate.toLocaleDateString("sv");
          const timestamp = checkDate.toISOString();

          studentData.subscribed_meals.forEach((meal: string) => {
            const exists = dbLogs.some((l) => {
              const logDate = new Date(l.timestamp).toLocaleDateString("sv");
              return l.mealType === meal && logDate === dateStr;
            });

            if (!exists) {
              logsToInsert.push({
                student_id: id,
                meal_type: meal,
                status: "Verificado",
                timestamp: timestamp,
              });
            }
          });
        }
      }

      if (logsToInsert.length > 0) {
        const { data: insertedData, error: syncError } = await supabase
          .from("meal_logs")
          .insert(logsToInsert)
          .select();

        if (!syncError && insertedData) {
          insertedData.forEach((newLog) => {
            finalDbLogs.push({
              id: newLog.id,
              studentId: newLog.student_id,
              mealType: newLog.meal_type,
              timestamp: newLog.timestamp,
              status: newLog.status as any,
              hasExtra: newLog.has_extra,
              extraNotes: newLog.extra_notes,
              isPaid: newLog.is_paid,
              paymentDate: newLog.payment_date,
            });
          });
        } else {
          console.log("Sync skipped or failed:", syncError);
        }
      }
      setLogs(finalDbLogs);
    }

    // 4. Fetch Extras
    const { data: extrasData, error: extrasError } = await supabase
      .from("student_extras")
      .select("*")
      .eq("student_id", id)
      .order("created_at", { ascending: false });

    if (extrasError) {
      console.error("Error fetching extras:", extrasError);
    } else {
      const dbExtras: StudentExtra[] = (extrasData || []).map((extra: any) => ({
        id: extra.id,
        studentId: extra.student_id,
        title: extra.title,
        price: extra.price,
        createdAt: extra.created_at,
        isPaid: extra.is_paid,
        paymentDate: extra.payment_date,
      }));
      setExtras(dbExtras);
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
    if (currentStatus === "Anulado" || currentStatus === "Aviso") {
      handleDeleteLog(logId, true);
      return;
    }

    const { error } = await supabase
      .from("meal_logs")
      .update({ status: "Anulado" })
      .eq("id", logId);

    if (error) {
      console.error("Error updating status:", error);
      setAlertModal({
        isOpen: true,
        title: "Error",
        message: "Error al anular el registro",
        type: "error",
      });
    } else {
      setLogs((prev) =>
        prev.map((log) =>
          log.id === logId ? { ...log, status: "Anulado" as any } : log,
        ),
      );
    }
  };

  const handleDeleteLog = async (
    logId: string,
    fastRestore: boolean = false,
  ) => {
    const executeDelete = async () => {
      const { error } = await supabase
        .from("meal_logs")
        .delete()
        .eq("id", logId);

      if (error) {
        console.error("Error deleting log:", error);
        setAlertModal({
          isOpen: true,
          title: "Error",
          message: "Error al eliminar el registro",
          type: "error",
        });
      } else {
        setLogs((prev) => prev.filter((log) => log.id !== logId));
      }
    };

    if (!fastRestore) {
      setConfirmationModal({
        isOpen: true,
        title: "Eliminar Registro",
        message:
          "¿Estás seguro de que deseas eliminar este registro permanentemente?",
        onConfirm: executeDelete,
      });
    } else {
      await executeDelete();
    }
  };

  const handleDeleteExtra = async (extraId: string) => {
    setConfirmationModal({
      isOpen: true,
      title: "Eliminar Extra",
      message: "¿Estás seguro de que deseas eliminar este consumo extra?",
      onConfirm: async () => {
        const { error } = await supabase
          .from("student_extras")
          .delete()
          .eq("id", extraId);

        if (error) {
          console.error("Error deleting extra:", error);
          setAlertModal({
            isOpen: true,
            title: "Error",
            message: "Error al eliminar extra",
            type: "error",
          });
        } else {
          setExtras((prev) => prev.filter((e) => e.id !== extraId));
        }
      },
    });
  };

  const handleRegisterPayment = () => {
    const debt = calculateDebt();
    if (debt === 0) {
      setAlertModal({
        isOpen: true,
        title: "Info",
        message: "No hay deuda pendiente para registrar pago.",
        type: "success",
      });
      return;
    }

    // Determine default date range
    const unpaidLogs = logs.filter(
      (l) => !l.isPaid && l.status !== "Anulado" && l.status !== "Aviso",
    );
    const unpaidExtras = extras.filter((e) => !e.isPaid);

    let minDate = new Date();

    unpaidLogs.forEach((l) => {
      const d = new Date(l.timestamp);
      if (d < minDate) minDate = d;
    });

    unpaidExtras.forEach((e) => {
      const d = new Date(e.createdAt);
      if (d < minDate) minDate = d;
    });

    setPaymentRange({
      start: minDate.toLocaleDateString("sv").split(" ")[0], // "sv" locale gives YYYY-MM-DD
      end: new Date().toLocaleDateString("sv").split(" ")[0],
    });

    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    const debt = calculatePaymentDebt();
    if (debt === 0) return;

    setConfirmationModal({
      isOpen: true,
      title: "Confirmar Pago",
      message: `¿Confirmar pago de S/ ${debt.toFixed(2)} por el rango seleccionado?`,
      onConfirm: async () => {
        const start = new Date(paymentRange.start + "T00:00:00");
        const end = new Date(paymentRange.end + "T23:59:59");

        const unpaidLogIds = logs
          .filter((l) => {
            // Include "Aviso" so they get marked as paid/settled and disappear from pending list
            if (l.isPaid || l.status === "Anulado") return false;

            const logDate = new Date(l.timestamp);
            return logDate >= start && logDate <= end;
          })
          .map((l) => l.id);

        const unpaidExtraIds = extras
          .filter((e) => {
            if (e.isPaid) return false;
            const extraDate = new Date(e.createdAt);
            return extraDate >= start && extraDate <= end;
          })
          .map((e) => e.id);

        try {
          const now = new Date().toISOString();

          console.log("Processing Payment...", { start, end });
          console.log("Unpaid Logs IDs:", unpaidLogIds);
          console.log("Unpaid Extras IDs:", unpaidExtraIds);

          if (unpaidLogIds.length > 0) {
            const { error: logError } = await supabase
              .from("meal_logs")
              .update({ is_paid: true, payment_date: now })
              .in("id", unpaidLogIds);
            if (logError) throw logError;
          }

          if (unpaidExtraIds.length > 0) {
            console.log("Updating extras...", unpaidExtraIds);
            const { data: extraData, error: extraError } = await supabase
              .from("student_extras")
              .update({ is_paid: true, payment_date: now })
              .in("id", unpaidExtraIds)
              .select();

            console.log("Extras update result:", { extraData, extraError });

            if (extraError) throw extraError;
          }

          if (unpaidExtraIds.length > 0) {
            const { error: extraError } = await supabase
              .from("student_extras")
              .update({ is_paid: true, payment_date: now })
              .in("id", unpaidExtraIds);
            if (extraError) throw extraError;
          }

          setIsPaymentModalOpen(false);
          setAlertModal({
            isOpen: true,
            title: "Éxito",
            message: "Pago registrado con éxito.",
            type: "success",
          });
          fetchStudentData();
        } catch (err: any) {
          console.error("Error processing payment:", err);

          const isColumnError =
            err.message?.includes('column "is_paid" does not exist') ||
            err.message?.includes("is_paid");

          setAlertModal({
            isOpen: true,
            title: isColumnError ? "Falta Actualización DB" : "Error",
            message: isColumnError
              ? "Error: La tabla de extras no tiene la columna de pagos. Por favor ejecuta el script SQL 'supabase_add_payment_to_extras.sql' en Supabase."
              : "Hubo un error al registrar el pago. Inténtalo de nuevo.",
            type: "error",
          });
        }
      },
    });
  };

  const allHistory: HistoryItem[] = [
    ...logs.map((log) => ({ type: "log" as const, data: log })),
    ...extras.map((extra) => ({ type: "extra" as const, data: extra })),
  ];

  const filteredHistory = allHistory
    .filter((item) => {
      const isExtra = item.type === "extra";
      const timestamp =
        item.type === "log" ? item.data.timestamp : item.data.createdAt;

      if (activeTab === "Extras") {
        if (!isExtra) return false;
      } else if (activeTab !== "Todos") {
        if (isExtra) return false;
        if (item.data.mealType !== activeTab) return false;
      }

      let matchesDate = true;
      if (startDate || endDate) {
        const itemDate = new Date(timestamp);
        itemDate.setHours(0, 0, 0, 0);

        if (startDate) {
          const [y, m, d] = startDate.split("-").map(Number);
          const start = new Date(y, m - 1, d);
          if (itemDate < start) matchesDate = false;
        }
        if (endDate) {
          const [y, m, d] = endDate.split("-").map(Number);
          const end = new Date(y, m - 1, d);
          if (itemDate > end) matchesDate = false;
        }
      }

      if (showPaid) {
        if (!item.data.isPaid) return false;
      } else {
        if (item.data.isPaid) return false;
      }

      return matchesDate;
    })
    .sort((a, b) => {
      const tA = a.type === "log" ? a.data.timestamp : a.data.createdAt;
      const tB = b.type === "log" ? b.data.timestamp : b.data.createdAt;
      return new Date(tB).getTime() - new Date(tA).getTime();
    });

  return (
    <div className="space-y-8 animate-in fade-in slide-up duration-500 pb-20">
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
        {/* Supeior Actions Bar */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[#1ABB9C] rounded-full"></div>
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
              Panel de Filtrado
            </h4>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white px-1 py-1 rounded-2xl border border-slate-200 shadow-sm">
              <button
                onClick={() => setShowPaid(false)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  !showPaid
                    ? "bg-rose-50 text-rose-500 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Pendientes
              </button>
              <button
                onClick={() => setShowPaid(true)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  showPaid
                    ? "bg-emerald-50 text-emerald-500 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Pagados
              </button>
            </div>

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
              onClick={() => fetchStudentData()}
              className="h-12 w-12 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-[#1ABB9C] hover:border-[#1ABB9C] hover:shadow-lg transition-all group shadow-sm active:scale-95"
              title="Actualizar datos"
            >
              <RefreshIcon
                size={18}
                className="transition-transform group-hover:rotate-180 duration-700"
              />
            </button>

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

              <div className="flex items-center gap-1.5 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50 shadow-inner overflow-x-auto">
                {(
                  ["Todos", "Desayuno", "Almuerzo", "Cena", "Extras"] as const
                ).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2 text-[9px] font-black uppercase tracking-widest rounded-[1rem] transition-all flex items-center gap-3 whitespace-nowrap ${
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
                      {tab === "Extras"
                        ? extras.length
                        : logs.filter(
                            (l) =>
                              l.studentId === student.id &&
                              (tab === "Todos" || l.mealType === tab),
                          ).length + (tab === "Todos" ? extras.length : 0)}
                    </span>
                  </button>
                ))}
              </div>

              <div className="hidden xl:block">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1ABB9C]"></div>
                  <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest">
                    <span className="text-[#1ABB9C]">
                      {filteredHistory.length}
                    </span>{" "}
                    Registros
                  </p>
                </div>
              </div>

              {!showPaid && (
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Deuda Total Pendiente
                    </span>
                    <span className="text-xl font-black text-rose-500">
                      S/ {currentDebt.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={handleRegisterPayment}
                    disabled={currentDebt === 0}
                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 ${
                      currentDebt > 0
                        ? "bg-[#1ABB9C] text-white hover:bg-[#16a085] shadow-[#1ABB9C]/20 active:scale-95"
                        : "bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed"
                    }`}
                  >
                    <span>Registrar Pago</span>
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
                      <path d="M12 2v20" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </button>
                </div>
              )}
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
                  {Object.entries(
                    filteredHistory.reduce(
                      (groups, item) => {
                        const date = new Date(
                          item.type === "log"
                            ? item.data.timestamp
                            : item.data.createdAt,
                        ).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        });
                        if (!groups[date]) groups[date] = [];
                        groups[date].push(item);
                        return groups;
                      },
                      {} as Record<string, HistoryItem[]>,
                    ),
                  ).map(([dateStr, items]) => {
                    // Calculate Daily Total
                    const dailyLogs = items
                      .filter((i) => i.type === "log")
                      .map((i) => (i as { type: "log"; data: MealLog }).data);

                    const dailyExtras = items
                      .filter((i) => i.type === "extra")
                      .map(
                        (i) =>
                          (i as { type: "extra"; data: StudentExtra }).data,
                      );

                    const mealsTotal = calculateDailyTotal(
                      dailyLogs.map((l) => ({
                        type: l.mealType,
                        status: l.status,
                      })),
                    );
                    const extrasTotal = dailyExtras.reduce(
                      (sum, e) => sum + e.price,
                      0,
                    );
                    const dayTotal = mealsTotal + extrasTotal;

                    return (
                      <Fragment key={dateStr}>
                        {/* Daily Header */}
                        <tr
                          key={`header-${dateStr}`}
                          className="bg-slate-50/50"
                        >
                          <td colSpan={4} className="px-8 py-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {dateStr}
                              </span>
                              <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">
                                  CONSUMIDO:
                                </span>
                                <span className="text-xs font-black text-[#2A3F54]">
                                  S/ {dayTotal.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* Items */}
                        {items.map((item) => {
                          if (item.type === "extra") {
                            const extra = item.data;
                            return (
                              <tr
                                key={`extra-${extra.id}`}
                                className="group transition-all hover:bg-amber-50/10"
                              >
                                <td className="px-8 py-6 whitespace-nowrap pl-12 border-l-4 border-transparent hover:border-amber-200">
                                  <div className="flex items-center gap-5">
                                    <div className="w-10 h-10 rounded-xl bg-white border border-amber-200 flex flex-col items-center justify-center shadow-sm shadow-amber-100/50">
                                      <span className="text-[10px] font-bold text-amber-500">
                                        {new Date(
                                          extra.createdAt,
                                        ).toLocaleTimeString("es-ES", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>
                                    <span className="text-xs font-black text-slate-600">
                                      Extra Registrado
                                    </span>
                                  </div>
                                </td>
                                <td className="px-8 py-6 whitespace-nowrap">
                                  <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500 text-white shadow-md shadow-amber-500/20">
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
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                      </svg>
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-slate-700">
                                          {extra.title}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-8 py-6 whitespace-nowrap">
                                  {extra.isPaid ? (
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase tracking-widest rounded-xl border border-emerald-200">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 shadow-sm"></div>
                                      S/ {extra.price.toFixed(2)}
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-600 text-[8px] font-black uppercase tracking-widest rounded-xl border border-amber-100/50">
                                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></div>
                                      S/ {extra.price.toFixed(2)}
                                    </div>
                                  )}
                                </td>
                                <td className="px-8 py-6 whitespace-nowrap text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() =>
                                        handleDeleteExtra(extra.id)
                                      }
                                      className="px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          } else {
                            const log = item.data;
                            return (
                              <tr
                                key={log.id}
                                className={`group transition-all ${
                                  log.status === "Anulado" ||
                                  log.status === "Aviso"
                                    ? "bg-rose-50/20"
                                    : "hover:bg-slate-50"
                                }`}
                              >
                                <td className="px-8 py-6 whitespace-nowrap pl-12 border-l-4 border-transparent hover:border-slate-200">
                                  <div className="flex items-center gap-5">
                                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center shadow-sm">
                                      <span className="text-[10px] font-bold text-slate-500">
                                        {new Date(
                                          log.timestamp,
                                        ).toLocaleTimeString("es-ES", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>
                                    <span className="text-xs font-black text-slate-600">
                                      {log.status === "Suscripcion"
                                        ? "Automático"
                                        : "Registro Kiosko"}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-8 py-6 whitespace-nowrap">
                                  <div
                                    className={`flex items-center gap-4 transition-all ${
                                      log.status === "Anulado" ||
                                      log.status === "Aviso"
                                        ? "opacity-50 grayscale"
                                        : ""
                                    }`}
                                  >
                                    <div
                                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                        log.mealType === "Desayuno"
                                          ? "bg-amber-100 text-amber-600"
                                          : log.mealType === "Almuerzo"
                                            ? "bg-emerald-100 text-emerald-600"
                                            : "bg-indigo-100 text-indigo-600"
                                      }`}
                                    >
                                      <ClockIcon size={16} />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`text-sm font-black text-slate-700 transition-all ${
                                            log.status === "Anulado" ||
                                            log.status === "Aviso"
                                              ? "line-through text-slate-400"
                                              : ""
                                          }`}
                                        >
                                          {log.mealType}
                                        </span>
                                        {log.hasExtra && (
                                          <span className="text-[7px] font-black text-white bg-rose-500 px-1.5 py-0.5 rounded-md uppercase tracking-widest">
                                            Extra
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-8 py-6 whitespace-nowrap">
                                  <div className="flex items-center gap-3">
                                    {log.isPaid ? (
                                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase tracking-widest rounded-xl border border-emerald-200">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 shadow-sm"></div>
                                        PAGADO
                                        <span className="text-[7px] opacity-70 ml-1">
                                          {log.paymentDate
                                            ? new Date(
                                                log.paymentDate,
                                              ).toLocaleDateString("es-ES", {
                                                day: "2-digit",
                                                month: "2-digit",
                                              })
                                            : ""}
                                        </span>
                                      </div>
                                    ) : log.status === "Anulado" ||
                                      log.status === "Aviso" ? (
                                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-500 text-[8px] font-black uppercase tracking-widest rounded-xl">
                                        {log.status}
                                      </div>
                                    ) : (
                                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sky-50 text-sky-600 text-[8px] font-black uppercase tracking-widest rounded-xl border border-sky-100/50">
                                        <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse shadow-[0_0_8px_rgba(14,165,233,0.4)]"></div>
                                        PENDIENTE
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-8 py-6 whitespace-nowrap text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {log.status !== "Suscripcion" && (
                                      <button
                                        onClick={() =>
                                          handleToggleStatus(log.id, log.status)
                                        }
                                        className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${
                                          log.status === "Anulado" ||
                                          log.status === "Aviso"
                                            ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                            : "bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                                        }`}
                                      >
                                        {log.status === "Anulado" ||
                                        log.status === "Aviso"
                                          ? "Restaurar"
                                          : "Anular"}
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          }
                        })}
                      </Fragment>
                    );
                  })}
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
      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col md:flex-row">
            {/* Calendar Section */}
            <div className="p-6 bg-slate-50 border-r border-slate-100 md:w-1/2">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    const d = new Date(paymentRange.start || new Date());
                    d.setMonth(d.getMonth() - 1);
                    setPaymentRange((prev) => ({
                      ...prev,
                      start: d.toISOString().split("T")[0],
                    }));
                  }}
                  className="p-1 hover:bg-white rounded-lg transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-slate-400"
                  >
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <span className="text-xs font-black text-slate-700 uppercase tracking-widest">
                  {new Date(
                    paymentRange.start || new Date(),
                  ).toLocaleDateString("es-ES", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <button
                  onClick={() => {
                    const d = new Date(paymentRange.start || new Date());
                    d.setMonth(d.getMonth() + 1);
                    setPaymentRange((prev) => ({
                      ...prev,
                      start: d.toISOString().split("T")[0],
                    }));
                  }}
                  className="p-1 hover:bg-white rounded-lg transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-slate-400"
                  >
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {["D", "L", "M", "M", "J", "V", "S"].map((d, i) => (
                  <div
                    key={i}
                    className="text-[10px] font-black text-slate-300 text-center uppercase"
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  const currentMonthDate = new Date(
                    paymentRange.start || new Date(),
                  );
                  const year = currentMonthDate.getFullYear();
                  const month = currentMonthDate.getMonth();

                  const firstDay = new Date(year, month, 1);
                  const lastDay = new Date(year, month + 1, 0);
                  const daysInMonth = lastDay.getDate();
                  const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

                  const days = [];
                  // Empty slots for previous month
                  for (let i = 0; i < startDayOfWeek; i++) {
                    days.push(<div key={`empty-${i}`} className="h-8"></div>);
                  }

                  // Days
                  for (let d = 1; d <= daysInMonth; d++) {
                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

                    // Check status
                    // Check status
                    const dayLogs = logs.filter((l) => {
                      const logDateStr = new Date(l.timestamp)
                        .toLocaleDateString("sv")
                        .split(" ")[0];
                      return logDateStr === dateStr;
                    });
                    const dayExtras = extras.filter((e) => {
                      const extraDateStr = new Date(e.createdAt)
                        .toLocaleDateString("sv")
                        .split(" ")[0];
                      return extraDateStr === dateStr;
                    });
                    const hasActivity =
                      dayLogs.length > 0 || dayExtras.length > 0;

                    const isFullyPaid =
                      hasActivity &&
                      dayLogs.every((l) => l.isPaid) &&
                      dayExtras.every((e) => e.isPaid);

                    const hasPending = hasActivity && !isFullyPaid;

                    const isSelected =
                      dateStr >= paymentRange.start &&
                      dateStr <= paymentRange.end;

                    days.push(
                      <button
                        key={d}
                        onClick={() => {
                          setPaymentRange({ start: dateStr, end: dateStr });
                        }}
                        className={`h-8 rounded-lg flex flex-col items-center justify-center relative transition-all ${
                          isSelected
                            ? "bg-[#1ABB9C] text-white shadow-md shadow-[#1ABB9C]/30"
                            : "hover:bg-slate-100 text-slate-600"
                        }`}
                      >
                        <span className="text-[10px] font-bold">{d}</span>
                        {hasPending && (
                          <div className="w-1 h-1 rounded-full bg-rose-500 mt-0.5"></div>
                        )}
                        {isFullyPaid && !hasPending && (
                          <div className="w-1 h-1 rounded-full bg-emerald-500 mt-0.5"></div>
                        )}
                      </button>,
                    );
                  }
                  return days;
                })()}
              </div>

              <div className="mt-4 flex gap-4 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">
                    Pendiente
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">
                    Pagado
                  </span>
                </div>
              </div>
            </div>

            {/* Controls Section */}
            <div className="p-6 md:w-1/2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#1ABB9C]/10 rounded-xl">
                      <HistoryIcon size={20} className="text-[#1ABB9C]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                        Registrar Pago
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Seleccione el periodo
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:text-rose-500 hover:border-rose-200 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Desde
                    </label>
                    <input
                      type="date"
                      value={paymentRange.start}
                      onChange={(e) =>
                        setPaymentRange((prev) => ({
                          ...prev,
                          start: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#1ABB9C] transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Hasta
                    </label>
                    <input
                      type="date"
                      value={paymentRange.end}
                      onChange={(e) =>
                        setPaymentRange((prev) => ({
                          ...prev,
                          end: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#1ABB9C] transition-colors"
                    />
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between mt-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Total a Pagar
                    </span>
                    <span className="text-2xl font-black text-[#1ABB9C]">
                      S/ {calculatePaymentDebt().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:text-slate-600 hover:border-slate-300 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmPayment}
                  className="flex-1 px-4 py-3 bg-[#1ABB9C] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#16a085] shadow-lg shadow-[#1ABB9C]/20 transition-all active:scale-95"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Alert Modal */}
      {alertModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 max-w-sm w-full mx-4 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${alertModal.type === "success" ? "bg-emerald-100 text-emerald-500" : "bg-rose-100 text-rose-500"}`}
            >
              {alertModal.type === "success" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">
                {alertModal.title}
              </h3>
              <p className="text-sm text-slate-500 font-medium mt-1">
                {alertModal.message}
              </p>
            </div>
            <button
              onClick={() =>
                setAlertModal((prev) => ({ ...prev, isOpen: false }))
              }
              className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-sm uppercase tracking-widest hover:bg-slate-800 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmationModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 max-w-sm w-full mx-4 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">
                {confirmationModal.title}
              </h3>
              <p className="text-sm text-slate-500 font-medium mt-1">
                {confirmationModal.message}
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={() =>
                  setConfirmationModal((prev) => ({ ...prev, isOpen: false }))
                }
                className="flex-1 py-3 rounded-xl bg-white border border-slate-200 text-slate-500 font-bold text-sm uppercase tracking-widest hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  confirmationModal.onConfirm();
                  setConfirmationModal((prev) => ({ ...prev, isOpen: false }));
                }}
                className="flex-1 py-3 rounded-xl bg-[#1ABB9C] text-white font-bold text-sm uppercase tracking-widest hover:bg-[#16a085] shadow-lg shadow-[#1ABB9C]/20 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
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

const RefreshIcon = ({
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
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
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
