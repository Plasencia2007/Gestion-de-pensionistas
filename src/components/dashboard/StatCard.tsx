export default function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon?: string;
}) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col items-center justify-center">
      <span className="text-gray-500 text-sm">{title}</span>
      <span className="text-2xl font-bold">{value}</span>
    </div>
  );
}
