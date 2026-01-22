# Open Review

Open Review is a VS Code extension that turns code review notes into **first-class comments** and lets you **export everything with one click**.

It currently supports:

* Add comment threads by clicking a line/range
* Add/delete comments
* Delete threads
* Export all comments (Markdown) to clipboard

> Status: MVP / actively iterating

---

## Features

### 1) Add comment threads from editor

* Click a line (or select a range) to create a comment thread
* Type comments directly in VS Code’s native Comments UI

### 2) Manage threads & comments

* Add / delete comments
* Delete threads when the discussion is done

### 3) Export all comments

Export all threads & comments as **Markdown** (grouped by file → thread → comment), optimized for:

* sharing in chat / docs
* feeding into AI coding tools (Cline / Cursor / Claude Code, etc.)

Export format includes:

* file path
* thread location (line / range)
* all comments inside each thread (multi-line safe)

---

## Usage

### Create a thread

1. Open a file
2. Click a line (or select lines)
3. Add comments in the Comments panel

### Delete a comment / thread

* Use the built-in comment actions (or the Open Review commands, if enabled)

### Export all comments

Run the command:

* **Open Review: Export All Comments**

By default it will copy the Markdown to clipboard.

---

## Commands

> Replace command IDs below with your real ones.

* `open-review.exportAllComments` — Export all threads & comments to clipboard (Markdown)
* `open-review.createThread` — Create a new thread at current line/selection
* `open-review.deleteThread` — Delete current thread
* `open-review.deleteComment` — Delete a comment

---

## Output Example

````md
## File: /Users/you/project/src/foo.ts

### Thread @ L35
- Comment 1 (Alice):
  ```md
  Are we sure about this logic?
````

* Comment 2 (Bob):

  ```md
  It shouldn't be `clearReact`.
  ```

````

---

## Roadmap

- [ ] Export options: JSON / file output / unresolved-only / group-by
- [ ] Better navigation: open thread location from export preview
- [ ] AI workflows: send selected threads to your coding agent via MCP
- [ ] Persistence & sync (optional)

---

## Development

```bash
pnpm install
pnpm build
pnpm watch
````

* Press `F5` to launch the Extension Development Host
* Test comments, then run **Open Review: Export All Comments**

---

## License

MIT
