/* الحسابات والحالة: Firebase Auth + Firestore عند توفر الإعدادات، وإلا وضع تجريبي محلي. */
import { CONFIG } from "./config.js";
const FB = "https://www.gstatic.com/firebasejs/10.14.1/";
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const blank = () => ({ fav: {}, prog: {}, wrong: {}, hist: [] });

export let mode = "demo";           // "firebase" | "demo"
export let user = null;             // {uid, name, email} أو null
export let state = blank();
const subs = new Set();
export const subscribe = f => { subs.add(f); return () => subs.delete(f); };
const emit = () => subs.forEach(f => { try { f(); } catch (e) {} });
let fb = null, saveT = 0;
const key = () => "ds_state_" + (user ? user.uid : "guest");

export async function init() {
  const c = CONFIG.firebase;
  if (c && c.apiKey && !String(c.apiKey).startsWith("PUT_")) {
    try {
      const [a, au, fs] = await Promise.all([import(FB + "firebase-app.js"), import(FB + "firebase-auth.js"), import(FB + "firebase-firestore.js")]);
      const app = a.initializeApp(c); fb = { au, fs, auth: au.getAuth(app), db: fs.getFirestore(app) }; mode = "firebase";
      await new Promise(res => { let first = true; au.onAuthStateChanged(fb.auth, async u => { await setUser(u ? { uid: u.uid, name: u.displayName || (u.email || "").split("@")[0], email: u.email } : null); if (first) { first = false; res(); } }); });
      return;
    } catch (e) { console.warn("Firebase غير متاح، سيعمل الوضع التجريبي", e); mode = "demo"; }
  }
  const s = lsGet("ds_session", null); await setUser(s);
}
async function setUser(u) {
  user = u; state = Object.assign(blank(), lsGet(key(), {}));
  if (u && mode === "firebase") {
    try { const snap = await fb.fs.getDoc(fb.fs.doc(fb.db, "users", u.uid)); if (snap.exists()) state = merge(state, snap.data().state || {}); } catch (e) { console.warn(e); }
  }
  if (u) { const g = lsGet("ds_state_guest", null); if (g) { state = merge(state, g); localStorage.removeItem("ds_state_guest"); } }
  persist(true); emit();
}
function merge(a, b) {
  const o = blank();
  o.fav = Object.assign({}, a.fav, b.fav);
  o.wrong = Object.assign({}, a.wrong, b.wrong);
  o.prog = Object.assign({}, a.prog);
  Object.entries(b.prog || {}).forEach(([k, v]) => { const x = o.prog[k] || {}; o.prog[k] = Object.assign({}, x, v, { best: Math.max(x.best || 0, v.best || 0), attempts: Math.max(x.attempts || 0, v.attempts || 0), read: x.read || v.read, known: Array.from(new Set([...(x.known || []), ...(v.known || [])])) }); });
  o.hist = [...(a.hist || []), ...(b.hist || [])].sort((p, q) => q.ts - p.ts).slice(0, 40);
  return o;
}
function persist(now) {
  lsSet(key(), state);
  if (!(user && mode === "firebase")) return;
  clearTimeout(saveT);
  const go = () => fb.fs.setDoc(fb.fs.doc(fb.db, "users", user.uid), { name: user.name, state, updatedAt: Date.now() }, { merge: true }).catch(e => console.warn(e));
  now ? go() : (saveT = setTimeout(go, 800));
}
export function mutate(fn) { fn(state); persist(); emit(); }
export const isFav = k => !!state.fav[k];
export const toggleFav = k => mutate(s => { if (s.fav[k]) delete s.fav[k]; else s.fav[k] = Date.now(); });

/* ---- الحسابات ---- */
const sha = async t => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)))].map(b => b.toString(16).padStart(2, "0")).join("");
const errAr = e => {
  const c = (e && e.code) || e.message || "";
  const m = { "auth/email-already-in-use": "هذا البريد مسجّل من قبل. جرّب تسجيل الدخول.", "auth/invalid-email": "اكتب بريدًا إلكترونيًا صحيحًا.", "auth/weak-password": "كلمة المرور ضعيفة. استخدم 6 أحرف على الأقل.", "auth/invalid-credential": "البريد أو كلمة المرور غير صحيحين.", "auth/user-not-found": "لا يوجد حساب بهذا البريد.", "auth/wrong-password": "كلمة المرور غير صحيحة.", "auth/too-many-requests": "محاولات كثيرة. حاول بعد قليل.", "auth/network-request-failed": "لا يوجد اتصال بالإنترنت.", "auth/popup-closed-by-user": "أُغلقت نافذة تسجيل الدخول قبل أن تكتمل." };
  return m[c] || "تعذّر تنفيذ الطلب. حاول مرة أخرى.";
};
export async function signUp(name, email, pass) {
  email = email.trim().toLowerCase();
  if (mode === "firebase") {
    try { const r = await fb.au.createUserWithEmailAndPassword(fb.auth, email, pass); await fb.au.updateProfile(r.user, { displayName: name }); await setUser({ uid: r.user.uid, name, email }); return; }
    catch (e) { throw new Error(errAr(e)); }
  }
  const acc = lsGet("ds_accounts", {});
  if (acc[email]) throw new Error("هذا البريد مسجّل من قبل. جرّب تسجيل الدخول.");
  if (pass.length < 6) throw new Error("كلمة المرور ضعيفة. استخدم 6 أحرف على الأقل.");
  const uid = "d" + Date.now().toString(36); acc[email] = { uid, name, h: await sha(pass) }; lsSet("ds_accounts", acc);
  const u = { uid, name, email }; lsSet("ds_session", u); await setUser(u);
}
export async function logIn(email, pass) {
  email = email.trim().toLowerCase();
  if (mode === "firebase") { try { await fb.au.signInWithEmailAndPassword(fb.auth, email, pass); return; } catch (e) { throw new Error(errAr(e)); } }
  const a = lsGet("ds_accounts", {})[email];
  if (!a || a.h !== await sha(pass)) throw new Error("البريد أو كلمة المرور غير صحيحين.");
  const u = { uid: a.uid, name: a.name, email }; lsSet("ds_session", u); await setUser(u);
}
export async function google() {
  if (mode !== "firebase") throw new Error("تسجيل الدخول بجوجل يحتاج إعداد Firebase.");
  try { await fb.au.signInWithPopup(fb.auth, new fb.au.GoogleAuthProvider()); } catch (e) { throw new Error(errAr(e)); }
}
export async function resetPass(email) {
  if (mode !== "firebase") throw new Error("استعادة كلمة المرور تعمل بعد ربط Firebase.");
  try { await fb.au.sendPasswordResetEmail(fb.auth, email.trim()); } catch (e) { throw new Error(errAr(e)); }
}
export async function logOut() {
  if (mode === "firebase") await fb.au.signOut(fb.auth); else { localStorage.removeItem("ds_session"); await setUser(null); }
}
