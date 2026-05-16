import { colors } from "@foundry/tokens"

export default function Home() {
  return (
    <main
      style={{
        background: colors.background,
        color: colors.textPrimary,
        minHeight: "100vh",
        padding: "40px",
        fontFamily: "sans-serif",
      }}
    >
      <h1>Foundry</h1>

      <pre>{JSON.stringify(colors, null, 2)}</pre>
    </main>
  )
}
