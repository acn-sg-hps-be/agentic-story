# Scenario schema

A scenario is a single JSON file plus a `media/` folder. The engine contains
**zero story-specific content** — everything about a story lives here. A new
story needs **no art work**: the primitive library already draws everything;
you only write config and (optionally) drop in media.

Scenarios live in `public/scenarios/<id>/scenario.json` and are listed in
`public/scenarios/index.json`. Media paths are resolved **relative to the
scenario file**.

## Top level

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | ✓ | Unique scenario id. |
| `title` | string | ✓ | Shown in the scenario switcher. |
| `subtitle` | string | | Optional strapline. |
| `objectStates` | object | ✓ | Named visual states the object can take (see below). |
| `inputs` | array | ✓ | One or more input nodes. |
| `stations` | array | ✓ | One or more agent stations, in line order. |
| `outputs` | array | ✓ | One or more output nodes. |
| `plots` | array | ✓ | One or more linear plots. |

## `objectStates`

A map of state name → composed visual. A rendered object = **one base + zero or
more badges** layered on fixed anchor slots (so several badges stack without
collision).

```jsonc
"objectStates": {
  "raw":     { "base": "envelope" },
  "assured": { "base": "card", "badges": ["tags", "link", "stamp-green"] }
}
```

- `base` — one of: `envelope`, `chat`, `card`, `photo`.
- `badges` — any of: `tags`, `rename`, `link`, `stamp-green`.

## Nodes

All nodes are clickable and open a popup with their title, description and one
media slot. Missing media shows a tasteful placeholder.

### `inputs[]`
| Field | Type | Req | Notes |
|---|---|---|---|
| `id` | string | ✓ | Unique. |
| `label` | string | ✓ | |
| `icon` | string | ✓ | A base (`envelope`/`chat`/`card`/`photo`) or icon glyph. |
| `description` | string | ✓ | Shown in the popup. |
| `media` | string | | Path relative to the scenario, e.g. `media/email.png`. |
| `startsAs` | string | ✓ | An `objectStates` name. |
| `persona` | object | | The human who supplies the input (see below). |

`persona`: `{ "role": string, "quote": string, "avatar"?: "worker"|"inspector"|"office"|"person" }`

### `stations[]`
| Field | Type | Req | Notes |
|---|---|---|---|
| `id` | string | ✓ | Unique. |
| `label` | string | ✓ | e.g. `CAPTURE`. |
| `agents` | array | ✓ | One or more agents (see below). |
| `description` | string | ✓ | Station popup text. |
| `media` | string | | Station popup media. |
| `transformTo` | string | ✓ | `objectStates` name applied when the item reaches this station. |

`agents[]`: `{ "name": string, "icon": string, "description"?: string, "media"?: string }`
- `icon` — one of: `eye`, `tag`, `ticket`, `rename`, `link`, `check`, `shield`.
- Each agent is **individually clickable**. Its popup uses the agent's own
  `description`/`media`, falling back to the station's when absent.

### `outputs[]`
| Field | Type | Req | Notes |
|---|---|---|---|
| `id` | string | ✓ | Unique. |
| `label` | string | ✓ | |
| `icon` | string | ✓ | base or icon glyph. |
| `description` | string | ✓ | |
| `media` | string | | |
| `fromState` | string | ✓ | `objectStates` name the emitted output is shown in. |

## `plots[]`

Each plot is a **linear sequence of steps**.

```jsonc
{ "id": "main", "name": "Email → Issue", "steps": [ … ] }
```

### `steps[]`
| Field | Type | Req | Notes |
|---|---|---|---|
| `type` | string | ✓ | `actor-intro` \| `input-appear` \| `move-to` \| `process` \| `output-emit`. |
| `ref` | string | ✓ | id of the node this step acts on. |
| `caption` | string | ✓ | Timed subtitle. |
| `dwell` | number | ✓ | Milliseconds this step holds during autoplay. |
| `transformTo` | string | | Optional per-step override of the station's `transformTo`. |

Step types:
- **`actor-intro`** (ref = input) — the persona appears and states their pain point.
- **`input-appear`** (ref = input) — the item enters in its `startsAs` state.
- **`move-to`** / **`process`** (ref = station) — the item travels to / is processed
  at the station and morphs to that station's `transformTo` (or the step's override).
- **`output-emit`** (ref = output) — the item is emitted in the output's `fromState`.

Only the nodes a plot references are drawn, so a scenario with many
inputs/outputs stays clean. Recommended presentation shape: **≤ 6 places, one
input + one output** — but the engine handles any count.

## Primitives reference (the whole art system)

To add a new object type in future, add **one function** to
`src/engine/primitives.ts` — never an asset file.

- **bases**: `envelope`, `chat`, `card`, `photo`
- **badges**: `tags`, `rename`, `link`, `stamp-green`
- **agent icons**: `eye`, `tag`, `ticket`, `rename`, `link`, `check`, `shield`
- **avatars**: `worker`, `inspector`, `office`, `person`

The loader validates every scenario on load and reports friendly errors if a
field is missing or a referenced id / state / primitive does not exist.
