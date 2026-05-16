# Project Thread — Surface Specification

**Surface:** Primary operational workspace  
**Status:** Canonical — implementation reference v1.0  
**Mode:** Desktop-first, dark-mode first  
**Quality bar:** Apple / Linear / Arc / Raycast

---

## Preface

The Project Thread is where the user spends the majority of their time. It is not a chat interface. It is a chronological operational log of directed intelligence work — Briefs dispatched, Runs executed, Artifacts produced, Decisions recorded, Reviews issued, Memory updated. Every design decision on this surface must serve that purpose.

The surface must feel like a premium command environment. The emotional reference is a well-designed cockpit or a professional editing timeline: calm, information-dense, tool-quality. Not a feed. Not a conversation. Not a dashboard.

---

## 1. Design Token System

All values in this section are implementation constants. They do not change between screens.

### 1.1 Color tokens — dark mode

```
--bg-base:          #111110   Base page background. The deepest surface.
--bg-surface:       #161614   Thread entry backgrounds. Slight lift from base.
--bg-elevated:      #1E1E1C   Hover states, focused entries, popovers.
--bg-overlay:       #242422   Memory panel, command palette backdrop.
--bg-scrim:         rgba(0,0,0,0.6)   Full-screen overlay scrim.

--border-faint:     rgba(255,255,255,0.05)   Structural separators. Near-invisible.
--border-subtle:    rgba(255,255,255,0.09)   Default entry borders.
--border-default:   rgba(255,255,255,0.14)   Hover borders, active elements.
--border-strong:    rgba(255,255,255,0.22)   Focus rings, selected states.

--text-primary:     #EDEBE3   Body copy, entry content. High contrast.
--text-secondary:   #9A9890   Attribution, metadata, labels.
--text-tertiary:    #5E5D5A   Timestamps, placeholders, decorative labels.
--text-disabled:    #3A3A38   Inactive elements.

--accent-purple:    #7F77DD   Brief entries, dispatch actions, agent color.
--accent-teal:      #2DBE90   Decisions, memory updates, success states.
--accent-amber:     #F0A030   Running state pulse, redirect verb, warnings.
--accent-red:       #E24B4A   Rejected artifacts, failed runs, error states.
--accent-green:     #4CAF82   Approved artifacts, complete runs.

--accent-purple-dim: rgba(127,119,221,0.12)   Brief entry background tint.
--accent-teal-dim:   rgba(45,190,144,0.10)    Decision/memory background tint.
--accent-amber-dim:  rgba(240,160,48,0.10)    Running state background tint.
--accent-red-dim:    rgba(226,75,74,0.10)     Rejected/failed background tint.
--accent-green-dim:  rgba(76,175,130,0.10)    Approved background tint.
```

### 1.2 Typography scale

Font family: system-ui stack with `-apple-system, "Segoe UI", sans-serif` as fallback. Monospace: `"JetBrains Mono", "Fira Code", ui-monospace, monospace`.

```
--type-label:       10px / 500 / 0.08em letter-spacing / uppercase     Entry type labels, section headers
--type-meta:        11px / 400 / 0.02em letter-spacing                  Timestamps, model names, counts
--type-caption:     12px / 400 / normal                                  Metadata rows, attribute values
--type-body:        13px / 400 / 1.65 line-height                       Entry content body text
--type-body-mono:   12px / 400 / 1.6 line-height (monospace)            Code within artifacts
--type-title:       14px / 500 / normal                                  Entry primary title, section names
--type-heading:     16px / 500 / normal                                  Project name in header
--type-display:     18px / 500 / -0.01em letter-spacing                  Composer placeholder, empty state
```

### 1.3 Spacing rhythm

```
--space-1:   4px
--space-2:   8px
--space-3:   12px
--space-4:   16px
--space-5:   20px
--space-6:   24px
--space-8:   32px
--space-12:  48px
```

Spacing rule: all internal padding uses multiples of 4px. All gap values between entries use multiples of 4px. No arbitrary values.

### 1.4 Radius system

```
--radius-sm:   4px    Inline tags, small pills
--radius-md:   6px    Entry containers, input fields
--radius-lg:   8px    Artifact cards, expanded entries
--radius-xl:   12px   Popovers, command palette
```

### 1.5 Motion constants

```
--spring-snappy:   tension: 380, friction: 30, mass: 1     UI responses, toggles
--spring-gentle:   tension: 200, friction: 26, mass: 1     Entry appearances, panel slides
--spring-slow:     tension: 120, friction: 22, mass: 1     Modal entrances, large transitions

--ease-out:        cubic-bezier(0.16, 1, 0.3, 1)
--ease-in-out:     cubic-bezier(0.4, 0, 0.2, 1)

--duration-instant: 80ms     Hover state changes
--duration-fast:    150ms    Micro-animations, icon state changes
--duration-mid:     250ms    Entry state transitions
--duration-slow:    400ms    Panel slides, modal entrances
--duration-crawl:   600ms    Orchestration canvas transitions
```

---

## 2. Spatial Layout System

### 2.1 Shell proportions

The Project Thread surface exists within the three-panel shell. The thread claims the center panel, bounded left and right.

```
Shell layout (left to right):
  Icon rail:        52px       Fixed. Never collapses.
  Orbit panel:      220px      Collapsible. Default open.
  Thread surface:   1fr        Minimum 480px. Grows with viewport.
  Memory panel:     280px      Collapsible. Default open.

Minimum supported viewport: 1100px
Comfortable viewport: 1280px–1600px
Wide viewport: 1600px+ (thread content caps at max-width, panels grow)
```

### 2.2 Thread panel internal grid

Within the thread surface, content does not span the full panel width. The internal grid:

```
Thread panel
├── Left gutter:       48px       Timeline spine + entry type icons
├── Content area:      flexible   All entry content lives here
└── Right margin:      24px       Breathing room. Never use for content.

Content area max-width: 700px
Content area grows freely up to max-width, then centers with equal left/right padding.

On a 1280px viewport with panels open:
  Available thread width ≈ 1280 - 52 - 220 - 280 = 728px
  Left gutter: 48px, right margin: 24px
  Content area: 728 - 48 - 24 = 656px  (capped at 700px)
```

### 2.3 Thread surface regions

The thread panel is divided into three fixed-position regions:

```
Thread surface (top to bottom):
  Header bar:        48px fixed     Project identity, top rule
  Thread viewport:   1fr flex       Scrollable entry list
  Composer zone:     variable       Min 56px (simple), max 280px (full brief)
  Pulse bar:         32px fixed     System status, bottom rule
```

The header bar and pulse bar are always visible. The thread viewport and composer divide the remaining height. The composer grows upward; the thread viewport shrinks to accommodate.

### 2.4 Memory panel internal grid

```
Memory panel (left border to right edge):
  Left border:       1px         --border-subtle
  Inner padding:     16px        Left and right
  Content:           248px       (280px - 16 - 16)
  Scrollable zone:   h: 1fr      All four zones scroll together
  Footer bar:        36px fixed  "N facts · updated X ago" + actions
```

---

## 3. Information Hierarchy

### 3.1 The five reading distances

Every element on the surface belongs to one of five reading distances. Design must respect these distances — elements of the same distance share the same visual weight and never compete with elements of a lower (more important) distance.

```
Distance 1 — Immediate    What is happening right now?
  → Running state indicators, new artifact review action, active agent status

Distance 2 — Ambient     What is the current state of the project?
  → Entry content (Artifact body, Decision text), memory facts, project goal

Distance 3 — Contextual  What produced this?
  → Entry attribution, agent name, timestamp, run duration

Distance 4 — Reference   What did I decide and why?
  → Lineage annotations, expanded metadata, collapsed content

Distance 5 — Systemic    Is the system healthy?
  → Pulse bar, token usage, deploy status, memory age
```

### 3.2 Visual weight distribution

Primary visual weight: entry content. Everything else is lighter.
- Entry titles and Artifact bodies: `--text-primary` at body scale
- Metadata, attribution, timestamps: `--text-secondary` or `--text-tertiary`
- Type labels (BRIEF, RUN, ARTIFACT, DECISION): `--type-label` scale, accent color at reduced opacity (0.7)
- Action buttons: only at full opacity on hover/focus — tertiary color at rest
- The spine line: `--border-faint`, 1px. Structural but invisible at a distance.

### 3.3 Depth system

The surface uses three depth levels. Depth is expressed through background color, not shadows or blur.

```
Depth 0 (base):      --bg-base       The page background. Beneath everything.
Depth 1 (surface):   --bg-surface    Default entry backgrounds.
Depth 2 (elevated):  --bg-elevated   Hovered or focused entries. Composer on focus.
Depth 3 (overlay):   --bg-overlay    Memory panel, popovers, action menus.
```

---

## 4. Thread Anatomy

### 4.1 The spine

A 1px vertical line runs continuously down the left edge of the content area (at x = 32px within the gutter). This is the Thread Spine. It connects every entry visually and communicates that entries are part of the same temporal sequence.

Spine rules:
- Color: `--border-faint`. It is structural, not decorative.
- Interrupted at grouping breaks (see 4.3) by a 12px gap.
- The Spine stops at the bottom of the last entry. It does not extend into the composer zone.
- Each entry has a circular "node" on the Spine at its vertical midpoint. The node's style indicates entry type.

### 4.2 Spine nodes

Each entry type has a distinct node on the Spine. Nodes are 20×20px, centered at x=32px in the gutter.

```
Brief:          Circle, 8px diameter, --accent-purple fill
Run (idle):     Circle, 8px diameter, --border-default fill (empty)
Run (running):  Circle, 8px diameter, --accent-amber fill, pulse animation
Run (complete): Circle, 6px diameter, --accent-green fill
Run (failed):   Circle, 6px diameter, --accent-red fill
Artifact:       Square, 6×6px rotated 45° (diamond), --text-tertiary fill
Decision:       Circle, 8px diameter, --accent-teal fill
Review:         n/a — Review entries are inline on Artifacts, not spine nodes
Memory update:  Dash (—), 8px wide × 2px tall, --border-default fill
```

### 4.3 Entry grouping

Entries are grouped by causal relationship, not by time alone. When a Brief directly produces one or more Runs, and those Runs produce Artifacts, all of these are in the same visual group.

Grouping rules:
- A Brief and all Runs it directly spawned are grouped.
- All Artifacts produced by those Runs are grouped within the group.
- A Decision that was extracted from a specific Run/Artifact is indented 12px within the group.
- Diverge events create a group with visible parallel lanes (described in the Orchestration overlay spec, not here).

Between groups: 20px gap and a 12px Spine break. Within groups: 8px gap between entries.

### 4.4 Temporal markers

Every entry carries a timestamp. Timestamps render as relative ("just now", "3 min ago", "2 hours ago", "yesterday"). On hover, the tooltip shows the full ISO timestamp.

Date separators appear when the day changes. Format: the day name, centered, `--type-label` style, `--text-tertiary` color. A horizontal rule extends left and right from the label to meet the spine and the content area edge.

---

## 5. Typed Entry Design

### 5.1 Entry container anatomy

Every entry (regardless of type) shares the same container structure:

```
Entry container (horizontal layout):
  ├── Spine gutter (48px)
  │   ├── Spine line (1px, continuous)
  │   └── Spine node (20×20px, centered at x=32)
  └── Content region (flexible)
      ├── Entry header (always present)
      │   ├── Type label (left, --type-label)
      │   ├── Attribution: "Agent Name" or "You" (left, --type-meta)
      │   ├── Timestamp (right-aligned, --type-meta, --text-tertiary)
      │   └── Status badge (right of attribution, if applicable)
      ├── Entry body (type-specific)
      └── Entry footer (optional, on expand)
          ├── Lineage annotation trigger
          └── Metadata row
```

Entry container base styles:
- Background: `--bg-surface`
- Border: none at rest (the Spine provides structural separation)
- Border-radius: `--radius-md`
- Padding: `--space-4` (16px) on all sides
- On hover: background transitions to `--bg-elevated` at `--duration-instant`
- On focus: background is `--bg-elevated`, a 1px `--border-strong` ring appears with `--radius-md`

### 5.2 Brief entry

A Brief is a structured intent document. Its visual treatment is the most distinct of all entry types, because it must feel deliberate — heavier than a Run or Decision.

```
Brief entry:
  Container:      --accent-purple-dim background tint (not just --bg-surface)
                  Left-border accent: 2px solid --accent-purple (no radius on left side)
  Header:
    Type label:   "BRIEF" in --accent-purple at --type-label
    Attribution:  "You → Agent Name" in --text-secondary
    Timestamp:    Standard
  Body:
    Goal field:   --type-title, --text-primary, full width
    Below goal:   Up to two additional fields shown collapsed:
                    Context: shown if set (--type-body, --text-secondary)
                    Constraints: shown if set (--type-body, --text-secondary)
                    Output format: shown as a pill badge (--radius-sm, --bg-elevated)
    Field labels: "GOAL", "CONTEXT", "CONSTRAINTS" in --type-label, --text-tertiary
  Footer:
    "Dispatched to Architect · 3 runs produced" in --type-meta, --text-tertiary
    Expand link: "View full brief ↓" — only if additional fields are collapsed
```

Collapsed state (default): Shows Goal only. Context and Constraints are hidden with a "2 more fields" indicator.

### 5.3 Run entry

A Run is an observable execution event. It is structurally compact — it exists to communicate status, not content.

```
Run entry:
  Container:      --bg-surface (no tint at rest)
                  When running: --accent-amber-dim tint transitions in
  Header:
    Type label:   "RUN" in --text-tertiary
    Attribution:  Agent name in --text-secondary (agent color dot ●  before name)
    Status badge: "running" (amber) / "complete" (green) / "failed" (red)
    Timestamp:    Start time for complete, elapsed time for running
  Body:
    When running:   "Reviewing middleware ordering and JWT validation..." (streaming, --type-body, --text-secondary)
                    Progress bar: 2px height, full content-width, --accent-amber fill, animated
    When complete:  "Produced 2 artifacts · 45s · claude-sonnet-4-6" (--type-meta, --text-tertiary)
    When failed:    Error summary (--type-body, --accent-red)
  Actions on hover/focus:
    Running:  [Redirect ↳] verb appears right-aligned
    Complete: [View lineage] appears right-aligned
```

The progress bar for running state is not a conventional percentage progress bar. It animates in a scanning pattern (left-to-right fill, then repeating) to communicate activity without false precision. It fills and drains over approximately 3 seconds per cycle.

### 5.4 Artifact entry

Artifacts are the primary content of the thread. They deserve the most visual real estate and the most careful hierarchy.

```
Artifact entry:
  Container:      --bg-surface with type-specific left-border
    Code artifacts:     2px left-border, --accent-amber
    Analysis/plan:      2px left-border, --accent-purple
    Document:           2px left-border, --accent-teal
    Approved:           2px left-border, --accent-green
    Rejected:           2px left-border, --accent-red, opacity 0.5 on entire entry
  Header:
    Type label:   "ARTIFACT" + artifact subtype (e.g. "ARTIFACT · CODE") in appropriate accent color
    Attribution:  "Agent Name" in --text-secondary
    Timestamp:    Standard
    Review state: Badge right-aligned: "unreviewed" (default, --text-tertiary) /
                  "approved ✓" (--accent-green) / "rejected" (--accent-red, small) /
                  "superseded" (--text-disabled, strikethrough)
  Body (collapsed, default):
    First 3–4 lines of content (--type-body or --type-body-mono for code)
    If content exceeds 4 lines: fade-out at bottom + "Expand ↓" trigger
    Fade: 20px gradient from --bg-surface to transparent (above), then --bg-surface (at edge)
  Body (expanded):
    Full content, scrollable within the entry
    Maximum height: 60vh. Scrollbar appears. Entry does not overflow the thread.
  Footer (on hover, below content):
    Review action bar (described in Section 13)
    "View lineage" trigger (right-aligned)
```

Artifact content rendering:
- Plain text: `--type-body`, `--text-primary`, no special treatment
- Code: rendered in a code block, `--type-body-mono`, line numbers at `--text-tertiary`, syntax context from artifact subtype tag
- The code block does not use a separate background — it uses a 1px `--border-subtle` border around it within the entry

### 5.5 Decision entry

Decisions are compact and reference-weight. They do not compete with Artifacts for attention.

```
Decision entry:
  Container:      --accent-teal-dim tint, no left-border accent
                  Slightly reduced height — feels more compact than Brief or Artifact
  Header:
    Type label:   "DECISION" in --accent-teal
    Attribution:  "You" or "Extracted" (with a robot icon if auto-extracted)
    Timestamp:    Standard
  Body:
    Decision text (--type-body, --text-primary): the choice made, maximum 2 lines shown
    Below (collapsed): "Reasoning: [...]" — expand trigger on click
    Below (collapsed): "Alternatives considered: [...]" — expand trigger on click
  Footer:
    If linked to an Artifact: "From: Artifact name ↗" in --type-meta, --text-tertiary
```

### 5.6 Memory update entry

Memory updates are ambient. They should be visible but should not interrupt reading flow.

```
Memory update entry:
  Container:      --bg-base (same as page — nearly invisible)
                  No left-border accent, no tint
                  Reduced height: 36px standard
  Header:
    Type label:   "MEMORY" in --text-disabled, --type-label
    Attribution:  n/a
    Content:      Inline: "Added: Stack constraint updated" (--type-meta, --text-tertiary)
    Timestamp:    Right-aligned, --type-meta, --text-tertiary
  No body.
  On hover:      Background transitions to --bg-surface. Full memory fact shown as tooltip.
```

Memory updates should be the least visually prominent entries in the thread. If a user is skimming the thread at a distance, Memory updates should barely register. They exist for the audit log, not for reading.

---

## 6. Brief Composer

The composer is the primary input surface. It lives at the bottom of the thread viewport, inside the composer zone. It is never a chat input box.

### 6.1 Simple mode (default state)

The composer in simple mode is a single, undecorated input field.

```
Composer — simple mode:
  Height:         44px (single line) to 120px (with text wrapping)
  Background:     --bg-elevated
  Border:         1px --border-default
  Border-radius:  --radius-md
  Padding:        12px horizontal, 10px vertical
  Font:           --type-body, --text-primary
  Placeholder:    "Brief an agent, query memory, or redirect a run..."
                  --text-tertiary, --type-body

  Right-side controls (inside the field, right-aligned):
    Agent selector pill: "Architect ▾" — current default agent
                         --bg-surface fill, --border-subtle border, --type-caption, --text-secondary
    [Dispatch] button:   12px left margin from agent pill
                         Compact: 28px height, 64px width, --accent-purple background, --text-primary
                         Keyboard hint inside: "⌘↵" in --type-meta, rgba(255,255,255,0.5)

  Below the input field (8px gap):
    Keyboard hint row:    "Tab  full brief   ⌘⌘D  diverge   ⌘K  command"
                          --type-meta, --text-tertiary, each shortcut in a pill (--bg-surface, --border-faint)
```

On focus (cursor enters the field):
- Border transitions to `--border-default` → `--border-strong` at `--duration-fast`
- Hint row fades in (opacity 0 → 1, `--duration-mid`)
- Background: `--bg-elevated` (already at elevated, no change needed)

### 6.2 Full brief mode

Pressing `Tab` while the simple composer has focus, or clicking the "full brief" trigger, expands the composer to full brief mode.

```
Composer — full brief mode:
  Outer container height:  auto, maximum 280px. Scrollable internally if content exceeds.
  Background:              --bg-elevated
  Border:                  1px --border-strong (active state)
  Border-radius:           --radius-lg
  Animation:               Spring expand from bottom. Input height animates from 44px.
                           New fields stagger in with 40ms delay between each.

  Fields (top to bottom):
    Goal field:
      Label:     "GOAL" (--type-label, --accent-purple, 0.7 opacity)
      Input:     Multiline, min 2 rows, --type-body, --text-primary
      Required.  Placeholder: "What should the agent accomplish?"
      
    Context field:
      Label:     "CONTEXT" (--type-label, --text-tertiary)
      Input:     Multiline, min 1 row, --type-body, --text-secondary
      Optional.  Placeholder: "What should the agent know that isn't in Memory?"
      
    Constraints field:
      Label:     "CONSTRAINTS" (--type-label, --text-tertiary)
      Input:     Multiline, min 1 row, --type-body, --text-secondary
      Optional.  Placeholder: "What must the agent not do?"
      
    Output format selector:
      Label:     "OUTPUT" (--type-label, --text-tertiary)
      Control:   Horizontal pill group: [Code] [Analysis] [Plan] [Document] [Auto]
                 Default: Auto. Active pill: --bg-surface, --border-default.
                 Selected pill: --accent-purple-dim, --accent-purple border, --text-primary

  Action row (bottom of composer, right-aligned):
    Agent selector: Full dropdown with all available agents + their status indicators
    [Dispatch ⌘↵] button: Full accent style (--accent-purple bg, 32px height)
    [Diverge ⌘⌘D] button: Ghost style (--border-default, 32px height)
                            Tooltip on hover: "Send to multiple agents simultaneously"
    [Cancel Esc] link: --text-tertiary, --type-caption, left side of action row
```

### 6.3 Composer zone height behavior

The composer zone expands upward, shrinking the thread viewport. The thread viewport does not reflow — it simply has a smaller visible height. Scroll position is preserved.

This means: if the user is reading history while the composer is in full brief mode, their reading position is unaffected. The thread scroll position only moves if new content is added at the bottom.

---

## 7. Memory Panel Structure

### 7.1 Panel anatomy

```
Memory panel (top to bottom):
  Panel header (36px):
    Title: "Memory" (--type-title, --text-secondary)
    Actions: [+] add fact  [···] overflow menu   (right-aligned, icon buttons)
    Border-bottom: 1px --border-faint

  Scrollable zone (1fr):
    Zone 1: Workspace (if any facts exist)
    Zone 2: Project context (always shown)
    Zone 3: Decisions (collapsible)
    Zone 4: Ephemeral session context (shown only if session context exists)

  Panel footer (36px):
    "42 facts · updated 3 min ago" (--type-meta, --text-tertiary, left-aligned)
    Border-top: 1px --border-faint
```

### 7.2 Zone anatomy

```
Zone:
  Zone label (24px):    "WORKSPACE" / "PROJECT" / "DECISIONS" / "SESSION"
                        --type-label, --text-tertiary
                        Left-aligned, 16px left padding
                        For Decisions + Session: collapse arrow (▾/▸) right-aligned
  
  Fact rows:
    Each fact is a 2-row item (or 1 row if short):
      Key row:    --type-label, --text-tertiary, uppercase, 11px
      Value row:  --type-caption, --text-secondary, wraps naturally
      Total height: 36px for single-line, 48px for two-line values
      Padding: 10px top/bottom, 16px left/right
      Border-bottom: 1px --border-faint (except last item in zone)
    
    On hover:
      Background: --bg-elevated
      Edit pen icon (✎) appears right-aligned
      Cursor: text (edit in place)
    
    Edit mode (click to activate):
      Value row becomes a textarea (--bg-base, --border-default)
      [Save ↵] and [Cancel Esc] inline at bottom of edited fact
      No modal. Inline edit only.
  
  Zone footer (if zone has items):
    "+ Add fact" trigger, --type-meta, --accent-purple, --text-tertiary opacity at rest
    Appears as a subtle link, not a button. Height 28px.
```

### 7.3 Ephemeral zone visual treatment

The SESSION zone is visually distinguished to make its temporary nature unmistakable:

```
Session zone:
  Zone label:    "SESSION · EXPIRES ON CLOSE" — the label includes the expiry note
                 Color: --accent-amber at 0.6 opacity
  Fact rows:     --text-secondary at 0.7 opacity (visually lighter than persistent facts)
  Left margin:   A 2px dashed vertical line in --accent-amber at 0.3 opacity
                 runs along the left edge of all session fact rows
```

The visual treatment communicates: this content is temporary without any tooltip or explanation needed.

---

## 8. Keyboard-First Interaction Grammar

### 8.1 Global shortcuts (active on this surface)

```
⌘K              Open command palette
⌘↵              Dispatch from composer (simple or full brief mode)
⌘⌘D             Diverge (open full brief mode with diverge pre-selected)
Tab             Expand simple composer to full brief mode
Esc             Close full brief / cancel current action / deselect
J               Focus next entry (vim-style navigation, thread must be focused)
K               Focus previous entry
E               Expand/collapse focused entry
L               View lineage of focused entry (if Artifact)
A               Approve focused Artifact
R               Reject focused Artifact
D               Redirect focused Run (if running) / Request revision (if Artifact)
P               Promote focused Artifact
/               Jump focus to composer input (simple mode)
G G             Scroll to top (gg)
G B             Scroll to bottom (gb)
?               Show keyboard reference overlay
```

### 8.2 Navigation model

The thread supports two navigation modes simultaneously: mouse hover (spatial) and keyboard focus (sequential).

Mouse hover reveals action controls on entries without moving keyboard focus.

Keyboard navigation moves a "focus cursor" through entries sequentially. The focus cursor is independent of scroll position — pressing `J/K` scrolls the thread to keep the focused entry in view if it is not already visible.

The focus cursor is visible only when the last input was keyboard-based. On mouse click/hover, the focus cursor becomes invisible until the next keyboard input. This is the standard macOS/Arc pattern.

### 8.3 Composer keyboard behavior

When the composer has focus:
- `⌘↵` dispatches
- `Tab` expands to full brief (if in simple mode) or cycles through fields (if in full mode)
- `Shift+Tab` collapses back to simple mode (if in full mode and all fields are empty)
- `Esc` removes focus from composer, returns focus to thread

When the thread has focus (no input focused):
- Typing any alphanumeric character should NOT hijack focus to the composer. Keyboard navigation should not produce unwanted text input. Character keys serve as shortcuts only.
- `/` explicitly focuses the composer — the intentional gesture to begin composing.

---

## 9. Motion and Animation Rules

### 9.1 What animates and what does not

Rule: animate state transitions, not presence. Elements that are always present (the header bar, the spine, the composer) do not animate their layout. Elements that appear, change state, or disappear animate those transitions.

```
ANIMATES:
- Entry appearance (new entry added to thread)
- Entry state changes (running → complete, unreviewed → approved)
- Composer height (simple ↔ full brief)
- Memory panel slide (open/close)
- Focus depth effect (entry focus/blur)
- Action bar reveal (hover on entry)
- Running state progress bar
- Pulse transitions (agent activity indicator in pulse bar)

DOES NOT ANIMATE:
- Scroll position (let the browser handle this, no JS scroll animation)
- Text content changes (streaming text appears token by token with no additional animation)
- Background colors on hover (instant, no transition — prevents visual stutter during rapid mouse movement)
- Border color on hover (instant)
```

### 9.2 Entry appearance

When a new entry is added to the thread:

1. The entry container enters from opacity 0 at `translateY(8px)` offset
2. Animate to opacity 1, `translateY(0)` over `--duration-mid` (250ms) with `--ease-out`
3. The Spine node appears simultaneously with a scale from 0 to 1 over `--duration-fast` (150ms)
4. No bounce. No overshoot. Calm arrival.

For streaming entries (Run producing an Artifact as content streams):
- Entry appears with header visible, body at 0 height
- Body height animates to fit content as content streams in — but this height animation is gentle and continuous, not frame-by-frame
- Text itself appears with no additional animation — just instant rendering of each token

### 9.3 State change transitions

```
Running → Complete:
  - Progress bar transitions from scanning pattern to full fill (300ms)
  - Amber tint fades out (--duration-slow)
  - Status badge cross-fades from "running" to "complete ✓" (--duration-mid)
  - Green tint fades in if an Artifact was produced (--duration-slow)
  - Spine node transitions from pulsing amber to solid green (--duration-mid)

Artifact: Unreviewed → Approved:
  - Review action bar fades out (--duration-fast)
  - Left border transitions from type-color to --accent-green (--duration-mid)
  - Review badge transitions from "unreviewed" to "approved ✓" (--duration-mid)
  - Spine diamond node transitions to --accent-green fill (--duration-mid)

Artifact: Unreviewed → Rejected:
  - Review action bar fades out (--duration-fast)
  - Entire entry fades to 0.5 opacity (--duration-mid)
  - Left border transitions to --accent-red (--duration-mid)
  - A thin strikethrough overlays the entry header (this is a CSS effect, not an animation)
```

### 9.4 Running state pulse

The running state indicator is a continuous, slow pulse — not a spinner.

```
Running pulse:
  Applied to:    The progress bar, the Spine node, and the status badge
  Animation:     opacity oscillates between 0.5 and 1.0
  Duration:      2.2s per cycle (slow enough to be calm, fast enough to feel alive)
  Easing:        ease-in-out
  The three elements are phase-offset:
    Progress bar: phase 0
    Spine node:   phase 0.3s offset
    Status badge: phase 0.6s offset
  This creates a gentle "breathing" effect across the entry without feeling urgent.
```

### 9.5 Composer animation

Simple → Full brief expansion:
1. Container height animates from 44px to target height using `--spring-gentle`
2. New fields slide in with `opacity: 0 → 1` and `translateY(4px) → translateY(0)`
3. Stagger: 40ms delay between each field
4. Total duration of full expansion: approximately 350ms

Full brief → Simple collapse (on Esc with empty fields):
1. Fields fade out simultaneously (opacity 1 → 0, `--duration-fast`)
2. Container height collapses to 44px using `--spring-snappy`
3. Total: approximately 200ms

### 9.6 Focus depth effect

When an entry receives keyboard focus:
1. Focused entry: background transitions to `--bg-elevated`, border appears at `--border-strong`
2. All other entries: opacity transitions to 0.55 over `--duration-mid`
3. This depth effect makes the focused entry feel "above" the rest of the thread

When focus is removed:
1. All entries return to full opacity over `--duration-mid`
2. Focused entry returns to `--bg-surface`, border disappears

The opacity change is the only depth mechanism. No blur. No scale changes. No movement.

---

## 10. Focus States and Depth Behavior

### 10.1 Hover vs keyboard focus — the distinction

These are two different states and must look different.

```
Hover state:
  - Background: --bg-elevated (same as keyboard focus)
  - Border: none (no border appears on mouse hover)
  - Action controls: appear (opacity 0 → 1)
  - Other entries: unaffected (no opacity change)
  - Transition: instant (--duration-instant, 80ms)

Keyboard focus state:
  - Background: --bg-elevated (same as hover)
  - Border: 1px --border-strong (appears on keyboard focus only)
  - Action controls: appear + keyboard shortcut hints appear on each action
  - Other entries: opacity → 0.55 (the depth effect)
  - Transition: --duration-mid (250ms)
```

Why the distinction matters: hover should be frictionless and instant. Keyboard focus should be deliberate and visible. The focus ring communicates "this is the active target for keyboard actions" — it is a safety affordance, not a decoration.

### 10.2 Focus ring specification

The focus ring for keyboard-focused entries is a 1px solid border at `--border-strong`. It follows the `--radius-md` of the entry container. It does not use `outline` — it uses `border`. This is because `outline` can clip against the scroll container.

The focus ring for interactive elements within entries (action buttons, expand triggers) uses a 2px offset `box-shadow` ring in `--accent-purple` at 40% opacity. This ring is 2px outside the element's border. It follows the element's border-radius.

### 10.3 Depth behavior at thread edge cases

When the thread has fewer entries than fill the viewport:
- The depth effect applies normally to the focused entry and dampens all others
- The empty space below entries does not participate in the depth system

When the thread is scrolled to history (not at bottom):
- The depth effect applies normally regardless of scroll position
- The "jump to present" indicator (described in Section 15) appears but does not affect depth behavior

---

## 11. Interaction Weight System

Interaction weight determines how much friction the UI introduces for a given action. This is not about confirmation dialogs — it is about the physical and temporal cost of executing each action.

```
INSTANT (0ms friction):
  Expand/collapse entry, hover reveals, Query, scroll, focus navigation
  → No confirmation, no animation delay before action executes

RESPONSIVE (80–150ms friction):
  Review (Approve, Reject), Promote, memory fact edit, entry selection
  → Action executes after a single confident gesture (keypress or click)
  → Brief state change animation to confirm receipt

DELIBERATE (250–400ms friction):
  Dispatch, Redirect, Snapshot (auto-named)
  → Action executes immediately but UI takes time to reflect the outcome
  → The entry or panel that reflects the action animates into its new state
  → The temporal cost communicates "something real just happened"

INTENTIONAL (requires structured input):
  Full Brief composition, Diverge configuration, named Snapshot, Converge
  → Cannot be triggered by a single keypress
  → Requires filling in at least one structured field
  → The UI presents structure (fields, labels) before the action is available
  → ⌘↵ is the dispatch gesture within the structured context

CONSEQUENTIAL (requires confirmation):
  Deploy
  → Requires: a valid recent Snapshot (< 10 min old), explicit ⌘↵ confirmation
  → Cannot be triggered from a resting state in a single gesture
  → The Deploy surface (separate, not on the Thread) handles this
```

---

## 12. Empty States

### 12.1 New project — zero entries

When a Project has been created but no Briefs have been dispatched:

```
Thread viewport (empty):
  Vertical centering of a centered block:
    Project name:      --type-heading, --text-secondary, centered
    Below (8px gap):   "Brief an agent to begin." in --type-body, --text-tertiary, centered
    Below (32px gap):  Three agent option pills, horizontally arranged:
                       "→ Brief Architect"  "→ Brief Reviewer"  "→ Brief Analyst"
                       Each pill: --bg-elevated, --border-subtle, --type-caption, --text-secondary
                       On click: focuses the composer and pre-fills the agent selector
    
    No icons, no illustrations, no decorative elements.
    The Spine is not visible (no entries exist to connect).

Composer:
  Simple mode, active placeholder:
    "What would you like Architect to do?"  (defaults to first configured agent)
```

The empty state should feel like standing in a quiet room, not like encountering an error or a tutorial.

### 12.2 Dormant project — last entry was days ago

When the user opens a project with existing entries but no recent activity:

```
At top of thread (above all entries):
  Return context banner:
    Background:     --bg-elevated, 1px --border-subtle
    Height:         auto, maximum 64px
    Content:        "You were last here 4 days ago. Architect was reviewing the auth "
                    "middleware. 2 decisions were pending."
                    --type-body, --text-secondary
    Right side:     [Resume ↗] verb — focuses composer with return context pre-filled
    Dismiss:        ✕ icon, right-most. Dismisses and does not reappear this session.
    
  The banner is not a notification. It does not appear on projects visited in the
  last 6 hours. It fades out when dismissed with a --duration-mid opacity transition.
```

---

## 13. Loading and Running States

### 13.1 Streaming artifact content

When an agent is producing content in real time:

The Artifact entry appears in the thread at the moment the Run begins producing output, not before. The entry header is visible immediately. The body content area starts at a minimum 40px height with a single animated cursor `▋` (block cursor, `--accent-amber`, 1.2s blink cycle).

As content streams in:
- Characters render immediately, no additional animation
- The content area height grows naturally as text wraps
- The grow is smooth — not a jarring reflow — because the cursor establishes a minimum height
- Code blocks inside streaming content show the opening fence immediately, then fill

The cursor disappears when streaming is complete. It does not linger.

### 13.2 Run progress representation

```
Progress bar (runs the full width of the entry's content area, below the header):
  Height:      2px
  Background:  --bg-elevated
  Fill:        --accent-amber, scanning animation (see 9.4)
  Border-radius: 1px
  
  The bar is NOT a percentage indicator. It communicates activity, not completion.
  When the run completes, the bar fills completely over 300ms then fades out over 400ms.
  When the run fails, the bar transitions to --accent-red fill then fades out.
```

### 13.3 Multiple concurrent runs

When more than one Run is active simultaneously (during a Diverge event, or from background agents):

- Each Run's entry independently shows its own progress bar and pulse state
- The Pulse bar at the bottom of the surface shows a count: "2 agents running" with a compound pulse indicator
- No special treatment beyond individual entry states — the thread handles concurrency naturally by containing each Run in its own entry

---

## 14. Artifact Review Interactions

### 14.1 Review action bar

The review action bar appears inside an Artifact entry when:
- The artifact is in `unreviewed` state AND
- The entry is hovered OR focused

Placement: at the bottom of the Artifact content, after a 12px gap. The bar is part of the entry (not a floating overlay).

```
Review action bar:
  Height:        36px
  Background:    --bg-elevated (one level above the entry's --bg-surface)
  Border-radius: 0 0 --radius-md --radius-md (bottom corners only)
  Border-top:    1px --border-faint

  Contents (left to right):
    [Approve A]   Compact button, --accent-green text, --accent-green-dim bg on hover
    [Reject R]    Compact button, --accent-red text, --accent-red-dim bg on hover
    [Redirect D]  Compact button, --accent-amber text, --accent-amber-dim bg on hover

    (spacer: 1fr)

    [Promote P]   Compact button, --accent-purple text (visible only after approve)
    [View lineage L]   Link-style, --text-tertiary

  Each button shows its keyboard shortcut in a pill: "A", "R", "D", "P"
  Shortcut pills: --bg-surface, --border-faint, --text-tertiary, --radius-sm, 16px height
```

### 14.2 Approve gesture

1. User presses `A` or clicks [Approve]:
   - Action bar fades out (--duration-fast)
   - Left border transitions to --accent-green (--duration-mid)
   - Review badge transitions to "approved ✓" (--duration-mid)
   - A `[Promote P]` button appears inline at the bottom of the entry (not in the action bar — in the entry footer) at reduced prominence

2. If the user immediately presses `P` to Promote:
   - The entry gets a small "added to thread record" confirmation (a brief text label "Promoted" in --accent-green that fades within 1.5s)
   - The Thread Spine node transitions to --accent-green

Approve and Promote are two distinct gestures by design. Approval is a judgment. Promotion is an editorial choice about canonicity. The system does not auto-promote on approval.

### 14.3 Reject gesture

1. User presses `R` or clicks [Reject]:
   - Inline annotation field appears (replaces the action bar): "Why rejecting? (optional)" with a text input
   - User can press `↵` with empty field to reject without annotation, or type a note and press `↵`
   - The entry fades to 0.5 opacity with --accent-red left border (--duration-mid)
   - The entry is not removed from the thread — it remains as an archived record

### 14.4 Redirect gesture

1. User presses `D` or clicks [Redirect]:
   - Inline annotation field appears (replaces the action bar): "Redirect instruction:" with a text input
   - Required. Cannot redirect without a note.
   - On submit with `⌘↵`: a new Brief entry is added to the thread containing the redirect instruction, directed at the same agent, with the current artifact as context
   - The original artifact receives a "redirected → see Brief below" annotation in its footer

Redirect is the verb that turns a review into a new Brief. The connection between the rejected artifact and the new Brief must be visible in the thread — this is why the new Brief is added immediately and visually connected to the redirect annotation.

---

## 15. Scroll Behavior

### 15.1 Scroll anchoring rules

```
Auto-scroll triggers (new entry arrives):
  IF user is within 200px of the thread bottom:
    → Smooth-scroll to reveal the new entry (CSS scroll-behavior: smooth)
    → Duration: approximately 300ms
  IF user has scrolled more than 200px from bottom:
    → Do NOT auto-scroll. Preserve reading position.
    → Show "new activity" indicator (see 15.2)

Auto-scroll does NOT trigger:
  - During active keyboard navigation
  - When a modal or command palette is open
  - When the user is mid-selection (text selected in the thread)
```

### 15.2 "Jump to present" indicator

When the user has scrolled up and new entries have arrived at the bottom:

```
Jump to present indicator:
  Position:      Centered horizontally, 16px above the composer zone top edge
  Appearance:    Pill shape, --bg-elevated, --border-default, --radius-xl
  Content:       "↓ 3 new entries" (count updates live)
                 --type-meta, --text-secondary
  On click:      Smooth-scrolls to bottom, indicator fades out
  On keyboard:   G+B (go bottom) also dismisses the indicator
  Appears after: 1s of being more than 200px from bottom with new entries
  Disappears:    When user scrolls to within 100px of bottom
```

### 15.3 History scroll behavior

Scrolling into history (past older entries):
- No virtualization required for threads under 500 entries. Render all entries.
- For threads over 500 entries: load older entries in batches of 50 as user scrolls up. Entries materialize above the current scroll position without causing scroll jump (use `scroll-anchor: auto` and `overflow-anchor` correctly).
- No "load more" button. Infinite upward scroll.

### 15.4 Scroll position preservation

When the thread is navigated away from and returned to:
- Preserve the exact scroll position (not "jump to bottom")
- Exception: if the user was at the bottom when they left, return to the bottom

---

## 16. Notification Philosophy

There are no push notifications on this surface. There is no notification bell, no red badge, no toast popup.

The workspace communicates state changes through three mechanisms only:

**1. Thread entry updates (primary)**
When something completes, the entry changes. The user sees it when they look at the thread. The visual change (state badge, left border color, content) is the notification. The timeline of seeing it is determined by when the user looks — not when the system demands attention.

**2. The Pulse bar (ambient)**
The Pulse bar shows live aggregate state: "2 agents running", "last deploy 3h ago", "postgres healthy". This is read when the user glances at it, not when the system interrupts. It never changes color to red to demand attention. Even failure states are communicated calmly.

**3. The Orbit panel (returning to workspace)**
When returning to the workspace after time away, the Orbit panel shows which projects have had recent activity (a subtle dot change). This is a navigation cue, not a notification.

Rule: the workspace never interrupts. The user checks in on the work. The work does not interrupt the user.

---

## 17. Mobile Philosophy (High-Level)

The Project Thread is a desktop-native surface. Mobile is a secondary concern. The following principles govern any mobile implementation — detailed specification is deferred.

**Principle 1 — Single column.** The three-panel shell collapses to a single column. The Orbit panel and Memory panel become sheets (slide up from bottom, triggered by a persistent button). The thread takes full width.

**Principle 2 — Composer is primary.** On mobile, the primary experience is reviewing Artifacts and issuing quick Briefs. Full brief mode is available but accessed deliberately (a "Full brief" button, not a Tab shortcut).

**Principle 3 — Read-first.** The mobile thread is optimized for reading and reviewing, not for composing. The Review gestures (Approve/Reject/Redirect) are swipe gestures on Artifact entries: swipe right to approve, swipe left to reject.

**Principle 4 — No feature parity.** Diverge, Orchestration canvas, and Memory editing are tablet/desktop features. Mobile users should be able to read, review, and issue simple Briefs. Nothing more is required.

---

## 18. Component Hierarchy

This is a conceptual hierarchy — not an implementation tree. It describes what renders what.

```
ThreadSurface
├── HeaderBar
│   ├── ProjectTitle
│   ├── ProjectBadge (type indicator)
│   └── HeaderActions (⌘K hint, overflow)
├── ThreadViewport (scrollable)
│   ├── ReturnContextBanner (conditional)
│   ├── DateSeparator (conditional, repeating)
│   ├── EntryGroup (repeating)
│   │   ├── Spine (visual only, not a component)
│   │   ├── BriefEntry
│   │   │   └── BriefBody
│   │   ├── RunEntry
│   │   │   ├── RunHeader (with status)
│   │   │   ├── RunProgress (conditional, if running)
│   │   │   └── RunBody
│   │   └── ArtifactEntry
│   │       ├── ArtifactHeader (with review state badge)
│   │       ├── ArtifactContent (collapsed or expanded)
│   │       ├── ReviewActionBar (conditional, if unreviewed + hover/focus)
│   │       └── LineageAnnotation (conditional, if expanded)
│   ├── DecisionEntry (standalone or grouped)
│   ├── MemoryUpdateEntry (lowest prominence)
│   └── JumpToPresentIndicator (conditional)
├── ComposerZone
│   ├── ComposerSimple (default)
│   └── ComposerFullBrief (expanded)
│       ├── GoalField
│       ├── ContextField
│       ├── ConstraintsField
│       ├── OutputFormatSelector
│       └── ComposerActionRow
├── MemoryPanel
│   ├── PanelHeader
│   ├── MemoryZone (repeating: Workspace, Project, Decisions, Session)
│   │   ├── ZoneLabel (with collapse control)
│   │   ├── FactRow (repeating)
│   │   │   ├── FactKey
│   │   │   ├── FactValue (or FactEditInput when editing)
│   │   │   └── FactActions (on hover)
│   │   └── AddFactTrigger
│   └── PanelFooter
└── PulseBar
    ├── AgentStatusItems (left group)
    └── SystemStatusItems (right group)
```

---

## 19. State Transitions

### 19.1 Thread-level state machine

```
Thread states:
  LOADING     → Initial load. Spinner at center of viewport (not a full-page spinner).
  EMPTY       → Zero entries. Empty state shown.
  IDLE        → Entries present, no active runs.
  ACTIVE      → One or more runs in progress.
  REVIEWING   → User is focused on an unreviewed Artifact (review bar visible).
  COMPOSING   → Composer has focus.
  COMPOSING_FULL → Composer in full brief mode.
  FOCUSED     → An entry has keyboard focus (depth effect active).

State can be simultaneously:
  ACTIVE + COMPOSING        (composing a new brief while agents are running)
  FOCUSED + REVIEWING       (keyboard focus on an Artifact with review bar)
  ACTIVE + FOCUSED          (watching a running run while an entry has focus)
```

### 19.2 Transition table (Thread-level)

```
LOADING → EMPTY          On: initial data loads, zero entries
LOADING → IDLE           On: initial data loads, entries present, no active runs
EMPTY   → IDLE           On: first Brief dispatched and first entry created
IDLE    → ACTIVE         On: any Run enters running state
IDLE    → COMPOSING      On: /  key or click on composer input
IDLE    → FOCUSED        On: J/K keyboard navigation begins
ACTIVE  → IDLE           On: all Runs complete or fail
ACTIVE  → REVIEWING      On: Artifact produced + auto-focus on new Artifact (if user at bottom)
REVIEWING → IDLE         On: Artifact reviewed or focus moves away
COMPOSING → IDLE         On: Esc or click outside composer
COMPOSING → ACTIVE       On: ⌘↵ dispatch (Brief created, Run begins)
COMPOSING → COMPOSING_FULL On: Tab
COMPOSING_FULL → COMPOSING On: Esc with empty fields
```

---

## 20. Visual Density Philosophy

### 20.1 The default density

Default density is "comfortable" — this is the only density that needs to be designed at first. Future density modes (compact, expanded) can be added later.

Comfortable density characteristics:
- Entry gap: 8px within groups, 20px between groups
- Entry internal padding: 16px all sides
- Memory panel fact row height: 36px–48px depending on content length
- Type labels visible but unobtrusive
- Timestamps always visible (right-aligned in header, never hidden)

### 20.2 The information philosophy

Every pixel of information density on this surface must earn its presence. The question is not "how much can we show?" — it is "what does the user need to see at a glance to direct their next action?"

The answer: the user needs to know immediately (1) what the last few entries were, (2) whether any agents are running, (3) whether any Artifacts are awaiting review, and (4) what the project's current goal is. Everything else is available on demand.

This means:
- Collapsed Artifact bodies (default to 3-4 lines) are correct. Most of the time, the user knows what an Artifact contains — they want to see its status.
- Memory facts are reference, not primary. They should be visible but not dominant.
- Timestamps are present but `--text-tertiary` — they are scannable, not focal.

### 20.3 The density rule

If a new element is proposed for this surface, it must pass: "A user scanning the thread at 60% attention would want to see this." If the answer is no, the element belongs in an expanded or hover state, not at the surface level.

---

## 21. Emotional Target

The Project Thread must produce a specific emotional experience. This is not a soft goal — it is a design requirement that governs every decision not covered by this specification.

### The primary feeling: competent calm

When a user opens the Project Thread of an active project, they should feel what a skilled professional feels when returning to a tidy workbench with work in progress: oriented, in control, and ready. Not excited. Not overwhelmed. Not delighted by novelty. Competent and calm.

The sources of this feeling:
- They can see immediately what is happening (running state is visible but not alarming)
- They can see where they were (the thread tells the story without demanding attention)
- They know what to do next (the composer is present and ready)
- The system is showing its work (Memory is visible, Lineage is accessible)
- Nothing is demanding their attention (no badges, no alerts, no red)

### The secondary feeling: editorial authority

When the user reviews and approves an Artifact, they should feel what a director or editor feels when making a final call: decisive and authoritative. The approval gesture should be fast, confident, and satisfying. Not bureaucratic. Not confirmatory.

If the review interaction feels like filling out a form, the design has failed. If it feels like selecting something from a multiple-choice question, the design has failed. It must feel like making a judgment.

### The tertiary feeling: spatial memory

When a user returns to a project after days away, they should feel oriented — as if they have walked into a room where their work was left out, organized, and ready to be resumed. The Return Context banner, the Memory panel, and the Thread history together should reconstruct context without requiring effort.

The opposite of this feeling — disorientation, the sense that you have to re-read everything to remember where you were — is a failure state. Preventing it is one of Memory's primary functions.

### What should never be felt

- Anxiety: the system should never feel like it could fail or lose work
- Urgency: nothing should feel time-pressured (no pulsing alerts, no countdowns)
- Overwhelm: the information density must always feel manageable, never like a wall of text
- Chatbot familiarity: the surface must never feel like a conversation with a bot — the framing, structure, and tone of every entry should reinforce the "director of intelligence" identity

---

*Specification version: 1.0 — Implementation reference*  
*This document governs the Project Thread surface only. The Orchestration overlay, Agent Studio, and Deploy surface are specified separately.*
