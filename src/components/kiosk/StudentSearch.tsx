export default function StudentSearch() {
  return (
    <div className="w-full max-w-md">
      <input
        type="text"
        placeholder="Buscar por nombre o DNI..."
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
