"""Split, combine and convert PDFs to other formats.

Everything here is read-only with respect to the source document: each
function takes PDF bytes or an open document and returns new bytes.
"""

from __future__ import annotations

import html
import io
import os
import re
import tempfile
import zipfile

import pymupdf

from .pdf_ops import EditError

IMAGE_TYPES = {"png", "jpg", "jpeg", "gif", "bmp", "tif", "tiff", "webp"}

# format id -> (label, file extension, mime type)
FORMATS = {
    "docx": ("Word document", "docx",
             "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    "xlsx": ("Excel spreadsheet", "xlsx",
             "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
    "pptx": ("PowerPoint slides", "pptx",
             "application/vnd.openxmlformats-officedocument.presentationml.presentation"),
    "png": ("PNG images (zip)", "zip", "application/zip"),
    "jpg": ("JPEG images (zip)", "zip", "application/zip"),
    "txt": ("Plain text", "txt", "text/plain; charset=utf-8"),
    "html": ("Web page (HTML)", "html", "text/html; charset=utf-8"),
    "md": ("Markdown", "md", "text/markdown; charset=utf-8"),
}


# ---------------------------------------------------------------- page ranges

def parse_ranges(spec: str | None, page_count: int) -> list[list[int]]:
    """Parse "1-3, 5, 8-" into groups of 0-based page indexes.

    Each comma-separated part becomes one group. An empty spec means
    every page, as a single group.
    """
    spec = (spec or "").strip()
    if not spec:
        return [list(range(page_count))]
    groups = []
    for part in spec.split(","):
        part = part.strip()
        if not part:
            continue
        m = re.fullmatch(r"(\d*)\s*-\s*(\d*)|(\d+)", part)
        if not m:
            raise EditError(f"cannot read page range {part!r}; use e.g. 1-3, 5, 8-")
        if m.group(3):
            start = end = int(m.group(3))
        else:
            start = int(m.group(1)) if m.group(1) else 1
            end = int(m.group(2)) if m.group(2) else page_count
        for v in (start, end):
            if not 1 <= v <= page_count:
                raise EditError(f"page {v} is outside 1-{page_count}")
        step = 1 if end >= start else -1
        groups.append([p - 1 for p in range(start, end + step, step)])
    if not groups:
        raise EditError("no pages selected")
    return groups


def _flat(groups: list[list[int]]) -> list[int]:
    return [p for g in groups for p in g]


def _subset(doc: pymupdf.Document, pages: list[int]) -> pymupdf.Document:
    out = pymupdf.open()
    for p in pages:
        out.insert_pdf(doc, from_page=p, to_page=p)
    return out


def _label(pages: list[int]) -> str:
    if len(pages) == 1:
        return f"page-{pages[0] + 1}"
    return f"pages-{pages[0] + 1}-{pages[-1] + 1}"


# ---------------------------------------------------------------- split / combine

def extract(doc: pymupdf.Document, ranges: str | None) -> bytes:
    """One new PDF containing the selected pages, in the order given."""
    out = _subset(doc, _flat(parse_ranges(ranges, doc.page_count)))
    return out.tobytes(garbage=3, deflate=True)


def split(doc: pymupdf.Document, stem: str, ranges: str | None = None,
          every: int | None = None) -> bytes:
    """Zip of several PDFs: one per range, or one per ``every`` pages."""
    if every:
        every = int(every)
        if every < 1:
            raise EditError("pages per file must be at least 1")
        n = doc.page_count
        groups = [list(range(i, min(i + every, n))) for i in range(0, n, every)]
    else:
        groups = parse_ranges(ranges, doc.page_count)
    buf = io.BytesIO()
    used = set()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        for g in groups:
            name = f"{stem}-{_label(g)}"
            base, k = name, 2
            while name in used:
                name, k = f"{base}-{k}", k + 1
            used.add(name)
            z.writestr(f"{name}.pdf", _subset(doc, g).tobytes(garbage=3, deflate=True))
    return buf.getvalue()


def to_pdf_bytes(data: bytes, filename: str = "") -> bytes:
    """Return ``data`` as PDF bytes, converting images to one-page PDFs."""
    ext = os.path.splitext(filename)[1].lstrip(".").lower()
    if data[:5] == b"%PDF-" or ext == "pdf":
        return data
    if ext not in IMAGE_TYPES:
        raise EditError(f"unsupported file type: {filename or 'unknown'} "
                        "(use PDF or an image)")
    try:
        with pymupdf.open(stream=data, filetype=ext) as img:
            return img.convert_to_pdf()
    except Exception as exc:
        raise EditError(f"could not read image {filename}: {exc}")


def combine(files: list[tuple[bytes, str]]) -> bytes:
    """Join several PDFs/images, in order, into one PDF."""
    if not files:
        raise EditError("no files given")
    out = pymupdf.open()
    for data, name in files:
        try:
            with pymupdf.open(stream=to_pdf_bytes(data, name), filetype="pdf") as src:
                if src.needs_pass:
                    raise EditError(f"{name} is password-protected")
                out.insert_pdf(src)
        except EditError:
            raise
        except Exception as exc:
            raise EditError(f"could not open {name}: {exc}")
    if out.page_count == 0:
        raise EditError("no pages found")
    return out.tobytes(garbage=3, deflate=True)


# ---------------------------------------------------------------- converters

def to_docx(doc, pages):
    from pdf2docx import Converter
    with tempfile.TemporaryDirectory() as tmp:
        out = os.path.join(tmp, "out.docx")
        cv = Converter(stream=_subset(doc, pages).tobytes())
        try:
            cv.convert(out)
        finally:
            cv.close()
        with open(out, "rb") as f:
            return f.read()


_NUM_RE = re.compile(r"^[-+]?(?:\d{1,3}(?:,\d{3})+|[1-9]\d*|0)(?:\.\d+)?$")


def _cell(value):
    """Turn "1,234.5" into a real number so Excel can do sums with it."""
    if value is None:
        return None
    s = str(value).strip()
    if _NUM_RE.match(s) and len(s.replace(",", "")) <= 15:
        s = s.replace(",", "")
        return float(s) if "." in s else int(s)
    if s[:1] in "=+-@":
        return "'" + s  # never let PDF text become a live formula
    return s


def _text_rows(page) -> list[list[str]]:
    """Fallback when no table is found: rows from text lines, cells by gaps."""
    rows: dict[int, list] = {}
    for x0, y0, x1, y1, word, *_ in page.get_text("words", sort=True):
        key = round((y0 + y1) / 2 / 4)  # words within ~4pt share a row
        rows.setdefault(key, []).append((x0, x1, word, y1 - y0))
    out = []
    for key in sorted(rows):
        cells, prev_x1 = [], None
        for x0, x1, word, h in sorted(rows[key]):
            if prev_x1 is not None and x0 - prev_x1 < max(h * 1.2, 10):
                cells[-1] += " " + word
            else:
                cells.append(word)
            prev_x1 = x1
        out.append(cells)
    return out


def _table_rows(page, table) -> list[list[str | None]]:
    """Read each cell from the words whose centre lies inside it.

    More reliable than ``table.extract()``, which can scramble punctuation
    inside numbers such as "1,250.50".
    """
    words = page.get_text("words", sort=True)
    rows = []
    for row in table.rows:
        cells = []
        for bbox in row.cells:
            if bbox is None:  # part of a merged cell
                cells.append(None)
                continue
            r = pymupdf.Rect(bbox)
            inside = [w for w in words
                      if r.contains(pymupdf.Point((w[0] + w[2]) / 2, (w[1] + w[3]) / 2))]
            lines: dict[tuple, list[str]] = {}
            for w in inside:
                lines.setdefault((w[5], w[6]), []).append(w[4])
            cells.append("\n".join(" ".join(ws) for ws in lines.values()))
        rows.append(cells)
    return rows


def to_xlsx(doc, pages):
    from openpyxl import Workbook
    from openpyxl.styles import Font
    wb = Workbook()
    wb.remove(wb.active)
    for p in pages:
        page = doc[p]
        try:
            tables = page.find_tables().tables
        except Exception:
            tables = []
        if tables:
            for i, t in enumerate(tables, 1):
                name = f"Page {p + 1}" + (f" Table {i}" if len(tables) > 1 else "")
                ws = wb.create_sheet(name[:31])
                for r, row in enumerate(_table_rows(page, t), 1):
                    ws.append([_cell(c) for c in row])
                    if r == 1:
                        for c in ws[1]:
                            c.font = Font(bold=True)
        else:
            ws = wb.create_sheet(f"Page {p + 1}")
            for row in _text_rows(page):
                ws.append([_cell(c) for c in row])
        for col in ws.columns:
            width = max((len(str(c.value)) for c in col if c.value is not None), default=8)
            ws.column_dimensions[col[0].column_letter].width = min(max(width + 2, 8), 60)
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def to_pptx(doc, pages):
    """One slide per page, each page placed as a full-slide picture."""
    from pptx import Presentation
    from pptx.util import Emu
    prs = Presentation()
    first = doc[pages[0]].rect
    emu = 12700  # EMU per PDF point
    prs.slide_width, prs.slide_height = Emu(int(first.width * emu)), Emu(int(first.height * emu))
    blank = prs.slide_layouts[6]
    for p in pages:
        page = doc[p]
        slide = prs.slides.add_slide(blank)
        png = page.get_pixmap(dpi=150).tobytes("png")
        # Fit the page inside the slide, keeping its shape.
        scale = min(prs.slide_width / page.rect.width, prs.slide_height / page.rect.height)
        w, h = int(page.rect.width * scale), int(page.rect.height * scale)
        slide.shapes.add_picture(io.BytesIO(png), (prs.slide_width - w) // 2,
                                 (prs.slide_height - h) // 2, w, h)
    buf = io.BytesIO()
    prs.save(buf)
    return buf.getvalue()


def to_images(doc, pages, fmt="png", dpi=150):
    dpi = min(max(int(dpi), 36), 600)
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_STORED) as z:
        for p in pages:
            pix = doc[p].get_pixmap(dpi=dpi, alpha=False)
            data = pix.tobytes("jpeg", jpg_quality=90) if fmt == "jpg" else pix.tobytes("png")
            z.writestr(f"page-{p + 1:03d}.{fmt}", data)
    return buf.getvalue()


def to_text(doc, pages):
    parts = [doc[p].get_text("text", sort=True).rstrip() for p in pages]
    return ("\n\n\f".join(parts) + "\n").encode("utf-8")


def to_html(doc, pages):
    title = html.escape(doc.metadata.get("title") or "Document")
    body = "\n".join(
        f'<section class="page" id="page-{p + 1}">{doc[p].get_text("html")}</section>'
        for p in pages)
    return (f"<!doctype html><html><head><meta charset='utf-8'><title>{title}</title>"
            "<style>body{background:#eee;margin:0;padding:16px}"
            ".page{background:#fff;margin:0 auto 16px;width:max-content;"
            "box-shadow:0 1px 4px rgba(0,0,0,.2)}</style></head>"
            f"<body>\n{body}\n</body></html>").encode("utf-8")


def to_markdown(doc, pages):
    """Headings guessed from font size; bold/italic kept; tables as pipes."""
    sizes: dict[float, int] = {}
    for p in pages:
        for b in doc[p].get_text("dict")["blocks"]:
            for ln in b.get("lines", []):
                for s in ln["spans"]:
                    sizes[round(s["size"])] = sizes.get(round(s["size"]), 0) + len(s["text"])
    body = max(sizes, key=sizes.get) if sizes else 12
    out = []
    for p in pages:
        page = doc[p]
        for b in page.get_text("dict", sort=True)["blocks"]:
            lines = []
            big = 0
            for ln in b.get("lines", []):
                text = ""
                for s in ln["spans"]:
                    t = s["text"]
                    if not t.strip():
                        text += t
                        continue
                    big = max(big, round(s["size"]))
                    core = t.strip()
                    if s["flags"] & 16 and round(s["size"]) <= body:
                        core = f"**{core}**"
                    elif s["flags"] & 2:
                        core = f"*{core}*"
                    text += t[:len(t) - len(t.lstrip())] + core + t[len(t.rstrip()):]
                if text.strip():
                    lines.append(text.strip())
            if not lines:
                continue
            para = " ".join(lines)
            if big >= body * 1.6:
                para = "# " + para
            elif big >= body * 1.25:
                para = "## " + para
            out.append(para)
        out.append("")
    return ("\n\n".join(x for x in out if x) + "\n").encode("utf-8")


_CONVERTERS = {
    "docx": to_docx, "xlsx": to_xlsx, "pptx": to_pptx, "txt": to_text,
    "html": to_html, "md": to_markdown,
    "png": lambda d, p, **kw: to_images(d, p, "png", **kw),
    "jpg": lambda d, p, **kw: to_images(d, p, "jpg", **kw),
}


def convert(doc: pymupdf.Document, fmt: str, ranges: str | None = None,
            **options) -> tuple[bytes, str, str]:
    """Convert to ``fmt``; returns (data, file extension, mime type)."""
    if fmt not in FORMATS:
        raise EditError(f"unknown format {fmt!r}; choose one of {list(FORMATS)}")
    pages = _flat(parse_ranges(ranges, doc.page_count))
    try:
        data = _CONVERTERS[fmt](doc, pages, **options)
    except EditError:
        raise
    except Exception as exc:
        raise EditError(f"conversion to {fmt} failed: {exc}")
    _, ext, mime = FORMATS[fmt]
    return data, ext, mime
