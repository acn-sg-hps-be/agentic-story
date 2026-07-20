# _template — starter scenario

Clone this folder to start a new story:

1. Copy `_template/` to `public/scenarios/<your-id>/`.
2. Edit `scenario.json`. Every field is documented in the top-level
   [`SCHEMA.md`](../../../SCHEMA.md). JSON has no comments, so the annotations
   live in SCHEMA.md rather than inline.
3. Register it in `public/scenarios/index.json`:
   ```json
   { "id": "your-id", "title": "Your title", "path": "scenarios/your-id/scenario.json" }
   ```
4. Drop media into `media/` (same filenames as referenced), or run
   `node scripts/gen-placeholders.mjs` to create labelled placeholders.

Quick reference — compose objects from these code-drawn primitives (no art files):

- **bases**: `envelope`, `chat`, `card`, `photo`
- **badges**: `tags`, `rename`, `link`, `stamp-green`
- **agent icons**: `eye`, `tag`, `ticket`, `rename`, `link`, `check`, `shield`
- **avatars**: `worker`, `inspector`, `office`, `person`

Recommended shape: ≤ 6 places (one input + a few stations + one output). The
engine handles any count, but this reads best on a 16:9 screen.
