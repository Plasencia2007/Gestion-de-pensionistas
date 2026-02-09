"use client";

import { useState, useEffect } from "react";
import { MOCK_STUDENTS } from "@/src/data/mock";
import { Student } from "@/src/types";
import Link from "next/link";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Portal from "@/src/components/ui/Portal";

const studentSchema = z.object({
  firstName: z.string().min(2, "El nombre es requerido"),
  lastName: z.string().min(2, "Los apellidos son requeridos"),
  dni: z
    .string()
    .length(8, "El DNI debe tener exactamente 8 dígitos")
    .regex(/^\d+$/, "Solo números"),
  email: z.string().email("Correo electrónico inválido"),
  phone: z
    .string()
    .length(9, "Debe tener 9 dígitos")
    .regex(/^9\d*$/, "Debe empezar con 9 y solo números"),
  address: z.string().min(5, "La dirección es demasiado corta"),
  birthDate: z
    .string()
    .min(1, "Requerido")
    .refine((val) => {
      const year = parseInt(val.split("-")[0]);
      return year > 1940 && year <= new Date().getFullYear();
    }, "Año no válido"),
  code: z
    .string()
    .length(9, "El código debe tener 9 dígitos")
    .regex(/^\d+$/, "Solo números"),
  notes: z.string().optional(),
  active: z.boolean(),
});

type StudentFormData = z.infer<typeof studentSchema>;

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");

  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");

  const filteredStudents = MOCK_STUDENTS.filter((student) => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      student.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.dni.includes(searchTerm);

    const matchesStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "active"
          ? student.active
          : !student.active;

    return matchesSearch && matchesStatus;
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema) as any,
    defaultValues: {
      firstName: "",
      lastName: "",
      dni: "",
      email: "",
      phone: "",
      address: "",
      birthDate: "",
      code: "",
      notes: "",
      active: true,
    },
  });

  const handleOpenView = (student: Student) => {
    setSelectedStudent(student);
    setIsViewModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setSelectedStudent(student);
    setModalMode("edit");
    // Populate form with student data
    reset({
      firstName: student.firstName,
      lastName: student.lastName,
      dni: student.dni,
      email: student.email,
      phone: student.phone,
      address: student.address,
      birthDate: student.birthDate,
      code: student.code,
      notes: student.notes || "",
      active: student.active,
    });
    setIsFormModalOpen(true);
  };

  const handleOpenAdd = () => {
    setSelectedStudent(null);
    setModalMode("add");
    reset({
      firstName: "",
      lastName: "",
      dni: "",
      email: "",
      phone: "",
      address: "",
      birthDate: "",
      code: `2024${Math.floor(Math.random() * 90000) + 10000}`,
      notes: "",
      active: true,
    });
    setIsFormModalOpen(true);
  };

  const onSubmit: SubmitHandler<StudentFormData> = (data) => {
    console.log("Datos validados:", data);
    // Here we would typically update mock data or call an API
    alert(
      modalMode === "add"
        ? "Estudiante registrado con éxito"
        : "Datos actualizados con éxito",
    );
    setIsFormModalOpen(false);
  };

  const handleOpenDelete = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-up duration-500 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-[#1ABB9C]/10 rounded-lg text-[#1ABB9C]">
              <UsersIcon />
            </span>
            Gestión de Estudiantes
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Administre los perfiles, planes y estados de los pensionistas
            registrados.
          </p>
        </div>
        <div className="flex space-x-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none border border-slate-200 bg-white text-slate-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm">
            <ExportIcon /> Exportar
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex-1 md:flex-none bg-[#1ABB9C] text-white px-6 py-2.5 rounded-xl text-sm font-black hover:bg-[#16a085] transition-all shadow-lg shadow-[#1ABB9C]/20 flex items-center justify-center gap-2"
          >
            <PlusIcon /> Nuevo Estudiante
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#1ABB9C] transition-colors">
            <SearchIcon />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 bg-slate-50 border-transparent rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-[#1ABB9C]/20 focus:border-[#1ABB9C] transition-all placeholder:text-slate-400"
            placeholder="Buscar por nombre, apellidos, DNI o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 min-w-fit">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${filterStatus === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterStatus("active")}
            className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${filterStatus === "active" ? "bg-white text-[#1ABB9C] shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
          >
            Activos
          </button>
          <button
            onClick={() => setFilterStatus("inactive")}
            className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${filterStatus === "inactive" ? "bg-white text-rose-500 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
          >
            Inactivos
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden border-b-4 border-b-[#1ABB9C]/20">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-6 py-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">
                  Estudiante
                </th>
                <th className="px-6 py-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">
                  Documento
                </th>
                <th className="px-6 py-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">
                  Matrícula
                </th>
                <th className="px-6 py-4 text-center font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">
                  Estado
                </th>
                <th className="px-6 py-4 text-right font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="group hover:bg-[#F8FAF9] transition-all"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-xs text-slate-600 shadow-sm group-hover:border-[#1ABB9C]/30 group-hover:bg-[#1ABB9C]/5 transition-all outline outline-0 outline-[#1ABB9C]/20 group-hover:outline-4">
                          {student.firstName[0]}
                          {student.lastName[0]}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 text-sm leading-none mb-1">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            {student.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-600">
                        DNI: {student.dni}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-black text-[#1ABB9C] bg-[#1ABB9C]/5 px-2 py-1 rounded-md border border-[#1ABB9C]/10">
                        {student.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${student.active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${student.active ? "bg-emerald-500 shadow-[0_0_8px_#1ABB9C]" : "bg-slate-300"}`}
                        ></span>
                        {student.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleOpenView(student)}
                          className="p-2 text-slate-400 hover:text-[#1ABB9C] hover:bg-[#1ABB9C]/5 rounded-lg transition-all"
                          title="Ver Perfil Completo"
                        >
                          <EyeIcon />
                        </button>
                        <Link
                          href={`/dashboard/students/${student.id}/history`}
                          className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                          title="Historial de Consumo"
                        >
                          <HistoryIcon size={16} />
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(student)}
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                          title="Editar"
                        >
                          <EditIcon size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(student)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          title="Eliminar"
                        >
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs"
                  >
                    No se encontraron resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* View Modal */}
      {isViewModalOpen && selectedStudent && (
        <Portal>
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-3xl animate-in fade-in duration-500 cursor-pointer"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsViewModalOpen(false);
            }}
          >
            <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col md:flex-row max-h-[90vh] cursor-default">
              {/* Sidebar / Profile Summary */}
              <div className="md:w-72 bg-[#2A3F54] p-8 text-white flex flex-col items-center shrink-0">
                <div className="relative group">
                  <div className="w-28 h-28 rounded-3xl bg-[#1ABB9C] border-4 border-white/10 flex items-center justify-center text-4xl font-black text-white shadow-2xl transition-transform group-hover:scale-105 duration-500">
                    {selectedStudent.firstName[0]}
                    {selectedStudent.lastName[0]}
                  </div>
                  <div
                    className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-4 border-[#2A3F54] ${selectedStudent.active ? "bg-emerald-400" : "bg-slate-400"}`}
                  ></div>
                </div>

                <h2 className="text-xl font-black tracking-tight mt-6 text-center leading-tight">
                  {selectedStudent.firstName} <br /> {selectedStudent.lastName}
                </h2>
                <p className="text-slate-400 font-mono text-xs mt-1 uppercase tracking-widest">
                  ID: {selectedStudent.code}
                </p>

                <div className="mt-auto w-full pt-8">
                  <button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleOpenEdit(selectedStudent);
                    }}
                    className="w-full py-3 bg-[#1ABB9C] text-white font-black rounded-2xl hover:bg-[#16a085] transition-all text-[10px] uppercase tracking-widest shadow-lg shadow-[#1ABB9C]/20 flex items-center justify-center gap-2"
                  >
                    <EditIcon size={14} /> Editar Perfil
                  </button>
                </div>
              </div>

              {/* Main Content Areas */}
              <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                    Expediente Detallado
                  </h3>
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="p-2 rounded-xl hover:bg-slate-100 transition-all text-slate-400"
                  >
                    <XIcon size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-10">
                  {/* Personal Section */}
                  <section>
                    <h4 className="text-[10px] font-black text-[#1ABB9C] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                      <span className="w-8 h-px bg-[#1ABB9C]/20"></span>{" "}
                      Información Personal
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <InfoGroup
                        label="Núm. Documento (DNI)"
                        value={selectedStudent.dni}
                        icon={<BadgeIcon />}
                      />
                      <InfoGroup
                        label="Fecha de Nacimiento"
                        value={selectedStudent.birthDate}
                        icon={<CalendarIcon />}
                      />
                      <InfoGroup
                        label="Fecha de Ingreso"
                        value={selectedStudent.joinedDate}
                        icon={<CalendarIcon />}
                      />
                      <InfoGroup
                        label="Matrícula"
                        value={selectedStudent.code}
                        icon={<UsersIcon />}
                      />
                    </div>
                  </section>

                  {/* Contact Section */}
                  <section>
                    <h4 className="text-[10px] font-black text-[#1ABB9C] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                      <span className="w-8 h-px bg-[#1ABB9C]/20"></span> Datos
                      de Contacto
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <InfoGroup
                        label="Correo Institucional"
                        value={selectedStudent.email}
                        icon={<MailIcon />}
                        canCopy
                      />
                      <InfoGroup
                        label="Teléfono de Contacto"
                        value={selectedStudent.phone}
                        icon={<PhoneIcon />}
                        canCopy
                      />
                      <div className="sm:col-span-2">
                        <InfoGroup
                          label="Dirección de Residencia"
                          value={selectedStudent.address}
                          icon={<MapIcon />}
                        />
                      </div>
                    </div>
                  </section>

                  {/* Medical Section */}
                  <section>
                    <h4 className="text-[10px] font-black text-[#1ABB9C] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                      <span className="w-8 h-px bg-[#1ABB9C]/20"></span>{" "}
                      Observaciones Clínicas
                    </h4>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-[#1ABB9C]"></div>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
                        "
                        {selectedStudent.notes ||
                          "No se han registrado observaciones especiales o restricciones alimentarias para este pensionista."}
                        "
                      </p>
                    </div>
                  </section>
                </div>

                <div className="p-6 bg-white border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="px-8 py-3 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all text-[10px] uppercase tracking-widest"
                  >
                    Cerrar Expediente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Form Modal (Add / Edit) */}
      {isFormModalOpen && (
        <Portal>
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-3xl animate-in fade-in duration-500 cursor-pointer"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsFormModalOpen(false);
            }}
          >
            <form
              onSubmit={handleSubmit(onSubmit as any)}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh] cursor-default"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#1ABB9C]"></div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                    {modalMode === "add"
                      ? "Registrar Pensionista"
                      : "Actualizar Información"}
                  </h2>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                    Completa el formulario oficial del sistema
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="p-3 rounded-2xl hover:bg-slate-50 transition-all text-slate-300 hover:text-slate-500 border border-transparent hover:border-slate-100"
                >
                  <XIcon size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-10 custom-scrollbar">
                {/* Form Section: Core Info */}
                <div className="space-y-6">
                  <FormSectionHeader
                    title="Datos Generales"
                    icon={<UsersIcon />}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormHookInput
                      label="Nombres"
                      icon={<UserIconSmall />}
                      placeholder="Ej. Juan"
                      register={register("firstName")}
                      error={errors.firstName?.message}
                    />
                    <FormHookInput
                      label="Apellidos"
                      icon={<UserIconSmall />}
                      placeholder="Ej. Pérez García"
                      register={register("lastName")}
                      error={errors.lastName?.message}
                    />
                    <FormHookInput
                      label="Número de DNI"
                      icon={<BadgeIcon />}
                      placeholder="8 números"
                      register={register("dni")}
                      error={errors.dni?.message}
                    />
                    <FormHookInput
                      label="Fecha de Nacimiento"
                      icon={<CalendarIcon />}
                      type="date"
                      register={register("birthDate")}
                      error={errors.birthDate?.message}
                    />
                    <FormHookInput
                      label="Código de Matrícula"
                      icon={<LockIcon />}
                      placeholder="9 números"
                      register={register("code")}
                      error={errors.code?.message}
                      disabled={modalMode === "edit"}
                    />
                  </div>
                </div>

                {/* Form Section: Contact */}
                <div className="space-y-6">
                  <FormSectionHeader
                    title="Contacto y Ubicación"
                    icon={<PhoneIcon />}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormHookInput
                      label="Correo Institucional"
                      icon={<MailIcon />}
                      placeholder="ejemplo@universidad.edu"
                      register={register("email")}
                      error={errors.email?.message}
                    />
                    <FormHookInput
                      label="Número de Celular"
                      icon={<PhoneIcon />}
                      placeholder="900 000 000"
                      register={register("phone")}
                      error={errors.phone?.message}
                    />
                    <div className="md:col-span-2">
                      <FormHookInput
                        label="Dirección de Residencia"
                        icon={<MapIcon />}
                        placeholder="Avenida, Urbanización, Distrito..."
                        register={register("address")}
                        error={errors.address?.message}
                      />
                    </div>
                  </div>
                </div>

                {/* Form Section: Notes */}
                <div className="space-y-6">
                  <FormSectionHeader
                    title="Estado y Observaciones"
                    icon={<EditIcon />}
                  />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <EditIcon size={12} /> Comentarios Adicionales o Dietas
                      </label>
                      <textarea
                        {...register("notes")}
                        rows={4}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#1ABB9C]/10 focus:border-[#1ABB9C] outline-none transition-all font-medium text-slate-700 text-sm placeholder:text-slate-400 placeholder:italic"
                        placeholder="Indique si el estudiante tiene alergias, es vegetariano, o requiere trato especial..."
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-8 py-4 bg-white border border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-100 transition-all text-[10px] uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-12 py-4 bg-[#1ABB9C] text-white font-black rounded-2xl hover:bg-[#16a085] transition-all text-[10px] uppercase tracking-widest shadow-[0_12px_24px_-8px_rgba(26,187,156,0.4)] flex items-center gap-2"
                >
                  <CheckIconCircle size={16} />
                  {modalMode === "add"
                    ? "Validar y Guardar"
                    : "Aplicar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </Portal>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedStudent && (
        <Portal>
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-3xl animate-in fade-in duration-500 cursor-pointer"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsDeleteModalOpen(false);
            }}
          >
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-500 p-10 text-center relative border border-slate-100 cursor-default">
              <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
              <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-100 rotate-3 transition-transform hover:rotate-0 duration-500 shadow-sm">
                <TrashIcon size={44} />
              </div>

              <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                ¿Eliminar Pensionista?
              </h2>
              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-[0.2em] mt-3">
                Esta acción es irreversible
              </p>

              <div className="my-8 p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                <p className="text-sm text-slate-500 font-medium">
                  Se desactivará el perfil de <br />
                  <span className="text-lg font-black text-slate-800 block mt-2 px-4 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="w-full py-4 bg-rose-500 text-white font-black rounded-2xl hover:bg-rose-600 transition-all text-[10px] uppercase tracking-[0.2em] shadow-[0_12px_24px_-8px_rgba(244,63,94,0.4)]"
                >
                  Sí, Eliminar Registro
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="w-full py-4 bg-white border border-slate-200 text-slate-400 font-bold rounded-2xl hover:bg-slate-50 transition-all text-[10px] uppercase tracking-[0.2em]"
                >
                  Mantener Estudiante
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

function InfoGroup({
  label,
  value,
  icon,
  canCopy = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  canCopy?: boolean;
}) {
  return (
    <div className="flex gap-4 group items-center min-w-0">
      <div className="h-10 w-10 shrink-0 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-[#1ABB9C]/5 group-hover:text-[#1ABB9C] group-hover:border-[#1ABB9C]/20 transition-all duration-300 shadow-sm">
        {icon}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5 truncate">
          {label}
        </h4>
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-sm font-bold text-slate-700 tracking-tight truncate">
            {value || "No registrado"}
          </p>
          {canCopy && value && (
            <button className="text-[#1ABB9C] opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#1ABB9C]/5 rounded-md shrink-0">
              <CopyIcon size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
        {label}
      </span>
      <span className="text-sm font-black text-white tracking-tight">
        {value}
      </span>
    </div>
  );
}

function FormSectionHeader({
  title,
  icon,
}: {
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
      <div className="p-1.5 bg-slate-50 text-[#1ABB9C] rounded-lg border border-slate-100">
        {icon}
      </div>
      <h3 className="text-xs font-black text-slate-700 uppercase tracking-[0.1em]">
        {title}
      </h3>
    </div>
  );
}

function FormHookInput({
  label,
  icon,
  placeholder,
  register,
  error,
  type = "text",
  disabled = false,
}: {
  label: string;
  icon: React.ReactNode;
  placeholder?: string;
  register: any;
  error?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
        {icon} {label}
      </label>
      <input
        type={type}
        disabled={disabled}
        {...register}
        className={`w-full px-5 py-3.5 rounded-2xl outline-none transition-all font-bold text-sm ${
          disabled
            ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
            : error
              ? "bg-rose-50 border-rose-200 text-rose-900 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500"
              : "bg-slate-50 border border-slate-100 text-slate-700 focus:bg-white focus:ring-4 focus:ring-[#1ABB9C]/10 focus:border-[#1ABB9C] placeholder:text-slate-300"
        }`}
        placeholder={placeholder}
      />
      {error && (
        <p className="text-[10px] text-rose-500 font-black uppercase tracking-tight ml-1 animate-in fade-in slide-in-from-top-1 duration-300">
          {error}
        </p>
      )}
    </div>
  );
}

function FormInput({
  label,
  icon,
  placeholder,
  defaultValue,
  type = "text",
  disabled = false,
}: {
  label: string;
  icon: React.ReactNode;
  placeholder?: string;
  defaultValue?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
        {icon} {label}
      </label>
      <input
        type={type}
        disabled={disabled}
        defaultValue={defaultValue}
        className={`w-full px-5 py-3.5 rounded-2xl outline-none transition-all font-bold text-sm ${
          disabled
            ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
            : "bg-slate-50 border border-slate-100 text-slate-700 focus:bg-white focus:ring-4 focus:ring-[#1ABB9C]/10 focus:border-[#1ABB9C] placeholder:text-slate-300"
        }`}
        placeholder={placeholder}
      />
    </div>
  );
}

// Icons
const UsersIcon = () => (
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
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const SearchIcon = ({ size = 18 }: { size?: number }) => (
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
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const PlusIcon = () => (
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
    <path d="M5 12h14" />
    <path d="M12 5v14" />
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
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M12 12v9" />
    <path d="m8 17 4 4 4-4" />
  </svg>
);

const EyeIcon = () => (
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
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const CopyIcon = ({ size = 16 }: { size?: number }) => (
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
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const UserIconSmall = ({ size = 14 }: { size?: number }) => (
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
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LockIcon = ({ size = 14 }: { size?: number }) => (
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
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const CheckIconCircle = ({ size = 16 }: { size?: number }) => (
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
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const EditIcon = ({ size = 16 }: { size?: number }) => (
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
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);

const TrashIcon = ({ size = 16 }: { size?: number }) => (
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
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" x2="10" y1="11" y2="17" />
    <line x1="14" x2="14" y1="11" y2="17" />
  </svg>
);

const XIcon = ({ size = 20 }: { size?: number }) => (
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
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const BadgeIcon = () => (
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
    <path d="M16 2a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v20l6-3 6 3V2z" />
    <circle cx="10" cy="8" r="3" />
  </svg>
);

const MailIcon = () => (
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
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.53 5.5a2.41 2.41 0 0 1-2.94 0L2 7" />
  </svg>
);

const PhoneIcon = () => (
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
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const MapIcon = () => (
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
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const CalendarIcon = () => (
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
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const HistoryIcon = ({ size = 16 }: { size?: number }) => (
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
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </svg>
);

const ClockIcon = () => (
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
