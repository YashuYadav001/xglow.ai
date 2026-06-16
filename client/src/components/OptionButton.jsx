export default function OptionButton({
  text,
  selected,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl border text-left transition mb-3 ${
        selected
          ? "bg-blue-600 border-blue-500"
          : "bg-gray-800 border-gray-700 hover:border-gray-500"
      }`}
    >
      {text}
    </button>
  );
}