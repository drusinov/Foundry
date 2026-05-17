# Platform primitives — canonical constitution

**Classification:** Product Philosophy / Conceptual Systems Design  
**Scope:** Core entity model, interaction grammar, surface allocation, emotional architecture  
**Status:** Canonical — changes require constitutional justification, not feature rationale

---

## The governing test

A primitive earns its existence by failing the removal test.

If the product does not fundamentally break — structurally, cognitively, or emotionally — without a given concept, that concept is a feature, not a primitive. Features can be deferred, versioned, or cut. Primitives cannot. They are the product's skeleton. Every design decision that touches a primitive must be evaluated against conceptual integrity, not just usability or aesthetic preference.

A second test governs emotional primitives specifically: does the absence of this primitive make the user feel like they're using a chatbot? If yes, it is a primitive. The product's identity is defined as much by what it refuses to be as by what it is.

---

## Part I — The entity model

Entities are the nouns of the platform. They exist, persist, and have state. The entity model has three tiers, organized by what fails without them.

---

### Tier 1 — Foundational entities

*The system cannot exist without these. They are the vocabulary of the workspace.*

---

#### Project

**What it is:** A bounded context of ongoing work. A Project has a goal, a history, an active memory state, and a set of agents assigned to it. It is not a folder, a repository, or a conversation thread. It is the unit of directed intelligence — the thing you are trying to accomplish.

**Why it exists:** Without the Project as an explicit, persistent entity, the workspace degrades into a flat sequence of interactions. There is no container for memory, no scope for agent context, no unit of focus. The user cannot return to something. They can only start something new.

**Emotional role:** Identity and ownership. The Project is the answer to "what am I building?" It grounds the user. It is the place you return to. When you open a Project, the workspace should feel like entering a room where your work is already in progress.

**What breaks without it:** Memory has no scope. Agents have no assignment. The thread has no container. Diverge and Convergence have no home. The workspace becomes a chat interface with extra steps.

**User-visible:** Always. A Project is never implicit.  
**Persistent:** Yes. Indefinitely, until explicitly archived.  
**Auditable:** Yes — creation, membership changes, goal revisions, archival.

---

#### Agent

**What it is:** A named, configured intelligence with a defined role, a set of capabilities, a tool access list, and a memory scope. An Agent is not a model. It is not a persona. It is a specialist. You name it, define its role, and trust it with a bounded domain of work. Multiple agents can coexist within a project, each with different responsibilities.

**Why it exists:** Without the Agent as a distinct, nameable entity, every AI interaction is anonymous. The user cannot build trust, assign responsibility, or reason about which intelligence produced which output. The Agent makes delegation cognitively possible. You cannot direct what you cannot identify.

**Emotional role:** Trust and delegation. An Agent that you have named, configured, and worked with across multiple sessions earns a kind of professional familiarity. It is not affection — it is the quiet confidence of knowing what a specialist will and won't do well. This is the emotional foundation of the "director" identity.

**What breaks without it:** The user cannot delegate — they can only prompt. They cannot reason about which intelligence produced which result. They cannot configure different specialists for different concerns. The product collapses into a single-model chatbot with an elaborate interface.

**User-visible:** Always. Agent identity is always displayed on runs and artifacts.  
**Persistent:** Yes. An Agent configuration persists across sessions and projects.  
**Auditable:** Yes — configuration changes, capability additions, tool grants.

---

#### Memory

**What it is:** The structured, visible, editable knowledge state of a Project. Memory is not a conversation history. It is not a log. It is a set of named facts, decisions, constraints, and context that the system maintains about a project and that gets scoped into agent runs. Memory has explicit zones: workspace-level facts (true across all projects), project-level context (the stack, the goal, the constraints), decision records (choices made and why), and ephemeral session context (active only during a session).

**Why it exists:** Without visible, editable Memory, the system's intelligence is invisible and unverifiable. The user cannot know what the agents know. They cannot correct a false assumption. They cannot understand why an artifact looks the way it does. Trust requires transparency, and transparency requires that the knowledge state be a first-class, inspectable entity — not a black box.

**Emotional role:** Continuity and groundedness. Memory is what makes the workspace feel like a place you inhabit rather than a tool you operate. When you open a project after three days, Memory is what says "here is where you were." When an agent produces a contextually accurate result without being told everything, Memory is why. It is the product's long-term intelligence.

**What breaks without it:** Every agent run starts cold. Context must be re-established manually every session. The workspace has no continuity. The intelligence is local and ephemeral. The product feels disposable. More critically: the user cannot verify that agents are reasoning from correct premises. Trust is impossible.

**User-visible:** Always. Memory is a visible, editable panel — never a hidden system prompt.  
**Persistent:** Yes. Memory persists indefinitely. Ephemeral session context is explicitly labeled.  
**Auditable:** Yes — every fact addition, edit, and deletion is logged with timestamp.

---

#### Thread

**What it is:** The temporal spine of a Project. The Thread is the ordered record of everything that has happened in a project: briefs dispatched, runs completed, artifacts produced, decisions recorded, redirects issued, convergences performed. It is read chronologically, top to bottom. It is not a chat log — it contains structured, typed entries, not undifferentiated messages.

**Why it exists:** Without the Thread, a project has state but no history. You can see what is currently true but not how you got there. The Thread is the project's memory of actions, as distinct from Memory (which is the project's knowledge of facts). Together they provide full context: what we know, and how we came to know it.

**Emotional role:** Narrative and progress. The Thread is what makes work feel like it is accumulating toward something. Scrolling up through a project thread should feel like reviewing a creative process — you can see the thinking, the iterations, the moments of decision. This is psychologically different from a chat log because the entries are typed, attributed, and structured: a run is visually distinct from a decision, which is visually distinct from a redirect.

**What breaks without it:** There is no record of how the project reached its current state. Lineage becomes impossible. The "return context" feature (re-orienting users who return to a dormant project) has no source material. Work feels ephemeral even when it is technically persistent.

**User-visible:** Always. The Thread is the primary work surface.  
**Persistent:** Yes. Append-only. Entries are never deleted, only archived.  
**Auditable:** Inherently — the Thread is itself the audit trail.

---

### Tier 2 — Operational entities

*The product's value is delivered through these. They are how work actually happens.*

---

#### Brief

**What it is:** A structured intent document that directs an Agent. A Brief has four required fields: Goal (what the agent should produce), Context (what it needs to know that isn't in Memory), Constraints (what it must not do), and Output format (what kind of artifact it should produce). A Brief is not a message. It is not a prompt. It is a deliberate, structured act of direction.

**Why it exists:** The Brief is the UX primitive that distinguishes a workspace from a chat interface. The act of filling in a Brief is cognitively different from typing a message: it requires the user to be explicit about intent, context, and expectations. This structure produces better agent results AND creates a better user posture — the user is a director, not a prompter. The Brief is also the unit of auditable intent: you can see exactly what was asked for, not just what was produced.

**Emotional role:** Clarity and intention. Writing a Brief should feel like giving a creative brief to a talented specialist — deliberate, considered, and confident. When the Brief is well-formed, there is a moment of satisfaction before dispatching: "I have been clear." This is a different emotional register from pressing Enter after a chat message.

**What breaks without it:** Without the Brief as a distinct entity, all user intent is implicit and ephemeral. The system cannot surface "here is what you asked for" when reviewing an artifact. The audit trail loses its intent anchor. Most importantly: the user's posture degrades from director to prompter.

**User-visible:** Always. The Brief is shown alongside every Run and Artifact it produced.  
**Persistent:** Yes. Briefs are stored and linked to their Runs.  
**Auditable:** Yes — the Brief is the most auditable entity in the system. Every Run is traceable to its Brief.

---

#### Run

**What it is:** A single execution of an Agent against a Brief, within a defined context scope. A Run has status (pending, running, complete, failed, cancelled, redirected), a start time, a completion time, the model used, the memory scope that was active, and the artifacts it produced. A Run is the observable unit of agent activity — you can see it happening.

**Why it exists:** Without the Run as an explicit entity, agent activity is invisible. The user cannot see what is happening, cannot redirect a failing execution, cannot understand the cost or time of a given task, and cannot inspect the conditions under which an artifact was produced. The Run makes agent work transparent and interruptible.

**Emotional role:** Presence and activity. A running Run should feel alive in the interface — a gentle, non-intrusive indicator that intelligence is at work on your behalf. The transition from running to complete is one of the most important interaction moments in the product. It should feel like receiving a delivery, not like a page refresh.

**What breaks without it:** Execution is a black box. Redirect (a core verb) has nothing to target. Lineage loses its execution record. The user cannot reason about "why did this take so long" or "what was the system doing when it failed."

**User-visible:** Yes — status and duration visible in the Thread and Orchestration view.  
**Persistent:** Yes. Run records are kept indefinitely for lineage.  
**Auditable:** Yes — model, scope, timestamps, token usage, status transitions.

**State transitions:**
```
Draft → Dispatched → Running → Complete
                             → Failed
                             → Cancelled (user-initiated)
                             → Redirected → Running (resumed with annotation)
```

---

#### Artifact

**What it is:** Any discrete, named output produced by a Run that has been evaluated by the user. An Artifact is not the raw output of a model. Raw output becomes an Artifact only after it passes through Review — either explicit (the user approves or rejects it) or implicit (the user promotes it to the Thread). An Artifact has a type (analysis, code, plan, document, synthesis), a production lineage, and a lifecycle status.

**Why it exists:** Without the Artifact as a distinct, typed, lifecycle-managed entity, all AI output is undifferentiated text. The user cannot curate, promote, reject, or supersede it. They cannot see a gallery of what has been produced. They cannot trace what made it into the canonical project record versus what was discarded. The Artifact is the unit of creative output in the workspace.

**Emotional role:** Judgment and curation. The moment of reviewing an Artifact is the moment the user exercises editorial authority. Approving an Artifact feels like selecting a take. Rejecting one feels like sending notes back to a collaborator. This is the emotional core of "editor of intelligence" — the user's role is not to produce, but to judge and select.

**What breaks without it:** The product cannot distinguish between "output" and "canonical work." The Thread fills with raw, unreviewed AI text. The user cannot curate. Convergence (the synthesis of multiple artifacts) has no source material to work from. The quality filter between AI production and canonical project state disappears.

**Lifecycle states:**
```
Produced (raw, unreviewed) → Reviewed → Promoted (canonical, in Thread)
                                       → Rejected (archived with annotation)
                          → Superseded (replaced by a newer version)
```

**User-visible:** Yes — all promoted Artifacts are visible in the Thread.  
**Persistent:** Yes. All Artifacts, including rejected ones, are retained for lineage.  
**Auditable:** Yes — promotion, rejection, and supersession events with timestamps.

---

### Tier 3 — Synthesis and trust entities

*The product earns long-term, repeated use through these. They are what make it feel like a serious tool.*

---

#### Diverge

**What it is:** A first-class dispatch operation in which a single Brief (or a set of Brief variants) is sent simultaneously to multiple Agents or multiple configurations of the same Agent, producing parallel independent Runs. Diverge is not "run the same prompt multiple times." It is a structural operation: it creates an Orchestration context, gives each Run a named lane, and suspends normal Thread progression until a Convergence event resolves it.

**Why it exists:** The most cognitively valuable thing you can do with multiple AI specialists is explore a problem from multiple angles simultaneously and then compare. Without Diverge as a named, structured operation, this requires manual repetition and no UI support for comparison. Diverge makes parallel exploration a first-class act, not a workaround.

**Emotional role:** Exploration and confidence. The gesture of triggering a Diverge says "I don't yet know which direction is right, and I am deliberately creating optionality." This is the posture of a thoughtful director, not a user who wants one answer. The emotional payoff comes at Convergence — the moment of comparing what came back.

**What breaks without it:** The product is sequential. All AI work is single-threaded, single-perspective. The orchestration value proposition disappears. Agents can coexist in a project but cannot be deployed in coordination. The product is more sophisticated than a chatbot but not qualitatively different.

**User-visible:** Yes — Diverge triggers the Orchestration surface, which is always visible when a Diverge is active.  
**Persistent:** The Diverge event is recorded in the Thread. The parallel Runs it creates are persistent.  
**Auditable:** Yes — which agents were dispatched, with which briefs, at what time.

---

#### Convergence

**What it is:** The structured editorial operation that resolves a Diverge event. Convergence presents the artifacts from parallel Runs in a comparison view, exposes their differences and agreements, and offers two resolution paths: synthesis (the system produces a unified artifact from all inputs, with user editorial direction) or selection (the user promotes one artifact and archives the others). Convergence is never automatic. It always requires a deliberate human choice.

**Why it exists:** Without Convergence as a defined operation, Diverge creates chaos with no resolution mechanism. The user has multiple outputs and no structured way to combine or choose between them. More importantly: Convergence is where the user exercises authorial authority. It is the moment that most directly expresses "you are the editor of intelligence, not the intelligence itself."

**Emotional role:** Synthesis and authorship. The Convergence moment is the most emotionally significant interaction in the product. It is where the user feels like they are doing something that AI cannot do alone — making a judgment about what is true, what is useful, and what should become canonical. Getting this interaction right is not a UX nicety; it is what the product stands for.

**What breaks without it:** Diverge creates a cognitive dead end. Parallel outputs accumulate with no resolution path. The comparison and synthesis value — the thing that most differentiates this product from sequential AI tools — cannot be accessed. The product's most powerful workflow has no conclusion gesture.

**User-visible:** Yes — Convergence has a dedicated interaction moment in the Orchestration surface.  
**Persistent:** The Convergence event, editorial choices, and synthesis artifact are all persistent in the Thread.  
**Auditable:** Yes — which artifacts were selected, what synthesis direction was given, what was discarded.

---

#### Decision

**What it is:** An explicit, named record of a choice made within a project. A Decision has: the choice itself, the reasoning behind it (one or two sentences), the alternatives that were considered, the date it was made, and optionally the artifact or run that informed it. Decisions can be created manually or extracted automatically from the Thread by a background process and presented for confirmation. They live in the Memory panel and are linked to the Thread entry that spawned them.

**Why it exists:** Work produces not just artifacts but choices. The difference between a project that can be resumed by someone else and one that cannot is largely whether the decisions are recorded. Without the Decision as a structured entity, institutional knowledge evaporates. More practically: agents briefed with a history of project Decisions make better choices, because they know not just what was built but why.

**Emotional role:** Institutional memory and justification. A Decision record is the answer to "why does this look the way it does?" It prevents the endless re-litigation of choices that have already been made. It also creates a subtle but important feeling of progress — the accumulation of Decisions is evidence that the project has matured.

**What breaks without it:** Memory contains facts but not reasoning. Agents can be told what constraints exist but not why. New contributors (human or agent) cannot understand the project's logic without reading the entire Thread. The project cannot justify itself to a skeptic.

**User-visible:** Yes — in the Memory panel, organized by date and topic.  
**Persistent:** Yes.  
**Auditable:** Yes — creation, revision, and reversal events.

---

#### Snapshot

**What it is:** A named, restorable capture of a project's complete state at a specific moment in time. A Snapshot includes: the current Memory state, all Artifact content, the project goal, the agent configurations, and a reference to the Thread position. Snapshots are created automatically before every Deploy and manually on demand. A Snapshot is not a backup — it is an intentional checkpoint. It has a name (not a timestamp) because it represents a meaningful state, not just a moment.

**Why it exists:** Without Snapshots, deployment is a fear gesture. The user has no safe point to return to if something goes wrong. More subtly: without Snapshots, the workspace has no concept of "versions" of a project's state. Work feels linear and irreversible. The Snapshot is what makes the workspace feel operationally trustworthy — it is the safety net that permits confident forward movement.

**Emotional role:** Safety and reversibility. The existence of a Snapshot should change the user's relationship to risk. Knowing that "v2 schema decision" is a named, restorable state means you can experiment with v3 without anxiety. This is the same emotional function as git — not to record history for its own sake, but to make forward movement feel safe.

**What breaks without it:** Deploy is irreversible and therefore frightening. Experimentation is inhibited. The workspace feels fragile. Operational trust — the sense that the system can be recovered from any state — is absent.

**User-visible:** Yes — named Snapshots are visible in the Deploy surface.  
**Persistent:** Yes. Snapshots are stored indefinitely by default.  
**Auditable:** Yes — creation, restore events, and what state was restored.

---

#### Lineage

**What it is:** The traceable provenance chain of any Artifact, surfaced as an expandable annotation. Lineage shows: the Brief that created it, the Agent that executed it, the Memory state that was active at execution, the Run details (model, timestamp, duration), any Redirects that were applied mid-run, and whether it was part of a Diverge event. Lineage is not a separate surface — it is an inline disclosure on any Artifact in the Thread.

**Why it exists:** Without Lineage, the user cannot understand *why* an artifact looks the way it does. They cannot assess whether the reasoning was sound, whether the context was correct, or whether the agent was working from a stale memory state. Trust in AI output requires the ability to inspect its provenance. Lineage is what makes the workspace a transparent system rather than a black box that produces text.

**Emotional role:** Trust and accountability. Lineage answers the question that every thoughtful user has but most products never address: "How did this get made?" The ability to answer that question — to trace a result back to its intent, context, and execution — is what separates a professional tool from a toy. It is also what makes the platform defensible in a team or organizational setting.

**What breaks without it:** The system is opaque. Artifacts cannot be audited. Incorrect results cannot be diagnosed — you cannot tell if the problem was the Brief, the Memory, the Agent configuration, or the model. Trust is faith-based rather than evidence-based. In any serious use case, opacity is a terminal flaw.

**User-visible:** Yes — as an expandable annotation on Artifacts, not a separate surface.  
**Persistent:** Yes. Lineage records are immutable once created.  
**Auditable:** Inherently — Lineage is itself an audit mechanism.

---

## Part II — The action grammar

Actions are the verbs of the platform. Every action should have a distinct weight — some are light (instant, reversible, low consequence), some are heavy (deliberate, often irreversible, high consequence). The weight of an action should be felt in the interaction, not just described in documentation.

---

### Primary verbs (user-facing, dedicated UI gestures)

**Brief** — Weight: deliberate. The act of directing an Agent. Should feel like commissioning a specialist. Requires structured input. Has a confirm gesture before dispatch. Is never a casual action. If the Brief feels like typing a chat message, the design has failed.

**Dispatch** — Weight: committed. The moment a Brief is sent to an Agent for execution. A one-way gate — once dispatched, a Run begins. The dispatch gesture should carry a sense of finality. Consider a brief visual confirmation that acknowledges "a run has begun."

**Diverge** — Weight: expansive. The deliberate creation of parallel optionality. Should feel like opening a fan — multiple things unfold simultaneously. The UI transition from a single-agent brief to a diverge event should be animated and spatial: things move apart.

**Review** — Weight: judicial. The evaluation of an Artifact. Approval, rejection, or redirect. Should feel like making a call — quick, decisive, but consequential. The three states (approve, reject, redirect) should have distinct visual and gestural identities. This is not a rating widget; it is an editorial act.

**Redirect** — Weight: corrective. A mid-run annotation that steers an active execution. Should feel precise — like a margin note passed to a specialist who is still working. Should not interrupt the flow of other work. Is applied to a Run, not to an Agent.

**Promote** — Weight: curatorial. The act of moving an Artifact from "reviewed" to "canonical" — adding it to the Thread as part of the project's official record. Should feel like selection from a set of options. The gesture implies "this represents the project's state now."

**Converge** — Weight: authorial. The synthesis resolution of a Diverge event. Should feel like the most important gesture in the orchestration workflow. It is the moment the director asserts editorial authority. Should have the most deliberately designed interaction moment in the product.

**Query** — Weight: light. A question directed at Memory, not at an Agent. Should feel instant — like asking a knowledgeable assistant. Does not create a Run. Does not produce an Artifact. Surfaces facts from Memory. Is the lightest interaction in the system.

**Snapshot** — Weight: intentional. A deliberate checkpoint. Should require naming (not a timestamp auto-name). The name is meaningful: "pre-refactor," "v2 schema approved." Should feel like pressing save before a significant change.

**Deploy** — Weight: consequential. The riskiest verb in the system. Should require: the existence of a named Snapshot created within the last N minutes, a health-check acknowledgment, and explicit confirmation. Should never be casual. Should never be one click from a resting state.

---

### Secondary verbs (system-initiated, visible but not primary)

**Extract** — The system extracts a Decision from Thread content and presents it for user confirmation. System-initiated, user-confirmed.

**Synthesize** — During Convergence, the system produces a unified Artifact from multiple inputs according to the user's editorial direction. System-executed, user-directed.

**Recall** — The system surfaces relevant Memory in response to a Query. System-executed, triggered by user.

**Expire** — Session context that is explicitly ephemeral is expired at the end of a session. System-initiated, user-informed.

---

## Part III — Surface allocation

Not every primitive deserves its own page. The surface allocation decision is one of the most consequential architectural choices in the product.

### Primitives that deserve dedicated surfaces

**Project / Thread** — The primary work surface. Everything that happens within a project happens here. This is where the user spends the majority of their time. It must be the most refined surface in the product.

**Orchestration** — Appears as an overlay on the Thread when a Diverge event is active. Not a separate page — a contextual overlay that makes parallel runs visible without abandoning the project context. Disappears when Convergence is complete.

**Memory panel** — A persistent panel within the Project surface. Always accessible. Never hidden. Divided into its four zones (workspace memory, project context, decisions, ephemeral). Editable in place.

**Agent Studio** — A dedicated surface for configuring Agents: role, capabilities, tool access, memory scope, and persona. Separate from the Thread because Agent configuration is a deliberate, infrequent act that should have full attention.

**Deploy / Snapshot** — A dedicated surface for operational state: Snapshot history, Deploy history, health status, environment configuration. Accessed intentionally, not ambient.

**Command palette** — Accessible from anywhere via keyboard shortcut. Spans surfaces. The interface between the user's intent and the entire system.

### Primitives that live within surfaces (not dedicated pages)

**Brief** — Lives in the Composer (bottom of the Thread). Expands into a structured form when a "full brief" mode is invoked. Does not have its own page.

**Run** — Visible in the Thread as a typed entry. Status is displayed inline. Not a separate page — clicking a Run entry expands it in place.

**Artifact** — Lives in the Thread. Expandable inline. Lineage is an expandable annotation on the Artifact itself.

**Decision** — Lives in the Memory panel. Not a separate page.

**Lineage** — An expandable disclosure on any Artifact in the Thread. Never a separate page.

**Query** — Lives in the Command palette and in the Memory panel's search. Not a page.

---

## Part IV — Ephemeral vs persistent

This classification governs what can be recovered, what should be retained, and what the user should never worry about losing.

### Persistent (retained indefinitely by default)

Project, Agent configuration, Memory (all zones except ephemeral), Thread (append-only), all Artifacts (including rejected), all Runs (records, not just successful ones), Briefs, Decisions, Snapshots, Lineage records, Convergence events, Diverge events, Deploy history.

The rule: anything a user might need to answer "how did this get here?" must be persistent.

### Ephemeral (expires at session end, explicitly labeled)

Session context in Memory (the fourth zone), draft Briefs that have never been dispatched, intermediate synthesis states during Convergence before the user confirms.

The rule: anything that would be confusing if it persisted must be ephemeral and explicitly labeled as such.

### User expectation gap

The most common source of trust failures in AI products is when users believe something is persistent and discover it is not. Every ephemeral entity in this product must be visually labeled as ephemeral. The Memory panel's ephemeral zone must look different from the persistent zones. The labeling must be ambient, not buried in documentation.

---

## Part V — Auditable primitives

Not all entities require the same level of audit rigor. These primitives require immutable, timestamped audit logs.

**Brief** — What was asked. The intent record is sacred. A Brief, once dispatched, is never edited — only superseded by a new Brief.

**Run** — What was executed. Model, scope, timestamps, status transitions, token usage. Immutable.

**Decision** — What was decided and why. Creation, revision, and reversal events, each with timestamps and the user who made the change.

**Converge event** — What was synthesized, what was discarded, what editorial direction was given. This is the record of the user's authorial authority.

**Deploy** — What was deployed, from what Snapshot, with what health-check outcome. Non-repudiation for operational events.

**Memory edit** — Every addition, edit, and deletion to Memory is logged. This prevents silent context drift — the condition where agents start reasoning from premises the user never intended.

The rule: if the outcome of an action could be questioned later ("why did the agent do that?", "when was this deployed?", "who changed this constraint?"), the action must be auditable.

---

## Part VI — The emotional core

Three primitives define the product's soul. Without these three feeling right — not just functioning, but feeling right — no amount of polish in the remaining primitives will save the product's identity.

### Memory

If the workspace does not feel like it knows your project, it does not feel like a workspace. It feels like a slightly sophisticated chatbot. Memory is the primitive that answers "this place knows where I was." It is what separates a tool you use once from a workspace you inhabit over time. If Memory is a black box — if the user cannot see it, edit it, or trust it — the entire platform proposition collapses.

The emotional test for Memory: when a user opens a project they haven't touched in four days, do they feel oriented or disoriented? Oriented is right. Disoriented means Memory has failed, regardless of whether it is technically functioning.

### Brief

If directing an Agent feels like chatting with a bot, the product has failed its core identity claim. The Brief is the primitive that makes the user feel like a director rather than a prompter. The act of constructing a Brief — naming the goal, defining the context, setting constraints — is the act of taking a professional posture toward AI work. If this gesture is collapsed into a text field, the product is a chatbot.

The emotional test for Brief: does filling in a Brief feel like preparing to commission good work, or does it feel like typing a prompt? The former is right.

### Convergence

The moment a user resolves a Diverge event — reviewing parallel outputs, making editorial choices, directing synthesis — is the moment they most clearly feel their authorial authority. This is the interaction that most definitively answers "this is not a chatbot" and "I am not just a reader of AI output." The Convergence moment is where the user becomes the editor of intelligence, not merely the recipient of it. If Convergence is poorly designed — if it feels like selecting from a list rather than making a creative judgment — the product's highest-value workflow is made mundane.

The emotional test for Convergence: does the user feel like a director making a call, or like a user selecting an answer from a multiple-choice question? The former is right. The latter is a chatbot with extra steps.

---

## Part VII — The coherence rules

These rules govern all future product decisions. Any proposed feature or change must pass them.

**Rule 1 — Entity fidelity.** No new concept may be introduced that maps to a combination of existing primitives without a demonstrated reason why the combination is insufficient. Prevent abstraction inflation.

**Rule 2 — The verb test.** Every user-facing action must have a named verb from the interaction grammar. If a proposed interaction cannot be described by an existing verb, either the interaction is wrong or a new verb must be justified at the level of a primitive. Not a feature.

**Rule 3 — Memory visibility.** No information that informs an agent run may be hidden from the user. Memory must be inspectable and editable. No hidden system prompts that the user cannot see or modify.

**Rule 4 — Lineage completeness.** Any Artifact that appears in the Thread must have a complete Lineage. If an Artifact cannot be traced to a Brief, an Agent, and a Run, it should not appear in the Thread.

**Rule 5 — The chatbot test.** Before any new feature is designed, ask: does this make the product feel more like a chatbot or less? If more, reject or fundamentally redesign. The product's identity is defined by what it refuses to become.

**Rule 6 — The weight gradient.** No two verbs should have the same interaction weight. Light verbs (Query, Recall) should feel instant. Heavy verbs (Deploy, Converge) should require deliberate gesture. If Deploy can be triggered accidentally, the design has failed.

**Rule 7 — Ephemeral labeling.** Anything ephemeral must be labeled as such in the interface, ambient and always. The user must never discover that something they relied on has expired.

---

*This document is a constitution, not a backlog. It defines what the platform is, not what it will ship next. Amendments require the same level of argument applied here — structural justification, not feature rationale.*

*Version 1.0 — Canonical. Supersedes all prior product philosophy documents.*
