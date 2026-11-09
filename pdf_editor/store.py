"""On-disk document store with linear undo/redo history.

Each uploaded document lives in ``<root>/<doc_id>/`` as a series of
snapshots ``v0.pdf, v1.pdf, ...`` plus ``state.json`` recording which
snapshot is current. Editing saves a new snapshot and discards any redo
branch, exactly like the undo stack in a text editor.
"""

from __future__ import annotations

import json
import os
import re
import threading
import uuid
from pathlib import Path

import pymupdf

MAX_HISTORY = 50
_ID_RE = re.compile(r"^[0-9a-f]{32}$")


class NotFound(KeyError):
    pass


class DocumentStore:
    def __init__(self, root: str | os.PathLike):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)
        self._locks: dict[str, threading.Lock] = {}
        self._guard = threading.Lock()

    # ------------------------------------------------------------ internals
    def _dir(self, doc_id: str) -> Path:
        if not _ID_RE.match(doc_id or ""):
            raise NotFound(doc_id)
        d = self.root / doc_id
        if not d.is_dir():
            raise NotFound(doc_id)
        return d

    def lock(self, doc_id: str) -> threading.Lock:
        with self._guard:
            return self._locks.setdefault(doc_id, threading.Lock())

    def _state(self, doc_id: str) -> dict:
        return json.loads((self._dir(doc_id) / "state.json").read_text())

    def _write_state(self, doc_id: str, state: dict) -> None:
        tmp = self._dir(doc_id) / "state.json.tmp"
        tmp.write_text(json.dumps(state))
        tmp.replace(self._dir(doc_id) / "state.json")

    def _version_path(self, doc_id: str, v: int) -> Path:
        return self._dir(doc_id) / f"v{v}.pdf"

    # ------------------------------------------------------------ public API
    def create(self, data: bytes, filename: str = "document.pdf") -> str:
        # Validate + normalise: repairs damaged files, decrypts nothing.
        doc = pymupdf.open(stream=data, filetype="pdf")
        if doc.needs_pass:
            raise ValueError("password-protected PDFs are not supported")
        if doc.page_count == 0:
            raise ValueError("PDF has no pages")
        doc_id = uuid.uuid4().hex
        d = self.root / doc_id
        d.mkdir()
        doc.save(d / "v0.pdf", garbage=1, deflate=True)
        doc.close()
        name = Path(filename).name or "document.pdf"
        (d / "state.json").write_text(json.dumps(
            {"current": 0, "latest": 0, "oldest": 0, "filename": name}))
        return doc_id

    def path(self, doc_id: str) -> Path:
        return self._version_path(doc_id, self._state(doc_id)["current"])

    def filename(self, doc_id: str) -> str:
        return self._state(doc_id)["filename"]

    def open(self, doc_id: str) -> pymupdf.Document:
        return pymupdf.open(self.path(doc_id))

    def commit(self, doc_id: str, doc: pymupdf.Document) -> int:
        """Save ``doc`` as a new version, dropping any redo history."""
        st = self._state(doc_id)
        for v in range(st["current"] + 1, st["latest"] + 1):
            self._version_path(doc_id, v).unlink(missing_ok=True)
        new = st["current"] + 1
        doc.save(self._version_path(doc_id, new), garbage=3, deflate=True)
        st["current"] = st["latest"] = new
        while st["latest"] - st["oldest"] >= MAX_HISTORY:
            self._version_path(doc_id, st["oldest"]).unlink(missing_ok=True)
            st["oldest"] += 1
        self._write_state(doc_id, st)
        return new

    def undo(self, doc_id: str) -> bool:
        st = self._state(doc_id)
        if st["current"] <= st["oldest"]:
            return False
        st["current"] -= 1
        self._write_state(doc_id, st)
        return True

    def redo(self, doc_id: str) -> bool:
        st = self._state(doc_id)
        if st["current"] >= st["latest"]:
            return False
        st["current"] += 1
        self._write_state(doc_id, st)
        return True

    def status(self, doc_id: str) -> dict:
        st = self._state(doc_id)
        return {
            "id": doc_id,
            "filename": st["filename"],
            "version": st["current"],
            "can_undo": st["current"] > st["oldest"],
            "can_redo": st["current"] < st["latest"],
        }
