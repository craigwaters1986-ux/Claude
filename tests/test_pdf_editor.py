import io

import pymupdf
import pytest

from pdf_editor import pdf_ops
from pdf_editor.app import create_app

PNG_1PX = pymupdf.Pixmap(pymupdf.csRGB, pymupdf.IRect(0, 0, 4, 4), False).tobytes("png")


def make_pdf(pages=2, text="Hello world") -> bytes:
    doc = pymupdf.open()
    for i in range(pages):
        p = doc.new_page(width=300, height=400)
        p.insert_text((50, 100), f"{text} {i + 1}", fontsize=14)
    return doc.tobytes()


def text_of(doc, i=0):
    return doc[i].get_text()


# ------------------------------------------------------------------ pdf_ops

@pytest.fixture
def doc():
    d = pymupdf.open(stream=make_pdf(), filetype="pdf")
    yield d
    d.close()


def test_text_spans(doc):
    spans = pdf_ops.text_spans(doc, 0)
    assert spans[0]["text"] == "Hello world 1"
    assert spans[0]["size"] == 14
    assert spans[0]["base_font"] == "helv"


def test_replace_text_removes_old_glyphs(doc):
    s = pdf_ops.text_spans(doc, 0)[0]
    pdf_ops.replace_text(doc, 0, s["bbox"], "Goodbye", origin=s["origin"], size=s["size"])
    t = text_of(doc)
    assert "Goodbye" in t and "Hello" not in t


def test_replace_text_with_empty_deletes(doc):
    s = pdf_ops.text_spans(doc, 0)[0]
    pdf_ops.replace_text(doc, 0, s["bbox"], "")
    assert text_of(doc).strip() == ""


def test_find_replace_all_pages(doc):
    n = pdf_ops.find_replace(doc, "world", "there")
    assert n == 2
    assert "Hello there 1" in text_of(doc, 0)
    assert "Hello there 2" in text_of(doc, 1)


def test_find_replace_case_insensitive(doc):
    assert pdf_ops.find_replace(doc, "HELLO", "Hi", match_case=False) == 2
    assert "Hi world 1" in text_of(doc)


def test_add_text_multiline(doc):
    pdf_ops.add_text(doc, 0, [20, 200], "line one\nline two", size=10, color="#ff0000")
    t = text_of(doc)
    assert "line one" in t and "line two" in t


def test_redact_removes_text(doc):
    pdf_ops.redact(doc, 0, [0, 0, 300, 400])
    assert text_of(doc).strip() == ""


def test_shapes_and_annotations(doc):
    pdf_ops.rectangle(doc, 0, [10, 10, 60, 60], fill="#00ff00")
    pdf_ops.ellipse(doc, 0, [70, 10, 120, 60])
    pdf_ops.line(doc, 0, [0, 0], [100, 100])
    pdf_ops.ink(doc, 0, [[[0, 0], [10, 10], [20, 5]]])
    pdf_ops.whiteout(doc, 0, [0, 300, 300, 400])
    pdf_ops.highlight(doc, 0, [50, 85, 150, 105])
    pdf_ops.note(doc, 0, [200, 200], "check this")
    pdf_ops.image(doc, 0, [200, 300, 250, 350], PNG_1PX)
    assert len(doc[0].get_drawings()) >= 5
    assert len(list(doc[0].annots())) == 2
    assert len(doc[0].get_images()) == 1
    assert pdf_ops.delete_annotations(doc, 0) == 2


def test_page_operations(doc):
    pdf_ops.insert_blank(doc, after=0)
    assert doc.page_count == 3 and text_of(doc, 1).strip() == ""
    pdf_ops.duplicate_page(doc, 0)
    assert doc.page_count == 4 and "Hello world 1" in text_of(doc, 1)
    pdf_ops.move_page(doc, 3, 0)
    assert "Hello world 2" in text_of(doc, 0)
    pdf_ops.move_page(doc, 0, 3)
    assert "Hello world 2" in text_of(doc, 3)
    pdf_ops.rotate_page(doc, 0, 90)
    assert doc[0].rotation == 90
    pdf_ops.delete_page(doc, 0)
    assert doc.page_count == 3
    pdf_ops.merge(doc, make_pdf(1, "Other"))
    assert doc.page_count == 4 and "Other 1" in text_of(doc, 3)


def test_rotated_page_coordinates_are_display_space(doc):
    pdf_ops.rotate_page(doc, 0, 90)
    span = pdf_ops.text_spans(doc, 0)[0]
    w, h = doc[0].rect.width, doc[0].rect.height
    assert (w, h) == (400, 300)
    x0, y0, x1, y1 = span["bbox"]
    assert 0 <= x0 < x1 <= w and 0 <= y0 < y1 <= h
    # Replacing via displayed coordinates must hit the right glyphs.
    pdf_ops.replace_text(doc, 0, span["bbox"], "Rotated", origin=span["origin"], size=14)
    assert "Rotated" in text_of(doc) and "Hello" not in text_of(doc)


def test_errors(doc):
    with pytest.raises(pdf_ops.EditError):
        pdf_ops.apply(doc, {"op": "nope"})
    with pytest.raises(pdf_ops.EditError):
        pdf_ops.apply(doc, {"op": "rotate_page", "page": 9})
    with pytest.raises(pdf_ops.EditError):
        pdf_ops.apply(doc, {"op": "whiteout", "page": 0, "rect": [1, 1, 1, 1]})
    with pytest.raises(pdf_ops.EditError):
        pdf_ops.apply(doc, {"op": "add_text", "page": 0, "at": [1, 1], "text": "x", "font": "comic"})
    pdf_ops.delete_page(doc, 1)
    with pytest.raises(pdf_ops.EditError):
        pdf_ops.delete_page(doc, 0)


def test_metadata(doc):
    pdf_ops.set_metadata(doc, title="T", author="A")
    assert doc.metadata["title"] == "T" and doc.metadata["author"] == "A"


# ------------------------------------------------------------------ HTTP API

@pytest.fixture
def client(tmp_path):
    app = create_app(str(tmp_path))
    app.testing = True
    return app.test_client()


def upload(client, data=None, name="test.pdf"):
    r = client.post("/api/upload", data={"file": (io.BytesIO(data or make_pdf()), name)},
                    content_type="multipart/form-data")
    assert r.status_code == 201, r.json
    return r.json


def test_upload_render_edit_undo_redo_download(client):
    snap = upload(client)
    doc_id = snap["id"]
    assert len(snap["pages"]) == 2 and not snap["can_undo"]

    r = client.get(f"/api/docs/{doc_id}/pages/0.png?zoom=1")
    assert r.status_code == 200 and r.data[:4] == b"\x89PNG"

    spans = client.get(f"/api/docs/{doc_id}/pages/0/text").json
    fp_before = snap["pages"][0]["fp"]
    r = client.post(f"/api/docs/{doc_id}/edit", json={
        "op": "replace_text", "page": 0, "rect": spans[0]["bbox"],
        "origin": spans[0]["origin"], "text": "Edited", "size": 14})
    assert r.status_code == 200 and r.json["can_undo"]
    assert r.json["pages"][0]["fp"] != fp_before
    assert r.json["pages"][1]["fp"] == snap["pages"][1]["fp"]  # untouched page keeps cache key

    # batch: image as data URL + rotate
    import base64
    data_url = "data:image/png;base64," + base64.b64encode(PNG_1PX).decode()
    r = client.post(f"/api/docs/{doc_id}/edit", json=[
        {"op": "image", "page": 1, "rect": [10, 10, 50, 50], "data": data_url},
        {"op": "rotate_page", "page": 1}])
    assert r.status_code == 200 and r.json["pages"][1]["rotation"] == 90

    assert client.post(f"/api/docs/{doc_id}/undo").json["pages"][1]["rotation"] == 0
    assert client.post(f"/api/docs/{doc_id}/undo").json["can_undo"] is False
    assert client.post(f"/api/docs/{doc_id}/redo").json["can_redo"] is True

    r = client.get(f"/api/docs/{doc_id}/download")
    assert r.status_code == 200
    out = pymupdf.open(stream=r.data, filetype="pdf")
    assert "Edited" in out[0].get_text()
    assert "test-edited.pdf" in r.headers["Content-Disposition"]


def test_new_edit_discards_redo(client):
    doc_id = upload(client)["id"]
    client.post(f"/api/docs/{doc_id}/edit", json={"op": "rotate_page", "page": 0})
    client.post(f"/api/docs/{doc_id}/undo")
    r = client.post(f"/api/docs/{doc_id}/edit", json={"op": "insert_blank"})
    assert r.json["can_redo"] is False and len(r.json["pages"]) == 3


def test_failed_batch_is_atomic(client):
    doc_id = upload(client)["id"]
    r = client.post(f"/api/docs/{doc_id}/edit", json=[
        {"op": "rotate_page", "page": 0}, {"op": "rotate_page", "page": 99}])
    assert r.status_code == 400
    assert client.get(f"/api/docs/{doc_id}").json["pages"][0]["rotation"] == 0


def test_merge_endpoint(client):
    doc_id = upload(client)["id"]
    r = client.post(f"/api/docs/{doc_id}/merge",
                    data={"file": (io.BytesIO(make_pdf(3)), "b.pdf"), "at": "0"},
                    content_type="multipart/form-data")
    assert r.status_code == 200 and len(r.json["pages"]) == 5


def test_bad_inputs(client):
    r = client.post("/api/upload", data={"file": (io.BytesIO(b"not a pdf"), "x.pdf")},
                    content_type="multipart/form-data")
    assert r.status_code == 400
    assert client.get("/api/docs/../../etc/passwd").status_code == 404
    assert client.get("/api/docs/" + "0" * 32).status_code == 404
    doc_id = upload(client)["id"]
    assert client.post(f"/api/docs/{doc_id}/edit", data="x").status_code == 400


def test_index_served(client):
    r = client.get("/")
    assert r.status_code == 200 and b"PDF Studio" in r.data
    assert client.get("/api/fonts").json[0]["id"] == "helv"
