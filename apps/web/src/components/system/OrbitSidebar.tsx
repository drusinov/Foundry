const projects = [
  "Foundry Core",
  "Thread Surface",
  "Memory System",
  "Convergence UX",
]

export function OrbitSidebar() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 p-5">
        <div className="text-sm uppercase tracking-[0.2em] text-white/40">
          Foundry
        </div>

        <div className="mt-3 text-2xl font-semibold">
          Orbit
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {projects.map((project) => (
            <button
              key={project}
              className="
                w-full rounded-xl border border-white/5
                bg-white/[0.03]
                px-4 py-3
                text-left
                transition-all
                hover:border-white/10
                hover:bg-white/[0.05]
              "
            >
              {project}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
