# Configuring the tool

How to change what the app shows — no engine code, just JSON (and optionally
media). For the exhaustive field reference see [SCHEMA.md](SCHEMA.md); this is
the task-oriented guide.

## Where the config lives

```
public/scenarios/
├─ index.json              registry: which demos appear in the dropdown (+ order)
├─ whatsapp/scenario.json  a demo
├─ email/scenario.json     a demo
│  └─ media/               drop real screenshots/videos here (optional)
└─ _template/scenario.json starter to clone for a new demo
```

Each entry in the dropdown is **one plot**. A "demo" = a `scenario.json` (one
plot each, in the current setup).

## Preview your edits

```bash
npm run dev      # http://localhost:5173
```
Edit a `scenario.json`, save, refresh the browser. If a config is malformed the
app shows a plain-language error naming the problem (it validates on load).

Use the **▦ object gallery** button in the toolbar to see the exact names you
can use for `avatar`, station `variant`, object `base`, `badges`, and agent
`icon`.

## Common edits (recipes)

### Change wording or timing
In a plot's `steps`, edit `caption` (the subtitle text) and `dwell`
(milliseconds that step holds during autoplay).

### Change who triggers it (the avatar + speech bubble)
On an input, edit `persona`:
```jsonc
"persona": { "role": "Site Foreman", "quote": "…their pain point…", "avatar": "inspector" }
```
`avatar` is one of: `worker`, `inspector`, `office`, `person`.

### Add / remove an agent in a station
Each station has an `agents` array. Each agent:
```jsonc
{ "name": "Vision", "icon": "eye",
  "description": "what it does (one line)",
  "output": "what it produces (one line)" }
```
`icon` is one of: `eye`, `tag`, `ticket`, `rename`, `link`, `check`, `shield`.
During playback each agent gets its own popup, shown one at a time.

### Add / remove a station
Add/remove an object in `stations` (id, label, `transformTo`, `description`,
`agents`). Then reference it in the plot's `steps` with a `process` (or
`move-to`) step. Optional `"variant": 0..3` picks a different tower look.

### Change how the travelling object looks / transforms
`objectStates` maps a name → `{ base, badges }`:
- `base`: `envelope`, `chat`, `card`, `photo`
- `badges`: any of `tags`, `rename`, `link`, `stamp-green`

Each station's `transformTo` names the state the object becomes there. A step
may override it with its own `transformTo`.

### Add a whole new demo
1. Copy `public/scenarios/_template/` to `public/scenarios/<your-id>/`.
2. Edit its `scenario.json`.
3. Register it in `public/scenarios/index.json`:
   ```jsonc
   { "id": "your-id", "title": "Your title", "path": "scenarios/your-id/scenario.json" }
   ```
   Order in this array = order in the dropdown.

### Reorder or hide demos
Reorder (or remove) entries in `index.json`. Removing an entry hides it from the
dropdown without deleting the folder.

## Media (screenshots / videos)

Media is **optional**. Any input/station/agent may set a `media` path, resolved
**relative to that scenario's folder**, e.g. `"media/capture.mp4"`. Drop a file
of that name into the scenario's `media/` folder.

- If a popup has **no** `media`, it plays the bundled `public/sample.mp4` so the
  slot is always a testable video. Replace it by adding real `media`.
- An agent with no `media` falls back to its **station's** `media`.
- Videos start **paused** and use the browser's native controls (incl.
  fullscreen).

Generate labelled placeholder images for every `media` path a scenario declares:
```bash
node scripts/gen-placeholders.mjs   # writes .svg placeholders where media points
```

## Step types (plot flow)

| type | ref | effect |
|---|---|---|
| `actor-intro` | input | avatar + speech bubble (no popup) |
| `input-appear` | input | the item enters; input popup available |
| `move-to` / `process` | station | object travels to / is processed; agent popups |
| `output-emit` | output | object exits in its final state; final caption |

## After you're happy — publish

See [DEPLOY.md](DEPLOY.md). In short: `git commit`/`git push` the source, then
`npm run deploy` to update the live site.
