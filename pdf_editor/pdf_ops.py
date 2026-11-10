"""Pure PDF editing operations built on PyMuPDF.

Every function takes an open ``pymupdf.Document`` and mutates it in place.
All coordinates coming from the UI are in *displayed* page space (PDF points,
origin top-left, after the page's /Rotate is applied). PyMuPDF's drawing and
annotation APIs work in *unrotated* space, so we convert at the boundary.
"""

from __future__ import annotations

import hashlib
import re

import pymupdf

# Base-14 fonts available without embedding anything.
FONTS = {
    "helv": "Helvetica",
    "hebo": "Helvetica Bold",
    "heit": "Helvetica Oblique",
    "tiro": "Times Roman",
    "tibo": "Times Bold",
    "tiit": "Times Italic",
    "cour": "Courier",
    "cobo": "Courier Bold",
}


_XREF_RE = re.compile(r"\d+ \d+ R")


class EditError(ValueError):
    """Raised for invalid edit requests (bad page, bad rect, unknown op...)."""


# ---------------------------------------------------------------- helpers

def _page(doc: pymupdf.Document, index) -> pymupdf.Page:
    try:
        index = int(index)
    except (TypeError, ValueError):
        raise EditError(f"invalid page index: {index!r}")
    if not 0 <= index < doc.page_count:
        raise EditError(f"page {index} out of range (0..{doc.page_count - 1})")
    return doc[index]


def _color(value, default=(0, 0, 0)):
    """Accept '#rrggbb', [r,g,b] (0-1) or None -> tuple of floats or None."""
    if value is None or value == "":
        return default
    if value == "none":
        return None
    if isinstance(value, str):
        v = value.lstrip("#")
        if len(v) == 3:
            v = "".join(c * 2 for c in v)
        if len(v) != 6:
            raise EditError(f"invalid colour: {value!r}")
        return tuple(int(v[i:i + 2], 16) / 255 for i in (0, 2, 4))
    return tuple(float(c) for c in value)


def _to_hex(srgb: int) -> str:
    return f"#{srgb:06x}"


def _rect(page: pymupdf.Page, r) -> pymupdf.Rect:
    """Displayed-space rect [x0,y0,x1,y1] -> normalised unrotated rect."""
    try:
        rect = pymupdf.Rect(*map(float, r))
    except Exception:
        raise EditError(f"invalid rect: {r!r}")
    rect = (rect * page.derotation_matrix).normalize()
    if rect.is_empty:
        raise EditError("rectangle has no area")
    return rect


def _point(page: pymupdf.Page, p) -> pymupdf.Point:
    try:
        return pymupdf.Point(float(p[0]), float(p[1])) * page.derotation_matrix
    except Exception:
        raise EditError(f"invalid point: {p!r}")


def _font(name: str | None) -> str:
    name = name or "helv"
    if name not in FONTS:
        raise EditError(f"unknown font {name!r}; choose one of {list(FONTS)}")
    return name


def guess_font(pdf_font_name: str, flags: int) -> str:
    """Map an embedded font name to the closest base-14 font."""
    n = pdf_font_name.lower()
    bold = "bold" in n or "black" in n or "heavy" in n or bool(flags & 16)
    italic = "italic" in n or "oblique" in n or bool(flags & 2)
    if "courier" in n or "mono" in n or bool(flags & 8):
        return "cobo" if bold else "cour"
    if "times" in n or ("serif" in n and "sans" not in n) or bool(flags & 4):
        return "tibo" if bold else ("tiit" if italic else "tiro")
    return "hebo" if bold else ("heit" if italic else "helv")


# ---------------------------------------------------------------- reading

def page_fingerprint(page: pymupdf.Page) -> str:
    """Cheap hash of what a page looks like, used as a render cache key."""
    # Deliberately avoids xref numbers: saving with garbage collection
    # renumbers objects, which would needlessly invalidate every page.
    h = hashlib.blake2b(digest_size=8)
    h.update(repr((page.rotation, tuple(page.mediabox), tuple(page.cropbox))).encode())
    h.update(page.read_contents())
    for name in ("XObject", "Font", "ExtGState"):
        h.update(name.encode())
        value = page.parent.xref_get_key(page.xref, f"Resources/{name}")[1]
        h.update(_XREF_RE.sub("R", value).encode())  # keep names, drop numbers
    for annot in page.annots() or []:
        h.update(repr((annot.type, tuple(annot.rect), annot.colors, annot.info.get("content"),
                       annot.opacity, annot.border)).encode())
    h.update(repr([(img[7], img[2], img[3]) for img in page.get_images()]).encode())
    return h.hexdigest()


def page_info(doc: pymupdf.Document) -> list[dict]:
    return [
        {"width": round(p.rect.width, 2), "height": round(p.rect.height, 2),
         "rotation": p.rotation, "fp": page_fingerprint(p)}
        for p in doc
    ]


def text_spans(doc: pymupdf.Document, index: int) -> list[dict]:
    """Return every text span on a page with its displayed-space bbox."""
    page = _page(doc, index)
    mat = page.rotation_matrix
    spans = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            for s in line["spans"]:
                if not s["text"].strip():
                    continue
                bbox = (pymupdf.Rect(s["bbox"]) * mat).normalize()
                origin = pymupdf.Point(s["origin"]) * mat
                spans.append({
                    "text": s["text"],
                    "bbox": [round(v, 2) for v in bbox],
                    "origin": [round(origin.x, 2), round(origin.y, 2)],
                    "size": round(s["size"], 2),
                    "font": s["font"],
                    "base_font": guess_font(s["font"], s["flags"]),
                    "color": _to_hex(s["color"]),
                    "dir": line["dir"],
                })
    return spans


# ---------------------------------------------------------------- text

def add_text(doc, page, at, text, size=12, color="#000000", font="helv"):
    """Insert (possibly multi-line) text with its first baseline at ``at``."""
    pg = _page(doc, page)
    if not text:
        raise EditError("text is empty")
    pg.insert_text(_point(pg, at), str(text), fontsize=float(size),
                   fontname=_font(font), color=_color(color),
                   rotate=pg.rotation)


def replace_text(doc, page, rect, text, origin=None, size=12,
                 color="#000000", font="helv"):
    """Truly remove the text inside ``rect`` and write ``text`` in its place.

    Uses a redaction with no fill so the background, images and vector
    graphics underneath are preserved; only glyphs are removed.
    """
    pg = _page(doc, page)
    r = _rect(pg, rect)
    # Shrink slightly so neighbouring glyphs that merely touch the box survive.
    pg.add_redact_annot(r + (0.5, 0.5, -0.5, -0.5), fill=False)
    pg.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE,
                        graphics=pymupdf.PDF_REDACT_LINE_ART_NONE)
    if text:
        if origin is None:
            disp = pymupdf.Rect(*map(float, rect))
            origin = [disp.x0, disp.y1 - float(size) * 0.22]
        add_text(doc, page, origin, text, size=size, color=color, font=font)


def find_replace(doc, find, replace, match_case=True):
    """Replace every occurrence of ``find`` across the document.

    Returns the number of replacements made.
    """
    if not find:
        raise EditError("search text is empty")
    count = 0
    for pg in doc:
        hits = []
        for s in text_spans(doc, pg.number):
            hay, needle = (s["text"], find) if match_case else \
                (s["text"].lower(), find.lower())
            if needle in hay:
                hits.append(s)
        for s in hits:
            new = s["text"].replace(find, replace) if match_case else \
                _ireplace(s["text"], find, replace)
            count += (s["text"] if match_case else s["text"].lower()).count(
                find if match_case else find.lower())
            replace_text(doc, pg.number, s["bbox"], new, origin=s["origin"],
                         size=s["size"], color=s["color"], font=s["base_font"])
    return count


def _ireplace(text, old, new):
    out, i, lo, lt = [], 0, old.lower(), text.lower()
    while True:
        j = lt.find(lo, i)
        if j < 0:
            out.append(text[i:])
            return "".join(out)
        out.append(text[i:j] + new)
        i = j + len(old)


# ---------------------------------------------------------------- shapes

def whiteout(doc, page, rect, color="#ffffff"):
    """Paint an opaque box (visually hides content but does not remove it)."""
    pg = _page(doc, page)
    pg.draw_rect(_rect(pg, rect), color=None, fill=_color(color), overlay=True)


def redact(doc, page, rect, color="#000000"):
    """Permanently remove all text/images/graphics in ``rect``."""
    pg = _page(doc, page)
    pg.add_redact_annot(_rect(pg, rect), fill=_color(color))
    pg.apply_redactions()


def rectangle(doc, page, rect, stroke="#ff0000", fill="none", width=2):
    pg = _page(doc, page)
    pg.draw_rect(_rect(pg, rect), color=_color(stroke, None),
                 fill=_color(fill, None), width=float(width))


def ellipse(doc, page, rect, stroke="#ff0000", fill="none", width=2):
    pg = _page(doc, page)
    pg.draw_oval(_rect(pg, rect), color=_color(stroke, None),
                 fill=_color(fill, None), width=float(width))


def line(doc, page, start, end, stroke="#ff0000", width=2):
    pg = _page(doc, page)
    pg.draw_line(_point(pg, start), _point(pg, end),
                 color=_color(stroke), width=float(width))


def ink(doc, page, paths, stroke="#0000ff", width=2):
    """Freehand drawing; ``paths`` is a list of lists of [x, y] points."""
    pg = _page(doc, page)
    shape = pg.new_shape()
    drew = False
    for path in paths:
        pts = [_point(pg, p) for p in path]
        if len(pts) >= 2:
            shape.draw_polyline(pts)
            drew = True
    if not drew:
        raise EditError("drawing needs at least two points")
    shape.finish(color=_color(stroke), width=float(width), closePath=False,
                 lineCap=1, lineJoin=1)
    shape.commit()


# ---------------------------------------------------------------- annotations

def highlight(doc, page, rect, color="#ffff00"):
    pg = _page(doc, page)
    r = _rect(pg, rect)
    annot = pg.add_highlight_annot(r)
    annot.set_colors(stroke=_color(color))
    annot.update()


def note(doc, page, at, text, color="#ffd400"):
    pg = _page(doc, page)
    annot = pg.add_text_annot(_point(pg, at), str(text))
    annot.set_colors(stroke=_color(color))
    annot.update()


def image(doc, page, rect, data: bytes, keep_proportion=True):
    pg = _page(doc, page)
    if not data:
        raise EditError("image is empty")
    try:
        pg.insert_image(_rect(pg, rect), stream=data,
                        keep_proportion=keep_proportion,
                        rotate=pg.rotation)
    except (RuntimeError, ValueError) as exc:
        raise EditError(f"could not read image: {exc}")


def delete_annotations(doc, page, rect=None):
    """Delete annotations (highlights, notes...) on a page, optionally in rect."""
    pg = _page(doc, page)
    area = _rect(pg, rect) if rect else None
    n = 0
    for annot in list(pg.annots() or []):
        if annot.type[0] == pymupdf.PDF_ANNOT_REDACT:
            continue
        if area is None or annot.rect.intersects(area):
            pg.delete_annot(annot)
            n += 1
    return n


# ---------------------------------------------------------------- pages

def rotate_page(doc, page, angle=90):
    pg = _page(doc, page)
    if int(angle) % 90:
        raise EditError("rotation must be a multiple of 90")
    pg.set_rotation((pg.rotation + int(angle)) % 360)


def delete_page(doc, page):
    _page(doc, page)
    if doc.page_count == 1:
        raise EditError("cannot delete the only page")
    doc.delete_page(int(page))


def move_page(doc, page, to):
    _page(doc, page)
    to = int(to)
    if not 0 <= to < doc.page_count:
        raise EditError(f"target {to} out of range")
    if to == int(page):
        return
    # pymupdf.move_page inserts *before* `to`; -1 means append.
    target = to + 1 if to > int(page) else to
    doc.move_page(int(page), -1 if target >= doc.page_count else target)


def duplicate_page(doc, page):
    _page(doc, page)
    doc.fullcopy_page(int(page), int(page) + 1 if int(page) + 1 < doc.page_count else -1)


def insert_blank(doc, after=-1, width=None, height=None):
    after = int(after)
    if after >= 0:
        ref = _page(doc, after)
        width = width or ref.rect.width
        height = height or ref.rect.height
    doc.new_page(pno=after + 1 if after >= 0 else -1,
                 width=float(width or 595), height=float(height or 842))


def merge(doc, data: bytes, at=-1):
    """Insert all pages of another PDF (bytes) after page ``at`` (-1 = end)."""
    try:
        other = pymupdf.open(stream=data, filetype="pdf")
    except Exception as exc:
        raise EditError(f"not a valid PDF: {exc}")
    at = int(at)
    doc.insert_pdf(other, start_at=at + 1 if at >= 0 else -1)
    other.close()


def set_metadata(doc, **fields):
    allowed = {"title", "author", "subject", "keywords", "creator", "producer"}
    meta = dict(doc.metadata or {})
    for k, v in fields.items():
        if k not in allowed:
            raise EditError(f"unknown metadata field {k!r}")
        meta[k] = str(v)
    doc.set_metadata(meta)


# ---------------------------------------------------------------- dispatch

OPERATIONS = {
    "add_text": add_text,
    "replace_text": replace_text,
    "find_replace": find_replace,
    "whiteout": whiteout,
    "redact": redact,
    "rectangle": rectangle,
    "ellipse": ellipse,
    "line": line,
    "ink": ink,
    "highlight": highlight,
    "note": note,
    "image": image,
    "delete_annotations": delete_annotations,
    "rotate_page": rotate_page,
    "delete_page": delete_page,
    "move_page": move_page,
    "duplicate_page": duplicate_page,
    "insert_blank": insert_blank,
    "merge": merge,
    "set_metadata": set_metadata,
}


def apply(doc, op: dict):
    """Apply one ``{"op": name, ...args}`` request to ``doc``."""
    op = dict(op)
    name = op.pop("op", None)
    fn = OPERATIONS.get(name)
    if fn is None:
        raise EditError(f"unknown operation {name!r}")
    try:
        return fn(doc, **op)
    except TypeError as exc:
        raise EditError(f"bad arguments for {name}: {exc}")
