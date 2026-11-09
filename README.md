# PDF Studio

A small web app for uploading a PDF in your browser and editing it, then downloading the result.

## Features

**Text**
- **Edit existing text**: click any line of text, retype it, press Enter. The old glyphs are actually removed from the file, not just painted over, and backgrounds stay as they were.
- **Add text** anywhere, with a choice of font, size and colour. Text can run over several lines.
- **Find & replace** across every page.

**Drawing and annotations**
- Rectangles, ellipses, lines, and freehand drawing (works for signatures).
- Highlights and sticky notes. The **Erase notes** tool removes them again.
- Insert PNG, JPEG, GIF or BMP images.
- **Whiteout** hides content behind a box. **Redact** permanently deletes everything in an area.

**Pages**
- Drag thumbnails to reorder pages.
- Rotate, duplicate or delete pages, and insert blank ones.

**Merge**
- Pick or drop several files at once and they are joined, in order, into one PDF.
- **Merge** adds more files to the end of the open document.
- Images (PNG, JPEG, GIF, BMP, TIFF, WebP) are accepted too; each becomes a page.

**Split**
- One new PDF with only the pages you list, e.g. `1-3, 5, 8-`.
- A separate PDF for each range, delivered as a zip.
- A new PDF every N pages (N = 1 gives one file per page), delivered as a zip.

**Convert** (all pages, or a page range)
| To | What you get |
|---|---|
| Word (`.docx`) | Editable text, tables and images. The layout is rebuilt. |
| Excel (`.xlsx`) | Each table becomes a sheet, and numbers are stored as real numbers. Pages without a table are split into rows and columns by spacing. |
| PowerPoint (`.pptx`) | One slide per page, each page as a picture. |
| PNG / JPEG | One picture per page, in a zip. |
| Text, HTML, Markdown | The words alone, a laid-out web page, or headings and paragraphs. |

**Document**
- Undo and redo (up to 50 steps).
- Edit document properties (title, author, subject, keywords).
- Download the edited PDF.

## Running it

```bash
pip install -r requirements.txt
python -m pdf_editor.app            # then open http://127.0.0.1:5000
```

Options: `--host 0.0.0.0 --port 8080 --storage /path/to/data`.

To open a PDF, drag it onto the page or click **Open PDF**. The document ID goes into the URL hash, so reloading the page brings you back to the same document.

### Keyboard shortcuts
| Key | Action |
|---|---|
| `Esc` | Select tool |
| `E` | Edit text |
| `T` | Add text |
| `H` | Highlight |
| `R` | Rectangle |
| `L` | Line |
| `D` | Draw |
| `N` | Note |
| `I` | Image |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Ctrl+S` | Download |
| `Ctrl+scroll` | Zoom |

## How it works

Think of it like a **photocopier with a tracing-paper overlay**:

1. **The photocopy.** The server (Flask + [PyMuPDF](https://pymupdf.readthedocs.io)) renders each page to a PNG, and the browser shows that image.
2. **The tracing paper.** An invisible layer sits on top of each page image and captures your clicks and drags. Your mouse position in screen pixels is divided by the zoom level to get PDF coordinates (points).
3. **The instruction slip.** Each action is sent to the server as a small JSON instruction, for example `{"op": "rectangle", "page": 0, "rect": [x0,y0,x1,y1]}`. The server applies it to the real PDF and saves a new numbered snapshot (`v0.pdf`, `v1.pdf`, …). Undo just moves a pointer back to the previous snapshot, much like flipping back a page in a notebook.
4. **Only the changed pages are redrawn.** Each page has a fingerprint (a hash of its content). The browser re-downloads a page image only when that page's fingerprint changes.

```
pdf_editor/
  pdf_ops.py     # every edit operation (pure functions on a PyMuPDF document)
  convert.py     # split, join, and convert to Word/Excel/PowerPoint/images/text
  store.py       # on-disk snapshots + undo/redo history
  app.py         # Flask HTTP API
  static/        # index.html, app.js, style.css: the browser UI (no build step)
tests/           # pytest suite for the operations and the API
```

### API

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/upload` | multipart `file` (repeat it to join several), returns a document snapshot |
| GET | `/api/docs/<id>/export?format=&pages=` | convert: `docx`, `xlsx`, `pptx`, `png`, `jpg`, `txt`, `html`, `md` |
| GET | `/api/docs/<id>/split?mode=&pages=&every=` | `extract` (one PDF), `ranges` or `every` (zip of PDFs) |
| GET | `/api/docs/<id>` | snapshot: pages, sizes, undo state, metadata |
| GET | `/api/docs/<id>/pages/<n>.png?zoom=` | rendered page |
| GET | `/api/docs/<id>/pages/<n>/text` | text spans with positions and fonts |
| POST | `/api/docs/<id>/edit` | one operation, or a list applied all-or-nothing |
| POST | `/api/docs/<id>/merge` | multipart `file`, one or more (+ `at`) |
| POST | `/api/docs/<id>/undo`, `/redo` | step through history |
| GET | `/api/docs/<id>/download` | the edited PDF |

Operations available through `/edit`: `add_text`, `replace_text`, `find_replace`, `whiteout`, `redact`, `rectangle`, `ellipse`, `line`, `ink`, `highlight`, `note`, `image`, `delete_annotations`, `rotate_page`, `delete_page`, `move_page`, `duplicate_page`, `insert_blank`, `merge`, `set_metadata`. Images and PDFs inside JSON are sent as base64 or data URLs.

## Tests

```bash
python -m pytest
```

## Limitations

- When you edit existing text, the replacement is set in the closest standard PDF font (Helvetica, Times or Courier), not the original embedded font. Size and colour are kept.
- Text is edited one line (span) at a time. Paragraphs do not reflow.
- Password-protected PDFs are rejected.
- Conversion reads the text stored in the PDF. A scanned PDF (pages that are just photos) has no text to read, so Word, Excel and text output will be empty or picture-only; there is no OCR.
- Word conversion rebuilds the layout, so complex pages (multi-column, heavy graphics) can shift.
- Conversion goes from PDF to other formats. Word or Excel files cannot be turned into PDFs here.
- This is built as a single-user or local tool. It has no login, so if you expose it on a network, put it behind authentication. Documents are kept under `storage/` until you delete them.
