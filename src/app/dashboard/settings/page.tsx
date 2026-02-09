"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const settingsSchema = z.object({
  institutionName: z.string().min(3, "El nombre es demasiado corto"),
  ruc: z
    .string()
    .length(11, "El RUC debe tener 11 dígitos")
    .regex(/^\d+$/, "Solo números"),
  slogan: z.string().min(5, "El slogan es demasiado corto"),
  darkMode: z.boolean(),
  audioNotifications: z.boolean(),
  ticketHeader: z.string().min(3, "El encabezado es requerido"),
  ticketFooter: z.string().min(5, "El pie de página es requerido"),
  printDate: z.boolean(),
  showStudentCode: z.boolean(),
  kioskCooldown: z
    .number()
    .min(0, "Debe ser positivo")
    .max(3600, "Máximo 1 hora"),
  kioskFullscreen: z.boolean(),
  showAvatar: z.boolean(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<
    "general" | "horarios" | "ticket" | "kiosko" | "usuarios" | "datos"
  >("general");

  const TABS = [
    { id: "general", label: "General", icon: <SettingsIcon /> },
    { id: "horarios", label: "Horarios Comedor", icon: <ClockIcon /> },
    { id: "ticket", label: "Config. Ticket", icon: <PrintIcon /> },
    { id: "kiosko", label: "Terminal Kiosko", icon: <MonitorIcon /> },
    { id: "usuarios", label: "Usuarios Admin", icon: <UsersIcon /> },
    { id: "datos", label: "Base de Datos", icon: <DatabaseIcon /> },
  ] as const;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema) as any,
    defaultValues: {
      institutionName: "Comedor Universitario UNCP",
      ruc: "20458932011",
      slogan: "Comprometidos con el bienestar estudiantil",
      darkMode: false,
      audioNotifications: true,
      ticketHeader: "COMEDOR CENTRAL UNCP",
      ticketFooter:
        "¡Buen provecho! Conserve su ticket para futuras auditorías.",
      printDate: true,
      showStudentCode: false,
      kioskCooldown: 300,
      kioskFullscreen: true,
      showAvatar: true,
    },
  });

  const onSubmit: SubmitHandler<SettingsFormData> = (data) => {
    console.log("Configuración guardada:", data);
    alert("Configuración actualizada con éxito");
  };

  const formValues = watch();

  return (
    <div className="space-y-8 animate-in fade-in slide-up duration-500 pb-20">
      {/* Header Section */}
      <form onSubmit={handleSubmit(onSubmit as any)}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <span className="p-2 bg-[#1ABB9C]/10 rounded-lg text-[#1ABB9C]">
                <SettingsIcon />
              </span>
              Configuración del Sistema
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">
              Gestione las reglas de negocio, horarios y parámetros técnicos de
              la plataforma.
            </p>
          </div>
          <button
            type="submit"
            disabled={!isDirty}
            className={`px-8 py-3 rounded-2xl text-xs font-black transition-all shadow-lg flex items-center gap-2 uppercase tracking-widest ${
              isDirty
                ? "bg-[#1ABB9C] text-white hover:bg-[#16a085] shadow-[#1ABB9C]/20"
                : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
            }`}
          >
            <SaveIcon size={16} /> {isDirty ? "Guardar Cambios" : "Sin Cambios"}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Navigation Sidebar */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-4 space-y-2 sticky top-24">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${
                    activeTab === tab.id
                      ? "bg-[#2A3F54] text-white shadow-lg shadow-[#2A3F54]/20"
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={activeTab === tab.id ? "text-[#1ABB9C]" : ""}
                  >
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden border-b-4 border-b-[#1ABB9C]/20 min-h-[600px] flex flex-col">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xs font-black text-[#1ABB9C] uppercase tracking-[0.2em] flex items-center gap-3">
                  {TABS.find((t) => t.id === activeTab)?.label}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                  Último cambio: Hoy, 10:45 AM
                </p>
              </div>

              <div className="p-10 flex-1 overflow-y-auto">
                {activeTab === "general" && (
                  <GeneralSettings register={register} errors={errors} />
                )}
                {activeTab === "horarios" && <DiningSchedules />}
                {activeTab === "ticket" && (
                  <TicketConfiguration
                    register={register}
                    errors={errors}
                    previewData={formValues}
                  />
                )}
                {activeTab === "kiosko" && (
                  <KioskSettings register={register} errors={errors} />
                )}
                {activeTab === "usuarios" && <UserManagement />}
                {activeTab === "datos" && <DatabaseMaintenance />}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

// --- Sub-components (Sections) ---

function GeneralSettings({ register, errors }: any) {
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="space-y-6">
        <SectionTitle
          title="Identidad de la Institución"
          icon={<UsersIcon />}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <SettingHookInput
            label="Nombre de la Institución"
            placeholder="Ej. Universidad Central del Perú"
            register={register("institutionName")}
            error={errors.institutionName?.message}
          />
          <SettingHookInput
            label="Número de RUC / Registro"
            placeholder="20XXXXXXXXX"
            register={register("ruc")}
            error={errors.ruc?.message}
          />
          <div className="md:col-span-2">
            <SettingHookInput
              label="Lema o Eslogan Institucional"
              placeholder="Ej. Alimento para el conocimiento"
              register={register("slogan")}
              error={errors.slogan?.message}
            />
          </div>
        </div>
      </div>

      <div className="space-y-6 pt-6 border-t border-slate-100">
        <SectionTitle title="Preferencias de Interfaz" icon={<MonitorIcon />} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <SettingHookToggle
            title="Modo Oscuro Automático"
            description="Cambia el tema según la hora del sistema"
            register={register("darkMode")}
          />
          <SettingHookToggle
            title="Notificaciones de Audio"
            description="Reproducir sonidos en validación exitosa"
            register={register("audioNotifications")}
          />
        </div>
      </div>
    </div>
  );
}

function DiningSchedules() {
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <SectionTitle title="Reglas de Servicio" icon={<ClockIcon />} />
      <div className="grid grid-cols-1 gap-6">
        <ScheduleCard
          id="breakfast"
          title="Desayuno"
          icon={<CoffeeIcon />}
          start="07:00 AM"
          end="09:00 AM"
          active={true}
        />
        <ScheduleCard
          id="lunch"
          title="Almuerzo"
          icon={<UtensilsIcon />}
          start="12:00 PM"
          end="03:00 PM"
          active={true}
        />
        <ScheduleCard
          id="dinner"
          title="Cena"
          icon={<MoonIcon />}
          start="06:00 PM"
          end="08:00 PM"
          active={false}
        />
      </div>

      <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4">
        <div className="p-2 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-200 shrink-0">
          <WarningIcon size={20} />
        </div>
        <div>
          <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest leading-none mb-1">
            Nota Preventiva
          </h4>
          <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
            Los cambios en los horarios afectarán la validación en tiempo real
            del terminal Kiosko. Verifique que los turnos no se solapen.
          </p>
        </div>
      </div>
    </div>
  );
}

function TicketConfiguration({ register, errors, previewData }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in duration-500">
      <div className="space-y-8">
        <SectionTitle title="Contenido del Ticket" icon={<PrintIcon />} />
        <div className="space-y-6">
          <SettingHookInput
            label="Encabezado del Voucher"
            placeholder="Texto superior"
            register={register("ticketHeader")}
            error={errors.ticketHeader?.message}
          />
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <PlusIcon size={12} /> Texto de Pie de Página
            </label>
            <textarea
              {...register("ticketFooter")}
              rows={3}
              className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl focus:ring-4 outline-none transition-all font-bold text-sm text-slate-700 ${
                errors.ticketFooter
                  ? "border-rose-200 focus:ring-rose-500/10 focus:border-rose-500"
                  : "border-slate-100 focus:ring-[#1ABB9C]/10 focus:border-[#1ABB9C]"
              }`}
            ></textarea>
            {errors.ticketFooter && (
              <p className="text-[10px] text-rose-500 font-black uppercase ml-1">
                {errors.ticketFooter.message}
              </p>
            )}
          </div>
          <SettingHookToggle
            title="Imprimir Fecha y Hora"
            description="Incluir marca de tiempo detallada"
            register={register("printDate")}
          />
          <SettingHookToggle
            title="Mostrar Código de Matrícula"
            description="Ocultar por privacidad si es requerido"
            register={register("showStudentCode")}
          />
        </div>
      </div>

      <div className="space-y-6">
        <SectionTitle title="Vista Previa (Térmica)" icon={<MonitorIcon />} />
        <div className="bg-slate-100 p-8 rounded-[2rem] flex justify-center sticky top-24">
          <div className="w-64 bg-white shadow-xl p-6 font-mono text-[9px] text-slate-800 space-y-4 border-t-8 border-t-slate-800">
            <div className="text-center space-y-1">
              <p className="font-bold border-b border-dashed border-slate-300 pb-2 uppercase italic">
                {previewData.ticketHeader}
              </p>
              <p className="pt-2 italic">RUC: {previewData.ruc}</p>
            </div>
            <div className="space-y-1 py-2 italic font-medium">
              {previewData.printDate && (
                <>
                  <p>FECHA: 08/02/2026</p>
                  <p>HORA: 12:45:22 PM</p>
                </>
              )}
              <p>TICKET: #4582-A</p>
            </div>
            <div className="border-y border-dashed border-slate-300 py-3 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-[#1ABB9C]">
                ALMUERZO
              </p>
            </div>
            <div className="space-y-1 italic font-medium">
              <p>USUARIO: JUAN PEREZ</p>
              {previewData.showStudentCode && <p>COD: 2024001</p>}
            </div>
            <div className="text-center pt-4 border-t border-dashed border-slate-300">
              <p className="italic">"{previewData.ticketFooter}"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KioskSettings({ register, errors }: any) {
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <SectionTitle title="Parámetros del Terminal" icon={<MonitorIcon />} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <SettingHookInput
            label="Tiempo de Bloqueo (Cooldown)"
            icon={<ClockIcon />}
            placeholder="Segundos"
            register={register("kioskCooldown")}
            type="number"
            error={errors.kioskCooldown?.message}
          />
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight -mt-4 ml-1">
            Tiempo en segundos para evitar marcas dobles.
          </p>

          <SettingHookToggle
            title="Pantalla Completa Automática"
            description="Bloquear navegación en el kiosko"
            register={register("kioskFullscreen")}
          />
          <SettingHookToggle
            title="Mostrar Avatar del Alumno"
            description="Visualizar foto si está disponible"
            register={register("showAvatar")}
          />
        </div>
        <div className="bg-slate-50 border border-slate-100 p-8 rounded-[2rem] flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-[#1ABB9C] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-[#1ABB9C]/20 mb-4 animate-pulse">
            <MonitorIcon size={32} />
          </div>
          <h4 className="text-sm font-black text-slate-800 mb-2 leading-none">
            Estado de Terminales
          </h4>
          <p className="text-xs text-slate-500 font-medium mb-6">
            Actualmente hay{" "}
            <span className="text-[#1ABB9C] font-black">2 terminales</span>{" "}
            activos en red.
          </p>
          <button
            type="button"
            className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-all"
          >
            Refrescar Nodos
          </button>
        </div>
      </div>
    </div>
  );
}

function UserManagement() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <SectionTitle title="Cuentas de Administración" icon={<UsersIcon />} />
        <button className="px-4 py-2 bg-slate-100 text-[#1ABB9C] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#1ABB9C] hover:text-white transition-all border border-[#1ABB9C]/10">
          Invitar Usuario
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 font-black uppercase tracking-widest">
              <th className="px-6 py-4 text-left">Usuario</th>
              <th className="px-6 py-4 text-left">Rol</th>
              <th className="px-6 py-4 text-left">Último Acceso</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <UserRow
              name="Super Admin"
              email="admin@sistema.com"
              role="Propietario"
              last="Hace 5 min"
            />
            <UserRow
              name="Cajero Mañana"
              email="turno1@comedor.com"
              role="Operador"
              last="Ayer, 4:00 PM"
            />
            <UserRow
              name="Soporte Técnico"
              email="dev@universidad.edu"
              role="Editor"
              last="05 Feb 2026"
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DatabaseMaintenance() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
      <MaintenanceCard
        title="Copias de Seguridad"
        description="Generar respaldo completo de la base de datos en formato JSON/SQL."
        icon={<DatabaseIcon />}
        action="Descargar Backup"
        color="emerald"
      />
      <MaintenanceCard
        title="Purga de Registros"
        description="Eliminar historial de consumos de meses anteriores para optimizar."
        icon={<TrashIcon />}
        action="Programar Limpieza"
        color="rose"
      />
      <MaintenanceCard
        title="Importación Masiva"
        description="Cargar lista de estudiantes desde un archivo Excel (.csv, .xlsx)."
        icon={<ExportIcon />}
        action="Subir Archivo"
        color="blue"
      />
      <MaintenanceCard
        title="Integridad de Datos"
        description="Verificar y reparar inconsistencias en los registros de matrícula."
        icon={<SettingsIcon />}
        action="Ejecutar Test"
        color="amber"
      />
    </div>
  );
}

// --- Helpers ---

function SectionTitle({
  title,
  icon,
}: {
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 bg-slate-50 text-[#1ABB9C] rounded-xl border border-slate-100 shadow-sm">
        {icon}
      </div>
      <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest leading-none">
        {title}
      </h3>
    </div>
  );
}

function SettingHookInput({
  label,
  placeholder,
  register,
  error,
  icon,
  type = "text",
  disabled = false,
}: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
        {icon} {label}
      </label>
      <input
        type={type}
        disabled={disabled}
        {...register}
        className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl focus:ring-4 outline-none transition-all font-bold text-sm text-slate-700 ${
          error
            ? "border-rose-200 focus:ring-rose-500/10 focus:border-rose-500"
            : "border-slate-100 focus:ring-[#1ABB9C]/10 focus:border-[#1ABB9C]"
        }`}
        placeholder={placeholder}
      />
      {error && (
        <p className="text-[10px] text-rose-500 font-black uppercase ml-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
}

function SettingInput({
  label,
  placeholder,
  defaultValue,
  icon,
  type = "text",
  disabled = false,
}: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
        {icon} {label}
      </label>
      <input
        type={type}
        disabled={disabled}
        defaultValue={defaultValue}
        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-[#1ABB9C]/10 focus:border-[#1ABB9C] outline-none transition-all font-bold text-sm text-slate-700"
        placeholder={placeholder}
      />
    </div>
  );
}

function SettingHookToggle({
  title,
  description,
  register,
}: {
  title: string;
  description: string;
  register: any;
}) {
  return (
    <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-md transition-all duration-300">
      <div>
        <h4 className="text-xs font-black text-slate-700 leading-none mb-1">
          {title}
        </h4>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
          {description}
        </p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" {...register} className="sr-only peer" />
        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1ABB9C]"></div>
      </label>
    </div>
  );
}

function SettingToggle({
  title,
  description,
  enabled,
}: {
  title: string;
  description: string;
  enabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-md transition-all duration-300">
      <div>
        <h4 className="text-xs font-black text-slate-700 leading-none mb-1">
          {title}
        </h4>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
          {description}
        </p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          defaultChecked={enabled}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1ABB9C]"></div>
      </label>
    </div>
  );
}

function ScheduleCard({ id, title, icon, start, end, active }: any) {
  return (
    <div className="flex items-center gap-6 p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-lg hover:border-[#1ABB9C]/20 transition-all duration-500">
      <div
        className={`w-14 h-14 ${active ? "bg-[#1ABB9C] text-white" : "bg-slate-100 text-slate-400"} rounded-2xl flex items-center justify-center shadow-lg transition-colors`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-black text-slate-800 leading-none mb-1">
          {title}
        </h4>
        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <span>{start}</span>
          <span className="w-4 h-px bg-slate-200"></span>
          <span>{end}</span>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer scale-90">
        <input
          type="checkbox"
          defaultChecked={active}
          className="sr-only peer"
        />
        <div className="w-12 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#1ABB9C]"></div>
      </label>
    </div>
  );
}

function UserRow({ name, email, role, last }: any) {
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-sm font-black text-slate-800">{name}</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
            {email}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black uppercase text-slate-600 tracking-widest">
          {role}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-xs font-bold text-slate-500">{last}</span>
      </td>
      <td className="px-6 py-4 text-right">
        <button className="text-slate-400 hover:text-rose-500 transition-colors">
          <TrashIcon size={14} />
        </button>
      </td>
    </tr>
  );
}

function MaintenanceCard({ title, description, icon, action, color }: any) {
  const colors: any = {
    emerald:
      "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100",
    rose: "bg-rose-50 text-rose-500 border-rose-100 shadow-rose-100",
    blue: "bg-blue-50 text-blue-500 border-blue-100 shadow-blue-100",
    amber: "bg-amber-50 text-amber-500 border-amber-100 shadow-amber-100",
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-full hover:shadow-xl transition-all duration-500">
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-xl ${colors[color]}`}
      >
        {icon}
      </div>
      <h4 className="text-sm font-black text-slate-800 mb-2 leading-none">
        {title}
      </h4>
      <p className="text-xs text-slate-500 mb-8 font-medium leading-relaxed leading-tight">
        {description}
      </p>
      <button className="mt-auto w-full py-4 bg-slate-50 border border-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all">
        {action}
      </button>
    </div>
  );
}

// Icons
const SettingsIcon = ({ size = 18 }: { size?: number }) => (
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
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const ClockIcon = () => (
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
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const PrintIcon = () => (
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
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect width="12" height="8" x="6" y="14" />
  </svg>
);
const MonitorIcon = ({ size = 18 }: any) => (
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
    <rect width="20" height="14" x="2" y="3" rx="2" />
    <line x1="8" x2="16" y1="21" y2="21" />
    <line x1="12" x2="12" y1="17" y2="21" />
  </svg>
);
const UsersIcon = () => (
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
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const DatabaseIcon = () => (
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
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5V19A9 3 0 0 0 21 19V5" />
    <path d="M3 12A9 3 0 0 0 21 12" />
  </svg>
);
const SaveIcon = ({ size = 16 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);
const CoffeeIcon = () => (
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
    <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
    <line x1="6" x2="6" y1="2" y2="4" />
    <line x1="10" x2="10" y1="2" y2="4" />
    <line x1="14" x2="14" y1="2" y2="4" />
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
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <path d="M7 2v20" />
    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
  </svg>
);
const MoonIcon = () => (
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
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);
const WarningIcon = ({ size = 18 }: any) => (
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
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" x2="12" y1="9" y2="13" />
    <line x1="12" x2="12.01" y1="17" y2="17" />
  </svg>
);
const PlusIcon = ({ size = 18 }: any) => (
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
    <line x1="12" x2="12" y1="5" y2="19" />
    <line x1="5" x2="19" y1="12" y2="12" />
  </svg>
);
const TrashIcon = ({ size = 18 }: any) => (
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
    <line x1="10" x2="12" y1="11" y2="17" />
    <line x1="14" x2="12" y1="11" y2="17" />
  </svg>
);
const ExportIcon = () => (
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
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);
