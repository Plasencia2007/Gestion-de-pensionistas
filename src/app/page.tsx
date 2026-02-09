"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate login delay
    setTimeout(() => {
      router.push("/dashboard");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-4">
      <div
        className={`relative overflow-hidden bg-white rounded-2xl shadow-2xl w-[850px] max-w-full min-h-[520px] transition-all duration-700`}
        id="container"
      >
        {/* Registration Form (Sign Up) - COMMENTED OUT FOR NOW
        <div
          className={`absolute top-0 h-full transition-all duration-700 ease-in-out left-0 w-1/2 z-[1] ${isRightPanelActive ? "translate-x-full opacity-100 z-[5]" : "opacity-0"}`}
        >
          <form
            className="bg-white flex flex-col items-center justify-center px-10 md:px-14 h-full text-center"
            onSubmit={(e) => e.preventDefault()}
          >
            <h1 className="font-extrabold m-0 text-3xl text-[#2A3F54] tracking-tight">
              Crea tu Cuenta
            </h1>
            <div className="my-6 flex space-x-3">
              <SocialLink icon={<FacebookIcon />} />
              <SocialLink icon={<GoogleIcon />} />
              <SocialLink icon={<TwitterIcon />} />
            </div>
            <span className="text-xs text-[#73879C] mb-4">
              o usa tu correo electrónico
            </span>
            <div className="w-full space-y-2">
              <Input type="text" placeholder="Nombre completo" />
              <Input type="email" placeholder="Correo electrónico" />
              <Input type="password" placeholder="Contraseña" />
            </div>
            <button className="mt-8 px-12 py-3 rounded-full border border-[#1ABB9C] bg-[#1ABB9C] text-white text-xs font-bold tracking-[2px] uppercase transition-all duration-100 active:scale-95 hover:bg-[#16a085] shadow-lg shadow-[#1ABB9C]/30">
              Registrarse
            </button>
          </form>
        </div>
        */}

        {/* Login Form (Sign In) */}
        <div
          className={`absolute top-0 h-full transition-all duration-700 ease-in-out left-0 w-1/2 z-[2] ${isRightPanelActive ? "translate-x-full" : ""}`}
        >
          <form
            className="bg-white flex flex-col items-center justify-center px-10 md:px-14 h-full text-center"
            onSubmit={handleLogin}
          >
            <h1 className="font-extrabold m-0 text-3xl text-[#2A3F54] tracking-tight">
              Iniciar Sesión
            </h1>
            <div className="my-6 flex space-x-3">
              <SocialLink icon={<FacebookIcon />} />
              <SocialLink icon={<GoogleIcon />} />
              <SocialLink icon={<TwitterIcon />} />
            </div>
            <span className="text-xs text-[#73879C] mb-4">
              accede con tu cuenta registrada
            </span>
            <div className="w-full space-y-2">
              <Input type="email" placeholder="Correo electrónico" required />
              <Input type="password" placeholder="Contraseña" required />
            </div>
            <a
              href="#"
              className="text-[#337AB7] text-sm hover:underline mt-4 mb-2 transition-all"
            >
              ¿Olvidaste tu contraseña?
            </a>
            <button
              type="submit"
              disabled={loading}
              className="mt-4 px-12 py-3 rounded-full border border-[#1ABB9C] bg-[#1ABB9C] text-white text-xs font-bold tracking-[2px] uppercase transition-all duration-100 active:scale-95 hover:bg-[#16a085] disabled:opacity-50 shadow-lg shadow-[#1ABB9C]/30 flex items-center justify-center min-w-[180px]"
            >
              {loading ? (
                <span className="flex items-center">
                  <LoadingSpinner />
                  Validando...
                </span>
              ) : (
                "Ingresar"
              )}
            </button>
          </form>
        </div>

        {/* Sliding Overlay */}
        <div
          className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-[100] ${isRightPanelActive ? "-translate-x-full" : ""}`}
        >
          <div
            className={`bg-[#1ABB9C] bg-gradient-to-br from-[#1ABB9C] to-[#2A3F54] text-white relative left-[-100%] h-full w-[200%] transition-transform duration-700 ease-in-out ${isRightPanelActive ? "translate-x-1/2" : "translate-x-0"}`}
          >
            {/* Left Overlay Content (Visible when Sign Up is active) - COMMENTED OUT
            <div
              className={`absolute top-0 flex flex-col items-center justify-center px-10 text-center h-full w-1/2 transition-transform duration-700 ease-in-out ${isRightPanelActive ? "translate-x-0" : "-translate-x-[20%]"}`}
            >
              <h1 className="font-extrabold m-0 text-3xl">
                ¡Bienvenido de nuevo!
              </h1>
              <p className="text-sm font-medium leading-relaxed tracking-wide mt-6 mb-10 opacity-90">
                Para mantenerte conectado con nosotros, por favor inicia sesión
                con tus datos personales.
              </p>
              <button
                onClick={() => setIsRightPanelActive(false)}
                className="px-12 py-3 rounded-full border border-white bg-transparent text-white text-xs font-bold tracking-[2px] uppercase transition-all hover:bg-white hover:text-[#1ABB9C] active:scale-95"
              >
                Ir a Login
              </button>
            </div>
            */}

            {/* Right Overlay Content (Visible when Sign In is active) */}
            <div
              className={`absolute top-0 right-0 flex flex-col items-center justify-center px-10 text-center h-full w-1/2 transition-transform duration-700 ease-in-out ${isRightPanelActive ? "translate-x-[20%]" : "translate-x-0"}`}
            >
              <h1 className="font-extrabold m-0 text-3xl">
                Gestión de Pensionistas
              </h1>
              <p className="text-sm font-medium leading-relaxed tracking-wide mt-6 mb-10 opacity-90">
                Bienvenido al sistema de control y gestión. Por favor, ingresa
                tus credenciales para acceder al panel administrativo.
              </p>
              {/* Toggle to sign up commented out
              <button
                onClick={() => setIsRightPanelActive(true)}
                className="px-12 py-3 rounded-full border border-white bg-transparent text-white text-xs font-bold tracking-[2px] uppercase transition-all hover:bg-white hover:text-[#1ABB9C] active:scale-95"
              >
                Crear Cuenta
              </button>
              */}
            </div>
          </div>
        </div>
      </div>

      {/* Modern Footer */}
      <footer className="mt-12 text-center text-slate-500 text-xs animate-in fade-in slide-up space-y-4">
        <div className="flex flex-col items-center">
          <p className="text-slate-400 mb-2 font-semibold uppercase tracking-widest text-[10px]">
            Portal de Autoservicio
          </p>
          <a
            href="/kiosk"
            className="flex items-center space-x-3 px-8 py-3 bg-white border border-slate-200 rounded-full hover:border-[#1ABB9C] hover:text-[#1ABB9C] transition-all duration-300 shadow-sm group active:scale-95"
          >
            <div className="w-8 h-8 rounded-full bg-[#1ABB9C]/10 flex items-center justify-center text-[#1ABB9C] group-hover:bg-[#1ABB9C] group-hover:text-white transition-colors">
              <UsersIcon />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold leading-none">
                Acceso Estudiantes
              </p>
              <p className="text-[10px] opacity-70">
                Registra tu consumo en el Kiosko
              </p>
            </div>
          </a>
        </div>

        <div className="pt-8 opacity-60">
          <p className="font-medium">© 2026 Gestión de Pensionistas</p>
          <p className="mt-1">
            Desarrollado para una administración eficiente y segura.
          </p>
        </div>
      </footer>
    </div>
  );
}

function SocialLink({ icon }: { icon: React.ReactNode }) {
  return (
    <a
      href="#"
      className="border border-slate-200 rounded-full inline-flex justify-center items-center h-10 w-10 text-slate-600 hover:text-[#1ABB9C] hover:border-[#1ABB9C] hover:bg-[#1ABB9C]/5 transition-all duration-300 transform hover:scale-110"
    >
      {icon}
    </a>
  );
}

function Input({
  type,
  placeholder,
  required,
}: {
  type: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      required={required}
      className="bg-slate-100 border-none px-4 py-3 text-sm rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#1ABB9C]/20 transition-all placeholder:text-slate-400"
    />
  );
}

const UsersIcon = () => (
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
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const LoadingSpinner = () => (
  <svg
    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

const FacebookIcon = () => (
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
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const GoogleIcon = () => (
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
    <path d="M10 24A12 12 0 1 0 10 0C4.477 0 0 4.477 0 10c0 1.54.29 3.007.818 4.357L.063 21l6.643-2.31c1.01.2 2.053.31 3.124.31zM10 4a6 6 0 0 1 0 12c-1.127 0-2.18-.31-3.076-.846l-3.32.936.936-3.32A5.96 5.96 0 0 1 4 10c0-3.313 2.687-6 6-6z" />
  </svg>
);

const TwitterIcon = () => (
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
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);
