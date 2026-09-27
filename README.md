# Flowchart Site

A single-page flowchart editor built for the take-home test. It renders a
customer-interaction flow (the `payload.json` seed) on a draggable canvas and
lets you create, edit, and delete nodes, with an undo/redo history and
localStorage persistence.

## Stack

- **Vue 3.5** (JavaScript, per the spec — TypeScript is noted below as the production path)
- **Vite** (dev server + build)
- **Pinia** — UI state (the node graph, undo/redo history)
- **Vue Router** — route-driven Details drawer
- **TanStack Query** — server state (the payload), wired with the spec's exact config
- **@vue-flow/core** — the canvas (custom node types, edges, drag)
- **Vitest** — unit tests

## Getting started

Requires Node `^22.18.0 || >=24.12.0`.

```sh
npm install
npm run dev        # start the dev server (http://localhost:5173)
```

### Scripts

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Vite dev server with hot reload       |
| `npm run build`     | Production build to `dist/`           |
| `npm run preview`   | Serve the production build locally    |
| `npm run test:unit` | Run the Vitest suite (watch mode)     |
| `npm run test:unit -- run` | Run the suite once and exit      |
| `npm run lint`      | oxlint + ESLint (with `--fix`)        |
| `npm run format`    | Prettier over `src/`                  |

## How to use the app

- **Click a node** → the Details drawer opens and the URL becomes `/#/<nodeId>` (deep-linkable).
- **Click the same node again**, press **Esc**, or hit the browser **back** button → the drawer closes and the URL returns to `/`.
- **Connector nodes** (Success/Failure) are display-only — clicking them does nothing, per the spec.
- **The `+` on a node's bottom edge** opens the create modal with that node locked in as the parent — the new node is created as its child and the connecting edge is derived automatically. Every node (including connectors) has one. (There is no separate top-level "add" button: in a tree every new node is a child of an existing one.)
- **Undo / Redo** revert/redo the last node change (intent-granular, not per-keystroke).
- Edits and the node graph **persist to localStorage** and survive a reload (a saved copy wins over the seed payload).

## Architecture & design decisions

### State is split by ownership

- **TanStack Query owns server state** — the node payload. `useQuery` fetches it from a simulated REST API (`src/api/flow.js`), and create/update/delete flow through `useMutation` against the same API. The API is async (it simulates a network round-trip) and reads the persisted copy, falling back to the seed `payload.json`.
- **Pinia owns UI state** — the working copy of the graph plus the undo/redo stacks.

The two never duplicate each other: Query hands the payload to the store once (`store.init`), and the store is the single source of truth for everything the UI edits. Each `useMutation` hits the API, then mirrors the result into the store on success (`onSuccess`) — so the store (and its undo/redo history) stays authoritative while the mutations satisfy the "Query mutations" requirement.

### The payload is a tree, not a graph

`payload.json` is a **flat array with no `edges` key** — the graph is encoded via `parentId` (root = `-1`). `src/utils/flow.js` derives both:

- `toFlowNodes` — positions each node in a left→right tree layout (depth × 250px, row × 120px). The payload has no positions, so layout is computed, not stored.
- `toFlowEdges` — turns each `parentId` link into a vue-flow edge.

### Node-type mapping (spec ↔ payload)

The spec and the payload use different names for the same concept. `flow.js` maps them:

| Spec type         | Payload type         | Notes |
| ----------------- | -------------------- | ----- |
| `trigger`         | `trigger`            | No `name` in payload → renderer falls back to a label. |
| `sendMessage`     | `sendMessage`        | `data.payload` is a **mixed array**: `{type:'text'}` and `{type:'attachment'}` interleaved. |
| `businessHours`   | `dateTime`           | Spec's "business hours" = payload's `dateTime`. |
| `addComment`      | `addComment`         | `data.comment`. |
| connector (display) | `dateTimeConnector` | Success/Failure; `data.connectorType` is `'success'\|'failure'`. Display-only. |

Only `sendMessage`, `addComment`, and `dateTime` are **creatable** — trigger and connector nodes are excluded from the Create form.

### Ids are normalized to strings

The payload mixes numeric ids (`1`) and string ids (`'d09c08'`). Everything goes through `String(id)` so lookups and route params are consistent.

### Adding a node is adding a child

The graph is a tree, so "connect a node" means "give it a parent." Each node renders a `+` on its bottom edge (the outgoing connector); clicking it opens the create modal with `parentId` locked to that node. The new node's `parentId` is set, and `toFlowEdges` derives the connecting edge — no separate edge machinery. The handler is threaded into each node's vue-flow `data` as `onAddChild`, emitted up through `FlowCanvas` to `FlowPage`, which opens the modal.

### The Details drawer is a route, not a boolean

"Accessible via a URL containing the node ID" means the drawer is **route-driven**: `/` is canvas-only, `/:nodeId` is canvas + drawer. Both routes render the same `FlowPage`, so the canvas stays mounted (vue-flow state, positions, scroll survive) while the drawer toggles. The selected node is `computed` from `route.params`.

### Undo/redo snapshots at intent granularity

Each mutating action (`addNode` / `updateNode` / `deleteNode`) pushes a deep clone of the graph onto the undo stack *before* the change. Text fields commit on **blur/Enter**, not per keystroke — so one edit is one undo step. A new mutation clears the redo stack. History is capped at 50 entries.

### Persistence

A deep `watch` on the store's `nodes` is the **single persistence path**: it writes to localStorage on every change, catching both the `useMutation` writes and undo/redo restores. On load, a saved copy **wins over** the seed payload; corrupt data falls through to the fetch. Attachments are stored as **data URLs** (via `FileReader`) so they survive persistence without a backend.

### Node positions persist

Positions are normally **computed** from the tree layout (`toFlowNodes`: depth × 250px, row × 120px) — the payload has none. When a node is dragged, `@node-drag-stop` saves its final position via a `useMutation` (the API call, then `store.updateNode(id, { position })` on success). `toFlowNodes` then prefers a saved `node.position` over the computed layout, so dragged nodes keep their spot across reloads. Because the position lives in the store, it's persisted by the same watch and is **undoable** (one drag = one undo step). Nodes that were never dragged still use the computed layout.

### Attachments have no backend

"Upload new attachments" is mocked: files are read as data URLs and stored on the node. No server round-trip.

## Testing

Vitest (jsdom). Coverage spans:

- `flow.spec.js` — `toFlowNodes` / `toFlowEdges` (layout + edge derivation, id normalization).
- `flow.store.spec.js` — the Pinia store: init, add/update/delete, undo/redo, history cap, id normalization.
- `CreateNodeModal.spec.js` — validation, per-type payload shapes, cancel, Escape, focus-on-open.
- `NodeDetails.spec.js` — per-type sections, edit commits (attachments preserved), delete + navigation, Escape, focus-on-open.
- `App.spec.js` — the app boots and renders the flow page for the root route.

A `ResizeObserver` stub lives in `src/__tests__/setup.js` because jsdom lacks it and vue-flow needs it to measure the canvas.

## Production notes

- **TypeScript** is the natural extension — the spec asked for JS, but the payload's mixed shapes (mixed ids, mixed `payload` arrays) are exactly what a type system would tighten.
- **Real backend**: the simulated API in `src/api/flow.js` is the seam — point its functions at real HTTP endpoints and the `useQuery`/`useMutation` wiring already works unchanged.
- **Accessibility**: the modal and drawer focus their first field on open and close on **Esc**; both expose ARIA roles (`dialog` / `complementary`). A full focus trap is the remaining a11y gap.
