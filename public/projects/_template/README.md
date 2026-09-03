# _template — starter project

Clone this **whole folder** to start a new project (a new client / engagement):

```
public/projects/<project-id>/
├─ project.json              title, brand-bar logos, list of demos
├─ branding/                 this project's logos
└─ scenarios/<id>/
   ├─ scenario.json          one demo
   └─ media/                 screenshots / videos (optional)
```

1. Copy `_template/` to `public/projects/<project-id>/`. Keep the id to letters,
   digits, `.`, `-`, `_` — it goes straight into the URL.
2. Replace `branding/client.svg` with the client's logo and update the `logos`
   array in `project.json`. Set `"invert": true` on a logo with dark artwork so
   it renders white on the purple stage; omit it for one that's already light or
   must keep its brand colours.
3. Edit `project.json`: `title`, and one `scenarios` entry per demo. Array order
   is dropdown order.
4. Edit each `scenarios/<id>/scenario.json`. Every field is documented in the
   top-level [`SCHEMA.md`](../../../SCHEMA.md). JSON has no comments, so the
   annotations live in SCHEMA.md rather than inline.
5. Drop media into each scenario's `media/` folder (same filenames as
   referenced), or run `node scripts/gen-placeholders.mjs <project-id>` to
   create labelled placeholders.
6. Open `http://localhost:5173/?project=<project-id>`.

To make it the project a bare URL opens, set `DEFAULT_PROJECT` in
`src/config.ts` and rebuild.

Quick reference — compose objects from these code-drawn primitives (no art files):

- **bases**: `envelope`, `chat`, `card`, `photo`
- **badges**: `tags`, `rename`, `link`, `stamp-green`
- **agent icons**: `eye`, `tag`, `ticket`, `rename`, `link`, `check`, `shield`
- **avatars**: `worker`, `inspector`, `office`, `person`

Recommended shape: ≤ 6 places (one input + a few stations + one output). The
engine handles any count, but this reads best on a 16:9 screen.
