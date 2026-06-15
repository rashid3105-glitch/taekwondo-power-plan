## Add HTML / Visual toggle to RichTextEditor

Add a toggle button to `src/components/blog/RichTextEditor.tsx` that switches between the TipTap visual editor and a raw HTML source view.

### Behavior
- New "Code" button (e.g. `<Code2 />` icon from lucide) in the toolbar, far right next to undo/redo.
- Two modes:
  - **Visual** (default): current TipTap `EditorContent`.
  - **HTML**: a `<textarea>` showing the raw HTML, monospace font, same min-height as editor.
- Switching modes:
  - Visual → HTML: read `editor.getHTML()` into local textarea state.
  - HTML → Visual: call `editor.commands.setContent(html)` and trigger `onChange(html)`.
- While in HTML mode, edits to the textarea update local state and call `onChange(html)` directly so saves work without switching back.
- Toolbar formatting buttons (bold, italic, headings, etc.) are disabled/hidden in HTML mode; only the toggle, undo/redo (disabled), and the code button remain active.

### Files
- `src/components/blog/RichTextEditor.tsx` — add `mode` state, conditional render, toggle button.

No DB, API, or other component changes needed. Consumers (`AdminBlogEditor.tsx`) already just pass `value`/`onChange` and keep working unchanged.
