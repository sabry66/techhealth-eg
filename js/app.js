import { CONFIG } from "./config.js";
import * as S from "./store.js";
import { mindmap } from "./mindmap.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const LC = "A-Za-zα-ωΑ-Ω0-9µ%×°′″+\\-–./,:;'’= ⁰-⁹⁺⁻";
const LAT = new RegExp("[A-Za-zα-ωΑ-Ω](?:[" + LC + "]|\\([" + LC + "]*\\))*", "g");
const ltr = m => { const t = m.replace(/[\s.,:;]+$/, ""); return '<bdi class="lt" dir="ltr">' + t + "</bdi>" + m.slice(t.length); };
const rich = t => esc(t).replace(LAT, ltr).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
const arN = n => Number(n).toLocaleString("ar-EG");
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- أيقونات (خط واحد 1.5) ---------- */
const P = { home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10", book: "M4 5a2 2 0 012-2h13v17H6a2 2 0 00-2 2V5zM4 19a2 2 0 012-2h13", quiz: "M9 11l3 3 8-8M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h9", star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z", user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0", search: "M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-4.3-4.3", sun: "M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4", moon: "M21 13A9 9 0 1111 3a7 7 0 0010 10z", cube: "M12 2l9 5v10l-9 5-9-5V7l9-5zM12 12l9-5M12 12v10M12 12L3 7", map: "M5 12h4M9 12l4-6h6M9 12l4 6h6M19 6v0M19 18v0", cards: "M4 7h13v12H4zM8 7V4h13v12h-4", check: "M5 12l5 5L20 7", chev: "M9 6l6 6-6 6", out: "M15 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M10 16l-4-4 4-4M6 12h11", clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2", flame: "M12 3c1 4 5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z" };
const ic = (n, c = "") => `<svg class="ic ${c}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n]}"/></svg>`;

/* ---------- بيانات المناهج ---------- */
let MAN = null; const BK = {};
const manifest = async () => MAN || (MAN = await (await fetch("data/manifest.json")).json());
const loadBook = async id => BK[id] || (BK[id] = await (await fetch("data/books/" + id + ".json")).json());
const deptOf = id => MAN.depts.find(d => d.id === id);
const bookM = id => MAN.books.find(b => b.id === id);
const chKey = (b, c) => b + ":" + c;
const prog = (b, c) => S.state.prog[chKey(b, c)] || {};
const bookProg = b => { const m = bookM(b); const n = m.chapters.length; const r = m.chapters.filter(c => prog(b, c.id).read).length; return { n, r, pct: n ? Math.round(r / n * 100) : 0 }; };
const nQ = m => m.chapters.reduce((s, c) => s + (c.q || 0), 0);

/* ---------- الهيكل ---------- */
const main = () => $("#main");
function shell() {
  $("#app").innerHTML = `
  <a class="skip" href="#main">تخطَّ إلى المحتوى</a>
  <header class="top"><div class="wrap bar">
    <a class="logo" href="#/" aria-label="${esc(CONFIG.siteName)}"><span class="mark" aria-hidden="true"></span>${esc(CONFIG.siteName)}</a>
    <nav class="nav" aria-label="التنقل الرئيسي">${navLinks()}</nav>
    <div class="tools">
      <button class="icbtn" id="themeBtn" aria-label="تبديل المظهر">${ic("moon")}</button>
      <a class="acct" id="acct" href="#/login"></a>
    </div></div></header>
  <main id="main" tabindex="-1"></main>
  <nav class="tabbar" aria-label="التنقل"><div class="tabs-in">${navLinks(true)}</div></nav>`;
  $("#themeBtn").addEventListener("click", toggleTheme);
  paintAcct();
}
const NAV = [["#/", "home", "الرئيسية"], ["#/lib", "book", "الشروحات"], ["#/quizzes", "quiz", "الاختبارات"], ["#/fav", "star", "المفضلة"], ["#/me", "user", "حسابي"]];
const navLinks = tab => NAV.filter(n => tab || n[1] !== "user").map(n => `<a href="${n[0]}" data-nav="${n[0]}">${tab ? ic(n[1]) : ""}<span>${n[2]}</span></a>`).join("");
function paintAcct() {
  const a = $("#acct"); if (!a) return;
  if (S.user) { a.href = "#/me"; a.innerHTML = `${ic("user")}<span>${esc(S.user.name)}</span>`; } else { a.href = "#/login"; a.innerHTML = `<span>تسجيل الدخول</span>`; }
}
function markNav(route) {
  const base = "#/" + (route[0] || "");
  $$("[data-nav]").forEach(a => { const t = a.dataset.nav; const on = t === base || (t === "#/lib" && ["book", "read"].includes(route[0])) || (t === "#/quizzes" && route[0] === "quiz") || (t === "#/me" && ["login", "signup"].includes(route[0])); a.classList.toggle("on", on); if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
}
function toggleTheme() {
  const cur = document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const n = cur === "dark" ? "light" : "dark"; document.documentElement.dataset.theme = n; try { localStorage.setItem("ds_theme", n); } catch (e) {}
}
try { const t = localStorage.getItem("ds_theme"); if (t) document.documentElement.dataset.theme = t; } catch (e) {}

/* ---------- الراوتر ---------- */
let cleanup = null;
function parse() { const h = location.hash.replace(/^#\/?/, ""); const [p, q] = h.split("?"); return { route: p.split("/").filter(Boolean).map(decodeURIComponent), q: new URLSearchParams(q || "") }; }
async function route() {
  if (cleanup) { cleanup(); cleanup = null; }
  const { route: r, q } = parse(); markNav(r);
  const v = r[0] || "home"; const m = main();
  document.body.dataset.dept = "";
  try {
    await manifest();
    if (v === "home") home(m);
    else if (v === "lib") lib(m, q);
    else if (v === "book") await bookPage(m, r[1]);
    else if (v === "read") await reader(m, r[1], r[2], r[3] || "explain");
    else if (v === "quizzes") await quizHub(m);
    else if (v === "quiz") await quizRun(m, q);
    else if (v === "fav") await favPage(m, q);
    else if (v === "me") mePage(m);
    else if (v === "login" || v === "signup") authPage(m, v, q);
    else if (v === "search") searchPage(m, decodeURIComponent(r[1] || ""));
    else notFound(m);
  } catch (e) { console.error(e); m.innerHTML = `<div class="wrap pad"><h1>تعذّر تحميل الصفحة</h1><p class="muted">تأكد من الاتصال بالإنترنت ثم حدّث الصفحة.</p></div>`; }
  if (!parse().q.get("keep")) { window.scrollTo(0, 0); }
}
const notFound = m => m.innerHTML = `<div class="wrap pad"><h1>الصفحة غير موجودة</h1><p><a class="btn" href="#/">العودة للرئيسية</a></p></div>`;

/* ---------- مكونات صغيرة ---------- */
const favBtn = (key, label = "إضافة للمفضلة") => `<button class="favbtn" type="button" data-fav="${esc(key)}" aria-pressed="${S.isFav(key)}" aria-label="${label}" title="${label}">${ic("star")}</button>`;
function bindFavs(root = document) {
  $$("[data-fav]", root).forEach(b => { if (b._b) return; b._b = 1; b.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); S.toggleFav(b.dataset.fav); }); });
}
S.subscribe(() => {
  paintAcct();
  $$("[data-fav]").forEach(b => { const on = S.isFav(b.dataset.fav); b.setAttribute("aria-pressed", String(on)); });
  const { route: r } = parse(); if (["fav", "me"].includes(r[0])) route();
});
const bar = p => `<div class="meter" role="img" aria-label="${p}%"><i style="width:${p}%"></i></div>`;
const pageHead = (t, sub, extra = "") => `<div class="phead wrap"><div><h1>${t}</h1>${sub ? `<p class="muted">${sub}</p>` : ""}</div>${extra}</div>`;

/* ---------- الرئيسية ---------- */
function home(m) {
  const last = Object.entries(S.state.prog).filter(([, v]) => v.at).sort((a, b) => b[1].at - a[1].at)[0];
  let lastHtml = "";
  if (last) { const [b, c] = last[0].split(":"); const bm = bookM(b), cm = bm && bm.chapters.find(x => x.id === c); if (cm) lastHtml = `<a class="resume" href="#/read/${b}/${c}"><span class="muted">تابع من حيث توقفت</span><b>${rich(cm.title)}</b><span class="muted">${rich(bm.title)}</span>${ic("chev")}</a>`; }
  const wrong = Object.keys(S.state.wrong).length;
  m.innerHTML = `
  <section class="hero"><div class="wrap">
    <h1>${esc(CONFIG.siteName)}</h1>
    <p class="lead">${esc(CONFIG.tagline)}</p>
    <form class="search" id="sf" role="search"><label class="sr" for="sq">ابحث في المناهج</label>${ic("search")}<input id="sq" type="search" placeholder="ابحث عن فصل أو مصطلح، مثل Hemoglobin" autocomplete="off"><button class="btn" type="submit">بحث</button></form>
    ${lastHtml}
  </div></section>
  <section class="depts wrap">${MAN.depts.map(d => deptPanel(d)).join("")}</section>
  ${wrong ? `<section class="wrap strip"><div><b>${arN(wrong)} سؤالًا أخطأت فيها</b><span class="muted"> جاهزة للمراجعة في اختبار واحد.</span></div><a class="btn" href="#/quiz?src=wrong&mode=practice">راجع أخطائي</a></section>` : ""}`;
  $("#sf").addEventListener("submit", e => { e.preventDefault(); const v = $("#sq").value.trim(); if (v) location.hash = "#/search/" + encodeURIComponent(v); });
}
function deptPanel(d) {
  const books = MAN.books.filter(b => b.dept === d.id), ch = books.reduce((s, b) => s + b.chapters.length, 0), q = books.reduce((s, b) => s + nQ(b), 0);
  const terms = [1, 2].map(t => { const bs = books.filter(b => b.term === t); return bs.length ? `<div class="termcol"><h3>السنة الثانية · الترم ${t === 1 ? "الأول" : "الثاني"}</h3><ul>${bs.map(b => `<li><a href="#/book/${b.id}">${rich(b.title)}</a>${b.chapters.length ? "" : '<span class="soon">قريبًا</span>'}</li>`).join("")}</ul></div>` : ""; }).join("");
  return `<article class="dpanel" data-d="${d.id}"><header><h2>${esc(d.name)}</h2><p class="muted"><span class="num">${arN(books.length)}</span> كتب · <span class="num">${arN(ch)}</span> فصلًا · <span class="num">${arN(q)}</span> سؤالًا</p></header><div class="terms">${terms}</div><a class="btn ghost" href="#/lib?d=${d.id}">استعرض كل الشروحات</a></article>`;
}

/* ---------- المكتبة (الشروحات) ---------- */
function lib(m, q) {
  const dsel = q.get("d") || "all", tsel = q.get("t") || "all";
  const chip = (label, href, on) => `<a class="chip" href="${href}" ${on ? 'aria-current="true"' : ""}>${label}</a>`;
  const bs = MAN.books.filter(b => (dsel === "all" || b.dept === dsel) && (tsel === "all" || String(b.term) === tsel));
  m.innerHTML = pageHead("الشروحات", "اختر كتابًا لقراءة شرحه فصلًا فصلًا، مع الخريطة الذهنية والمصطلحات.") + `
  <div class="wrap filters"><div class="chips" role="group" aria-label="القسم">${chip("الكل", `#/lib?t=${tsel}`, dsel === "all")}${MAN.depts.map(d => chip(esc(d.name), `#/lib?d=${d.id}&t=${tsel}`, dsel === d.id)).join("")}</div>
  <div class="chips" role="group" aria-label="الترم">${chip("الترمان", `#/lib?d=${dsel}`, tsel === "all")}${chip("الترم الأول", `#/lib?d=${dsel}&t=1`, tsel === "1")}${chip("الترم الثاني", `#/lib?d=${dsel}&t=2`, tsel === "2")}</div></div>
  <section class="wrap booklist">${bs.map(b => { const p = bookProg(b.id); return `<a class="brow" data-d="${b.dept}" href="#/book/${b.id}"><div><h3>${rich(b.title)}</h3><p class="muted">${esc(deptOf(b.dept).name)} · السنة الثانية · الترم ${b.term === 1 ? "الأول" : "الثاني"} · <span class="num">${arN(b.chapters.length)}</span> فصلًا</p></div><div class="brow-end">${b.chapters.length ? `${bar(p.pct)}<span class="muted num">${arN(p.r)} من ${arN(p.n)}</span>` : '<span class="soon">قريبًا</span>'}</div></a>`; }).join("") || '<p class="muted">لا توجد كتب بهذه الفلاتر.</p>'}</section>`;
}

/* ---------- صفحة الكتاب ---------- */
async function bookPage(m, id) {
  const b = bookM(id); if (!b) return notFound(m);
  document.body.dataset.dept = b.dept;
  const p = bookProg(id);
  m.innerHTML = `<div class="wrap pad"><nav class="crumbs" aria-label="المسار"><a href="#/lib">الشروحات</a><span>${esc(deptOf(b.dept).name)}</span><span>السنة الثانية</span><span>الترم ${b.term === 1 ? "الأول" : "الثاني"}</span></nav>
  <div class="bookhead"><div><h1>${rich(b.title)}</h1><p class="muted">${esc(b.author || "")}</p></div>
  <div class="bk-actions">${b.chapters.length ? `<a class="btn" href="#/quiz?src=book:${id}&mode=practice">اختبار على الكتاب كله</a><a class="btn ghost" href="#/quiz?src=book:${id}&mode=exam">امتحان بمؤقت</a>` : ""}</div></div>
  ${b.chapters.length ? `<div class="bkprog">${bar(p.pct)}<span class="muted num">قرأت ${arN(p.r)} من ${arN(p.n)} فصلًا</span></div>` : ""}
  <ol class="chlist">${b.chapters.map((c, i) => { const pr = prog(id, c.id); return `<li><a class="chrow" href="#/read/${id}/${c.id}"><span class="no num">${arN(i + 1)}</span><span class="ct"><b>${rich(c.title)}</b><span class="muted">${c.q ? arN(c.q) + " سؤالًا · " : ""}${c.t ? arN(c.t) + " مصطلحًا" : ""}</span></span><span class="badges">${pr.read ? `<span class="tag ok">${ic("check")}مقروء</span>` : ""}${pr.best != null ? `<span class="tag num">${arN(pr.best)}٪</span>` : ""}</span></a>${favBtn("c:" + chKey(id, c.id))}</li>`; }).join("") || '<p class="muted">محتوى هذا الكتاب قيد الإعداد.</p>'}</ol></div>`;
  bindFavs(m);
}

/* ---------- القارئ ---------- */
async function reader(m, bid, cid, tab) {
  const meta = bookM(bid); if (!meta) return notFound(m);
  const bk = await loadBook(bid); const idx = bk.chapters.findIndex(c => c.id === cid); if (idx < 0) return notFound(m);
  const c = bk.chapters[idx]; document.body.dataset.dept = bk.dept;
  S.mutate(s => { const k = chKey(bid, cid); s.prog[k] = Object.assign({}, s.prog[k], { at: Date.now() }); });
  const prev = bk.chapters[idx - 1], next = bk.chapters[idx + 1];
  const tabs = [["explain", "الشرح", "book"], ["map", "الخريطة الذهنية", "map"], ["cards", "بطاقات المصطلحات", "cards"]];
  const scn = await sceneKey(bid, cid, bk); if (scn) tabs.splice(1, 0, ["3d", "مجسم 3D", "cube"]);
  m.innerHTML = `<div class="wrap pad reader">
  <nav class="crumbs" aria-label="المسار"><a href="#/lib">الشروحات</a><a href="#/book/${bid}">${rich(bk.title)}</a></nav>
  <header class="rhead"><div><p class="muted num">الفصل ${arN(idx + 1)} من ${arN(bk.chapters.length)}</p><h1>${rich(c.title)}</h1></div>
  <div class="ract">${favBtn("c:" + chKey(bid, cid), "إضافة الفصل للمفضلة")}<a class="btn" href="#/quiz?src=ch:${bid}:${cid}&mode=practice">اختبر هذا الفصل</a></div></header>
  <div class="tabs" role="tablist" aria-label="أقسام الفصل">${tabs.map(t => `<a role="tab" class="tab" href="#/read/${bid}/${cid}/${t[0]}" aria-selected="${tab === t[0]}">${ic(t[2])}${t[1]}</a>`).join("")}</div>
  <div id="pane" role="tabpanel"></div>
  <footer class="rfoot"><button class="btn ${prog(bid, cid).read ? "ghost" : ""}" id="readBtn" type="button">${ic("check")}<span>${prog(bid, cid).read ? "تم تعليمه كمقروء" : "علّمه كمقروء"}</span></button>
  <div class="pn">${prev ? `<a class="btn ghost" href="#/read/${bid}/${prev.id}">${rich(prev.title)}</a>` : ""}${next ? `<a class="btn" href="#/read/${bid}/${next.id}">الفصل التالي</a>` : `<a class="btn" href="#/book/${bid}">قائمة الفصول</a>`}</div></footer></div>`;
  bindFavs(m);
  $("#readBtn").addEventListener("click", () => { S.mutate(s => { const k = chKey(bid, cid); const p = s.prog[k] = s.prog[k] || {}; p.read = p.read ? 0 : Date.now(); }); const r = prog(bid, cid).read; $("#readBtn").className = "btn " + (r ? "ghost" : ""); $("#readBtn span").textContent = r ? "تم تعليمه كمقروء" : "علّمه كمقروء"; });
  const pane = $("#pane");
  if (tab === "map") { pane.innerHTML = `<div class="mmhost" id="mm"></div><p class="muted hint">اضغط على أي فرع به علامة + لفتحه، واسحب الخلفية لتحريك الخريطة.</p>`; if (c.map) mindmap($("#mm"), JSON.parse(JSON.stringify(c.map))); else $("#mm").innerHTML = '<p class="muted">لا توجد خريطة لهذا الفصل بعد.</p>'; }
  else if (tab === "cards") cardsTab(pane, bid, cid, c);
  else if (tab === "3d" && scn) scene3d(pane, scn);
  else explain(pane, c);
}
let SCN;
async function sceneKey(bid, cid, bk) { if (!SCN) { try { SCN = await (await fetch("data/scenes.json")).json(); } catch { SCN = {}; } } return SCN[bid + ":" + cid] || SCN[(bk.id || bid) + ":" + cid] || SCN[bid.replace(/-(lab|rad)$/, "") + ":" + cid]; }
async function scene3d(pane, key) {
  const M = await import("./scenes3d.js"); const d = M.sceneInfo(key);
  pane.innerHTML = `<div class="s3"><div class="s3host" id="s3h"></div><p class="muted hint">اسحب لتدوير المجسم، واستخدم عجلة الماوس أو الإصبعين للتقريب.</p><p class="s3cap">${rich(d.ar)}</p><ul class="s3leg">${d.legend.map(l => `<li><i style="background:${l[0]}"></i><bdi class="lt" dir="ltr">${esc(l[1])}</bdi> — ${rich(l[2])}</li>`).join("")}</ul></div>`;
  M.mount($("#s3h"), key);
}
function explain(pane, c) {
  const secs = c.summary || [];
  pane.innerHTML = `<div class="explain">${secs.length > 2 ? `<aside class="toc" aria-label="محتويات الفصل"><b>في هذا الفصل</b>${secs.map((s, i) => `<a href="#/read/${location.hash.split("/")[2]}/${location.hash.split("/")[3]}/explain?keep=1&s=${i}" data-s="${i}">${rich(s.h)}</a>`).join("")}</aside>` : ""}
  <div class="prose">${secs.map((s, i) => `<section id="s${i}"><h2>${rich(s.h)}</h2>${(s.p || []).map(p => `<p>${rich(p)}</p>`).join("")}${s.ul ? `<ul>${s.ul.map(li => `<li>${rich(li)}</li>`).join("")}</ul>` : ""}${s.table ? `<div class="tbl"><table><thead><tr>${s.table.head.map(h => `<th>${rich(h)}</th>`).join("")}</tr></thead><tbody>${s.table.rows.map(r => `<tr>${r.map(x => `<td>${rich(x)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : ""}${s.note ? `<p class="note">${rich(s.note)}</p>` : ""}</section>`).join("")}</div></div>`;
  $$(".toc a", pane).forEach(a => a.addEventListener("click", e => { e.preventDefault(); const t = $("#s" + a.dataset.s); if (t) t.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }); }));
}
function cardsTab(pane, bid, cid, c) {
  const terms = c.terms || []; if (!terms.length) { pane.innerHTML = '<p class="muted">لا توجد مصطلحات لهذا الفصل بعد.</p>'; return; }
  let order = terms.map((_, i) => i), pos = 0, flipped = false;
  const known = () => new Set(prog(bid, cid).known || []);
  const draw = () => {
    const i = order[pos], t = terms[i], k = known();
    pane.innerHTML = `<div class="fc-wrap"><div class="fc-top"><span class="muted num">${arN(pos + 1)} من ${arN(order.length)} · عرفت ${arN(k.size)} من ${arN(terms.length)}</span><span>${favBtn("t:" + chKey(bid, cid) + ":" + i, "إضافة المصطلح للمفضلة")}<button class="btn ghost sm" id="shuf" type="button">اخلط</button></span></div>
    <button class="fc ${flipped ? "flip" : ""}" id="fc" type="button" aria-label="اضغط لقلب البطاقة"><span class="fc-face front"><bdi class="lt big" dir="ltr">${esc(t.en)}</bdi><small class="muted">اضغط لرؤية المعنى</small></span><span class="fc-face back"><b>${rich(t.ar || "")}</b><span>${rich(t.d || "")}</span></span></button>
    <div class="fc-act"><button class="btn ghost" id="pv" type="button">السابق</button><button class="btn ghost" id="again" type="button">راجعه لاحقًا</button><button class="btn" id="ok" type="button">عرفته</button><button class="btn ghost" id="nx" type="button">التالي</button></div></div>
    <details class="gloss"><summary>كل المصطلحات (${arN(terms.length)})</summary><dl>${terms.map(x => `<div><dt><bdi class="lt" dir="ltr">${esc(x.en)}</bdi></dt><dd>${rich(x.ar || "")}${x.d ? " — " + rich(x.d) : ""}</dd></div>`).join("")}</dl></details>`;
    bindFavs(pane);
    $("#fc").addEventListener("click", () => { flipped = !flipped; $("#fc").classList.toggle("flip", flipped); });
    const go = d => { pos = (pos + d + order.length) % order.length; flipped = false; draw(); $("#fc").focus(); };
    $("#pv").onclick = () => go(-1); $("#nx").onclick = () => go(1);
    $("#ok").onclick = () => { S.mutate(s => { const p = s.prog[chKey(bid, cid)] = s.prog[chKey(bid, cid)] || {}; p.known = Array.from(new Set([...(p.known || []), i])); }); go(1); };
    $("#again").onclick = () => { S.mutate(s => { const p = s.prog[chKey(bid, cid)] = s.prog[chKey(bid, cid)] || {}; p.known = (p.known || []).filter(x => x !== i); }); go(1); };
    $("#shuf").onclick = () => { order = shuffle(order); pos = 0; flipped = false; draw(); };
  };
  draw();
}

/* ---------- الاختبارات: المركز ---------- */
async function quizHub(m) {
  const wrong = Object.keys(S.state.wrong).length, fav = Object.keys(S.state.fav).filter(k => k.startsWith("q:")).length;
  m.innerHTML = pageHead("الاختبارات", "الاختبارات منفصلة عن الشروحات. اختر ما تريد مراجعته.") + `
  <section class="wrap hubtop">
    <a class="hubcard" href="#/quiz?src=rand&mode=practice&n=10"><b>اختبار سريع</b><span class="muted">١٠ أسئلة عشوائية من كل المناهج المتاحة</span></a>
    <a class="hubcard ${wrong ? "" : "off"}" href="#/quiz?src=wrong&mode=practice"><b>أسئلتي الخاطئة</b><span class="muted">${wrong ? arN(wrong) + " سؤالًا تحتاج مراجعة" : "لا توجد أسئلة خاطئة بعد"}</span></a>
    <a class="hubcard ${fav ? "" : "off"}" href="#/quiz?src=fav&mode=practice"><b>أسئلتي المفضلة</b><span class="muted">${fav ? arN(fav) + " سؤالًا محفوظة" : "ضع نجمة على أي سؤال لحفظه"}</span></a>
  </section>
  <section class="wrap"><h2>اختبار حسب الكتاب والفصل</h2>
  ${MAN.books.filter(b => b.chapters.length).map(b => `<details class="qbook" data-d="${b.dept}"><summary><span>${rich(b.title)}</span><span class="muted">${esc(deptOf(b.dept).name)} · <span class="num">${arN(nQ(b))}</span> سؤالًا</span></summary>
    <div class="qbody"><div class="qacts"><a class="btn" href="#/quiz?src=book:${b.id}&mode=practice">تدريب على الكتاب</a><a class="btn ghost" href="#/quiz?src=book:${b.id}&mode=exam">امتحان بمؤقت</a></div>
    <ul>${b.chapters.map((c, i) => { const p = prog(b.id, c.id); return `<li><a href="#/quiz?src=ch:${b.id}:${c.id}&mode=practice"><span class="num muted">${arN(i + 1)}</span><span>${rich(c.title)}</span><span class="muted num">${arN(c.q || 0)} سؤالًا${p.best != null ? " · أفضل نتيجة " + arN(p.best) + "٪" : ""}</span></a></li>`; }).join("")}</ul></div></details>`).join("") || '<p class="muted">لا توجد أسئلة بعد.</p>'}</section>
  ${S.state.hist.length ? `<section class="wrap"><h2>آخر نتائجك</h2><ul class="hist">${S.state.hist.slice(0, 6).map(h => `<li><span>${rich(h.label)}</span><span class="muted">${h.mode === "exam" ? "امتحان" : "تدريب"}</span><b class="num">${arN(h.score)} / ${arN(h.total)}</b></li>`).join("")}</ul></section>` : ""}`;
}

/* ---------- الاختبارات: التشغيل ---------- */
async function pool(src) {
  const out = []; const add = async (bid, only) => { const bk = await loadBook(bid); bk.chapters.forEach(c => { if (only && c.id !== only) return; (c.quiz || []).forEach((q, i) => out.push({ k: bid + ":" + c.id + ":" + i, bid, cid: c.id, i, q, ch: c.title, bt: bk.title })); }); };
  const [t, a, b] = src.split(":");
  if (t === "ch") await add(a, b); else if (t === "book") await add(a);
  else if (t === "rand") for (const bm of MAN.books.filter(x => x.chapters.length)) await add(bm.id);
  else if (t === "wrong" || t === "fav") { const keys = t === "wrong" ? Object.keys(S.state.wrong) : Object.keys(S.state.fav).filter(k => k.startsWith("q:")).map(k => k.slice(2)); const books = [...new Set(keys.map(k => k.split(":")[0]))]; for (const bid of books) await add(bid); return out.filter(x => keys.includes(x.k)); }
  return out;
}
async function quizRun(m, q) {
  const src = q.get("src") || "rand", mode = q.get("mode") === "exam" ? "exam" : "practice";
  let all = await pool(src); if (!all.length) { m.innerHTML = `<div class="wrap pad"><h1>لا توجد أسئلة هنا بعد</h1><p class="muted">جرّب اختبارًا آخر من مركز الاختبارات.</p><a class="btn" href="#/quizzes">مركز الاختبارات</a></div>`; return; }
  const n = Math.min(+q.get("n") || (mode === "exam" ? 20 : 15), all.length);
  const items = shuffle(all).slice(0, n).map(x => { const order = shuffle(x.q.a.map((_, i) => i)); return Object.assign({}, x, { opts: order, ok: order.indexOf(x.q.c) }); });
  const first = items[0]; const [t, a, b] = src.split(":");
  const label = t === "ch" ? first.ch : t === "book" ? first.bt : t === "wrong" ? "أسئلتي الخاطئة" : t === "fav" ? "أسئلتي المفضلة" : "اختبار سريع";
  document.body.dataset.dept = t === "rand" || t === "wrong" || t === "fav" ? "" : (bookM(a) || {}).dept || "";
  const ans = new Array(n).fill(null); let cur = 0, timer = 0, left = n * 60;
  const finish = () => { clearInterval(timer); result(m, items, ans, label, mode, src); };
  const draw = () => {
    const it = items[cur], done = ans[cur] != null, pr = mode === "practice";
    m.innerHTML = `<div class="wrap pad quiz"><div class="qtop"><a class="muted" href="#/quizzes">إنهاء</a><span class="muted">${rich(label)}</span>${mode === "exam" ? `<span class="clock num" id="clock">${ic("clock")}<b></b></span>` : "<span></span>"}</div>
    <div class="dots" aria-hidden="true">${items.map((_, i) => `<i class="${ans[i] != null ? "done" : ""} ${i === cur ? "cur" : ""}"></i>`).join("")}</div>
    <p class="muted num qno">سؤال ${arN(cur + 1)} من ${arN(n)}</p>
    <div class="qhead"><h2 class="qtext" id="qt" tabindex="-1">${rich(it.q.q)}</h2>${favBtn("q:" + it.k, "حفظ السؤال في المفضلة")}</div>
    <div class="opts" role="radiogroup" aria-labelledby="qt">${it.opts.map((oi, k) => { let cls = ""; if (done && pr) { if (k === it.ok) cls = "ok"; else if (k === ans[cur]) cls = "no"; } else if (done && ans[cur] === k) cls = "sel"; return `<button type="button" class="opt ${cls}" role="radio" aria-checked="${ans[cur] === k}" data-k="${k}" ${done && pr ? "disabled" : ""}><span class="ol">${["أ", "ب", "ج", "د", "هـ"][k]}</span><span>${rich(it.q.a[oi])}</span></button>`; }).join("")}</div>
    <div id="fb" aria-live="polite">${done && pr ? `<div class="fb ${ans[cur] === it.ok ? "ok" : "no"}"><b>${ans[cur] === it.ok ? "إجابة صحيحة" : "إجابة غير صحيحة"}</b>${it.q.e ? rich(it.q.e) : ""}</div>` : ""}</div>
    <div class="qnav">${mode === "exam" ? `<button class="btn ghost" id="pv" ${cur ? "" : "disabled"}>السابق</button>` : "<span></span>"}
    ${cur < n - 1 ? `<button class="btn" id="nx" ${pr && !done ? "disabled" : ""}>التالي</button>` : `<button class="btn" id="fin" ${pr && !done ? "disabled" : ""}>${mode === "exam" ? "تسليم الامتحان" : "عرض النتيجة"}</button>`}</div></div>`;
    bindFavs(m); $("#qt").focus({ preventScroll: true });
    $$(".opt", m).forEach(b => b.addEventListener("click", () => {
      if (pr && ans[cur] != null) return; ans[cur] = +b.dataset.k;
      if (pr) { const right = ans[cur] === it.ok; S.mutate(s => { if (right) { if (s.wrong[it.k]) { s.wrong[it.k]--; if (s.wrong[it.k] <= 0) delete s.wrong[it.k]; } } else s.wrong[it.k] = (s.wrong[it.k] || 0) + 1; }); }
      draw();
    }));
    const nx = $("#nx"), pv = $("#pv"), fin = $("#fin"); if (nx) nx.onclick = () => { cur++; draw(); }; if (pv) pv.onclick = () => { cur--; draw(); }; if (fin) fin.onclick = finish;
    tick();
  };
  const tick = () => { const c = $("#clock b"); if (c) c.textContent = Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0"); };
  const go = () => { if (mode === "exam") { timer = setInterval(() => { left--; tick(); if (left <= 0) finish(); }, 1000); cleanup = () => clearInterval(timer); } draw(); };
  m.innerHTML = `<div class="wrap pad quiz intro"><p class="muted">${esc(mode === "exam" ? "امتحان بمؤقت" : "تدريب بتصحيح فوري")}</p><h1>${rich(label)}</h1>
  <ul class="introlist"><li><b class="num">${arN(n)}</b> سؤالًا من الكتاب والفصل المحدد</li><li>${mode === "exam" ? "المدة <b class=\"num\">" + arN(n) + "</b> دقيقة، ويبدأ المؤقت عند الضغط على ابدأ" : "تظهر الإجابة والتفسير بعد كل سؤال"}</li><li>الأسئلة داخل المنهج المقرر فقط</li></ul>
  <div class="qacts"><button class="btn" id="go">ابدأ</button><a class="btn ghost" href="#/quizzes">رجوع</a></div></div>`;
  $("#go").addEventListener("click", go); $("#go").focus({ preventScroll: true });
}
function result(m, items, ans, label, mode, src) {
  const total = items.length, score = items.reduce((s, it, i) => s + (ans[i] === it.ok ? 1 : 0), 0), pct = Math.round(score / total * 100);
  S.mutate(s => {
    s.hist.unshift({ ts: Date.now(), label, mode, score, total, src }); s.hist = s.hist.slice(0, 40);
    const [t, a, b] = src.split(":");
    if (t === "ch") { const k = chKey(a, b); const p = s.prog[k] = s.prog[k] || {}; p.best = Math.max(p.best || 0, pct); p.attempts = (p.attempts || 0) + 1; }
    if (mode === "exam") items.forEach((it, i) => { if (ans[i] === it.ok) { if (s.wrong[it.k]) delete s.wrong[it.k]; } else s.wrong[it.k] = (s.wrong[it.k] || 0) + 1; });
  });
  const msg = pct === 100 ? "ممتاز، كل الإجابات صحيحة." : pct >= 70 ? "نتيجة جيدة. راجع ما أخطأت فيه." : "راجع الشرح ثم أعد المحاولة.";
  const wr = items.map((it, i) => ({ it, i })).filter(x => ans[x.i] !== x.it.ok);
  m.innerHTML = `<div class="wrap pad result"><p class="muted">${rich(label)} · ${mode === "exam" ? "امتحان" : "تدريب"}</p><div class="big num">${arN(score)}<small> / ${arN(total)}</small></div><p class="lead">${arN(pct)}٪ — ${msg}</p>
  <div class="ractions"><a class="btn" href="#/quiz?${new URLSearchParams({ src, mode }).toString()}">اختبار جديد</a>${wr.length ? `<a class="btn ghost" href="#/quiz?src=wrong&mode=practice">راجع أخطائي (${arN(Object.keys(S.state.wrong).length)})</a>` : ""}<a class="btn ghost" href="#/quizzes">مركز الاختبارات</a></div>
  ${wr.length ? `<h2>ما أخطأت فيه</h2><ol class="wlist">${wr.map(({ it, i }) => `<li><div class="qhead"><b>${rich(it.q.q)}</b>${favBtn("q:" + it.k, "حفظ السؤال")}</div><p><span class="tag bad">إجابتك</span> ${ans[i] == null ? "بدون إجابة" : rich(it.q.a[it.opts[ans[i]]])}</p><p><span class="tag ok">الصحيحة</span> ${rich(it.q.a[it.q.c])}</p>${it.q.e ? `<p class="muted">${rich(it.q.e)}</p>` : ""}<a class="muted" href="#/read/${it.bid}/${it.cid}">راجع الفصل: ${rich(it.ch)}</a></li>`).join("")}</ol>` : ""}</div>`;
  bindFavs(m); window.scrollTo(0, 0);
}

/* ---------- المفضلة ---------- */
async function favPage(m, q) {
  const tab = q.get("t") || "c"; const keys = Object.entries(S.state.fav).sort((a, b) => b[1] - a[1]).map(x => x[0]);
  const by = p => keys.filter(k => k.startsWith(p + ":"));
  const tabs = [["c", "فصول"], ["q", "أسئلة"], ["t", "مصطلحات"]];
  let body = "";
  const ks = by(tab);
  if (!ks.length) body = `<p class="empty">${tab === "c" ? "لم تضف فصولًا للمفضلة. اضغط على النجمة بجوار أي فصل." : tab === "q" ? "لم تحفظ أسئلة. اضغط على النجمة داخل أي اختبار." : "لم تحفظ مصطلحات. اضغط على النجمة في بطاقة المصطلح."}</p>`;
  else if (tab === "c") body = `<ul class="favlist">${ks.map(k => { const [b, c] = k.slice(2).split(":"); const bm = bookM(b), cm = bm && bm.chapters.find(x => x.id === c); return cm ? `<li><a href="#/read/${b}/${c}"><b>${rich(cm.title)}</b><span class="muted">${rich(bm.title)}</span></a>${favBtn(k, "إزالة من المفضلة")}</li>` : ""; }).join("")}</ul>`;
  else { const bks = [...new Set(ks.map(k => k.slice(2).split(":")[0]))]; for (const b of bks) await loadBook(b);
    if (tab === "q") body = `<ul class="favlist">${ks.map(k => { const [b, c, i] = k.slice(2).split(":"); const ch = BK[b] && BK[b].chapters.find(x => x.id === c); const qq = ch && ch.quiz[+i]; return qq ? `<li class="fq"><div><b>${rich(qq.q)}</b><p><span class="tag ok">الصحيحة</span> ${rich(qq.a[qq.c])}</p>${qq.e ? `<p class="muted">${rich(qq.e)}</p>` : ""}<a class="muted" href="#/read/${b}/${c}">${rich(ch.title)}</a></div>${favBtn(k, "إزالة من المفضلة")}</li>` : ""; }).join("")}</ul><a class="btn" href="#/quiz?src=fav&mode=practice">اختبرني في أسئلتي المفضلة</a>`;
    else body = `<ul class="favlist">${ks.map(k => { const [b, c, i] = k.slice(2).split(":"); const ch = BK[b] && BK[b].chapters.find(x => x.id === c); const t = ch && ch.terms[+i]; return t ? `<li class="fq"><div><b><bdi class="lt" dir="ltr">${esc(t.en)}</bdi></b> — ${rich(t.ar || "")}<p class="muted">${rich(t.d || "")}</p><a class="muted" href="#/read/${b}/${c}/cards">${rich(ch.title)}</a></div>${favBtn(k, "إزالة من المفضلة")}</li>` : ""; }).join("")}</ul>`; }
  m.innerHTML = pageHead("المفضلة", S.user ? "" : 'محفوظة على هذا الجهاز. <a href="#/signup">أنشئ حسابًا</a> لتجدها على أي جهاز.') + `<div class="wrap"><div class="tabs" role="tablist">${tabs.map(t => `<a class="tab" role="tab" href="#/fav?t=${t[0]}" aria-selected="${tab === t[0]}">${t[1]} <span class="num muted">${arN(by(t[0]).length)}</span></a>`).join("")}</div>${body}</div>`;
  bindFavs(m);
}

/* ---------- حسابي ---------- */
function mePage(m) {
  if (!S.user) { m.innerHTML = pageHead("حسابي", "سجّل الدخول لحفظ تقدمك ومفضلتك على كل أجهزتك.") + `<div class="wrap"><a class="btn" href="#/login">تسجيل الدخول</a> <a class="btn ghost" href="#/signup">إنشاء حساب</a></div>`; return; }
  const books = MAN.books.filter(b => b.chapters.length), tot = books.reduce((s, b) => s + b.chapters.length, 0), read = books.reduce((s, b) => s + bookProg(b.id).r, 0);
  const hist = S.state.hist, avg = hist.length ? Math.round(hist.reduce((s, h) => s + h.score / h.total, 0) / hist.length * 100) : 0;
  m.innerHTML = pageHead(esc(S.user.name), esc(S.user.email || "")) + `<div class="wrap me">
  ${S.mode === "demo" ? `<p class="demo">وضع تجريبي: الحساب والبيانات محفوظة على هذا الجهاز فقط. اربط Firebase لتصبح الحسابات حقيقية.</p>` : ""}
  <dl class="stats"><div><dt>فصول قرأتها</dt><dd class="num">${arN(read)} <small>من ${arN(tot)}</small></dd></div><div><dt>اختبارات أنهيتها</dt><dd class="num">${arN(hist.length)}</dd></div><div><dt>متوسط نتائجك</dt><dd class="num">${arN(avg)}٪</dd></div><div><dt>أسئلة تحتاج مراجعة</dt><dd class="num">${arN(Object.keys(S.state.wrong).length)}</dd></div></dl>
  <h2>التقدم في الكتب</h2><ul class="progl">${books.map(b => { const p = bookProg(b.id); return `<li><a href="#/book/${b.id}">${rich(b.title)}</a>${bar(p.pct)}<span class="muted num">${arN(p.pct)}٪</span></li>`; }).join("")}</ul>
  <h2>آخر النتائج</h2>${hist.length ? `<ul class="hist">${hist.slice(0, 10).map(h => `<li><span>${rich(h.label)}</span><span class="muted">${new Date(h.ts).toLocaleDateString("ar-EG")}</span><b class="num">${arN(h.score)} / ${arN(h.total)}</b></li>`).join("")}</ul>` : '<p class="muted">لم تنهِ أي اختبار بعد.</p>'}
  <button class="btn ghost" id="out" type="button">${ic("out")}تسجيل الخروج</button></div>`;
  $("#out").addEventListener("click", async () => { await S.logOut(); location.hash = "#/"; });
}

/* ---------- الدخول والتسجيل ---------- */
function authPage(m, kind, q) {
  const signup = kind === "signup";
  m.innerHTML = `<div class="wrap auth"><h1>${signup ? "إنشاء حساب" : "تسجيل الدخول"}</h1><p class="muted">${signup ? "احفظ تقدمك وفصولك المفضلة وأسئلتك على أي جهاز." : "أهلًا بعودتك."}</p>
  ${S.mode === "demo" ? `<p class="demo">وضع تجريبي: الحسابات محفوظة على هذا الجهاز فقط.</p>` : ""}
  <form id="af" novalidate>${signup ? `<div class="fld"><label for="nm">الاسم</label><input id="nm" autocomplete="name" required></div>` : ""}
  <div class="fld"><label for="em">البريد الإلكتروني</label><input id="em" type="email" inputmode="email" autocomplete="email" dir="ltr" required></div>
  <div class="fld"><label for="pw">كلمة المرور</label><input id="pw" type="password" autocomplete="${signup ? "new-password" : "current-password"}" dir="ltr" required><small class="muted">6 أحرف على الأقل.</small></div>
  <div class="err" id="er" role="alert"></div>
  <button class="btn wide" id="go" type="submit">${signup ? "إنشاء الحساب" : "دخول"}</button></form>
  ${CONFIG.google && S.mode === "firebase" ? `<button class="btn ghost wide" id="gg" type="button">المتابعة بحساب جوجل</button>` : ""}
  <p class="alt">${signup ? 'عندك حساب؟ <a href="#/login">سجّل الدخول</a>' : 'ليس لديك حساب؟ <a href="#/signup">أنشئ حسابًا</a> · <a href="#/login?reset=1" id="rp">نسيت كلمة المرور؟</a>'}</p></div>`;
  const er = $("#er"), to = q.get("next") || "#/";
  const run = async fn => { er.textContent = ""; $("#go").disabled = true; try { await fn(); location.hash = to; } catch (e) { er.textContent = e.message; $("#go").disabled = false; } };
  $("#af").addEventListener("submit", e => { e.preventDefault(); const em = $("#em").value, pw = $("#pw").value, nm = signup ? $("#nm").value.trim() : "";
    if (signup && nm.length < 2) { er.textContent = "اكتب اسمك."; return $("#nm").focus(); }
    if (!/^\S+@\S+\.\S+$/.test(em)) { er.textContent = "اكتب بريدًا إلكترونيًا صحيحًا."; return $("#em").focus(); }
    if (pw.length < 6) { er.textContent = "كلمة المرور 6 أحرف على الأقل."; return $("#pw").focus(); }
    run(() => signup ? S.signUp(nm, em, pw) : S.logIn(em, pw)); });
  const gg = $("#gg"); if (gg) gg.addEventListener("click", () => run(() => S.google()));
  const rp = $("#rp"); if (rp) rp.addEventListener("click", async e => { e.preventDefault(); const em = $("#em").value; if (!/^\S+@\S+\.\S+$/.test(em)) { er.textContent = "اكتب بريدك أولًا ثم اضغط نسيت كلمة المرور."; return $("#em").focus(); } try { await S.resetPass(em); er.style.color = "var(--ok)"; er.textContent = "أرسلنا رابط استعادة كلمة المرور إلى بريدك."; } catch (x) { er.style.color = ""; er.textContent = x.message; } });
}

/* ---------- البحث ---------- */
function searchPage(m, qs) {
  const q = qs.toLowerCase().trim(); const hits = [];
  MAN.books.forEach(b => b.chapters.forEach(c => { const hay = [c.title, c.en || "", b.title, ...(c.terms || [])].join(" ").toLowerCase(); if (q && hay.includes(q)) hits.push({ b, c, t: (c.terms || []).filter(x => x.toLowerCase().includes(q)).slice(0, 3) }); }));
  m.innerHTML = pageHead("نتائج البحث", q ? `عن «${esc(qs)}»` : "") + `<div class="wrap"><form class="search" id="sf" role="search"><label class="sr" for="sq">بحث</label>${ic("search")}<input id="sq" type="search" value="${esc(qs)}" placeholder="ابحث عن فصل أو مصطلح"><button class="btn">بحث</button></form>
  <ul class="favlist">${hits.map(h => `<li><a href="#/read/${h.b.id}/${h.c.id}${h.t.length ? "/cards" : ""}"><b>${rich(h.c.title)}</b><span class="muted">${rich(h.b.title)}${h.t.length ? " · مصطلحات: " + h.t.map(x => `<bdi class="lt" dir="ltr">${esc(x)}</bdi>`).join("، ") : ""}</span></a></li>`).join("") || `<p class="empty">${q ? "لا توجد نتائج. جرّب كلمة أخرى أو مصطلحًا بالإنجليزية." : "اكتب ما تبحث عنه."}</p>`}</ul></div>`;
  $("#sf").addEventListener("submit", e => { e.preventDefault(); location.hash = "#/search/" + encodeURIComponent($("#sq").value.trim()); });
}

/* ---------- تشغيل ---------- */
window.addEventListener("hashchange", route);
(async () => { shell(); await S.init(); paintAcct(); route(); })();
