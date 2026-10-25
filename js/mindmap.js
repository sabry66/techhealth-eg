/* خريطة ذهنية SVG من اليمين لليسار: نقر على العقدة يطوي أو يفتح فروعها، سحب للتحريك، أزرار للتكبير. */
const NS = "http://www.w3.org/2000/svg";
const el = (n, a = {}, t) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (t != null) e.textContent = t; return e; };
const ctx = document.createElement("canvas").getContext("2d");
const FONT = '500 14px "IBM Plex Sans Arabic","Segoe UI",Tahoma,sans-serif';
const measure = t => { ctx.font = FONT; return Math.ceil(ctx.measureText(t).width); };
const wrap = (t, max) => { // تقسيم النص لأسطر بعرض أقصى
  const words = t.split(/\s+/), lines = []; let cur = "";
  for (const w of words) { const nx = cur ? cur + " " + w : w; if (measure(nx) > max && cur) { lines.push(cur); cur = w; } else cur = nx; }
  if (cur) lines.push(cur); return lines;
};

export function mindmap(host, data) {
  host.innerHTML = "";
  const BR = 6; // عدد ألوان الفروع
  let id = 0;
  const prep = (n, d, b) => { n._id = id++; n._d = d; n._b = d === 0 ? -1 : b; n._open = d < 2; n._lines = wrap(n.t, d === 0 ? 170 : 190); n._w = Math.max(...n._lines.map(measure)) + 28; n._h = n._lines.length * 19 + 14; (n.c || []).forEach((c, i) => prep(c, d + 1, d === 0 ? i % BR : b)); };
  prep(data, 0, 0);

  const bar = document.createElement("div"); bar.className = "mm-bar";
  const mk = (t, f) => { const b = document.createElement("button"); b.type = "button"; b.className = "mm-btn"; b.textContent = t; b.addEventListener("click", f); bar.appendChild(b); return b; };
  const wrapEl = document.createElement("div"); wrapEl.className = "mm-wrap";
  const svg = el("svg", { class: "mm", role: "img", "aria-label": "خريطة ذهنية: " + data.t });
  const g = el("g"); svg.appendChild(g); wrapEl.appendChild(svg); host.append(bar, wrapEl);

  let tx = 0, ty = 0, sc = 1, W = 0, H = 0;
  const apply = () => g.setAttribute("transform", `translate(${tx},${ty}) scale(${sc})`);

  function layout() {
    g.innerHTML = "";
    const vis = []; let leafY = 0; const colW = [];
    const walk = (n) => { vis.push(n); colW[n._d] = Math.max(colW[n._d] || 0, n._w);
      const kids = n._open ? (n.c || []) : [];
      if (!kids.length) { n._y = leafY + n._h / 2; leafY += n._h + 12; } else { kids.forEach(walk); n._y = (kids[0]._y + kids[kids.length - 1]._y) / 2; } };
    walk(data);
    const GAP = 56, xs = []; let x = 0;
    colW.forEach((w, d) => { xs[d] = x; x += (w || 0) + GAP; });
    W = x; H = leafY;
    const px = n => W - GAP - xs[n._d] - n._w; // حافة النص اليسرى: الجذر في اليمين
    const links = el("g"), nodes = el("g"); g.append(links, nodes);
    vis.forEach(n => {
      n._x = px(n);
      if (n._open) (n.c || []).forEach(c => { c._x = px(c); });
    });
    vis.forEach(n => { if (n._open) (n.c || []).forEach(c => {
      const x1 = n._x, y1 = n._y, x2 = c._x + c._w, y2 = c._y, mx = (x1 + x2) / 2;
      links.appendChild(el("path", { d: `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`, class: "mm-l b" + (c._b % BR) }));
    }); });
    vis.forEach(n => {
      const has = n.c && n.c.length, cls = "mm-n" + (n._d === 0 ? " root" : " b" + (n._b % BR)) + (has ? " has" : "");
      const grp = el("g", { class: cls, transform: `translate(${n._x},${n._y - n._h / 2})` });
      if (has) { grp.setAttribute("tabindex", "0"); grp.setAttribute("role", "button"); grp.setAttribute("aria-expanded", String(n._open)); grp.setAttribute("aria-label", n.t + (n._open ? "، مفتوح" : "، مطوي")); }
      grp.appendChild(el("rect", { width: n._w, height: n._h, rx: 9 }));
      n._lines.forEach((l, i) => grp.appendChild(el("text", { x: n._w / 2, y: 20 + i * 19 - 0, "text-anchor": "middle" }, l)));
      if (has) grp.appendChild(el("text", { class: "mm-t", x: 10, y: n._h / 2 + 4, "text-anchor": "middle" }, n._open ? "−" : "+"));
      if (has) { const t = () => { n._open = !n._open; layout(); }; grp.addEventListener("click", e => { e.stopPropagation(); t(); }); grp.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); t(); } }); }
      nodes.appendChild(grp);
    });
    svg.setAttribute("viewBox", `0 0 ${Math.max(W, 10)} ${Math.max(H, 10)}`);
    fit();
  }
  function fit() { const r = wrapEl.getBoundingClientRect(); const bw = Math.max(W, 10), bh = Math.max(H, 10); const s = Math.min(1, r.width / bw, 560 / bh); sc = Math.max(.4, s); tx = 0; ty = 0; svg.style.height = Math.min(Math.max(bh * sc + 24, 280), 640) + "px"; apply(); }
  const all = (n, o) => { n._open = o; (n.c || []).forEach(c => all(c, o)); };
  mk("فتح الكل", () => { all(data, true); layout(); });
  mk("طي الكل", () => { all(data, false); data._open = true; layout(); });
  mk("+", () => { sc = Math.min(2, sc * 1.2); apply(); }).setAttribute("aria-label", "تكبير");
  mk("−", () => { sc = Math.max(.3, sc / 1.2); apply(); }).setAttribute("aria-label", "تصغير");
  mk("ملاءمة", fit);
  /* سحب للتحريك */
  let drag = null;
  svg.addEventListener("pointerdown", e => { if (e.target.closest(".mm-n.has")) return; drag = { x: e.clientX, y: e.clientY, tx, ty }; svg.setPointerCapture(e.pointerId); svg.classList.add("drag"); });
  svg.addEventListener("pointermove", e => { if (!drag) return; const k = (parseFloat(svg.getAttribute("viewBox").split(" ")[2]) / svg.getBoundingClientRect().width) || 1; tx = drag.tx + (e.clientX - drag.x) * k; ty = drag.ty + (e.clientY - drag.y) * k; apply(); });
  const end = () => { drag = null; svg.classList.remove("drag"); };
  svg.addEventListener("pointerup", end); svg.addEventListener("pointercancel", end);
  layout();
}
