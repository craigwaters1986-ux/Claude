"""Flask web server for PDF Studio.

Run with:  python -m pdf_editor.app   then open http://127.0.0.1:5000
"""

from __future__ import annotations

import base64
import io
import os

import pymupdf
from flask import Flask, abort, jsonify, request, send_file

from . import pdf_ops
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
        f = request.files.get("file")
        if f is None or not f.filename:
            return jsonify(error="no file uploaded"), 400
        try:
            doc_id = store.create(f.read(), f.filename)
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
        f = request.files.get("file")
        if f is None:
            return jsonify(error="no file uploaded"), 400
        at = request.form.get("at", -1, type=int)
        with store.lock(doc_id), store.open(doc_id) as doc:
            pdf_ops.merge(doc, f.read(), at)
            store.commit(doc_id, doc)
        return jsonify(snapshot(doc_id))

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
        name = store.filename(doc_id)
        if not name.lower().endswith(".pdf"):
            name += ".pdf"
        stem = name[:-4]
        return send_file(store.path(doc_id), mimetype="application/pdf",
                         as_attachment=True, download_name=f"{stem}-edited.pdf")

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
