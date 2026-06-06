"use client";
import React, { useState, useRef } from "react";
import {
  Search, ScanLine, X, Info, ChevronDown, AlertTriangle, CircleDot, Leaf,
  FlaskConical, ShieldQuestion, Loader2, Droplets, Filter, MapPin, Camera,
  Check, Ban, Beef, Utensils,
} from "lucide-react";
import {
  APP_NAME, APP_TAGLINE, C, WATCHLIST, FOODS, WATER, FILTER_MAP,
  band, bandColor, analyze,
} from "../lib/data";

const WL_ICONS = { tallow: Beef, seedoils: Droplets, palm: Leaf, hfcs: Droplets, dyes: FlaskConical, maltodextrin: CircleDot };

export default function Page() {
  const [tab, setTab] = useState("scan");
  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "0 18px 70px" }}>
        <header style={{ paddingTop: 28, paddingBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <FlaskConical size={20} strokeWidth={2.2} color={C.clay} />
            <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 800, fontSize: 12.5, letterSpacing: 2, textTransform: "uppercase", color: C.inkSoft }}>{APP_NAME}</span>
          </div>
          <h1 style={{ fontFamily: "'Fraunces',serif", fontWeight: 800, fontSize: 33, lineHeight: 1.04, margin: "12px 0 6px", letterSpacing: -.5 }}>{APP_TAGLINE}</h1>
          <p style={{ color: C.inkSoft, fontSize: 15, margin: 0, maxWidth: 520 }}>Scan a food, hunt for an ingredient, or check your tap water — all in plain language, no health hype.</p>
        </header>

        <div style={{ display: "flex", gap: 6, margin: "16px 0 20px", flexWrap: "wrap" }}>
          {[["scan", "Scan & Search", ScanLine], ["finder", "Ingredient Finder", Search], ["water", "Water by ZIP", Droplets]].map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)} className="tap"
              style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 14, fontWeight: 600, padding: "9px 15px", borderRadius: 11, border: `1px solid ${tab === id ? C.ink : C.line}`, background: tab === id ? C.ink : C.card, color: tab === id ? C.paper : C.inkSoft, cursor: "pointer" }}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {tab === "scan" && <ScanTool />}
        {tab === "finder" && <FinderTool />}
        {tab === "water" && <WaterTool />}

        <footer style={{ marginTop: 42, paddingTop: 18, borderTop: `1px solid ${C.line}`, fontSize: 12.5, color: C.inkSoft, lineHeight: 1.5 }}>
          {APP_NAME} shows factual, regulatory, and comparative information — not medical, safety, or dietary advice. "Lower sodium," filter suggestions, etc. reference published standards, not health outcomes. Food data via OpenFoodFacts; water via EPA SDWIS/ECHO; recalls via openFDA. Verify current status with official sources.
        </footer>
      </div>
    </div>
  );
}

/* ===================== TOOL 1: SCAN & SEARCH ===================== */
function ScanTool() {
  const [mode, setMode] = useState("name"); const [q, setQ] = useState(""); const [res, setRes] = useState([]);
  const [sel, setSel] = useState(null); const [loading, setLoading] = useState(false); const [fb, setFb] = useState(false);
  const [touched, setTouched] = useState(false); const [camMsg, setCamMsg] = useState("");
  const videoRef = useRef(null);

  async function search(e) {
    e?.preventDefault(); const term = q.trim(); if (!term) return;
    setTouched(true); setLoading(true); setSel(null); setFb(false);
    try {
      const url = mode === "barcode" ? `/api/food?barcode=${encodeURIComponent(term)}` : `/api/food?q=${encodeURIComponent(term)}`;
      const r = await fetch(url); const d = await r.json();
      if (!d.ok || !d.products || d.products.length === 0) throw new Error("none");
      setRes(d.products);
    } catch {
      const t = term.toLowerCase();
      const m = FOODS.filter(f => f.name.toLowerCase().includes(t) || f.ingredients_text.toLowerCase().includes(t));
      setRes(m.length ? m : FOODS); setFb(true);
    } finally { setLoading(false); }
  }

  async function startScan() {
    setCamMsg("");
    try {
      if (!("BarcodeDetector" in window)) { setCamMsg("This browser has no built-in barcode reader. Use manual entry, or add a scanner library (e.g. @zxing/browser) later."); return; }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      const det = new window.BarcodeDetector({ formats: ["ean_13", "upc_a", "ean_8", "upc_e"] });
      const tick = async () => { try { const codes = await det.detect(videoRef.current); if (codes.length) { stream.getTracks().forEach(t => t.stop()); setMode("barcode"); setQ(codes[0].rawValue); } else requestAnimationFrame(tick); } catch { requestAnimationFrame(tick); } };
      tick();
    } catch { setCamMsg("Camera access was blocked. Allow camera permission in your browser, then try again — or just type the barcode."); }
  }

  return (<div>
    <form onSubmit={search}>
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {[["name", "By name", Search], ["barcode", "By barcode", ScanLine]].map(([m, l, Ic]) => (
          <button type="button" key={m} onClick={() => setMode(m)} className="tap" style={chip(mode === m)}><Ic size={15} /> {l}</button>
        ))}
        <button type="button" onClick={startScan} className="tap" style={{ ...chip(false), borderColor: C.clay, color: C.clay }}><Camera size={15} /> Scan with camera</button>
      </div>
      <video ref={videoRef} style={{ display: "none" }} muted playsInline />
      {camMsg && <div className="rise" style={note(C.amberBg)}><Info size={16} color={C.amber} style={{ marginTop: 1, flexShrink: 0 }} /><span>{camMsg}</span></div>}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <div style={inputWrap}><Search size={18} color={C.inkSoft} /><input value={q} onChange={e => setQ(e.target.value)} inputMode={mode === "barcode" ? "numeric" : "text"} placeholder={mode === "barcode" ? "Enter or scan a barcode…" : "e.g. tortilla chips, cola, bread…"} style={inputStyle} />{q && <button type="button" onClick={() => setQ("")} style={xBtn}><X size={17} /></button>}</div>
        <button type="submit" className="tap" style={goBtn}>{loading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : "Search"}</button>
      </div>
    </form>

    {!touched && <Chips items={FOODS} onPick={(f) => { setSel(f); setTouched(true); }} get={(f) => f.name.replace("Example: ", "")} />}
    {fb && <FallbackNote what="food products" />}
    {res.length > 0 && !sel && <div style={{ marginTop: 20, display: "grid", gap: 9 }}>{res.map((p, i) => (
      <button key={i} onClick={() => setSel(p)} className="tap rise" style={{ animationDelay: `${i * 35}ms`, ...rowBtn }}>
        {p.image ? <img src={p.image} alt="" style={thumb} /> : <div style={{ ...thumb, ...thumbFallback }}><Leaf size={20} color={C.sage} /></div>}
        <div style={{ flex: 1, minWidth: 0 }}><div style={rowTitle}>{p.name}</div>{p.brand && <div style={rowSub}>{p.brand}</div>}</div>
        <ChevronDown size={18} color={C.inkSoft} style={{ transform: "rotate(-90deg)" }} />
      </button>))}</div>}
    {sel && <Detail prod={sel} onBack={() => setSel(null)} />}
  </div>);
}

/* ===================== TOOL 2: INGREDIENT FINDER ===================== */
function FinderTool() {
  const [active, setActive] = useState(null); const [polarity, setPolarity] = useState("with");
  const [custom, setCustom] = useState(""); const [res, setRes] = useState([]); const [loading, setLoading] = useState(false);
  const [fb, setFb] = useState(false); const [sel, setSel] = useState(null); const [ran, setRan] = useState(false);

  function termsFor() { if (active) { const w = WATCHLIST.find(x => x.id === active); return { label: w.label, terms: w.terms }; } if (custom.trim()) return { label: custom.trim(), terms: [custom.trim().toLowerCase()] }; return null; }
  function applyPolarity(list, terms, pol) { return list.filter(p => { const has = terms.some(t => (p.ingredients_text || "").toLowerCase().includes(t)); return pol === "with" ? has : !has; }); }

  async function run() {
    const s = termsFor(); if (!s) return; setLoading(true); setRan(true); setSel(null); setFb(false);
    try {
      const r = await fetch(`/api/food?q=${encodeURIComponent(s.terms[0])}`); const d = await r.json();
      if (!d.ok) throw new Error("none");
      let products = applyPolarity(d.products || [], s.terms, polarity);
      if (!products.length) throw new Error("none");
      setRes(products);
    } catch { setRes(applyPolarity(FOODS, s.terms, polarity)); setFb(true); }
    finally { setLoading(false); }
  }

  return (<div>
    <p style={{ fontSize: 14.5, color: C.inkSoft, margin: "0 0 14px" }}>Pick what you care about, then find products that <b style={{ color: C.ink }}>contain</b> it — or are <b style={{ color: C.ink }}>made without</b> it.</p>
    <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
      {[["with", "Made WITH it", Check], ["without", "Made WITHOUT it", Ban]].map(([p, l, Ic]) => (
        <button key={p} onClick={() => setPolarity(p)} className="tap" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 600, padding: "8px 13px", borderRadius: 999, border: `1px solid ${polarity === p ? (p === "with" ? C.clay : C.sage) : C.line}`, background: polarity === p ? (p === "with" ? C.clay : C.sage) : C.card, color: polarity === p ? "#fff" : C.inkSoft, cursor: "pointer" }}><Ic size={15} /> {l}</button>
      ))}
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
      {WATCHLIST.map(w => { const Ic = WL_ICONS[w.id] || CircleDot; const on = active === w.id; return (
        <button key={w.id} onClick={() => { setActive(on ? null : w.id); setCustom(""); }} className="tap" style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 13px", borderRadius: 10, border: `1px solid ${on ? C.ink : C.line}`, background: on ? C.ink : C.card, color: on ? C.paper : C.ink, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
          <Ic size={15} /> {w.label}
        </button>); })}
    </div>
    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
      <div style={inputWrap}><Search size={18} color={C.inkSoft} /><input value={custom} onChange={e => { setCustom(e.target.value); setActive(null); }} placeholder="…or type any ingredient (e.g. carrageenan)" style={inputStyle} /></div>
      <button onClick={run} className="tap" style={goBtn}>{loading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : "Find"}</button>
    </div>
    {fb && <FallbackNote what="products" />}
    {ran && !loading && res.length === 0 && <div style={note(C.sageBg)}><Info size={16} color={C.sage} style={{ marginTop: 1 }} /><span>No matching products in the available set. Try the other toggle or a different ingredient.</span></div>}
    {res.length > 0 && !sel && <div style={{ marginTop: 6, display: "grid", gap: 9 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.inkSoft }}>{res.length} product{res.length > 1 ? "s" : ""} {polarity === "with" ? "containing" : "made without"} {termsFor()?.label}</div>
      {res.map((p, i) => (<button key={i} onClick={() => setSel(p)} className="tap rise" style={{ animationDelay: `${i * 30}ms`, ...rowBtn }}>
        {p.image ? <img src={p.image} alt="" style={thumb} /> : <div style={{ ...thumb, ...thumbFallback }}><Utensils size={18} color={C.sage} /></div>}
        <div style={{ flex: 1, minWidth: 0 }}><div style={rowTitle}>{p.name}</div>{p.brand && <div style={rowSub}>{p.brand}</div>}</div>
        <ChevronDown size={18} color={C.inkSoft} style={{ transform: "rotate(-90deg)" }} />
      </button>))}
    </div>}
    {sel && <Detail prod={sel} onBack={() => setSel(null)} />}
  </div>);
}

/* ===================== TOOL 3: WATER BY ZIP ===================== */
function WaterTool() {
  const [zip, setZip] = useState(""); const [data, setData] = useState(null); const [loading, setLoading] = useState(false);
  const [fb, setFb] = useState(false); const [err, setErr] = useState("");

  async function lookup(e) {
    e?.preventDefault(); const z = zip.trim(); if (z.length < 5) { setErr("Enter a 5-digit ZIP code."); return; }
    setErr(""); setLoading(true); setData(null); setFb(false);
    try {
      const r = await fetch(`/api/water?zip=${z}`); const d = await r.json();
      if (!d.ok || !d.system) throw new Error("none");
      setData({ ...d.system, live: true });
    } catch {
      const key = z.slice(0, 2); const sample = WATER[key] || WATER["90"];
      setData({ ...sample, live: false }); setFb(true);
    } finally { setLoading(false); }
  }

  return (<div>
    <p style={{ fontSize: 14.5, color: C.inkSoft, margin: "0 0 14px" }}>Enter your ZIP to find the water system serving your area, any reported violations, and which <b style={{ color: C.ink }}>certified filter type</b> matches the contaminants on record.</p>
    <form onSubmit={lookup} style={{ display: "flex", gap: 8 }}>
      <div style={inputWrap}><MapPin size={18} color={C.inkSoft} /><input value={zip} onChange={e => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))} inputMode="numeric" placeholder="5-digit ZIP code" style={inputStyle} /></div>
      <button type="submit" className="tap" style={{ ...goBtn, background: C.blue }}>{loading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : "Check"}</button>
    </form>
    {err && <div style={{ fontSize: 13, color: C.clay, marginTop: 8, fontWeight: 600 }}>{err}</div>}
    {!data && !loading && <div style={{ marginTop: 14 }}><div style={{ fontSize: 12.5, fontWeight: 600, color: C.inkSoft, marginBottom: 9 }}>TRY A SAMPLE ZIP</div><div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>{[["90210", "Los Angeles, CA"], ["07030", "Hoboken, NJ"], ["85001", "Phoenix, AZ"], ["53202", "Milwaukee, WI"]].map(([z, n]) => (<button key={z} onClick={() => setZip(z)} className="tap" style={{ fontSize: 13.5, fontWeight: 500, padding: "7px 12px", borderRadius: 9, border: `1px solid ${C.line}`, background: C.card, color: C.ink, cursor: "pointer" }}>{z} · {n}</button>))}</div></div>}
    {fb && <FallbackNote what="water systems" extra="Live EPA query wasn't reachable, so this is an illustrative example system." />}
    {data && <WaterResult d={data} />}
  </div>);
}

function WaterResult({ d }) {
  const filters = (d.contaminants || []).map(c => FILTER_MAP[c]).filter(Boolean);
  return (<div className="rise" style={{ marginTop: 20 }}>
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Droplets size={22} color={C.blue} /><div>
        <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 800, fontSize: 22, margin: 0, lineHeight: 1.1 }}>{d.name}</h2>
        <div style={{ fontSize: 13, color: C.inkSoft }}>{d.state ? d.state + " · " : ""}{d.pwsid ? `PWSID ${d.pwsid} · ` : ""}Serves {d.pop}</div>
      </div></div>
      <div style={{ marginTop: 18 }}><SecLabel>Reported violations</SecLabel>
        {(!d.violations || d.violations.length === 0) ? <p style={{ fontSize: 14, color: C.inkSoft, marginTop: 8 }}>No violations on record in the available data.</p> :
          <div style={{ marginTop: 9, display: "grid", gap: 8 }}>{d.violations.map((v, i) => (<div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: C.clayBg, border: `1px solid ${C.line}`, borderRadius: 10, padding: "11px 13px" }}><AlertTriangle size={16} color={C.clay} style={{ marginTop: 2, flexShrink: 0 }} /><div><div style={{ fontWeight: 600, fontSize: 14.5 }}>{v.type}</div><div style={{ fontSize: 12.5, color: C.inkSoft }}>{v.date} · {v.status}</div></div></div>))}</div>}
      </div>
      <div style={{ marginTop: 20 }}><SecLabel>Contaminants on record → certified filter type</SecLabel>
        {filters.length === 0 ? <p style={{ fontSize: 14, color: C.inkSoft, marginTop: 8 }}>{d.live ? "Live contaminant detail comes from parsing the violation feed — refine the mapping in app/api/water/route.js." : "None flagged in this example."}</p> :
          <div style={{ marginTop: 9, display: "grid", gap: 9 }}>{filters.map((f, i) => (<div key={i} style={{ background: f.t === "hazard" ? C.clayBg : f.t === "watch" ? C.amberBg : C.blueBg, border: `1px solid ${C.line}`, borderRadius: 12, padding: "13px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}><Filter size={16} color={f.t === "hazard" ? C.clay : f.t === "watch" ? C.amber : C.blue} /><span style={{ fontWeight: 700, fontSize: 15 }}>{f.name}</span></div>
            <div style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.5 }}>Look for a filter <b>certified to {f.std}</b>.</div>
          </div>))}</div>}
      </div>
      <div style={{ ...note(C.blueBg), marginTop: 16 }}><Info size={16} color={C.blue} style={{ marginTop: 1, flexShrink: 0 }} /><span>Filter suggestions reference NSF/ANSI certification standards for reducing specific contaminants — not a statement about your water's safety. Check your utility's annual Consumer Confidence Report for current testing.</span></div>
    </div>
  </div>);
}

/* ===================== shared product detail ===================== */
function Detail({ prod, onBack }) {
  const flags = analyze(prod); const nv = { 1: "Unprocessed / minimally processed", 2: "Processed culinary ingredient", 3: "Processed food", 4: "Ultra-processed" };
  return (<div className="rise" style={{ marginTop: 20 }}>
    <button onClick={onBack} className="tap" style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: C.inkSoft, fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 12, fontFamily: "inherit" }}><ChevronDown size={16} style={{ transform: "rotate(90deg)" }} /> Back</button>
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 20 }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>{prod.image && <img src={prod.image} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 10 }} />}<div><h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 800, fontSize: 23, margin: "0 0 3px", lineHeight: 1.1 }}>{prod.name}</h2>{prod.brand && <div style={{ color: C.inkSoft, fontSize: 14 }}>{prod.brand}</div>}</div></div>
      {prod.nova && <div style={{ marginTop: 15, display: "inline-flex", alignItems: "center", gap: 8, background: prod.nova === 4 ? C.amberBg : C.sageBg, border: `1px solid ${C.line}`, borderRadius: 9, padding: "8px 12px" }}><CircleDot size={15} color={prod.nova === 4 ? C.amber : C.sage} /><span style={{ fontSize: 13.5, fontWeight: 600 }}>Processing: {nv[prod.nova]} (NOVA {prod.nova})</span></div>}
      <div style={{ marginTop: 18 }}><SecLabel>Per 100g — vs. a published guide</SecLabel><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(92px,1fr))", gap: 8, marginTop: 9 }}>
        <Nut l="Calories" v={prod.n.energy} u="kcal" /><Nut l="Sugars" v={prod.n.sugars} u="g" b={band("sugar", prod.n.sugars)} /><Nut l="Sodium" v={prod.n.sodium} u="mg" b={band("sodium", prod.n.sodium)} /><Nut l="Sat. fat" v={prod.n.sat} u="g" b={band("sat", prod.n.sat)} /><Nut l="Protein" v={prod.n.protein} u="g" /><Nut l="Fiber" v={prod.n.fiber} u="g" />
      </div></div>
      <div style={{ marginTop: 20 }}><SecLabel>Ingredients of note ({flags.length})</SecLabel>{flags.length === 0 ? <p style={{ fontSize: 14, color: C.inkSoft, marginTop: 8 }}>No additives from the reference list were detected.</p> : <div style={{ marginTop: 10, display: "grid", gap: 9 }}>{flags.map(f => <Flag key={f.name} f={f} />)}</div>}</div>
      <div style={{ ...note(C.sageBg), marginTop: 18 }}><ShieldQuestion size={16} color={C.sage} style={{ marginTop: 1, flexShrink: 0 }} /><span>Recall check queries the openFDA enforcement database — add an /api/recall route to wire it up.</span></div>
      {prod.ingredients_text && <details style={{ marginTop: 14 }}><summary style={{ cursor: "pointer", fontSize: 13.5, fontWeight: 600, color: C.inkSoft }}>Full ingredient list</summary><p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 8 }}>{prod.ingredients_text}</p></details>}
    </div>
  </div>);
}

function Flag({ f }) {
  const [o, setO] = useState(false);
  const cfg = { restricted: { bg: C.clayBg, dot: C.clay, Icon: AlertTriangle, tag: "Restricted in some regions" }, debated: { bg: C.amberBg, dot: C.amber, Icon: Info, tag: "Mixed evidence / debated" }, common: { bg: C.sageBg, dot: C.sage, Icon: Leaf, tag: "Widely permitted" } }[f.status];
  const { Icon } = cfg;
  return (<div style={{ background: cfg.bg, border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden" }}>
    <button onClick={() => setO(!o)} className="tap" style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 11, padding: "13px 14px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}><Icon size={18} color={cfg.dot} style={{ flexShrink: 0 }} /><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 15 }}>{f.name}</div><div style={{ fontSize: 12.5, fontWeight: 600, color: cfg.dot }}>{cfg.tag}</div></div><ChevronDown size={18} color={C.inkSoft} style={{ transform: o ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }} /></button>
    {o && <div className="rise" style={{ padding: "0 14px 14px 43px", fontSize: 13.5, lineHeight: 1.55 }}><p style={{ margin: "0 0 8px" }}>{f.what}</p><p style={{ margin: "0 0 8px", color: C.inkSoft }}>{f.note}</p><div style={{ fontSize: 12, fontWeight: 700, color: C.inkSoft }}>{f.regions}</div></div>}
  </div>);
}

/* ---------------- small shared bits ---------------- */
const SecLabel = ({ children }) => <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: C.inkSoft }}>{children}</div>;
function Nut({ l, v, u, b }) { const has = v != null && !isNaN(v); const col = b ? bandColor[b.level] : C.ink; return (<div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 11px" }}><div style={{ fontSize: 12, color: C.inkSoft, fontWeight: 500 }}>{l}</div><div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 18, marginTop: 2 }}>{has ? Math.round(v * 10) / 10 : "—"}<span style={{ fontSize: 12, color: C.inkSoft, fontWeight: 400 }}> {has ? u : ""}</span></div>{b && <div style={{ fontSize: 11, fontWeight: 700, color: col, marginTop: 2, textTransform: "capitalize" }}>{b.level}</div>}</div>); }
function Chips({ items, onPick, get }) { return (<div className="rise" style={{ marginTop: 20 }}><div style={{ fontSize: 12.5, fontWeight: 600, color: C.inkSoft, marginBottom: 9 }}>OR TRY A SAMPLE</div><div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{items.map((it, i) => (<button key={i} onClick={() => onPick(it)} className="tap" style={{ fontSize: 13.5, fontWeight: 500, padding: "7px 12px", borderRadius: 9, border: `1px solid ${C.line}`, background: C.card, color: C.ink, cursor: "pointer" }}>{get(it)}</button>))}</div></div>); }
const FallbackNote = ({ what, extra }) => <div className="rise" style={{ ...note(C.amberBg), marginTop: 16 }}><Info size={16} color={C.amber} style={{ marginTop: 1, flexShrink: 0 }} /><span>{extra || `Live lookup wasn't reachable, so these are built-in sample ${what}.`}</span></div>;

const chip = (on) => ({ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 600, padding: "8px 13px", borderRadius: 999, border: `1px solid ${on ? C.ink : C.line}`, background: on ? C.ink : C.card, color: on ? C.paper : C.inkSoft, cursor: "pointer" });
const inputWrap = { flex: 1, display: "flex", alignItems: "center", gap: 9, background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "0 14px" };
const inputStyle = { flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 16, padding: "13px 0", color: C.ink, fontFamily: "inherit" };
const xBtn = { border: "none", background: "none", cursor: "pointer", color: C.inkSoft };
const goBtn = { background: C.clay, color: "#fff", border: "none", borderRadius: 12, padding: "0 20px", fontWeight: 700, fontSize: 15, cursor: "pointer", minWidth: 78, display: "flex", alignItems: "center", justifyContent: "center" };
const rowBtn = { textAlign: "left", display: "flex", alignItems: "center", gap: 13, background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 12, cursor: "pointer" };
const thumb = { width: 46, height: 46, objectFit: "cover", borderRadius: 8, flexShrink: 0 };
const thumbFallback = { background: C.sageBg, display: "flex", alignItems: "center", justifyContent: "center" };
const rowTitle = { fontWeight: 600, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const rowSub = { fontSize: 13, color: C.inkSoft };
const note = (bg) => ({ display: "flex", gap: 9, alignItems: "flex-start", background: bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: "11px 13px", fontSize: 13.5, color: C.inkSoft, marginTop: 10 });
