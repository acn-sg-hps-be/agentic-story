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

**What is clickable:** only the **avatar** (opens the input popup) and each
**agent** button (opens that agent's popup). The station towers, the callout
cards and the outputs are *not* clickable — outputs are covered per-agent and by
the final "Value Delivered" bar. A popup shows a title, description and one
media slot; missing media falls back to the bundled `sample.mp4`.

### `inputs[]`
| Field | Type | Req | Notes |
|---|---|---|---|
| `id` | string | ✓ | Unique. |
| `label` | string | ✓ | |
| `icon` | string | ✓ | A base (`envelope`/`chat`/`card`/`photo`) or icon glyph. |
| `description` | string | ✓ | Shown in the popup. |
| `inputFormat` | string | | Optional one-liner shown in the popup as an amber **Input** line. |
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
| `description` | string | | Fallback popup text for an agent that has none of its own. |
| `media` | string | | Fallback popup media for an agent that has none of its own. |
| `transformTo` | string | ✓ | `objectStates` name applied when the item reaches this station. |
| `variant` | number | | Tower look `0..3`; defaults to a per-index variant. |

`agents[]`: `{ "name": string, "icon": string, "description"?: string, "output"?: string, "media"?: string }`
- `icon` — one of: `eye`, `tag`, `ticket`, `rename`, `link`, `check`, `shield`.
- `output` — optional one-liner shown in the popup as a green **Output** line.
- Each agent is **individually clickable**, and the popup title is rendered as
  `"<name> Agent"`. The popup uses the agent's own `description`/`media`,
  falling back to the station's when absent.

### `outputs[]`
| Field | Type | Req | Notes |
|---|---|---|---|
| `id` | string | ✓ | Unique. |
| `label` | string | ✓ | Card **title** in the Value Delivered bar (unless `value` is set). |
| `icon` | string | ✓ | base or icon glyph. |
| `value` | string | | Punchier headline that overrides `label` as the card title. |
| `description` | string | | **Not currently rendered** — see the note below. |
| `media` | string | | |
| `fromState` | string | ✓ | `objectStates` name the emitted output is shown in. |

#### The "Value Delivered" bar

Outputs have **no popup**. Instead, as soon as the plot reaches *any*
`output-emit` step, the subtitle is replaced by a green **Value Delivered** bar
showing **one card per `output-emit` step** in the plot. Each card is:

- **title** → that output's `value`, falling back to its `label`
- **body** → the **`caption` of the `output-emit` step**, *not* the output's
  `description`

> **Gotcha:** `outputs[].description` is not displayed anywhere. To change the
> wording on a Value Delivered card, edit the **step `caption`** in the plot (and
> `value`/`label` for the title).

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
- **`output-emit`** (ref = output) — the item is emitted in the output's
  `fromState`, and the **Value Delivered** bar replaces the subtitle. This
  step's `caption` becomes that output's card body (see above).

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
