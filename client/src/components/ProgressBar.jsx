export default function ProgressBar({ current, total }) {
  const width = (current / total) * 100;

  return (
    <div className="w-full h-2 bg-gray-700 rounded-full mb-8">
      <div
        className="h-2 bg-blue-500 rounded-full transition-all duration-300"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}