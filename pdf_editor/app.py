"""Flask web server for PDF Studio.

Run with:  python -m pdf_editor.app   then open http://127.0.0.1:5000
"""

from __future__ import annotations

import base64
import io
import os

import pymupdf
from flask import Flask, abort, jsonify, request, send_file

from . import convert, pdf_ops
from .store import DocumentStore, NotFound

MAX_UPLOAD_MB = 100


def create_app(storage_dir: str | None = None) -> Flask:
    app = Flask(__name__, static_folder="static", static_url_path="/static")
    app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_MB * 1024 * 1024
    store = DocumentStore(storage_dir or os.environ.get(
        "PDF_STUDIO_STORAGE",
        os.path.join(os.path.dirname(__file__), "..", "storage")))
    app.config["STORE"] = store

    # ---------------------------------------------------------- helpers
    def snapshot(doc_id: str) -> dict:
        with store.open(doc_id) as doc:
            info = store.status(doc_id)
            info["pages"] = pdf_ops.page_info(doc)
            info["metadata"] = {k: v for k, v in (doc.metadata or {}).items()
                                if k in ("title", "author", "subject", "keywords")}
        return info

    def uploaded_files() -> list[tuple[bytes, str]]:
        return [(f.read(), f.filename) for f in request.files.getlist("file")
                if f.filename]

    def stem(doc_id: str) -> str:
        name = store.filename(doc_id)
        return name[:-4] if name.lower().endswith(".pdf") else name

    @app.errorhandler(NotFound)
    def _not_found(_):
        return jsonify(error="document not found"), 404

    @app.errorhandler(pdf_ops.EditError)
    def _bad_edit(exc):
        return jsonify(error=str(exc)), 400

    @app.errorhandler(413)
    def _too_big(_):
        return jsonify(error=f"file larger than {MAX_UPLOAD_MB} MB"), 413

    # ---------------------------------------------------------- routes
    @app.get("/")
    def index():
        return app.send_static_file("index.html")

    @app.post("/api/upload")
    def upload():
        """Upload one or more PDFs/images; several files are joined in order."""
        files = uploaded_files()
        if not files:
            return jsonify(error="no file uploaded"), 400
        name = files[0][1]
        try:
            data = files[0][0] if len(files) == 1 and files[0][0][:5] == b"%PDF-" \
                else convert.combine(files)
            if not name.lower().endswith(".pdf"):
                name = os.path.splitext(name)[0] + ".pdf"
            doc_id = store.create(data, name)
        except pdf_ops.EditError:
            raise
        except Exception as exc:  # pymupdf raises various types on bad input
            return jsonify(error=f"could not open PDF: {exc}"), 400
        return jsonify(snapshot(doc_id)), 201

    @app.get("/api/docs/<doc_id>")
    def info(doc_id):
        return jsonify(snapshot(doc_id))

    @app.get("/api/docs/<doc_id>/pages/<int:page>.png")
    def render(doc_id, page):
        zoom = min(max(request.args.get("zoom", 1.5, type=float), 0.1), 6)
        with store.open(doc_id) as doc:
            if not 0 <= page < doc.page_count:
                abort(404)
            pix = doc[page].get_pixmap(matrix=pymupdf.Matrix(zoom, zoom),
                                       annots=True)
            png = pix.tobytes("png")
        resp = send_file(io.BytesIO(png), mimetype="image/png")
        # URL includes ?v=<version>, so the image for a version never changes.
        resp.headers["Cache-Control"] = "private, max-age=3600"
        return resp

    @app.get("/api/docs/<doc_id>/pages/<int:page>/text")
    def text(doc_id, page):
        with store.open(doc_id) as doc:
            return jsonify(pdf_ops.text_spans(doc, page))

    @app.post("/api/docs/<doc_id>/edit")
    def edit(doc_id):
        """Apply one operation or a list of operations atomically."""
        payload = request.get_json(silent=True)
        if payload is None:
            return jsonify(error="expected JSON body"), 400
        ops = payload if isinstance(payload, list) else [payload]
        results = []
        with store.lock(doc_id):
            with store.open(doc_id) as doc:
                for op in ops:
                    op = dict(op)
                    if "data" in op and isinstance(op["data"], str):
                        # Binary payloads (images, PDFs) arrive as base64/data-URLs.
                        raw = op["data"].split(",", 1)[-1]
                        op["data"] = base64.b64decode(raw)
                    results.append(pdf_ops.apply(doc, op))
                store.commit(doc_id, doc)
        out = snapshot(doc_id)
        out["results"] = results
        return jsonify(out)

    @app.post("/api/docs/<doc_id>/merge")
    def merge(doc_id):
        """Insert one or more PDFs/images after page ``at`` (-1 = end)."""
        files = uploaded_files()
        if not files:
            return jsonify(error="no file uploaded"), 400
        at = request.form.get("at", -1, type=int)
        with store.lock(doc_id), store.open(doc_id) as doc:
            pdf_ops.merge(doc, convert.combine(files), at)
            store.commit(doc_id, doc)
        return jsonify(snapshot(doc_id))

    @app.get("/api/formats")
    def formats():
        return jsonify([{"id": k, "name": v[0]} for k, v in convert.FORMATS.items()])

    @app.get("/api/docs/<doc_id>/export")
    def export(doc_id):
        """Convert the current version (or ?pages=1-3,5) to another format."""
        fmt = request.args.get("format", "")
        options = {}
        if fmt in ("png", "jpg") and request.args.get("dpi"):
            options["dpi"] = request.args.get("dpi", 150, type=int) or 150
        with store.open(doc_id) as doc:
            data, ext, mime = convert.convert(
                doc, fmt, request.args.get("pages"), **options)
        return send_file(io.BytesIO(data), mimetype=mime, as_attachment=True,
                         download_name=f"{stem(doc_id)}.{ext}")

    @app.get("/api/docs/<doc_id>/split")
    def split(doc_id):
        """mode=extract -> one PDF of ?pages; mode=ranges -> zip with one PDF
        per comma-separated range; mode=every -> zip, ?every=N pages each."""
        mode = request.args.get("mode", "extract")
        pages = request.args.get("pages")
        name = stem(doc_id)
        with store.open(doc_id) as doc:
            if mode == "extract":
                data = convert.extract(doc, pages)
                return send_file(io.BytesIO(data), mimetype="application/pdf",
                                 as_attachment=True, download_name=f"{name}-extract.pdf")
            if mode == "ranges":
                data = convert.split(doc, name, ranges=pages)
            elif mode == "every":
                data = convert.split(doc, name,
                                     every=request.args.get("every", 1, type=int) or 1)
            else:
                raise pdf_ops.EditError(f"unknown split mode {mode!r}")
        return send_file(io.BytesIO(data), mimetype="application/zip",
                         as_attachment=True, download_name=f"{name}-split.zip")

    @app.post("/api/docs/<doc_id>/undo")
    def undo(doc_id):
        with store.lock(doc_id):
            store.undo(doc_id)
        return jsonify(snapshot(doc_id))

    @app.post("/api/docs/<doc_id>/redo")
    def redo(doc_id):
        with store.lock(doc_id):
            store.redo(doc_id)
        return jsonify(snapshot(doc_id))

    @app.get("/api/docs/<doc_id>/download")
    def download(doc_id):
        return send_file(store.path(doc_id), mimetype="application/pdf",
                         as_attachment=True,
                         download_name=f"{stem(doc_id)}-edited.pdf")

    @app.get("/api/fonts")
    def fonts():
        # A list (not a dict) so the UI keeps our order; jsonify sorts keys.
        return jsonify([{"id": k, "name": v} for k, v in pdf_ops.FONTS.items()])

    return app


def main():
    import argparse
    p = argparse.ArgumentParser(description="PDF Studio web editor")
    p.add_argument("--host", default="127.0.0.1")
    p.add_argument("--port", type=int, default=5000)
    p.add_argument("--storage", default=None, help="where documents are kept")
    a = p.parse_args()
    create_app(a.storage).run(host=a.host, port=a.port, debug=False)


if __name__ == "__main__":
    main()
