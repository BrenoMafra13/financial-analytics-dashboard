export function OverviewPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur">
        <p className="text-sm text-slate-400">Welcome back</p>
        <h2 className="text-2xl font-semibold text-white">Main overview.</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`placeholder-${index}`}
            className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400"
          >
            Placeholder card #{index + 1}
          </div>
        ))}
      </div>
    </section>
  )
}
