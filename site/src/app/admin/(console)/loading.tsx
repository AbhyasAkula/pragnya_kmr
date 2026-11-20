/** Skeleton shown while an admin page loads. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="animate-pulse">
      <span className="sr-only">Loading…</span>
      <div className="mb-8 h-9 w-56 rounded-lg bg-line/70" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-xl border border-line bg-white" />
        ))}
      </div>
      <div className="mt-6 h-72 rounded-xl border border-line bg-white" />
    </div>
  );
}
