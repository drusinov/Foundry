# Frontend Implementation Systems Architecture
## Project Thread Surface — Principal Architect Specification

**Target:** React 19 + TypeScript 5.x + Tailwind v4 + Framer Motion v11  
**Surface:** Project Thread (primary operational surface)  
**Status:** Pre-implementation reference v1.0  
**Audience:** Senior frontend engineers implementing the platform

---

## Governing Principle

This document defines architecture decisions, not implementation details. It answers the question "how should this be structured?" not "what code should I write?" Every section should be read as a constraint on implementation choices, not as a suggestion.

A senior engineer reading this document should be able to make any component-level implementation decision without asking a question. If they cannot, this document is incomplete.

---

## 1. Design Token Architecture

### 1.1 Token hierarchy

Tokens exist at three levels. Understanding the distinction is mandatory before writing a single Tailwind class or CSS variable.

```
Level 1 — Primitive tokens     Raw values. Never referenced directly in components.
  Example: --color-gray-900: #111110

Level 2 — Semantic tokens      Named by role, not by value. Components use these.
  Example: --bg-base: var(--color-gray-900)

Level 3 — Component tokens     Scoped to a component family. Use sparingly.
  Example: --entry-bg-hover: var(--bg-elevated)
```

The rule: components reference semantic tokens only. If you find yourself using a primitive token directly in a component, stop — create the semantic token first. This is what makes the design consistent when the primitive changes.

### 1.2 Token file structure

```
tokens/
  primitives.css      Raw color, spacing, radius, typography values
  semantic.css        Role-named tokens that consume primitives
  motion.css          Animation timing, easing, spring constants as CSS vars
  component/
    thread-entry.css  Component-scoped tokens for entry variants
    composer.css      Composer-specific tokens
    memory-panel.css  Memory panel-specific tokens
```

Do not put motion constants in `primitives.css`. Motion is semantic, not primitive.

### 1.3 Tailwind v4 integration

Tailwind v4 reads CSS custom properties directly. The token architecture maps to Tailwind's CSS theme integration:

```css
/* In your @theme block, reference semantic tokens, not primitives */
@theme {
  --color-bg-base: var(--bg-base);
  --color-bg-surface: var(--bg-surface);
  --color-bg-elevated: var(--bg-elevated);
  --color-text-primary: var(--text-primary);
  /* ... */
}
```

This means Tailwind classes like `bg-bg-base` and `text-text-primary` resolve through the semantic token layer. If the semantic token changes, the Tailwind utility changes with it. No find-and-replace migrations.

### 1.4 Dark mode strategy

Dark mode is the default. Light mode is an override. This is not the same as `prefers-color-scheme: dark`.

```css
/* primitives.css */
:root {
  /* Dark values are the defaults */
  --color-gray-900: #111110;
  --color-gray-800: #161614;
  /* ... */
}

[data-theme="light"] {
  /* Light mode overrides primitives */
  --color-gray-900: #FAFAF8;
  --color-gray-800: #F5F4F0;
  /* ... */
}
```

Never use `dark:` Tailwind modifier as the primary styling path. Use it only for the light-mode override layer. This inverts the conventional Tailwind dark mode pattern deliberately, because the product is dark-mode first.

### 1.5 Motion tokens as CSS variables

Spring constants must be available in both CSS and JavaScript. Define them in CSS; import them in the motion layer:

```css
/* motion.css */
:root {
  --spring-tension-snappy: 380;
  --spring-friction-snappy: 30;
  --spring-tension-gentle: 200;
  --spring-friction-gentle: 26;
  --duration-instant: 80ms;
  --duration-fast: 150ms;
  --duration-mid: 250ms;
  --duration-slow: 400ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

The JavaScript motion layer reads these via `getComputedStyle` at module initialization, creating a single source of truth for all spring and timing constants.

---

## 2. Primitive UI Component Taxonomy

### 2.1 The taxonomy levels

Five levels. The line between levels is architectural, not stylistic.

```
Atoms         Single-responsibility, no composition, no business logic
              Surface, Typography, Icon, Divider, Badge, Pill, Spinner

Molecules     Composed from Atoms, still no business logic
              MetaRow, StatusBadge, KeyboardHint, ActionButton, ProgressBar

Organisms     Composed from Molecules, may accept complex props, may have local state
              ThreadEntryShell, ComposerInput, MemoryFact, ReviewActionBar

Features      Composed from Organisms + business logic hooks
              ThreadEntry (typed), ComposerZone, MemoryPanel, PulseBar

Surfaces      Page-level composition. One per route/major view.
              ProjectThread (the only surface in this spec)
```

**The boundary rule:** Nothing below Features may import from the store or make API calls. Nothing in Atoms or Molecules may have local state beyond ephemeral UI state (focus, hover). This is enforced at the linting level.

### 2.2 Atoms

Every atom accepts `className` as a prop for Tailwind extension. Atoms never use arbitrary values. They only use token-mapped Tailwind utilities.

Critical atoms for this surface:

`Surface` — A background container that accepts a depth prop (`base | surface | elevated | overlay`). This is the primitive for all entry backgrounds. Never write `bg-[#161614]` in a component — use `<Surface depth="surface">`.

`Typography` — A polymorphic text element accepting a `variant` prop (`label | meta | caption | body | mono | title | heading`). Handles font size, weight, tracking, and leading from the type scale. No component ever writes `text-[13px]` directly.

`Icon` — Wraps the Tabler icon set with explicit size and color props. Handles `aria-hidden` automatically. Never use Tabler icons directly in component JSX.

`Divider` — A horizontal or vertical rule that consumes the border token. Never write `border-border-faint` inline.

### 2.3 Molecule contracts

Molecules must be completely stateless from the consumer's perspective. They accept data and callbacks; they do not own state.

`StatusBadge` — Accepts a `status: RunStatus | ArtifactReviewStatus` discriminated union. Renders the correct color, label, and optional animation class purely from that value.

`KeyboardHint` — Accepts a `shortcut: string` and optional `label: string`. Renders the keyboard hint pill from the spec. Used in the composer, action bars, and focus states.

`MetaRow` — Accepts `attribution: string`, `timestamp: Date`, and optional `badge: ReactNode`. Renders the standard entry header metadata line.

---

## 3. Layout Primitives

Layout primitives are headless components that implement the spatial layout system from the surface spec. They have no visual opinion — they only implement grid, flexbox, and spacing logic.

### 3.1 Required layout primitives

`Stack` — Vertical flex container. Props: `gap` (spacing token), `align`, `justify`. The workhorse for entry content layout.

`Cluster` — Horizontal flex container with wrapping. Props: `gap`, `align`, `justify`. Used for action bars, metadata rows, badge groups.

`Gutter` — The 48px timeline gutter. Not customizable. Fixed-width left column. Used inside every ThreadEntry. This is not a generic component — it exists specifically for the thread entry layout.

`ThreadGrid` — The two-column layout (`Gutter` + `Content`). Used as the outermost wrapper of every thread entry. Content column has no fixed width — it fills the remaining space.

`PanelSplit` — The three-column shell layout. `Orbit | Thread | Memory`. Uses CSS Grid. Not a generic layout primitive — it encodes the specific shell proportions from the spec.

`ContentBound` — A max-width container for thread content. Applies the `max-width: 700px` constraint from the spec with horizontal centering. All thread content goes inside this.

### 3.2 Anti-patterns

Never use `div` with arbitrary margin or padding for spacing. All spacing goes through layout primitives. This is enforced so that spacing changes flow from the token layer, not from scattered inline values.

Never implement the three-panel shell in a component that has business logic. `PanelSplit` is a pure layout primitive. The business logic lives in the `ProjectThread` feature.

---

## 4. Interaction Primitives

Interaction primitives abstract the input handling layer. They separate the "what does interaction feel like" question from the "what does this component show" question.

### 4.1 Required interaction primitives

`Pressable` — A polymorphic interactive wrapper. Handles `onPress`, `onHover`, `onFocus`, keyboard activation (`Enter`, `Space`), `disabled` state, and press animation. This replaces raw `button` and `div onClick` everywhere.

The key requirement: `Pressable` must correctly handle the distinction between `onClick` (mouse or keyboard) and `onPress` (intended action regardless of input method). These are different events with different semantics.

`HoverTarget` — A non-interactive wrapper that tracks hover state and exposes it via render prop or context. Used when hover state needs to affect sibling elements (e.g., showing the action bar when hovering an entry).

`FocusRing` — A wrapper that applies the correct focus ring treatment from the spec. Differentiates between mouse focus (no ring, no depth effect) and keyboard focus (ring + depth effect). Consumes the focus visibility state from the keyboard navigation layer.

`InteractionBoundary` — A context provider that declares the "interaction zone" for an entry. All child interactions within a `ThreadEntry` report to this boundary. Used by the keyboard navigation system to know which entry is active.

### 4.2 The mouse/keyboard distinction

This is the most commonly implemented incorrectly. The system has two input modes:

Mouse mode: hover triggers action bar. No focus ring. No depth effect. No entry cursor.
Keyboard mode: J/K moves the entry cursor. Focus ring appears. Depth effect activates. Action bar shows with keyboard hints.

The implementation pattern:

```typescript
// Not implementation code — interface contract
interface InputModeContext {
  mode: 'mouse' | 'keyboard'
  setMode: (mode: 'mouse' | 'keyboard') => void
}
```

Mode switches on any keyboard navigation event (sets to `keyboard`) or `mousemove` (sets to `mouse`). This context is provided at the `ThreadSurface` level. Components below it use `useInputMode()` to make mode-sensitive decisions.

---

## 5. Motion Primitives

Motion primitives wrap Framer Motion. No component ever imports from `framer-motion` directly — they import from `motion/` which re-exports composed variants and configured components.

### 5.1 Motion configuration

Spring constants from the spec are codified as named Framer Motion transition objects:

```typescript
// Not code — type contract and intent
type MotionConfig = {
  snappy: SpringTransition   // UI responses, toggles
  gentle: SpringTransition   // Entry appearances, panel slides
  slow: SpringTransition     // Modal entrances, large transitions
  instant: TweenTransition   // Background color changes (not spring)
}
```

These are the only transition configurations allowed. Adding new ones requires an architectural decision, not a component-level decision.

### 5.2 Shared variant definitions

Variants are defined at the module level in `motion/variants.ts`, not inline in components. The naming convention is `[component][state]Variant`:

```
threadEntryVariants         { hidden, visible }     Entry appearance
depthEffectVariants         { focused, unfocused }  Depth opacity change
composerExpandVariants      { simple, full }        Composer height
progressBarVariants         { idle, scanning, complete, failed }
runningPulseVariants        { active, idle }
reviewBarVariants           { hidden, visible }
```

When a new animation is needed, the question is always: does an existing variant cover this? If yes, use it. If not, add to the shared variants file — not inline.

### 5.3 Reduced motion

All motion is wrapped in `useReducedMotion()`. The convention:

```typescript
// Contract, not code
function useMotionConfig(): {
  shouldAnimate: boolean
  getTransition: (name: keyof MotionConfig) => Transition
}
```

When `shouldAnimate` is false, `getTransition` returns `{ duration: 0 }`. No component manages reduced motion independently — it all flows through this hook.

---

## 6. State Architecture

This is the most consequential architecture decision. Get it wrong and you will spend months refactoring.

### 6.1 State categories and their homes

```
Server state          TanStack Query v5
  Thread entries      useThreadEntries(projectId)
  Memory facts        useMemoryFacts(projectId)
  Agent states        useAgentStates(projectId)
  Project metadata    useProject(projectId)

Streaming state       Custom hook built on SSE/WebSocket + Zustand
  Active run content  useRunStream(runId)
  Token accumulation  Internal to useRunStream, never in global store

Global UI state       Zustand
  Active project      activeProjectId
  Thread focus cursor focusedEntryId
  Composer mode       composerMode: 'simple' | 'full'
  Input mode          inputMode: 'mouse' | 'keyboard'
  Panel states        memoryPanelOpen, orbitPanelOpen
  Jump-to-present     hasUnseenEntries, unseenCount
  Keyboard context    keyboardContext: KeyboardContext

Local component state useState
  Entry expanded      isExpanded (in each ArtifactEntry)
  Hover state         isHovered (in HoverTarget)
  Fact edit state     editingFactId (in MemoryPanel)
  Review annotation   annotation text (in ReviewActionBar)
```

### 6.2 Critical topology rules

**Rule 1:** Thread entry data never lives in Zustand. It lives in TanStack Query. Zustand stores IDs and cursor positions, not entry content. Mixing server state into Zustand creates synchronization hell.

**Rule 2:** Streaming content never triggers full thread re-renders. The `useRunStream` hook manages its own internal buffer. It writes to the DOM directly via ref during streaming, then commits the final content to TanStack Query cache on completion. This is the only place in the codebase where direct DOM mutation is acceptable.

**Rule 3:** No component below Feature level reads from the Zustand store. Atoms, Molecules, and Organisms receive all their data as props. Features are the boundary where store access is allowed.

**Rule 4:** `activeProjectId` is the root of the data tree. Every query is keyed by it. Switching projects invalidates all queries with the old project key.

### 6.3 TanStack Query key structure

```typescript
// Contract — these key factories are canonical
const queryKeys = {
  thread: (projectId: string) => ['thread', projectId] as const,
  entries: (projectId: string) => ['thread', projectId, 'entries'] as const,
  entry: (projectId: string, entryId: string) => 
    ['thread', projectId, 'entries', entryId] as const,
  memory: (projectId: string) => ['memory', projectId] as const,
  memoryFacts: (projectId: string) => ['memory', projectId, 'facts'] as const,
  agents: (projectId: string) => ['agents', projectId] as const,
}
```

This structure enables granular invalidation. When a single artifact is reviewed, invalidate `queryKeys.entry(projectId, artifactId)`. When memory is updated, invalidate `queryKeys.memoryFacts(projectId)`. Do not invalidate `queryKeys.thread(projectId)` for a single entry change — that refetches everything.

### 6.4 Optimistic update pattern

The Review interaction (Approve/Reject/Redirect) must feel instant — the UI updates before the server confirms. Pattern:

1. User triggers review action
2. Zustand `pendingReviews` map is updated immediately (local optimistic state)
3. The artifact entry renders from the optimistic state
4. API mutation fires
5. On success: TanStack Query cache is updated, optimistic state is cleared
6. On failure: optimistic state is rolled back, error is surfaced inline

The Zustand `pendingReviews` map is the only place optimistic state lives. It is not in TanStack Query — that would require `useMutation`'s optimistic update API which has rollback complexity at the component level.

---

## 7. Accessibility Contracts

Accessibility is specified as contracts, not as implementation details. Each contract must be verifiable by an automated accessibility audit.

### 7.1 Thread accessibility structure

```
ThreadViewport:
  role="feed"
  aria-label="Project thread for [Project Name]"
  aria-busy={hasActiveRuns}
  aria-live="polite"
  tabIndex={0}   (makes viewport focusable for keyboard nav entry)

ThreadEntry (each):
  role="article"
  aria-label="[Entry type] by [Attribution] [relative timestamp]"
  aria-posinset={index + 1}
  aria-setsize={totalEntries}
  data-entry-id={entry.id}   (used by focus management, not ARIA)

  When keyboard-focused:
    aria-current="true"

ArtifactEntry (when unreviewed):
  aria-describedby="review-instructions-[id]"
  (links to a visually hidden description of review key bindings)
```

### 7.2 Composer accessibility

```
ComposerZone:
  role="form"
  aria-label="Brief composer"

  Simple mode input:
    role="textbox"
    aria-label="Brief, query, or redirect"
    aria-expanded={composerMode === 'full'}
    aria-controls="full-brief-form"

  Full brief form:
    id="full-brief-form"
    role="group"
    aria-label="Full brief"

  Dispatch button:
    aria-label="Dispatch brief to [Agent Name]"
    aria-keyshortcuts="Meta+Return"
```

### 7.3 Memory panel accessibility

```
MemoryPanel:
  role="complementary"
  aria-label="Project memory"

MemoryZone (each):
  role="region"
  aria-label="[Zone name] memory"

MemoryFact (each):
  role="listitem"
  When in edit mode:
    aria-label="Editing: [fact key]"
```

### 7.4 Live regions

Two live regions. Only two. No more.

```
AgentActivityAnnouncer:
  role="status"   (polite live region)
  aria-live="polite"
  Purpose: announces run state changes ("Architect completed" / "Architect failed")
  Location: visually hidden, in ThreadSurface root

ReviewPromptAnnouncer:
  role="alert"   (assertive live region, only for review-required)
  aria-live="assertive"
  Purpose: announces when a new artifact requires review
  Location: visually hidden, in ThreadSurface root
  Firing condition: only when user is NOT already focused on an unreviewed artifact
```

Live regions are not toast notifications. They are screen reader announcements. `aria-live="assertive"` is used sparingly — only for review prompts. Everything else is `polite`.

---

## 8. Focus Management Philosophy

### 8.1 The dual navigation model, implemented

The thread has two concurrent focus systems that must not interfere:

System A — DOM focus (browser-native): managed by tab order and programmatic `focus()` calls. Used for composer, action buttons, memory facts.

System B — Entry cursor (custom): a Zustand value (`focusedEntryId`) that represents the "active entry" in keyboard navigation mode. Does not correspond to DOM focus.

The coupling rule: when the Entry cursor changes, DOM focus is set to the thread viewport element (`aria-activedescendant` is updated), NOT to the entry itself. This is because focusing individual entries would cause the thread to scroll to them unexpectedly and would break the reading flow.

Exception: when the user presses `E` to expand an entry or `A` to approve, the relevant interactive element within that entry receives DOM focus temporarily, then returns focus to the viewport on action completion.

### 8.2 Focus trap management

Focus traps apply only to:
- The command palette (full trap — Tab cycles within palette)
- The Orchestration overlay when active (full trap)
- Modals and confirmation dialogs (full trap)

The thread surface itself is NOT a focus trap. The composer is NOT a focus trap. Tab should be able to move focus freely between the thread, composer, and memory panel.

### 8.3 Focus restoration

When any overlay, modal, or command palette closes, focus must return to:
- The entry that was focused before the overlay opened (if an entry was focused)
- The composer input (if the composer was focused)
- The thread viewport (fallback)

This is managed by a `useFocusRestore` hook that saves focus context before any overlay opens and restores it on close.

---

## 9. Layering / Z-Index System

Named layers only. No arbitrary z-index values in any component.

```typescript
// Contract — these are the only allowed z-index values
const layers = {
  base:          0,    // Thread content, all entries
  raised:        10,   // Hover state overlays, action bars
  sticky:        20,   // Header bar, pulse bar, composer zone
  panel:         30,   // Memory panel (when overlapping on narrow viewports)
  orchestration: 40,   // Orchestration overlay (future)
  command:       50,   // Command palette
  tooltip:       60,   // Tooltips, popovers
  modal:         70,   // Confirmation dialogs
}
```

This is imported as a constant in every component that needs z-index. Writing `z-50` in Tailwind is forbidden. Write `z-[${layers.command}]` or map it to a Tailwind token.

The orchestration overlay at layer 40 is reserved even though it is not built yet. This prevents a future implementation from requiring a z-index migration.

---

## 10. Scroll Management Architecture

### 10.1 The scroll container

There is exactly one scroll container in the thread surface: `ThreadViewport`. The composer, header, and pulse bar are outside this container (they are sticky, not scrolled). The memory panel has its own independent scroll container.

No nested scrollable containers within the thread. If an artifact has more content than fits in 60vh, it clips with `overflow: hidden` at the entry level and the user expands it explicitly. When expanded, the artifact's own content area may scroll — but this is scoped to the artifact, not the thread.

### 10.2 Auto-scroll implementation

Auto-scroll must respect the user's reading position. The rule from the spec: only auto-scroll if the user is within 200px of the bottom.

Implementation pattern (not code — contract):

```
useAutoScroll(threadViewportRef):
  state: isNearBottom (boolean, computed from scroll position)
  
  on new entry:
    if isNearBottom:
      scrollToBottom(behavior: 'smooth')
    else:
      increment unseenCount in Zustand store
  
  on scroll:
    update isNearBottom
    if isNearBottom and unseenCount > 0:
      clear unseenCount
```

The 200px threshold is a constant, not a magic number. It lives in the scroll management module.

### 10.3 Scroll position preservation

When the user navigates away from the Project Thread and returns, the scroll position is restored. This is stored in Zustand keyed by `projectId`, not in the DOM.

On mount, the `ThreadViewport` reads the stored scroll position and restores it using `scrollTop` assignment (not smooth scroll — restoration should be instant, not animated).

### 10.4 CSS scroll anchoring

`overflow-anchor: auto` is set on the `ThreadViewport`. This handles the case where new entries are prepended (e.g., loading earlier history) — the browser keeps the current view stable.

For new entries appended at the bottom, the auto-scroll logic handles the decision. `overflow-anchor` is not relied upon for new-entry behavior.

---

## 11. Thread Virtualization Strategy

### 11.1 The threshold decision

Virtualization is not applied by default. Rendering all entries is simpler and performs adequately for threads under ~300 entries. The threshold for virtualization is 300 entries, not 50.

This threshold is a constant. When a thread exceeds 300 entries, `@tanstack/react-virtual` is activated. Below the threshold, a plain mapped array renders.

The component does not know which path is active — this is handled by a `useThreadRenderer` hook that returns either a virtualized or non-virtualized render function based on entry count.

### 11.2 Dynamic height strategy

Thread entries have dynamic heights. An artifact entry can be 60px (collapsed) or 400px (expanded). The virtualizer must measure real heights.

Strategy: `measureElement` callback with `ResizeObserver`. Each entry reports its height to the virtualizer on mount and on every resize. The virtualizer estimates during initial render (use 80px as the default estimate — it is better to slightly under-estimate than over-estimate to avoid excessive scroll height).

### 11.3 The expansion problem

When an artifact is expanded (height increases from ~80px to ~400px), the virtualizer must be notified and the scroll position must be preserved.

The pattern:
1. User presses `E` on artifact entry
2. Expansion state changes (local useState in ArtifactEntry)
3. `ResizeObserver` fires on the entry element
4. Virtualizer receives new measurement
5. If the expanded entry is above the viewport center: scroll position is corrected by the height delta (prevents viewport jumping)
6. If below: no correction needed — the viewport extends naturally

Step 5 is the critical subtlety. Without it, expanding an entry above the fold causes a jarring jump.

### 11.4 Streaming entries and the virtualizer

While a run is streaming content, the streaming entry's height is changing continuously. Every measurement triggers the ResizeObserver, which triggers virtualizer recalculation.

Mitigation: debounce the ResizeObserver callback for streaming entries with a 100ms delay. The slight height lag during streaming is imperceptible. Without debouncing, streaming entries cause 60fps layout recalculations.

The debounce applies only to entries in `running` status. All other entries use immediate measurement.

---

## 12. Component Composition Boundaries

### 12.1 The ThreadEntry boundary

`ThreadEntry` is a compound component. It is also the most important composition boundary in the codebase. Define it correctly once; the team follows the pattern for every entry type.

```typescript
// Interface contract — not implementation
interface ThreadEntryComposition {
  // The shell: spine, gutter, hover/focus behavior, animation wrapper
  ThreadEntry: FC<{ entry: AnyThreadEntry; index: number }>

  // Type-specific body components — used inside ThreadEntry
  BriefBody: FC<{ entry: BriefEntry }>
  RunBody: FC<{ entry: RunEntry }>
  ArtifactBody: FC<{ entry: ArtifactEntry }>
  DecisionBody: FC<{ entry: DecisionEntry }>
  MemoryUpdateBody: FC<{ entry: MemoryUpdateEntry }>

  // Shared sub-components — used by multiple body types
  EntryHeader: FC<{ type: EntryType; attribution: string; timestamp: Date; badge?: ReactNode }>
  LineageAnnotation: FC<{ runId: string; briefId: string }>
  ReviewActionBar: FC<{ artifactId: string; reviewState: ArtifactReviewState }>
}
```

The `ThreadEntry` shell handles: spine node rendering, gutter layout, hover detection, keyboard focus management, entry appearance animation, depth effect (when other entries are focused). It does NOT render entry content — it passes the entry data to the appropriate body component.

The type-specific body components handle: their content layout, their specific state (expanded/collapsed, streaming), and their specific interactions. They do NOT handle spine, gutter, hover, focus, or animation.

### 12.2 The discriminated union strategy

```typescript
// Interface contract for the entry type system
type BriefEntry = {
  type: 'brief'
  id: string
  goalText: string
  contextText?: string
  constraintsText?: string
  outputFormat?: ArtifactType
  targetAgentId: string
  timestamp: Date
  runIds: string[]
}

type RunEntry = {
  type: 'run'
  id: string
  briefId: string
  agentId: string
  status: RunStatus
  startedAt: Date
  completedAt?: Date
  model: string
  artifactIds: string[]
  streamingContent?: string   // only present when status === 'running'
}

type ArtifactEntry = {
  type: 'artifact'
  id: string
  runId: string
  artifactType: ArtifactType
  title: string
  content: string
  reviewState: ArtifactReviewState
  promotedAt?: Date
  lineage: ArtifactLineage
}

// ... DecisionEntry, MemoryUpdateEntry

type AnyThreadEntry = BriefEntry | RunEntry | ArtifactEntry | DecisionEntry | MemoryUpdateEntry
```

The discriminated union on `type` drives all rendering decisions. The `ThreadEntry` component switches on `entry.type` to select the body component. TypeScript exhaustiveness checking ensures every entry type is handled.

### 12.3 The useEntryBehavior hook

All entries share behavioral logic: hover state, keyboard focus participation, depth effect, and animation. This goes in a single hook:

```typescript
// Contract — not implementation
interface EntryBehaviorReturn {
  isHovered: boolean
  isKeyboardFocused: boolean     // driven by Zustand entry cursor
  depthOpacity: number           // 1 or 0.55 based on whether another entry is focused
  motionProps: MotionProps       // Framer Motion props for entry appearance
  containerProps: HTMLAttributes // data-entry-id, aria attributes
  ref: RefObject<HTMLDivElement>
}

function useEntryBehavior(entryId: string, index: number): EntryBehaviorReturn
```

Every entry body component calls this hook. No hover detection, focus management, or animation logic lives in a component file.

---

## 13. Styling Architecture Philosophy

### 13.1 The Tailwind usage contract

Tailwind is used for layout, spacing, and structural styling. It is not used for brand-specific visual decisions.

Allowed Tailwind usage:
- Layout: `flex`, `grid`, `gap-*`, `p-*`, `m-*`
- Sizing: `w-*`, `h-*`, `max-w-*`, `min-h-*`
- Display: `hidden`, `block`, `inline-flex`
- Token-mapped colors: `bg-bg-surface`, `text-text-primary` (these map through the token layer)
- Border radius: `rounded-*` mapped to radius tokens
- Cursor: `cursor-pointer`, `cursor-text`
- Overflow: `overflow-hidden`, `overflow-auto`

Not allowed in Tailwind:
- Arbitrary values: `w-[700px]`, `bg-[#111110]` — these bypass the token system
- Hardcoded colors: `text-gray-400` — use semantic tokens
- Spacing that doesn't map to a token: `p-[13px]`
- Anything that should be in a motion primitive: `transition-all duration-300`

### 13.2 CSS Modules for structural components

Layout primitives that have complex CSS (e.g., `ThreadGrid`, `PanelSplit`) use CSS Modules, not Tailwind. This is because their CSS is structural and should not be expressed as class composition.

All other components use Tailwind exclusively. CSS Modules are not used for visual styling — only for layout primitives with intrinsic complexity.

### 13.3 The variant pattern

Entry types have distinct visual treatments (different tints, left-border colors). These are implemented via a `variant` prop on `ThreadEntryShell`, not via conditional Tailwind class strings.

The variant maps to a CSS class that applies the variant-specific tokens:

```css
/* thread-entry.css */
.entry-brief {
  --entry-tint: var(--accent-purple-dim);
  --entry-accent: var(--accent-purple);
  --entry-accent-width: 2px;
}
.entry-artifact-approved {
  --entry-tint: transparent;
  --entry-accent: var(--accent-green);
  --entry-accent-width: 2px;
}
```

`ThreadEntryShell` applies the appropriate class based on the `variant` prop. The shell's CSS uses these local variables. This pattern avoids long conditional className strings and keeps variant logic in CSS where it belongs.

---

## 14. Keyboard Event Architecture

This is the second most consequential architecture decision, after state.

### 14.1 The command registry pattern

A single event listener at the `ThreadSurface` level. No `onKeyDown` handlers in individual components except for:
- Form inputs (handled by the browser)
- Composable components that need to stop propagation (e.g., the full brief form)

```typescript
// Interface contract
interface Command {
  id: string
  shortcut: KeyboardShortcut
  handler: () => void
  condition?: () => boolean    // only active when condition returns true
  weight: number               // higher weight wins when shortcuts conflict
}

interface CommandRegistry {
  register: (command: Command) => () => void   // returns deregister function
  dispatch: (event: KeyboardEvent) => void
  getActiveCommands: () => Command[]
}
```

The registry is a module-level singleton, not a React context. React contexts are not appropriate for event-handling infrastructure — they have React lifecycle overhead.

### 14.2 Keyboard context stack

The registry uses a context stack to determine which commands are active:

```typescript
type KeyboardContext = 
  | 'thread'           // Thread viewport has focus, no entry cursor active
  | 'entry-navigation' // Entry cursor is active (J/K navigation)
  | 'composer-simple'  // Simple composer has focus
  | 'composer-full'    // Full brief mode active
  | 'review'           // Keyboard focus on an unreviewed artifact
  | 'memory'           // Memory panel fact has focus
  | 'command-palette'  // Command palette is open (supersedes all)
```

Commands register with one or more context conditions. When a keyboard event fires, the registry finds the highest-weight command whose condition is satisfied by the current context stack.

The context stack is stored in Zustand as `keyboardContext`. It is updated by:
- Composer receiving focus → pushes `composer-simple`
- Tab in composer → transitions to `composer-full`
- Entry cursor becoming active → transitions to `entry-navigation`
- Entry cursor on unreviewed artifact → additionally activates `review`
- Command palette opening → pushes `command-palette`

### 14.3 Shortcut collision prevention

Shortcuts are validated at registration time. If two commands in the same context register the same shortcut, a console error is thrown in development. This is enforced by the registry, not by convention.

`Tab` is a special case: it has browser-native behavior and component-level behavior (composer expansion). Commands that handle `Tab` must call `event.preventDefault()` before their handler runs, which is only permitted when the KeyboardContext is `composer-simple`.

### 14.4 The "/" shortcut

`/` focuses the composer. It must only activate when no input element has focus and the keyboard context is `thread` or `entry-navigation`. The handler:

1. Calls `event.preventDefault()` (prevents `find in page` behavior)
2. Sets composer mode to `simple` in Zustand
3. Calls `composerInputRef.current.focus()`
4. The focus event triggers a context transition to `composer-simple`

---

## 15. Rendering Hierarchy

### 15.1 The React tree structure

```
ProjectThread (Surface — data coordination, store access)
├── ThreadSurface (Feature — keyboard events, scroll management)
│   ├── HeaderBar (Feature — reads project metadata from TanStack Query)
│   ├── ThreadViewport (Organism — scroll container, virtualization host)
│   │   ├── ReturnContextBanner (Feature — conditional, reads from store)
│   │   └── [ThreadEntry × N] (Feature — reads individual entries from Query cache)
│   │       ├── ThreadGrid (Layout primitive)
│   │       │   ├── Gutter (Layout primitive)
│   │       │   │   └── SpineNode (Atom)
│   │       │   └── EntryContent (Organism — type-dispatched)
│   │       │       ├── EntryHeader (Molecule)
│   │       │       ├── [BriefBody | RunBody | ArtifactBody | ...] (Organism)
│   │       │       └── [ReviewActionBar] (Feature — conditional on artifact state)
│   ├── ComposerZone (Feature — composer state from store)
│   │   ├── ComposerSimple (Organism)
│   │   └── ComposerFullBrief (Organism — conditional, animated)
│   └── PulseBar (Feature — reads agent states from TanStack Query)
└── MemoryPanel (Feature — reads memory facts from TanStack Query)
    ├── PanelHeader (Molecule)
    ├── [MemoryZone × 4] (Organism)
    │   └── [MemoryFact × N] (Organism)
    └── PanelFooter (Molecule)
```

### 15.2 Re-render boundaries

The most expensive re-renders to prevent:

`ThreadViewport` must not re-render when a single entry's state changes. Entry data flows through TanStack Query's individual entry queries — `useEntry(entryId)` — not through a single `useThreadEntries` query that would re-render all entries on any change.

Each `ThreadEntry` subscribes to its own query key. When an artifact is approved, only that artifact's entry re-renders. The viewport does not re-render.

`MemoryPanel` must not re-render when thread entries change. Memory panel data is on a separate query key family. Thread activity has no impact on memory panel rendering.

### 15.3 Memoization strategy

`ThreadEntry` is memoized with `React.memo`. The equality check is on `entry.id` and the entry's last-modified timestamp. Do not memo by deep equality — that is expensive and unreliable for complex objects.

`ReviewActionBar` is not memoized — it is conditional and only renders for unreviewed artifacts. Its presence/absence is determined by conditional rendering, not opacity/display.

`MemoryFact` is memoized on the fact's `id` and `updatedAt`. Memory facts are frequently read but rarely updated.

---

## 16. Streaming Content Rendering Model

### 16.1 The core problem

Streaming AI output arrives as Server-Sent Events (SSE). Each event contains a token or a small chunk of text. There may be 50–200 events per second during fast streaming. React's reconciler cannot handle 200 state updates per second without jank.

The solution: bypass React's state system during streaming. Commit to React state only when streaming completes or when a significant chunk (e.g., 200ms of accumulated tokens) is available.

### 16.2 The useRunStream hook contract

```typescript
// Contract — not implementation
interface UseRunStreamReturn {
  // The streaming content ref — points to a DOM element
  // The hook writes directly to this element's textContent during streaming
  contentRef: RefObject<HTMLElement>

  // Current run status — this DOES go through React state
  status: RunStatus

  // The committed content — only updated when streaming completes
  // This is what gets saved to TanStack Query cache
  committedContent: string | null

  // Called by the artifact entry to start streaming
  // Connects to the SSE endpoint for this run
  startStream: (runId: string) => void
}
```

The direct DOM writes during streaming are the only sanctioned exception to "no direct DOM manipulation" in this codebase. They are isolated to `useRunStream` and must not be replicated elsewhere.

### 16.3 The streaming-to-committed transition

When the SSE stream closes (run completes):

1. `contentRef.current.textContent` contains the full content
2. The hook captures `contentRef.current.textContent` as `committedContent`
3. `status` changes from `running` to `complete` — this triggers a React re-render
4. The artifact entry receives `committedContent` via its TanStack Query data (the hook also updates the query cache)
5. The re-render replaces the raw DOM text with the properly formatted React-rendered content
6. The transition from raw text to formatted content should be visually imperceptible — both are text at the same font size

The "flicker" risk is the transition at step 6. Mitigate by ensuring the formatted content renders with identical whitespace and line breaks to the raw streamed text. Do not use Markdown rendering for streaming content — only for committed content.

### 16.4 Code block handling during streaming

Code blocks are delimited by `` ``` `` fences. During streaming, the code block may arrive mid-stream.

Strategy: detect `` ``` `` in the accumulated content and add a `.streaming-code` class to the wrapping element when inside a code block. Apply a monospace font to `.streaming-code` via CSS. This avoids any React-level parsing during streaming.

After commitment, the content is parsed properly and rendered as a React code block component with syntax highlighting, line numbers, and copy button.

---

## 17. Review Interaction State Model

### 17.1 The state machine

The review interaction is a finite state machine. It is not a boolean or a string. Use XState or a manual state machine — not conditional logic spread across components.

```typescript
type ReviewMachineState =
  | { state: 'idle' }
  | { state: 'hovered' }           // action bar visible
  | { state: 'pending_reject' }    // annotation input shown
  | { state: 'pending_redirect' }  // annotation input shown, required
  | { state: 'submitting' }        // API call in flight
  | { state: 'approved' }          // terminal
  | { state: 'rejected'; annotation?: string }   // terminal
  | { state: 'redirected'; instruction: string } // terminal, creates new Brief
  | { state: 'error'; previousState: ReviewMachineState } // recoverable

type ReviewMachineEvent =
  | { type: 'HOVER_ENTER' }
  | { type: 'HOVER_LEAVE' }
  | { type: 'KEYBOARD_FOCUS' }
  | { type: 'APPROVE' }
  | { type: 'REJECT' }
  | { type: 'REDIRECT' }
  | { type: 'SUBMIT_REJECT'; annotation?: string }
  | { type: 'SUBMIT_REDIRECT'; instruction: string }
  | { type: 'CANCEL' }
  | { type: 'SUCCESS' }
  | { type: 'FAILURE' }
```

The state machine lives in a custom hook `useArtifactReview(artifactId)`. The ReviewActionBar is a pure component that receives the current state and event dispatch function.

### 17.2 The optimistic update contract

On `APPROVE` or `SUBMIT_REJECT`:
1. Dispatch event to the state machine (transitions to `submitting`)
2. Update the Zustand `pendingReviews` map optimistically
3. The TanStack Query hook for this artifact reads from `pendingReviews` first (optimistic override)
4. Fire the API mutation
5. On success: clear from `pendingReviews`, invalidate the artifact query key
6. On failure: transition to `error`, rollback `pendingReviews`

The optimistic state in `pendingReviews` is typed as a partial ArtifactEntry — only the fields that change during review. The hook merges optimistic state with server state at render time.

### 17.3 The redirect flow creates a Brief

On `SUBMIT_REDIRECT`:

1. The redirect instruction is sent to the API
2. The API creates a new Brief entry in the thread
3. The API returns the new Brief's ID
4. TanStack Query is invalidated for the thread entries — the new Brief appears
5. A visual connection annotation is added to the original artifact entry: "redirected → Brief below"

The connection annotation is not a separate entry in the thread — it is state on the artifact entry itself. The Brief entry and the artifact entry are linked by `briefId` on the redirect event.

---

## 18. Memory Panel State Model

### 18.1 State topology

Memory panel state is split across three owners:

```
TanStack Query:
  Memory facts data       (server state, refetched on project change)
  Last-updated timestamp  (derived from the facts query metadata)

Zustand:
  editingFactId           (which fact is in edit mode, if any)
  collapsedZones          (Set<MemoryZone>)
  panelScrollPosition     (restored on project re-visit)

Local useState (in MemoryFact):
  editValue               (the current text in the fact's edit input)
  — not in Zustand because it is ephemeral input state
```

### 18.2 Edit mode contract

Only one fact can be in edit mode at a time. `editingFactId` in Zustand enforces this. When the user activates a second fact's edit mode, the first is automatically cancelled (if unsaved) or saved (if the user had typed something).

The save action:
1. `editValue` is committed via API mutation
2. TanStack Query cache for this fact is updated optimistically
3. `editingFactId` is cleared in Zustand
4. Focus returns to the fact row (not to the thread viewport)

The cancel action:
1. `editValue` is discarded (local state reset)
2. `editingFactId` is cleared
3. Focus returns to the fact row

### 18.3 Zone collapse persistence

Collapsed zones are persisted per-project in localStorage. The key: `memory-panel-collapsed-zones:${projectId}`. This is not in Zustand (Zustand state is in-memory) — it is in localStorage via a thin wrapper hook `usePersistedSet`.

---

## 19. Thread Entry Polymorphism Strategy

### 19.1 Why not separate components per type

The naive approach: `BriefEntry`, `RunEntry`, `ArtifactEntry` as completely separate components. This approach leads to:

- Duplicated spine, gutter, hover, focus, animation, and accessibility logic
- Inconsistent behavior when the shared logic is updated
- Props that are identical across all types (entryId, index, isVirtualized) repeated in six component signatures

The correct approach: one `ThreadEntry` shell component with type-specific body rendering via a slot pattern.

### 19.2 The slot pattern

`ThreadEntry` accepts an `entry: AnyThreadEntry` prop. It renders the shell (spine, gutter, animation wrapper, focus management, hover detection). It then dispatches to the appropriate body component:

```typescript
// Contract — the dispatch logic
const bodyComponents: Record<ThreadEntryType, ComponentType<{ entry: AnyThreadEntry }>> = {
  brief: BriefBody,
  run: RunBody,
  artifact: ArtifactBody,
  decision: DecisionBody,
  memory_update: MemoryUpdateBody,
}
```

This dispatch table is the canonical polymorphism mechanism. Adding a new entry type means: adding to the `AnyThreadEntry` union, adding a body component, and adding to this dispatch table. The shell never changes.

### 19.3 Type-narrowing in body components

Each body component receives `entry: AnyThreadEntry` and immediately narrows it:

```typescript
// Contract pattern
function ArtifactBody({ entry }: { entry: AnyThreadEntry }) {
  if (entry.type !== 'artifact') return null  // TypeScript guard
  // entry is now narrowed to ArtifactEntry
  // ...
}
```

This pattern may look redundant (the shell dispatches correctly), but it provides TypeScript narrowing without prop casting and makes each body component independently safe.

---

## 20. What Must Remain Framework-Agnostic

### 20.1 The portability boundary

The following must never import from React, Framer Motion, TanStack Query, or Zustand:

```
state-machines/
  review.machine.ts         ArtifactReview XState machine or manual machine
  run.machine.ts            Run lifecycle state machine
  composer.machine.ts       Composer mode state machine

data/
  thread.types.ts           All TypeScript type definitions
  entry.discriminator.ts    Type narrowing utilities
  thread.validators.ts      Zod schemas for API response validation

motion/
  constants.ts              Spring and timing constants (pure values, no imports)
  variants.ts               Framer Motion variant definitions (imports framer-motion only)

keyboard/
  command-registry.ts       Command registry (DOM APIs only, no React)
  shortcut-parser.ts        Keyboard event to shortcut string conversion
  context-stack.ts          Keyboard context management (pure logic)

scroll/
  scroll-manager.ts         Auto-scroll logic (DOM APIs only, no React)
  anchor-correction.ts      Scroll anchor correction math
```

### 20.2 Why this matters

The state machines, type definitions, keyboard management, and scroll logic are the high-value intellectual property of this frontend. They encode the platform's behavior. If React is ever replaced (or server components change the architecture), these modules should survive intact.

More practically: they are testable in plain Jest without React Testing Library. The most important behavioral logic in the application — review state transitions, keyboard routing, scroll anchoring — should have unit test coverage independent of the UI framework.

### 20.3 The import discipline

Enforce the boundary with ESLint's `import/no-restricted-paths` rule:

```
state-machines/**: cannot import from react, framer-motion, zustand, @tanstack/*
data/**: cannot import from anything except itself and node modules
keyboard/**: cannot import from react, framer-motion, zustand
scroll/**: cannot import from react, framer-motion, zustand
```

This is a build-time constraint, not a convention. It will catch violations in CI.

---

## Critical Pre-Implementation Decisions

These decisions must be made and documented before any feature code is written. They cannot be reversed without significant refactoring.

**Decision 1:** Confirm TanStack Query v5 as the server state layer. This is the recommendation, but the team must explicitly agree before implementation.

**Decision 2:** Confirm the `useEntryBehavior` hook boundary. Every engineer must understand that hover/focus/animation logic lives in this hook, not in components. A team that violates this boundary immediately creates divergent entry behaviors.

**Decision 3:** Confirm that streaming uses direct DOM mutation. Some engineers will reflexively reject this. The decision must be made explicitly, documented, and defended to future engineers who will encounter it.

**Decision 4:** Confirm the single keyboard event listener architecture. Teams often add `onKeyDown` to components "temporarily." The registry pattern must be established as a hard rule from day one.

**Decision 5:** Confirm the token hierarchy. Before any Tailwind class is written, the three-level token system must be implemented and all engineers must know which level they reference in which context.

---

*Document version: 1.0 — Pre-implementation architecture reference*  
*Next deliverable: Component library setup, token layer implementation, useEntryBehavior prototype*
