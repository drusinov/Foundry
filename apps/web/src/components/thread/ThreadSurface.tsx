const entries = [
  {
    type: "brief",
    title: "Design the orchestration model",
    body: "We need a system capable of multi-agent execution and convergence.",
  },
  {
    type: "artifact",
    title: "Architecture proposal",
    body: "Introduced orchestration boundary and streaming execution model.",
  },
]

export function ThreadSurface() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-8 py-5">
        <div className="text-sm uppercase tracking-[0.2em] text-white/40">
          Project Thread
        </div>

        <h1 className="mt-2 text-3xl font-semibold">
          Foundry Core
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
          {entries.map((entry, index) => (
            <div
              key={index}
              className="
                rounded-2xl border border-white/10
                bg-[#11131A]
                p-6
              "
            >
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">
                {entry.type}
              </div>

              <h2 className="mt-3 text-xl font-semibold">
                {entry.title}
              </h2>

              <p className="mt-4 leading-7 text-white/70">
                {entry.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
