export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-[#eee] rounded w-48" />
        <div className="h-4 bg-[#eee] rounded w-80" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 bg-[#f5f5f5] rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
