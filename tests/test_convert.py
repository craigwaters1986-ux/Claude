import io
import zipfile

import pymupdf
import pytest

from pdf_editor import convert
from pdf_editor.app import create_app
from pdf_editor.pdf_ops import EditError


def make_pdf(pages=5) -> bytes:
    doc = pymupdf.open()
    for i in range(pages):
        p = doc.new_page(width=300, height=400)
        p.insert_text((50, 60), f"Heading {i + 1}", fontsize=24)
        p.insert_text((50, 100), f"Body text on page {i + 1}", fontsize=11)
    return doc.tobytes()


def make_table_pdf() -> bytes:
    doc = pymupdf.open()
    p = doc.new_page(width=400, height=300)
    rows = [["Item", "Qty", "Price"], ["Apples", "3", "1,250.50"], ["Pears", "10", "=2+2"]]
    x, y, w, h = 40, 40, 100, 24
    for r, row in enumerate(rows):
        for c, val in enumerate(row):
            cell = pymupdf.Rect(x + c * w, y + r * h, x + (c + 1) * w, y + (r + 1) * h)
            p.draw_rect(cell, color=(0, 0, 0), width=0.7)
            p.insert_text((cell.x0 + 5, cell.y1 - 8), val, fontsize=10)
    return doc.tobytes()


def png_bytes(color=(255, 0, 0)) -> bytes:
    pix = pymupdf.Pixmap(pymupdf.csRGB, pymupdf.IRect(0, 0, 60, 40), False)
    pix.set_rect(pix.irect, color)
    return pix.tobytes("png")


@pytest.fixture
def doc():
    d = pymupdf.open(stream=make_pdf(), filetype="pdf")
    yield d
    d.close()


def pdf_texts(data):
    with pymupdf.open(stream=data, filetype="pdf") as d:
        return [p.get_text() for p in d]


# ------------------------------------------------------------------ ranges

def test_parse_ranges():
    assert convert.parse_ranges("", 4) == [[0, 1, 2, 3]]
    assert convert.parse_ranges("1-2, 4", 4) == [[0, 1], [3]]
    assert convert.parse_ranges("3-", 4) == [[2, 3]]
    assert convert.parse_ranges("-2", 4) == [[0, 1]]
    assert convert.parse_ranges("3-1", 4) == [[2, 1, 0]]
    for bad in ("0", "5", "a-b", "1-9", "1;2"):
        with pytest.raises(EditError):
            convert.parse_ranges(bad, 4)


# ------------------------------------------------------------------ split / combine

def test_extract(doc):
    texts = pdf_texts(convert.extract(doc, "4, 1-2"))
    assert len(texts) == 3
    assert "Heading 4" in texts[0] and "Heading 1" in texts[1] and "Heading 2" in texts[2]


def test_split_by_ranges(doc):
    z = zipfile.ZipFile(io.BytesIO(convert.split(doc, "doc", ranges="1-2, 3, 3")))
    assert z.namelist() == ["doc-pages-1-2.pdf", "doc-page-3.pdf", "doc-page-3-2.pdf"]
    assert len(pdf_texts(z.read("doc-pages-1-2.pdf"))) == 2


def test_split_every(doc):
    z = zipfile.ZipFile(io.BytesIO(convert.split(doc, "doc", every=2)))
    assert z.namelist() == ["doc-pages-1-2.pdf", "doc-pages-3-4.pdf", "doc-page-5.pdf"]
    assert len(zipfile.ZipFile(io.BytesIO(convert.split(doc, "d", every=1))).namelist()) == 5
    with pytest.raises(EditError):
        convert.split(doc, "doc", every=-1)


def test_combine_pdfs_and_images():
    data = convert.combine([(make_pdf(2), "a.pdf"), (png_bytes(), "pic.png"), (make_pdf(1), "b.pdf")])
    with pymupdf.open(stream=data, filetype="pdf") as d:
        assert d.page_count == 4
        assert d[2].get_images() and d[2].rect.width / d[2].rect.height == 1.5
    with pytest.raises(EditError):
        convert.combine([(b"hello", "notes.exe")])
    with pytest.raises(EditError):
        convert.combine([])


# ------------------------------------------------------------------ converters

def test_to_docx(doc):
    from docx import Document
    data, ext, _ = convert.convert(doc, "docx", "1-2")
    assert ext == "docx"
    text = "\n".join(p.text for p in Document(io.BytesIO(data)).paragraphs)
    assert "Heading 1" in text and "Body text on page 2" in text and "Heading 3" not in text


def test_to_xlsx_tables_become_typed_cells():
    from openpyxl import load_workbook
    with pymupdf.open(stream=make_table_pdf(), filetype="pdf") as d:
        data, ext, _ = convert.convert(d, "xlsx")
    ws = load_workbook(io.BytesIO(data)).worksheets[0]
    rows = [[c.value for c in r] for r in ws.iter_rows()]
    assert rows[0] == ["Item", "Qty", "Price"]
    assert rows[1] == ["Apples", 3, 1250.5]          # numbers are numbers
    assert rows[2] == ["Pears", 10, "'=2+2"]         # formulas are defused
    assert ws.cell(3, 3).data_type == "s"


def test_to_xlsx_without_tables_falls_back_to_text(doc):
    from openpyxl import load_workbook
    data, _, _ = convert.convert(doc, "xlsx", "1")
    wb = load_workbook(io.BytesIO(data))
    assert wb.sheetnames == ["Page 1"]
    assert wb["Page 1"]["A1"].value == "Heading 1"


def test_to_pptx(doc):
    from pptx import Presentation
    data, _, _ = convert.convert(doc, "pptx", "1-3")
    prs = Presentation(io.BytesIO(data))
    assert len(prs.slides) == 3
    assert round(prs.slide_width / prs.slide_height, 2) == 0.75


@pytest.mark.parametrize("fmt,magic", [("png", b"\x89PNG"), ("jpg", b"\xff\xd8")])
def test_to_images(doc, fmt, magic):
    data, ext, _ = convert.convert(doc, fmt, "2-3", dpi=72)
    z = zipfile.ZipFile(io.BytesIO(data))
    assert ext == "zip" and z.namelist() == [f"page-002.{fmt}", f"page-003.{fmt}"]
    assert z.read(z.namelist()[0])[:len(magic)] == magic


def test_to_text_html_markdown(doc):
    txt = convert.convert(doc, "txt")[0].decode()
    assert "Heading 1" in txt and "Body text on page 5" in txt
    page = convert.convert(doc, "html", "1")[0].decode()
    assert page.startswith("<!doctype html>") and "Heading 1" in page
    md = convert.convert(doc, "md", "1")[0].decode()
    assert "# Heading 1" in md and "Body text on page 1" in md


def test_unknown_format(doc):
    with pytest.raises(EditError):
        convert.convert(doc, "exe")


# ------------------------------------------------------------------ HTTP API

@pytest.fixture
def client(tmp_path):
    app = create_app(str(tmp_path))
    app.testing = True
    return app.test_client()


def post_files(client, url, files, **extra):
    data = {"file": [(io.BytesIO(d), n) for d, n in files], **extra}
    return client.post(url, data=data, content_type="multipart/form-data")


def test_upload_several_files_joins_them(client):
    r = post_files(client, "/api/upload", [(make_pdf(2), "a.pdf"), (png_bytes(), "p.png")])
    assert r.status_code == 201 and len(r.json["pages"]) == 3


def test_upload_single_image_becomes_pdf(client):
    r = post_files(client, "/api/upload", [(png_bytes(), "photo.png")])
    assert r.status_code == 201 and r.json["filename"] == "photo.pdf"


def test_upload_rejects_other_types(client):
    r = post_files(client, "/api/upload", [(b"MZ...", "virus.exe")])
    assert r.status_code == 400 and "unsupported" in r.json["error"]


def test_merge_several(client):
    doc_id = post_files(client, "/api/upload", [(make_pdf(1), "a.pdf")]).json["id"]
    r = post_files(client, f"/api/docs/{doc_id}/merge",
                   [(make_pdf(2), "b.pdf"), (png_bytes(), "c.png")], at="-1")
    assert r.status_code == 200 and len(r.json["pages"]) == 4 and r.json["can_undo"]


def test_export_and_split_endpoints(client):
    doc_id = post_files(client, "/api/upload", [(make_pdf(4), "report.pdf")]).json["id"]

    assert {f["id"] for f in client.get("/api/formats").json} >= {"docx", "xlsx", "pptx"}

    r = client.get(f"/api/docs/{doc_id}/export?format=txt&pages=2")
    assert r.status_code == 200 and b"Heading 2" in r.data and b"Heading 1" not in r.data
    assert "report.txt" in r.headers["Content-Disposition"]

    r = client.get(f"/api/docs/{doc_id}/export?format=docx")
    assert r.status_code == 200 and r.data[:2] == b"PK"

    r = client.get(f"/api/docs/{doc_id}/export?format=nope")
    assert r.status_code == 400

    r = client.get(f"/api/docs/{doc_id}/split?mode=extract&pages=2-3")
    assert r.status_code == 200 and len(pdf_texts(r.data)) == 2

    r = client.get(f"/api/docs/{doc_id}/split?mode=every&every=3")
    assert zipfile.ZipFile(io.BytesIO(r.data)).namelist() == [
        "report-pages-1-3.pdf", "report-page-4.pdf"]

    r = client.get(f"/api/docs/{doc_id}/split?mode=ranges&pages=1,9")
    assert r.status_code == 400 and "outside" in r.json["error"]

    # Exports use the current (edited) version.
    client.post(f"/api/docs/{doc_id}/edit", json={"op": "delete_page", "page": 0})
    r = client.get(f"/api/docs/{doc_id}/export?format=txt")
    assert b"Heading 1" not in r.data and b"Heading 2" in r.data
