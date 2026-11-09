/* PDF Studio front-end. No build step, no dependencies.
 *
 * The server renders each page to PNG; we lay a transparent "overlay" div
 * on top of every page image and translate mouse positions into PDF points
 * (pixels / zoom). Every edit is sent to the server as a JSON operation,
 * which returns a fresh document snapshot that we re-render from.
 */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const state = {
    doc: null,          // snapshot from server: {id, version, pages:[{width,height,fp}], ...}
    zoom: 1.5,          // CSS px per PDF point
    tool: "select",
    current: 0,         // page index in view
    spans: new Map(),   // `${page}:${fp}` -> text spans
    pendingImageRect: null,
    busy: false,
  };

  const opts = {
    get color() { return $("#opt-color").value; },
    get fill() {
      const v = $("#opt-fill").value;
      return v === "same" ? this.color : v;
    },
    get size() { return Number($("#opt-size").value) || 12; },
    get width() { return Number($("#opt-width").value) || 2; },
    get font() { return $("#opt-font").value || "helv"; },
  };

  // ------------------------------------------------------------ utilities
  let statusTimer;
  function toast(msg, isError = false) {
    const el = $("#status");
    el.textContent = msg;
    el.classList.toggle("error", isError);
    el.classList.add("show");
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => el.classList.remove("show"), isError ? 5000 : 1800);
  }

  async function api(path, { method = "GET", json, form } = {}) {
    const init = { method, headers: {} };
    if (json !== undefined) {
      init.body = JSON.stringify(json);
      init.headers["Content-Type"] = "application/json";
    } else if (form) {
      init.body = form;
    }
    const res = await fetch(path, init);
    const data = res.headers.get("content-type")?.includes("json") ? await res.json() : null;
    if (!res.ok) throw new Error(data?.error || `${res.status} ${res.statusText}`);
    return data;
  }

  const docUrl = (p = "") => `/api/docs/${state.doc.id}${p}`;

  function readAsDataURL(file) {
    return new Promise((ok, fail) => {
      const r = new FileReader();
      r.onload = () => ok(r.result);
      r.onerror = () => fail(r.error);
      r.readAsDataURL(file);
    });
  }

  // ------------------------------------------------------------ document lifecycle
  async function openFile(file) {
    if (!file) return;
    if (file.type && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return toast("Please choose a PDF file", true);
    }
    const form = new FormData();
    form.append("file", file);
    toast(`Uploading ${file.name}…`);
    try {
      const snap = await api("/api/upload", { method: "POST", form });
      state.current = 0;
      setDoc(snap, { rebuild: true });
      toast(`Opened ${snap.filename} (${snap.pages.length} pages)`);
    } catch (e) {
      toast(e.message, true);
    }
  }

  async function loadExisting(id) {
    try {
      const snap = await api(`/api/docs/${id}`);
      setDoc(snap, { rebuild: true });
    } catch {
      history.replaceState(null, "", location.pathname);
    }
  }

  function setDoc(snap, { rebuild = false } = {}) {
    const prev = state.doc;
    state.doc = snap;
    document.body.classList.add("has-doc");
    document.title = `${snap.filename} – PDF Studio`;
    if (location.hash !== `#${snap.id}`) history.replaceState(null, "", `#${snap.id}`);
    $("#btn-undo").disabled = !snap.can_undo;
    $("#btn-redo").disabled = !snap.can_redo;
    state.current = Math.min(state.current, snap.pages.length - 1);
    renderPages(rebuild || !prev || prev.id !== snap.id);
    renderThumbs();
  }

  async function edit(ops, message) {
    if (state.busy) return;
    state.busy = true;
    document.body.style.cursor = "progress";
    try {
      const snap = await api(docUrl("/edit"), { method: "POST", json: ops });
      setDoc(snap);
      if (message) toast(typeof message === "function" ? message(snap) : message);
      return snap;
    } catch (e) {
      toast(e.message, true);
    } finally {
      state.busy = false;
      document.body.style.cursor = "";
    }
  }

  async function undoRedo(which) {
    if (!state.doc) return;
    try {
      setDoc(await api(docUrl(`/${which}`), { method: "POST" }));
    } catch (e) { toast(e.message, true); }
  }

  // ------------------------------------------------------------ rendering
  function pageSrc(i, scale) {
    const p = state.doc.pages[i];
    const z = Math.min(6, scale * (window.devicePixelRatio || 1)).toFixed(2);
    return docUrl(`/pages/${i}.png?zoom=${z}&v=${p.fp}`);
  }

  function renderPages(rebuild) {
    const host = $("#pages");
    const pages = state.doc.pages;
    if (rebuild) host.replaceChildren();
    // Reconcile: reuse page elements, only swap the image if its fingerprint changed.
    while (host.children.length > pages.length) host.lastChild.remove();
    pages.forEach((p, i) => {
      let el = host.children[i];
      if (!el) {
        el = document.createElement("div");
        el.className = "page";
        el.innerHTML = `<img alt="" loading="lazy" decoding="async"><div class="overlay"></div>`;
        el.dataset.index = i;
        attachOverlay(el.querySelector(".overlay"), el);
        host.appendChild(el);
      }
      el.dataset.index = i;
      el.style.width = `${p.width * state.zoom}px`;
      el.style.height = `${p.height * state.zoom}px`;
      const img = el.querySelector("img");
      const src = pageSrc(i, state.zoom);
      if (img.getAttribute("src") !== src) img.src = src;
      if (el.dataset.fp !== p.fp) {
        el.dataset.fp = p.fp;
        el.querySelectorAll(".span-box").forEach((b) => b.remove());
      }
    });
    $("#zoom-label").textContent = `${Math.round(state.zoom * 100 / 1.333)}%`;
    if (state.tool === "edit") showSpans();
  }

  function renderThumbs() {
    const side = $("#sidebar");
    const pages = state.doc.pages;
    while (side.children.length > pages.length) side.lastChild.remove();
    pages.forEach((p, i) => {
      let t = side.children[i];
      if (!t) {
        t = document.createElement("div");
        t.className = "thumb";
        t.draggable = true;
        t.innerHTML = `<img alt=""><div class="num"></div>
          <div class="acts">
            <button data-act="rotl" title="Rotate left">⟲</button>
            <button data-act="rotr" title="Rotate right">⟳</button>
            <button data-act="dup" title="Duplicate page">⧉</button>
            <button data-act="blank" title="Insert blank page after">＋</button>
            <button data-act="del" class="del" title="Delete page">✕</button>
          </div>`;
        bindThumb(t);
        side.appendChild(t);
      }
      t.dataset.index = i;
      t.querySelector(".num").textContent = `Page ${i + 1}`;
      const img = t.querySelector("img");
      const src = pageSrc(i, 0.2);
      if (img.getAttribute("src") !== src) img.src = src;
      t.classList.toggle("current", i === state.current);
    });
  }

  function bindThumb(t) {
    const idx = () => Number(t.dataset.index);
    t.addEventListener("click", (e) => {
      const act = e.target.closest("button")?.dataset.act;
      const i = idx();
      if (!act) return scrollToPage(i);
      e.stopPropagation();
      const ops = {
        rotl: { op: "rotate_page", page: i, angle: -90 },
        rotr: { op: "rotate_page", page: i, angle: 90 },
        dup: { op: "duplicate_page", page: i },
        blank: { op: "insert_blank", after: i },
        del: { op: "delete_page", page: i },
      };
      if (act === "del" && !confirm(`Delete page ${i + 1}?`)) return;
      edit(ops[act]);
    });
    t.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/x-page", String(idx()));
      e.dataTransfer.effectAllowed = "move";
    });
    t.addEventListener("dragover", (e) => {
      if (!e.dataTransfer.types.includes("text/x-page")) return;
      e.preventDefault();
      $$(".thumb.drop-before").forEach((x) => x.classList.remove("drop-before"));
      t.classList.add("drop-before");
    });
    t.addEventListener("dragleave", () => t.classList.remove("drop-before"));
    t.addEventListener("drop", (e) => {
      e.preventDefault();
      t.classList.remove("drop-before");
      const from = Number(e.dataTransfer.getData("text/x-page"));
      const to = idx();
      if (!Number.isNaN(from) && from !== to) {
        edit({ op: "move_page", page: from, to }, `Moved page ${from + 1} → ${to + 1}`);
      }
    });
  }

  function scrollToPage(i) {
    const el = $("#pages").children[i];
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function trackCurrentPage() {
    const viewer = $("#viewer");
    const mid = viewer.getBoundingClientRect().top + viewer.clientHeight / 3;
    let best = 0;
    [...$("#pages").children].forEach((el, i) => {
      if (el.getBoundingClientRect().top <= mid) best = i;
    });
    if (best !== state.current) {
      state.current = best;
      $$(".thumb").forEach((t, i) => t.classList.toggle("current", i === best));
    }
  }

  function setZoom(z) {
    if (!state.doc) return;
    const viewer = $("#viewer");
    const ratio = viewer.scrollTop / Math.max(1, viewer.scrollHeight);
    state.zoom = Math.min(4, Math.max(0.4, z));
    renderPages(false);
    $$(".span-box").forEach((b) => b.remove());
    if (state.tool === "edit") showSpans();
    viewer.scrollTop = ratio * viewer.scrollHeight;
  }

  // ------------------------------------------------------------ text spans (edit tool)
  async function spansFor(i) {
    const key = `${i}:${state.doc.pages[i].fp}`;
    if (!state.spans.has(key)) state.spans.set(key, await api(docUrl(`/pages/${i}/text`)));
    return state.spans.get(key);
  }

  async function showSpans() {
    const els = [...$("#pages").children];
    for (const el of els) {
      const i = Number(el.dataset.index);
      if (el.querySelector(".span-box")) continue;
      const spans = await spansFor(i).catch(() => []);
      const overlay = el.querySelector(".overlay");
      const z = state.zoom;
      for (const s of spans) {
        const b = document.createElement("div");
        b.className = "span-box";
        const [x0, y0, x1, y1] = s.bbox;
        Object.assign(b.style, { left: `${x0 * z}px`, top: `${y0 * z}px`,
          width: `${(x1 - x0) * z}px`, height: `${(y1 - y0) * z}px` });
        b.title = `${s.font} ${s.size}pt`;
        b.spanData = s;
        overlay.appendChild(b);
      }
    }
  }

  // ------------------------------------------------------------ inline text editor
  function inlineEditor(overlay, { x, y, w, text = "", size, color, onCommit, hint }) {
    $$(".inline-editor, .inline-hint").forEach((n) => n.remove());
    const z = state.zoom;
    const ta = document.createElement("textarea");
    ta.className = "inline-editor";
    ta.value = text;
    ta.spellcheck = true;
    const lines = Math.max(1, text.split("\n").length);
    Object.assign(ta.style, {
      left: `${x * z}px`, top: `${y * z}px`,
      width: `${Math.max(w ? w * z + 24 : 160, 80)}px`,
      height: `${size * z * 1.25 * lines + 6}px`,
      fontSize: `${size * z}px`, color,
    });
    const tip = document.createElement("div");
    tip.className = "inline-hint";
    tip.textContent = hint || "Enter = save · Shift+Enter = new line · Esc = cancel";
    Object.assign(tip.style, { left: `${x * z}px`, top: `${y * z - 20}px` });
    overlay.append(tip, ta);
    let done = false;
    const finish = (save) => {
      if (done) return;
      done = true;
      const value = ta.value;
      ta.remove(); tip.remove();
      if (save) onCommit(value);
    };
    ta.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); finish(true); }
      else if (e.key === "Escape") { e.preventDefault(); finish(false); }
    });
    ta.addEventListener("input", () => {
      ta.style.height = "auto";
      ta.style.height = `${ta.scrollHeight + 2}px`;
    });
    ta.addEventListener("blur", () => finish(true));
    ta.addEventListener("pointerdown", (e) => e.stopPropagation());
    // Focus synchronously so the very first keystroke lands in the editor
    // (and is not mistaken for a tool shortcut).
    ta.focus();
    ta.select();
  }

  // ------------------------------------------------------------ overlay interaction
  function attachOverlay(overlay, pageEl) {
    const page = () => Number(pageEl.dataset.index);
    const pt = (e) => {
      const r = overlay.getBoundingClientRect();
      return [(e.clientX - r.left) / state.zoom, (e.clientY - r.top) / state.zoom];
    };
    const round = (v) => Math.round(v * 100) / 100;
    let drag = null;

    overlay.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || !state.doc) return;
      const tool = state.tool;
      const [x, y] = pt(e);

      if (tool === "edit") {
        const box = e.target.closest(".span-box");
        if (!box) return;
        const s = box.spanData;
        const [x0, y0, x1, y1] = s.bbox;
        inlineEditor(overlay, {
          x: x0, y: y0, w: x1 - x0, text: s.text, size: s.size, color: s.color,
          hint: "Edit text · Enter = save · empty = delete · Esc = cancel",
          onCommit: (value) => {
            if (value === s.text) return;
            edit({ op: "replace_text", page: page(), rect: s.bbox, origin: s.origin,
                   text: value, size: s.size, color: s.color, font: s.base_font },
                 value ? "Text updated" : "Text deleted");
          },
        });
        e.preventDefault();
        return;
      }
      if (tool === "text" || tool === "note") {
        e.preventDefault();
        const size = tool === "note" ? 12 : opts.size;
        inlineEditor(overlay, {
          x, y, text: "", size, color: tool === "note" ? "#000" : opts.color,
          hint: tool === "note" ? "Note text · Enter = save" : undefined,
          onCommit: (value) => {
            if (!value.trim()) return;
            if (tool === "note") {
              edit({ op: "note", page: page(), at: [round(x), round(y)], text: value }, "Note added");
            } else {
              // Baseline sits ~0.8em below the click so text appears where typed.
              edit({ op: "add_text", page: page(), at: [round(x + 2 / state.zoom), round(y + size * 0.95)],
                     text: value, size, color: opts.color, font: opts.font }, "Text added");
            }
          },
        });
        return;
      }
      if (tool === "select") return;

      e.preventDefault();
      overlay.setPointerCapture(e.pointerId);
      drag = { start: [x, y], points: [[round(x), round(y)]], el: null };
      if (tool === "ink" || tool === "line") {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.classList.add("live");
        const shape = document.createElementNS("http://www.w3.org/2000/svg", tool === "ink" ? "polyline" : "line");
        shape.setAttribute("fill", "none");
        shape.setAttribute("stroke", opts.color);
        shape.setAttribute("stroke-width", opts.width * state.zoom);
        shape.setAttribute("stroke-linecap", "round");
        shape.setAttribute("stroke-linejoin", "round");
        svg.appendChild(shape);
        overlay.appendChild(svg);
        drag.el = svg; drag.shape = shape;
      } else {
        drag.el = document.createElement("div");
        drag.el.className = "rubber" + (tool === "ellipse" ? " round" : "");
        if (tool === "highlight") drag.el.style.background = hexA(opts.color === "#d22b2b" ? "#ffff00" : opts.color, 0.35);
        if (tool === "whiteout") drag.el.style.background = "#fff";
        if (tool === "redact") drag.el.style.background = "rgba(0,0,0,.7)";
        overlay.appendChild(drag.el);
      }
    });

    overlay.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const [x, y] = pt(e);
      const z = state.zoom;
      if (state.tool === "ink") {
        drag.points.push([round(x), round(y)]);
        drag.shape.setAttribute("points", drag.points.map(([a, b]) => `${a * z},${b * z}`).join(" "));
      } else if (state.tool === "line") {
        const [sx, sy] = drag.start;
        Object.entries({ x1: sx * z, y1: sy * z, x2: x * z, y2: y * z })
          .forEach(([k, v]) => drag.shape.setAttribute(k, v));
        drag.end = [x, y];
      } else {
        const [sx, sy] = drag.start;
        Object.assign(drag.el.style, {
          left: `${Math.min(sx, x) * z}px`, top: `${Math.min(sy, y) * z}px`,
          width: `${Math.abs(x - sx) * z}px`, height: `${Math.abs(y - sy) * z}px`,
        });
        drag.end = [x, y];
      }
    });

    const finishDrag = (e) => {
      if (!drag) return;
      const d = drag;
      drag = null;
      d.el?.remove();
      const tool = state.tool;
      const p = page();
      if (tool === "ink") {
        if (d.points.length > 1) {
          edit({ op: "ink", page: p, paths: [d.points], stroke: opts.color, width: opts.width });
        }
        return;
      }
      if (!d.end) return;
      const [sx, sy] = d.start, [ex, ey] = d.end;
      if (tool === "line") {
        if (Math.hypot(ex - sx, ey - sy) < 2) return;
        edit({ op: "line", page: p, start: [round(sx), round(sy)], end: [round(ex), round(ey)],
               stroke: opts.color, width: opts.width });
        return;
      }
      const rect = [Math.min(sx, ex), Math.min(sy, ey), Math.max(sx, ex), Math.max(sy, ey)].map(round);
      if (rect[2] - rect[0] < 2 || rect[3] - rect[1] < 2) return;
      switch (tool) {
        case "whiteout": return edit({ op: "whiteout", page: p, rect }, "Area covered");
        case "redact":
          if (!confirm("Redaction permanently removes everything in this area. Continue?")) return;
          return edit({ op: "redact", page: p, rect }, "Area redacted");
        case "highlight":
          return edit({ op: "highlight", page: p, rect,
                        color: opts.color === "#d22b2b" ? "#ffff00" : opts.color });
        case "rectangle":
        case "ellipse":
          return edit({ op: tool, page: p, rect, stroke: opts.color, fill: opts.fill, width: opts.width });
        case "erase":
          return edit({ op: "delete_annotations", page: p, rect },
                      (s) => `Removed ${s.results[0]} annotation(s)`);
        case "image":
          state.pendingImageRect = { page: p, rect };
          $("#file-image").value = "";
          $("#file-image").click();
      }
    };
    overlay.addEventListener("pointerup", finishDrag);
    overlay.addEventListener("pointercancel", () => { drag?.el?.remove(); drag = null; });
  }

  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }

  // ------------------------------------------------------------ tools
  function setTool(tool) {
    state.tool = tool;
    document.body.dataset.tool = tool;
    $$("#tools .tool").forEach((b) => {
      b.classList.toggle("active", b.dataset.tool === tool);
      b.setAttribute("aria-checked", b.dataset.tool === tool);
    });
    if (tool === "edit" && state.doc) showSpans();
  }

  // ------------------------------------------------------------ wiring
  async function init() {
    try {
      const fonts = await api("/api/fonts");
      $("#opt-font").innerHTML = fonts
        .map((f) => `<option value="${f.id}">${f.name}</option>`).join("");
    } catch { /* server unavailable; leave empty */ }

    $("#file-open").addEventListener("change", (e) => openFile(e.target.files[0]));
    $("#file-merge").addEventListener("change", async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const form = new FormData();
      form.append("file", f);
      form.append("at", String(state.doc.pages.length - 1));
      try {
        setDoc(await api(docUrl("/merge"), { method: "POST", form }));
        toast(`Merged ${f.name}`);
      } catch (err) { toast(err.message, true); }
      e.target.value = "";
    });
    $("#file-image").addEventListener("change", async (e) => {
      const f = e.target.files[0];
      const target = state.pendingImageRect;
      state.pendingImageRect = null;
      if (!f || !target) return;
      edit({ op: "image", ...target, data: await readAsDataURL(f) }, "Image inserted");
    });

    $("#btn-download").addEventListener("click", () => { location.href = docUrl("/download"); });
    $("#btn-undo").addEventListener("click", () => undoRedo("undo"));
    $("#btn-redo").addEventListener("click", () => undoRedo("redo"));
    $("#btn-zoom-in").addEventListener("click", () => setZoom(state.zoom * 1.2));
    $("#btn-zoom-out").addEventListener("click", () => setZoom(state.zoom / 1.2));
    $$("#tools .tool").forEach((b) => b.addEventListener("click", () => setTool(b.dataset.tool)));

    const find = $("#dlg-find");
    $("#btn-find").addEventListener("click", () => find.showModal());
    find.addEventListener("close", () => {
      if (find.returnValue !== "ok") return;
      const f = find.querySelector("form").elements;
      edit({ op: "find_replace", find: f.find.value, replace: f.replace.value, match_case: f.case.checked },
           (s) => `Replaced ${s.results[0]} occurrence(s)`);
    });

    const meta = $("#dlg-meta");
    $("#btn-meta").addEventListener("click", () => {
      const f = meta.querySelector("form").elements;
      for (const k of ["title", "author", "subject", "keywords"]) f[k].value = state.doc.metadata?.[k] || "";
      meta.showModal();
    });
    meta.addEventListener("close", () => {
      if (meta.returnValue !== "ok") return;
      const f = meta.querySelector("form").elements;
      edit({ op: "set_metadata", title: f.title.value, author: f.author.value,
             subject: f.subject.value, keywords: f.keywords.value }, "Properties saved");
    });

    const viewer = $("#viewer");
    viewer.addEventListener("scroll", trackCurrentPage, { passive: true });
    viewer.addEventListener("dragover", (e) => {
      if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); viewer.classList.add("dragover"); }
    });
    viewer.addEventListener("dragleave", () => viewer.classList.remove("dragover"));
    viewer.addEventListener("drop", (e) => {
      viewer.classList.remove("dragover");
      const f = e.dataTransfer.files[0];
      if (f) { e.preventDefault(); openFile(f); }
    });
    viewer.addEventListener("wheel", (e) => {
      if (e.ctrlKey) { e.preventDefault(); setZoom(state.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1)); }
    }, { passive: false });

    const keys = { Escape: "select", e: "edit", t: "text", h: "highlight", r: "rectangle",
                   l: "line", d: "ink", n: "note", i: "image" };
    document.addEventListener("keydown", (e) => {
      if (e.target.matches("input, textarea, select") || !state.doc) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z") { e.preventDefault(); undoRedo(e.shiftKey ? "redo" : "undo"); }
      else if (mod && e.key.toLowerCase() === "y") { e.preventDefault(); undoRedo("redo"); }
      else if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); location.href = docUrl("/download"); }
      else if (!mod && keys[e.key]) setTool(keys[e.key]);
    });

    setTool("select");
    const id = location.hash.slice(1);
    if (/^[0-9a-f]{32}$/.test(id)) loadExisting(id);
  }

  init();
})();
