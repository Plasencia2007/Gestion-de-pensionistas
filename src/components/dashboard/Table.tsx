export default function Table({
  data,
  columns,
}: {
  data: any[];
  columns: string[];
}) {
  return (
    <div className="overflow-x-auto border rounded-xl">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50 uppercase text-xs text-gray-700">
          <tr>
            {columns.map((col) => (
              <th key={col} className="p-4">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{/* Filas de la tabla */}</tbody>
      </table>
    </div>
  );
}
