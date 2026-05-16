type GenerateAiPromptInput = {
  continuity: string

  userMessage: string
}

export function generateAiPrompt({
  continuity,

  userMessage,
}: GenerateAiPromptInput) {
  return `
You are continuing work inside the Foundry operational runtime.

Treat the following continuity payload as canonical runtime state and operational truth.

${continuity}

---

USER OPERATIONAL REQUEST:

${userMessage}

---

Requirements:

- preserve runtime stability
- avoid unsafe refactors
- preserve deterministic runtime behavior
- prefer incremental evolution
- avoid architectural drift
- preserve continuity semantics

Respond with:
- safest implementation direction
- operational risks
- deterministic next steps
  `.trim()
}