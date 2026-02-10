"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function WIPContent() {
  const searchParams = useSearchParams();
  const feature = searchParams.get("feature") || "Esta sección";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-in fade-in slide-up duration-700">
      <div className="w-24 h-24 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 mb-8 border border-amber-100 shadow-sm relative">
        <div className="absolute inset-0 bg-amber-400/20 rounded-3xl animate-ping opacity-20"></div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>
      </div>

      <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-4">
        {feature} en Construcción
      </h1>
      <p className="text-slate-500 max-w-md mx-auto leading-relaxed mb-10 font-medium">
        Estamos trabajando arduamente para traerte esta nueva funcionalidad.
        ¡Vuelve pronto para ver las novedades!
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/dashboard"
          className="px-8 py-3 bg-[#1ABB9C] text-white font-black rounded-2xl hover:bg-[#16a085] transition-all text-sm uppercase tracking-widest shadow-lg shadow-[#1ABB9C]/20"
        >
          Volver al Inicio
        </Link>
        <button
          onClick={() => window.history.back()}
          className="px-8 py-3 bg-white border border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-all text-sm uppercase tracking-widest"
        >
          Regresar
        </button>
      </div>
    </div>
  );
}

export default function WIPPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <WIPContent />
    </Suspense>
  );
}
