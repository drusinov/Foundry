"use client"

import { Command } from "cmdk"
import { AnimatePresence, motion } from "framer-motion"

type CommandPaletteProps = {
  open: boolean
}

const items = [
  "Brief Architect",
  "Open Canvas",
  "Review Active Runs",
  "Converge Outputs",
  "Inspect Memory",
]

export function CommandPalette({
  open,
}: CommandPaletteProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="
              fixed inset-0 z-40
              bg-black/50
              backdrop-blur-sm
            "
          />

          <motion.div
            initial={{
              opacity: 0,
              y: -20,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -10,
              scale: 0.98,
            }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 22,
            }}
            className="
              fixed left-1/2 top-24 z-50
              w-[720px]
              -translate-x-1/2
            "
          >
            <Command
              className="
                overflow-hidden rounded-2xl
                border border-white/10
                bg-[#11131A]
                shadow-2xl
              "
            >
              <div className="border-b border-white/10 px-4">
                <Command.Input
                  placeholder="Brief an agent, inspect memory, converge runs..."
                  className="
                    h-16 w-full
                    bg-transparent
                    text-lg text-white
                    outline-none
                    placeholder:text-white/30
                  "
                />
              </div>

              <Command.List className="max-h-[400px] overflow-y-auto p-2">
                {items.map((item) => (
                  <Command.Item
                    key={item}
                    className="
                      cursor-pointer rounded-xl
                      px-4 py-3
                      text-white/80
                      outline-none
                      transition-all
                      data-[selected=true]:bg-white/10
                      data-[selected=true]:text-white
                    "
                  >
                    {item}
                  </Command.Item>
                ))}
              </Command.List>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
