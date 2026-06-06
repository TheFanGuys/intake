import React, { useState, useRef } from "react";
import {
  Search, ScanLine, X, Info, ChevronDown, AlertTriangle, CircleDot, Leaf,
  FlaskConical, ShieldQuestion, Loader2, Droplets, Filter, MapPin, Camera,
  Check, Ban, Beef, Utensils,
} from "lucide-react";

/*  PLAIN LABEL — three tools, one app
    1) Scan & Search   — barcode + name lookup (OpenFoodFacts)
    2) Ingredient Finder — find products WITH or WITHOUT an ingredient (e.g. beef tallow, seed oils)
    3) Water by ZIP    — local water system, violations, contaminants → certified filter type (EPA)
    No medical claims. Factual, comparative, regulatory language only.            */

const C = {
  paper: "#f4efe6", card: "#fffdf8", ink: "#211c16", inkSoft: "#6b6358",
  line: "#e3dccd", clay: "#b9583b", amber: "#c98a2b", sage: "#5f7a52",
  blue: "#3f6f86", sageBg: "#eef1e8", amberBg: "#f8efdc", clayBg: "#f7e6df", blueBg: "#e6eef2",
};

/* ---------------- additive knowledge base ---------------- */
const KB = [
  { keys: ["e102","tartrazine","yellow 5"], name:"Tartrazine (Yellow 5)", what:"Synthetic yellow color.", status:"restricted", note:"EU requires an on-pack notice that it may affect activity and attention in children. Permitted in the US.", regions:"Label required: EU/UK" },
  { keys: ["e129","allura red","red 40"], name:"Allura Red (Red 40)", what:"Synthetic red color, very common in US foods.", status:"restricted", note:"Carries an EU activity/attention notice; some US states are restricting dyes in school foods.", regions:"Label required: EU/UK" },
  { keys: ["e127","erythrosine","red 3","red no. 3"], name:"Erythrosine (Red 3)", what:"Synthetic cherry-red color.", status:"restricted", note:"FDA announced in Jan 2025 it is revoking authorization for Red No. 3 in food, with a phase-out window.", regions:"Phasing out: US" },
  { keys: ["e924","potassium bromate"], name:"Potassium bromate", what:"Flour strengthener.", status:"restricted", note:"IARC: possibly carcinogenic. Banned for food in EU/UK/Canada; California requires a label.", regions:"Banned: EU/UK/Canada" },
  { keys: ["partially hydrogenated","hydrogenated oil","trans fat"], name:"Partially hydrogenated oil (trans fat)", what:"Processed oil for shelf life/texture.", status:"restricted", note:"FDA removed its GRAS status; no longer permitted to be added to US foods.", regions:"Not permitted: US/EU" },
  { keys: ["e171","titanium dioxide"], name:"Titanium dioxide", what:"White color/brightener.", status:"restricted", note:"EU banned it as a food additive in 2022; permitted in the US.", regions:"Banned: EU" },
  { keys: ["brominated vegetable oil","bvo"], name:"Brominated vegetable oil (BVO)", what:"Emulsifier formerly in some citrus sodas.", status:"restricted", note:"FDA revoked authorization for BVO in food in 2024.", regions:"Not permitted: US/EU" },
  { keys: ["e320","bha"], name:"BHA", what:"Antioxidant preservative.", status:"debated", note:"Listed by the US National Toxicology Program as reasonably anticipated to be a carcinogen (animal data). Still permitted.", regions:"Permitted, debated" },
  { keys: ["e321","bht"], name:"BHT", what:"Antioxidant preservative.", status:"debated", note:"Permitted; evidence mixed. Some makers have removed it on consumer preference.", regions:"Permitted, debated" },
  { keys: ["e951","aspartame"], name:"Aspartame", what:"Low-calorie sweetener.", status:"debated", note:"IARC (2023): possibly carcinogenic, while the FAO/WHO committee kept its intake limit unchanged. Contains phenylalanine (matters for PKU).", regions:"Permitted: US/EU" },
  { keys: ["e250","sodium nitrite"], name:"Sodium nitrite", what:"Curing salt in bacon/ham/hot dogs.", status:"debated", note:"IARC links processed meat (group 1) to colorectal cancer; nitrites are part of that. Permitted with limits.", regions:"Permitted with limits" },
  { keys: ["e150d","caramel color"], name:"Caramel color (Class IV)", what:"Brown coloring for colas/sauces.", status:"debated", note:"Some types contain 4-MEI, listed under California Prop 65 above set levels.", regions:"Labeled above limits: CA" },
  { keys: ["e621","monosodium glutamate","msg"], name:"MSG", what:"Savory flavor enhancer.", status:"common", note:"Repeatedly reviewed and permitted; large reviews have not confirmed the widely-reported reactions.", regions:"Permitted: US/EU" },
  { keys: ["e407","carrageenan"], name:"Carrageenan", what:"Seaweed thickener.", status:"debated", note:"Permitted; some studies raise digestive questions about degraded forms.", regions:"Permitted: US/EU" },
  { keys: ["e330","citric acid"], name:"Citric acid", what:"Acidity regulator / tart flavor.", status:"common", note:"One of the most common food acids.", regions:"Permitted: US/EU" },
  { keys: ["e322","lecithin","soy lecithin"], name:"Lecithin", what:"Emulsifier (often soy/sunflower).", status:"common", note:"Naturally occurring emulsifier.", regions:"Permitted: US/EU" },
  { keys: ["maltodextrin"], name:"Maltodextrin", what:"Starch-derived thickener/filler.", status:"debated", note:"Permitted; high glycemic index is sometimes flagged by consumers.", regions:"Permitted: US/EU" },
];
const findEntry = (t) => { const x=t.toLowerCase().replace(/^en:/,"").trim(); return KB.find(e=>e.keys.some(k=>x===k||x.includes(k)||k.includes(x))); };
const scanText = (txt) => { if(!txt) return []; const l=txt.toLowerCase(); const s=new Set(); KB.forEach(e=>{if(e.keys.some(k=>l.includes(k)))s.add(e);}); return [...s]; };

/* ---------------- ingredient finder watchlist ---------------- */
const WATCHLIST = [
  { id:"tallow", label:"Beef tallow", icon:Beef, terms:["beef tallow","tallow"] },
  { id:"seedoils", label:"Seed oils", icon:Droplets, terms:["soybean oil","canola oil","sunflower oil","safflower oil","cottonseed oil","grapeseed oil","corn oil","vegetable oil"] },
  { id:"palm", label:"Palm oil", icon:Leaf, terms:["palm oil","palm kernel"] },
  { id:"hfcs", label:"High-fructose corn syrup", icon:Droplets, terms:["high fructose corn syrup","high-fructose corn syrup"] },
  { id:"dyes", label:"Artificial dyes", icon:FlaskConical, terms:["red 40","yellow 5","yellow 6","blue 1","red 3","allura","tartrazine"] },
  { id:"maltodextrin", label:"Maltodextrin", icon:CircleDot, terms:["maltodextrin"] },
];

/* ---------------- nutrition bands (UK FSA per-100g guide) ---------------- */
function band(n,v){ if(v==null||isNaN(v))return null; const g={sugar:{low:5,high:22.5},sat:{low:1.5,high:5},sodium:{low:120,high:600}}[n]; if(!g)return null; let level="moderate"; if(v<=g.low)level="lower"; else if(v>g.high)level="higher"; return {level}; }
const bandColor={lower:C.sage,moderate:C.amber,higher:C.clay};

/* ---------------- sample foods (offline demo + fallback) ---------------- */
const FOODS = [
  { name:"Example: Tallow-Fried Tortilla Chips", brand:"Sample", nova:3, ingredients_text:"Corn, beef tallow, sea salt.", n:{energy:480,sugars:0.5,sodium:320,sat:5,protein:6,fiber:5} },
  { name:"Example: Classic Potato Chips", brand:"Sample", nova:4, ingredients_text:"Potatoes, vegetable oil (sunflower, corn, canola), salt.", n:{energy:540,sugars:0.2,sodium:500,sat:4,protein:6,fiber:4} },
  { name:"Example: Neon Sports Drink", brand:"Sample", nova:4, ingredients_text:"Water, high fructose corn syrup, citric acid, sodium benzoate, sucralose, Yellow 5, Blue 1.", n:{energy:38,sugars:9,sodium:45,sat:0,protein:0,fiber:0} },
  { name:"Example: Sandwich Bread", brand:"Sample", nova:4, ingredients_text:"Enriched wheat flour, water, sugar, soybean oil, potassium bromate, ascorbic acid.", n:{energy:265,sugars:4.5,sodium:480,sat:0.8,protein:8,fiber:2.4} },
  { name:"Example: Cured Bacon", brand:"Sample", nova:4, ingredients_text:"Pork, salt, sugar, sodium nitrite, BHA, BHT.", n:{energy:400,sugars:1,sodium:1300,sat:12,protein:12,fiber:0} },
  { name:"Example: Beef Tallow Fries", brand:"Sample", nova:3, ingredients_text:"Potatoes, beef tallow, salt.", n:{energy:310,sugars:0.4,sodium:300,sat:6,protein:4,fiber:4} },
  { name:"Example: Plain Greek Yogurt", brand:"Sample", nova:1, ingredients_text:"Cultured pasteurized milk, live active cultures.", n:{energy:97,sugars:4,sodium:36,sat:1.5,protein:9,fiber:0} },
  { name:"Example: Peanut Butter (No Oils)", brand:"Sample", nova:2, ingredients_text:"Dry roasted peanuts, salt.", n:{energy:590,sugars:5,sodium:430,sat:8,protein:25,fiber:6} },
  { name:"Example: Microwave Popcorn", brand:"Sample", nova:4, ingredients_text:"Popcorn, palm oil, salt, artificial butter flavor, maltodextrin.", n:{energy:500,sugars:0.5,sodium:700,sat:9,protein:7,fiber:8} },
  { name:"Example: Diet Cola", brand:"Sample", nova:4, ingredients_text:"Carbonated water, caramel color, aspartame, phosphoric acid, citric acid, caffeine.", n:{energy:1,sugars:0,sodium:28,sat:0,protein:0,fiber:0} },
];

function normLive(p){ const u=p.nutriments||{}; return { name:p.product_name||"Unnamed product", brand:p.brands||"", image:p.image_front_small_url||p.image_url||null, nova:p.nova_group||null, ingredients_text:p.ingredients_text_en||p.ingredients_text||"", additives_tags:p.additives_tags||[], n:{ energy:u["energy-kcal_100g"], sugars:u["sugars_100g"], sodium:u["sodium_100g"]!=null?u["sodium_100g"]*1000:null, sat:u["saturated-fat_100g"], protein:u["proteins_100g"], fiber:u["fiber_100g"] } }; }
function analyze(p){ const m=new Map(); (p.additives_tags||[]).forEach(t=>{const e=findEntry(t);if(e)m.set(e.name,e);}); scanText(p.ingredients_text).forEach(e=>m.set(e.name,e)); const o={restricted:0,debated:1,common:2}; return [...m.values()].sort((a,b)=>o[a.status]-o[b.status]); }

/* ---------------- water: contaminant → certified filter type ---------------- */
const FILTER_MAP = {
  lead:        { name:"Lead",                         std:"NSF/ANSI 53 (carbon block) or 58 (reverse osmosis)", t:"hazard" },
  pfas:        { name:"PFAS (PFOA/PFOS, 'forever chemicals')", std:"NSF/ANSI 53, P473, or 58 (reverse osmosis)", t:"hazard" },
  nitrate:     { name:"Nitrate / Nitrite",            std:"NSF/ANSI 58 (reverse osmosis) or 53 ion-exchange", t:"hazard" },
  arsenic:     { name:"Arsenic",                       std:"NSF/ANSI 58 (reverse osmosis)", t:"hazard" },
  tthm:        { name:"Disinfection byproducts (TTHM/HAA5)", std:"NSF/ANSI 53 (carbon)", t:"watch" },
  copper:      { name:"Copper",                        std:"NSF/ANSI 53 (carbon block) or 58 (RO)", t:"watch" },
  coliform:    { name:"Total coliform / bacteria",     std:"Microbiological — follow utility guidance; UV or NSF 53 cyst-rated", t:"hazard" },
  chlorine:    { name:"Chlorine / taste & odor",       std:"NSF/ANSI 42 (carbon)", t:"taste" },
};

/* sample water systems keyed by ZIP prefix for demo */
const WATER = {
  "90": { pwsid:"CA0000123", name:"Example Metro Water District", pop:"~310,000", state:"CA",
    contaminants:["lead","tthm","chlorine"], violations:[ {type:"Lead Action Level Exceedance", date:"2024", status:"Returned to compliance"}, {type:"TTHM (disinfection byproducts) MCL", date:"2023", status:"Resolved"} ] },
  "07": { pwsid:"NJ0000456", name:"Example Township Utilities", pop:"~58,000", state:"NJ",
    contaminants:["pfas","lead","chlorine"], violations:[ {type:"PFOA/PFOS above state MCL", date:"2024", status:"Under treatment upgrade"} ] },
  "53": { pwsid:"WI0000789", name:"Example Lakeside Water Works", pop:"~120,000", state:"WI",
    contaminants:["chlorine"], violations:[] },
  "85": { pwsid:"AZ0000321", name:"Example Desert Regional Water", pop:"~95,000", state:"AZ",
    contaminants:["arsenic","nitrate","chlorine"], violations:[ {type:"Arsenic MCL exceedance", date:"2023", status:"Monitoring"} ] },
};

/* ===================================================================== */
export default function App(){
  const [tab,setTab]=useState("scan");
  return (
    <div style={{background:C.paper,color:C.ink,minHeight:"100%",fontFamily:"'Hanken Grotesk',system-ui,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,800&family=Hanken+Grotesk:wght@400;500;600;700&display=swap');
        @keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .rise{animation:rise .45s cubic-bezier(.2,.8,.2,1) both}
        .tap{transition:transform .12s,background .15s,border-color .15s}.tap:active{transform:scale(.98)}
      `}</style>
      <div style={{maxWidth:780,margin:"0 auto",padding:"0 18px 70px"}}>
        <header style={{paddingTop:28,paddingBottom:8}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <FlaskConical size={20} strokeWidth={2.2} color={C.clay}/>
            <span style={{fontFamily:"'Fraunces',serif",fontWeight:800,fontSize:12.5,letterSpacing:2,textTransform:"uppercase",color:C.inkSoft}}>Plain Label</span>
          </div>
          <h1 style={{fontFamily:"'Fraunces',serif",fontWeight:800,fontSize:33,lineHeight:1.04,margin:"12px 0 6px",letterSpacing:-.5}}>Know what's in it.</h1>
          <p style={{color:C.inkSoft,fontSize:15,margin:0,maxWidth:520}}>Scan a food, hunt for an ingredient, or check your tap water — all in plain language, no health hype.</p>
        </header>

        <div style={{display:"flex",gap:6,margin:"16px 0 20px",flexWrap:"wrap"}}>
          {[["scan","Scan & Search",ScanLine],["finder","Ingredient Finder",Search],["water","Water by ZIP",Droplets]].map(([id,label,Icon])=>(
            <button key={id} onClick={()=>setTab(id)} className="tap"
              style={{display:"flex",alignItems:"center",gap:7,fontSize:14,fontWeight:600,padding:"9px 15px",borderRadius:11,
                border:`1px solid ${tab===id?C.ink:C.line}`,background:tab===id?C.ink:C.card,color:tab===id?C.paper:C.inkSoft,cursor:"pointer"}}>
              <Icon size={16}/> {label}
            </button>
          ))}
        </div>

        {tab==="scan" && <ScanTool/>}
        {tab==="finder" && <FinderTool/>}
        {tab==="water" && <WaterTool/>}

        <footer style={{marginTop:42,paddingTop:18,borderTop:`1px solid ${C.line}`,fontSize:12.5,color:C.inkSoft,lineHeight:1.5}}>
          Plain Label shows factual, regulatory, and comparative information — not medical, safety, or dietary advice. "Lower sodium," filter suggestions, etc. reference published standards, not health outcomes. Food data via OpenFoodFacts; water via EPA SDWIS/ECHO; recalls via openFDA. Verify current status with official sources.
        </footer>
      </div>
    </div>
  );
}

/* ===================== TOOL 1: SCAN & SEARCH ===================== */
function ScanTool(){
  const [mode,setMode]=useState("name"); const [q,setQ]=useState(""); const [res,setRes]=useState([]);
  const [sel,setSel]=useState(null); const [loading,setLoading]=useState(false); const [fb,setFb]=useState(false);
  const [touched,setTouched]=useState(false); const [camMsg,setCamMsg]=useState("");
  const videoRef=useRef(null);

  async function search(e){ e?.preventDefault(); const term=q.trim(); if(!term)return;
    setTouched(true);setLoading(true);setSel(null);setFb(false);
    try{ let products=[];
      const fields="product_name,brands,image_front_small_url,image_url,nova_group,ingredients_text,ingredients_text_en,additives_tags,nutriments";
      if(mode==="barcode"){ const r=await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(term)}.json?fields=${fields}`); const d=await r.json(); if(d?.product&&(d.product.product_name||d.product.ingredients_text))products=[normLive(d.product)]; }
      else{ const r=await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(term)}&search_simple=1&action=process&json=1&page_size=16&fields=${fields}`); const d=await r.json(); products=(d.products||[]).filter(p=>p.product_name&&(p.ingredients_text||p.ingredients_text_en)).map(normLive); }
      if(!products.length) throw new Error("none"); setRes(products);
    }catch{ const t=term.toLowerCase(); const m=FOODS.filter(f=>f.name.toLowerCase().includes(t)||f.ingredients_text.toLowerCase().includes(t)); setRes(m.length?m:FOODS); setFb(true);
    }finally{setLoading(false);}
  }

  async function startScan(){
    setCamMsg("");
    try{
      if(!("BarcodeDetector" in window)) { setCamMsg("This browser has no built-in barcode reader. In the deployed app a scanner library is bundled. Use manual entry for now."); return; }
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
      if(videoRef.current){ videoRef.current.srcObject=stream; await videoRef.current.play(); }
      const det=new window.BarcodeDetector({formats:["ean_13","upc_a","ean_8","upc_e"]});
      const tick=async()=>{ try{ const codes=await det.detect(videoRef.current); if(codes.length){ stream.getTracks().forEach(t=>t.stop()); setMode("barcode"); setQ(codes[0].rawValue); } else requestAnimationFrame(tick);}catch{ requestAnimationFrame(tick);} };
      tick();
    }catch{ setCamMsg("Camera isn't available in this preview (the sandbox blocks it). It works once deployed with camera permission — for now type the barcode."); }
  }

  return (<div>
    <form onSubmit={search}>
      <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
        {[["name","By name",Search],["barcode","By barcode",ScanLine]].map(([m,l,Ic])=>(
          <button type="button" key={m} onClick={()=>setMode(m)} className="tap" style={chip(mode===m)}><Ic size={15}/> {l}</button>
        ))}
        <button type="button" onClick={startScan} className="tap" style={{...chip(false),borderColor:C.clay,color:C.clay}}><Camera size={15}/> Scan with camera</button>
      </div>
      <video ref={videoRef} style={{display:"none"}} muted playsInline/>
      {camMsg && <div className="rise" style={note(C.amberBg)}><Info size={16} color={C.amber} style={{marginTop:1,flexShrink:0}}/><span>{camMsg}</span></div>}
      <div style={{display:"flex",gap:8,marginTop:10}}>
        <div style={inputWrap}><Search size={18} color={C.inkSoft}/><input value={q} onChange={e=>setQ(e.target.value)} inputMode={mode==="barcode"?"numeric":"text"} placeholder={mode==="barcode"?"Enter or scan a barcode…":"e.g. tortilla chips, cola, bread…"} style={inputStyle}/>{q&&<button type="button" onClick={()=>setQ("")} style={xBtn}><X size={17}/></button>}</div>
        <button type="submit" className="tap" style={goBtn}>{loading?<Loader2 size={18} style={{animation:"spin 1s linear infinite"}}/>:"Search"}</button>
      </div>
    </form>

    {!touched && <Chips items={FOODS} onPick={(f)=>{setSel(f);setTouched(true);}} get={(f)=>f.name.replace("Example: ","")}/>}
    {fb && <FallbackNote what="food products"/>}
    {res.length>0 && !sel && <div style={{marginTop:20,display:"grid",gap:9}}>{res.map((p,i)=>(
      <button key={i} onClick={()=>setSel(p)} className="tap rise" style={{animationDelay:`${i*35}ms`,...rowBtn}}>
        {p.image?<img src={p.image} alt="" style={thumb}/>:<div style={{...thumb,...thumbFallback}}><Leaf size={20} color={C.sage}/></div>}
        <div style={{flex:1,minWidth:0}}><div style={rowTitle}>{p.name}</div>{p.brand&&<div style={rowSub}>{p.brand}</div>}</div>
        <ChevronDown size={18} color={C.inkSoft} style={{transform:"rotate(-90deg)"}}/>
      </button>))}</div>}
    {sel && <Detail prod={sel} onBack={()=>setSel(null)}/>}
  </div>);
}

/* ===================== TOOL 2: INGREDIENT FINDER ===================== */
function FinderTool(){
  const [active,setActive]=useState(null); const [polarity,setPolarity]=useState("with");
  const [custom,setCustom]=useState(""); const [res,setRes]=useState([]); const [loading,setLoading]=useState(false);
  const [fb,setFb]=useState(false); const [sel,setSel]=useState(null); const [ran,setRan]=useState(false);

  function termsFor(){ if(active){ const w=WATCHLIST.find(x=>x.id===active); return {label:w.label,terms:w.terms}; } if(custom.trim()) return {label:custom.trim(),terms:[custom.trim().toLowerCase()]}; return null; }

  async function run(){ const s=termsFor(); if(!s)return; setLoading(true);setRan(true);setSel(null);setFb(false);
    const fields="product_name,brands,image_front_small_url,image_url,nova_group,ingredients_text,ingredients_text_en,additives_tags,nutriments";
    try{ const r=await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(s.terms[0])}&search_simple=1&action=process&json=1&page_size=20&fields=${fields}`); const d=await r.json();
      let products=(d.products||[]).filter(p=>p.product_name&&(p.ingredients_text||p.ingredients_text_en)).map(normLive);
      products=applyPolarity(products,s.terms,polarity);
      if(!products.length) throw new Error("none"); setRes(products);
    }catch{ setRes(applyPolarity(FOODS,s.terms,polarity)); setFb(true); }
    finally{setLoading(false);}
  }
  function applyPolarity(list,terms,pol){ return list.filter(p=>{ const has=terms.some(t=>(p.ingredients_text||"").toLowerCase().includes(t)); return pol==="with"?has:!has; }); }

  return (<div>
    <p style={{fontSize:14.5,color:C.inkSoft,margin:"0 0 14px"}}>Pick what you care about, then find products that <b style={{color:C.ink}}>contain</b> it — or are <b style={{color:C.ink}}>made without</b> it.</p>

    <div style={{display:"flex",gap:6,marginBottom:14}}>
      {[["with","Made WITH it",Check],["without","Made WITHOUT it",Ban]].map(([p,l,Ic])=>(
        <button key={p} onClick={()=>setPolarity(p)} className="tap" style={{display:"flex",alignItems:"center",gap:6,fontSize:13.5,fontWeight:600,padding:"8px 13px",borderRadius:999,border:`1px solid ${polarity===p?(p==="with"?C.clay:C.sage):C.line}`,background:polarity===p?(p==="with"?C.clay:C.sage):C.card,color:polarity===p?"#fff":C.inkSoft,cursor:"pointer"}}><Ic size={15}/> {l}</button>
      ))}
    </div>

    <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>
      {WATCHLIST.map(w=>{ const Ic=w.icon; const on=active===w.id; return (
        <button key={w.id} onClick={()=>{setActive(on?null:w.id);setCustom("");}} className="tap" style={{display:"flex",alignItems:"center",gap:7,padding:"9px 13px",borderRadius:10,border:`1px solid ${on?C.ink:C.line}`,background:on?C.ink:C.card,color:on?C.paper:C.ink,cursor:"pointer",fontSize:14,fontWeight:600}}>
          <Ic size={15}/> {w.label}
        </button>); })}
    </div>

    <div style={{display:"flex",gap:8,marginBottom:14}}>
      <div style={inputWrap}><Search size={18} color={C.inkSoft}/><input value={custom} onChange={e=>{setCustom(e.target.value);setActive(null);}} placeholder="…or type any ingredient (e.g. carrageenan)" style={inputStyle}/></div>
      <button onClick={run} className="tap" style={goBtn}>{loading?<Loader2 size={18} style={{animation:"spin 1s linear infinite"}}/>:"Find"}</button>
    </div>

    {fb && <FallbackNote what="products"/>}
    {ran && !loading && res.length===0 && <div style={note(C.sageBg)}><Info size={16} color={C.sage} style={{marginTop:1}}/><span>No matching products in the available set. Try the other toggle or a different ingredient.</span></div>}
    {res.length>0 && !sel && <div style={{marginTop:6,display:"grid",gap:9}}>
      <div style={{fontSize:13,fontWeight:600,color:C.inkSoft}}>{res.length} product{res.length>1?"s":""} {polarity==="with"?"containing":"made without"} {termsFor()?.label}</div>
      {res.map((p,i)=>(<button key={i} onClick={()=>setSel(p)} className="tap rise" style={{animationDelay:`${i*30}ms`,...rowBtn}}>
        {p.image?<img src={p.image} alt="" style={thumb}/>:<div style={{...thumb,...thumbFallback}}><Utensils size={18} color={C.sage}/></div>}
        <div style={{flex:1,minWidth:0}}><div style={rowTitle}>{p.name}</div>{p.brand&&<div style={rowSub}>{p.brand}</div>}</div>
        <ChevronDown size={18} color={C.inkSoft} style={{transform:"rotate(-90deg)"}}/>
      </button>))}
    </div>}
    {sel && <Detail prod={sel} onBack={()=>setSel(null)}/>}
  </div>);
}

/* ===================== TOOL 3: WATER BY ZIP ===================== */
function WaterTool(){
  const [zip,setZip]=useState(""); const [data,setData]=useState(null); const [loading,setLoading]=useState(false);
  const [fb,setFb]=useState(false); const [err,setErr]=useState("");

  async function lookup(e){ e?.preventDefault(); const z=zip.trim(); if(z.length<5){setErr("Enter a 5-digit ZIP code.");return;} setErr("");setLoading(true);setData(null);setFb(false);
    try{ const r=await fetch(`https://data.epa.gov/efservice/WATER_SYSTEM/ZIP_CODE/${z}/JSON`); const rows=await r.json();
      if(!Array.isArray(rows)||!rows.length) throw new Error("none");
      const sys=rows[0];
      setData({ pwsid:sys.PWSID, name:sys.PWS_NAME||"Local water system", pop:sys.POPULATION_SERVED_COUNT?`~${Number(sys.POPULATION_SERVED_COUNT).toLocaleString()}`:"—", state:sys.STATE_CODE||"", contaminants:[], violations:[], live:true });
    }catch{ const key=z.slice(0,2); const sample=WATER[key]||WATER["90"]; setData({...sample,live:false}); setFb(true); }
    finally{setLoading(false);}
  }

  return (<div>
    <p style={{fontSize:14.5,color:C.inkSoft,margin:"0 0 14px"}}>Enter your ZIP to find the water system serving your area, any reported violations, and which <b style={{color:C.ink}}>certified filter type</b> matches the contaminants on record.</p>
    <form onSubmit={lookup} style={{display:"flex",gap:8}}>
      <div style={inputWrap}><MapPin size={18} color={C.inkSoft}/><input value={zip} onChange={e=>setZip(e.target.value.replace(/\D/g,"").slice(0,5))} inputMode="numeric" placeholder="5-digit ZIP code" style={inputStyle}/></div>
      <button type="submit" className="tap" style={{...goBtn,background:C.blue}}>{loading?<Loader2 size={18} style={{animation:"spin 1s linear infinite"}}/>:"Check"}</button>
    </form>
    {err && <div style={{fontSize:13,color:C.clay,marginTop:8,fontWeight:600}}>{err}</div>}
    {!data && !loading && <div style={{marginTop:14}}><div style={{fontSize:12.5,fontWeight:600,color:C.inkSoft,marginBottom:9}}>TRY A SAMPLE ZIP</div><div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{[["90210","Los Angeles, CA"],["07030","Hoboken, NJ"],["85001","Phoenix, AZ"],["53202","Milwaukee, WI"]].map(([z,n])=>(<button key={z} onClick={()=>{setZip(z);}} className="tap" style={{fontSize:13.5,fontWeight:500,padding:"7px 12px",borderRadius:9,border:`1px solid ${C.line}`,background:C.card,color:C.ink,cursor:"pointer"}}>{z} · {n}</button>))}</div></div>}
    {fb && <FallbackNote what="water systems" extra="Live EPA query wasn't reachable, so this is an illustrative example system."/>}
    {data && <WaterResult d={data}/>}
  </div>);
}

function WaterResult({d}){
  const filters=(d.contaminants||[]).map(c=>FILTER_MAP[c]).filter(Boolean);
  return (<div className="rise" style={{marginTop:20}}>
    <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:16,padding:20}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}><Droplets size={22} color={C.blue}/><div>
        <h2 style={{fontFamily:"'Fraunces',serif",fontWeight:800,fontSize:22,margin:0,lineHeight:1.1}}>{d.name}</h2>
        <div style={{fontSize:13,color:C.inkSoft}}>{d.state?d.state+" · ":""}{d.pwsid?`PWSID ${d.pwsid} · `:""}Serves {d.pop}</div>
      </div></div>

      <div style={{marginTop:18}}><SecLabel>Reported violations</SecLabel>
        {(!d.violations||d.violations.length===0)?<p style={{fontSize:14,color:C.inkSoft,marginTop:8}}>No violations on record in the available data.</p>:
          <div style={{marginTop:9,display:"grid",gap:8}}>{d.violations.map((v,i)=>(<div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",background:C.clayBg,border:`1px solid ${C.line}`,borderRadius:10,padding:"11px 13px"}}><AlertTriangle size={16} color={C.clay} style={{marginTop:2,flexShrink:0}}/><div><div style={{fontWeight:600,fontSize:14.5}}>{v.type}</div><div style={{fontSize:12.5,color:C.inkSoft}}>{v.date} · {v.status}</div></div></div>))}</div>}
      </div>

      <div style={{marginTop:20}}><SecLabel>Contaminants on record → certified filter type</SecLabel>
        {filters.length===0?<p style={{fontSize:14,color:C.inkSoft,marginTop:8}}>{d.live?"Live contaminant detail needs the violation query — wired for the deployed app.":"None flagged in this example."}</p>:
        <div style={{marginTop:9,display:"grid",gap:9}}>{filters.map((f,i)=>(<div key={i} style={{background:f.t==="hazard"?C.clayBg:f.t==="watch"?C.amberBg:C.blueBg,border:`1px solid ${C.line}`,borderRadius:12,padding:"13px 14px"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><Filter size={16} color={f.t==="hazard"?C.clay:f.t==="watch"?C.amber:C.blue}/><span style={{fontWeight:700,fontSize:15}}>{f.name}</span></div>
          <div style={{fontSize:13.5,color:C.ink,lineHeight:1.5}}>Look for a filter <b>certified to {f.std}</b>.</div>
        </div>))}</div>}
      </div>
      <div style={{...note(C.blueBg),marginTop:16}}><Info size={16} color={C.blue} style={{marginTop:1,flexShrink:0}}/><span>Filter suggestions reference NSF/ANSI certification standards for reducing specific contaminants — not a statement about your water's safety. Check your utility's annual Consumer Confidence Report for current testing.</span></div>
    </div>
  </div>);
}

/* ===================== shared product detail ===================== */
function Detail({prod,onBack}){
  const flags=analyze(prod); const nv={1:"Unprocessed / minimally processed",2:"Processed culinary ingredient",3:"Processed food",4:"Ultra-processed"};
  return (<div className="rise" style={{marginTop:20}}>
    <button onClick={onBack} className="tap" style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:C.inkSoft,fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:12,fontFamily:"inherit"}}><ChevronDown size={16} style={{transform:"rotate(90deg)"}}/> Back</button>
    <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:16,padding:20}}>
      <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>{prod.image&&<img src={prod.image} alt="" style={{width:60,height:60,objectFit:"cover",borderRadius:10}}/>}<div><h2 style={{fontFamily:"'Fraunces',serif",fontWeight:800,fontSize:23,margin:"0 0 3px",lineHeight:1.1}}>{prod.name}</h2>{prod.brand&&<div style={{color:C.inkSoft,fontSize:14}}>{prod.brand}</div>}</div></div>
      {prod.nova&&<div style={{marginTop:15,display:"inline-flex",alignItems:"center",gap:8,background:prod.nova===4?C.amberBg:C.sageBg,border:`1px solid ${C.line}`,borderRadius:9,padding:"8px 12px"}}><CircleDot size={15} color={prod.nova===4?C.amber:C.sage}/><span style={{fontSize:13.5,fontWeight:600}}>Processing: {nv[prod.nova]} (NOVA {prod.nova})</span></div>}
      <div style={{marginTop:18}}><SecLabel>Per 100g — vs. a published guide</SecLabel><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(92px,1fr))",gap:8,marginTop:9}}>
        <Nut l="Calories" v={prod.n.energy} u="kcal"/><Nut l="Sugars" v={prod.n.sugars} u="g" b={band("sugar",prod.n.sugars)}/><Nut l="Sodium" v={prod.n.sodium} u="mg" b={band("sodium",prod.n.sodium)}/><Nut l="Sat. fat" v={prod.n.sat} u="g" b={band("sat",prod.n.sat)}/><Nut l="Protein" v={prod.n.protein} u="g"/><Nut l="Fiber" v={prod.n.fiber} u="g"/>
      </div></div>
      <div style={{marginTop:20}}><SecLabel>Ingredients of note ({flags.length})</SecLabel>{flags.length===0?<p style={{fontSize:14,color:C.inkSoft,marginTop:8}}>No additives from the reference list were detected.</p>:<div style={{marginTop:10,display:"grid",gap:9}}>{flags.map(f=><Flag key={f.name} f={f}/>)}</div>}</div>
      <div style={{...note(C.sageBg),marginTop:18}}><ShieldQuestion size={16} color={C.sage} style={{marginTop:1,flexShrink:0}}/><span>Recall check queries the openFDA enforcement database in the deployed app. Not run in this preview.</span></div>
      {prod.ingredients_text&&<details style={{marginTop:14}}><summary style={{cursor:"pointer",fontSize:13.5,fontWeight:600,color:C.inkSoft}}>Full ingredient list</summary><p style={{fontSize:13.5,lineHeight:1.6,marginTop:8}}>{prod.ingredients_text}</p></details>}
    </div>
  </div>);
}
function Flag({f}){ const [o,setO]=useState(false); const cfg={restricted:{bg:C.clayBg,dot:C.clay,Icon:AlertTriangle,tag:"Restricted in some regions"},debated:{bg:C.amberBg,dot:C.amber,Icon:Info,tag:"Mixed evidence / debated"},common:{bg:C.sageBg,dot:C.sage,Icon:Leaf,tag:"Widely permitted"}}[f.status]; const {Icon}=cfg;
  return (<div style={{background:cfg.bg,border:`1px solid ${C.line}`,borderRadius:12,overflow:"hidden"}}>
    <button onClick={()=>setO(!o)} className="tap" style={{width:"100%",textAlign:"left",display:"flex",alignItems:"center",gap:11,padding:"13px 14px",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}><Icon size={18} color={cfg.dot} style={{flexShrink:0}}/><div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:15}}>{f.name}</div><div style={{fontSize:12.5,fontWeight:600,color:cfg.dot}}>{cfg.tag}</div></div><ChevronDown size={18} color={C.inkSoft} style={{transform:o?"rotate(180deg)":"none",transition:"transform .2s",flexShrink:0}}/></button>
    {o&&<div className="rise" style={{padding:"0 14px 14px 43px",fontSize:13.5,lineHeight:1.55}}><p style={{margin:"0 0 8px"}}>{f.what}</p><p style={{margin:"0 0 8px",color:C.inkSoft}}>{f.note}</p><div style={{fontSize:12,fontWeight:700,color:C.inkSoft}}>{f.regions}</div></div>}
  </div>);
}

/* ---------------- small shared bits ---------------- */
const SecLabel=({children})=> <div style={{fontSize:11.5,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",color:C.inkSoft}}>{children}</div>;
function Nut({l,v,u,b}){ const has=v!=null&&!isNaN(v); const col=b?bandColor[b.level]:C.ink; return (<div style={{background:C.paper,border:`1px solid ${C.line}`,borderRadius:10,padding:"10px 11px"}}><div style={{fontSize:12,color:C.inkSoft,fontWeight:500}}>{l}</div><div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:18,marginTop:2}}>{has?Math.round(v*10)/10:"—"}<span style={{fontSize:12,color:C.inkSoft,fontWeight:400}}> {has?u:""}</span></div>{b&&<div style={{fontSize:11,fontWeight:700,color:col,marginTop:2,textTransform:"capitalize"}}>{b.level}</div>}</div>); }
function Chips({items,onPick,get}){ return (<div className="rise" style={{marginTop:20}}><div style={{fontSize:12.5,fontWeight:600,color:C.inkSoft,marginBottom:9}}>OR TRY A SAMPLE</div><div style={{display:"flex",flexWrap:"wrap",gap:7}}>{items.map((it,i)=>(<button key={i} onClick={()=>onPick(it)} className="tap" style={{fontSize:13.5,fontWeight:500,padding:"7px 12px",borderRadius:9,border:`1px solid ${C.line}`,background:C.card,color:C.ink,cursor:"pointer"}}>{get(it)}</button>))}</div></div>); }
const FallbackNote=({what,extra})=> <div className="rise" style={{...note(C.amberBg),marginTop:16}}><Info size={16} color={C.amber} style={{marginTop:1,flexShrink:0}}/><span>{extra||`Live lookup wasn't reachable in this preview, so these are built-in sample ${what}.`} The deployed app uses the live database.</span></div>;

/* style helpers */
const chip=(on)=>({display:"flex",alignItems:"center",gap:6,fontSize:13.5,fontWeight:600,padding:"8px 13px",borderRadius:999,border:`1px solid ${on?C.ink:C.line}`,background:on?C.ink:C.card,color:on?C.paper:C.inkSoft,cursor:"pointer"});
const inputWrap={flex:1,display:"flex",alignItems:"center",gap:9,background:C.card,border:`1px solid ${C.line}`,borderRadius:12,padding:"0 14px"};
const inputStyle={flex:1,border:"none",outline:"none",background:"transparent",fontSize:16,padding:"13px 0",color:C.ink,fontFamily:"inherit"};
const xBtn={border:"none",background:"none",cursor:"pointer",color:C.inkSoft};
const goBtn={background:C.clay,color:"#fff",border:"none",borderRadius:12,padding:"0 20px",fontWeight:700,fontSize:15,cursor:"pointer",minWidth:78,display:"flex",alignItems:"center",justifyContent:"center"};
const rowBtn={textAlign:"left",display:"flex",alignItems:"center",gap:13,background:C.card,border:`1px solid ${C.line}`,borderRadius:12,padding:12,cursor:"pointer"};
const thumb={width:46,height:46,objectFit:"cover",borderRadius:8,flexShrink:0};
const thumbFallback={background:C.sageBg,display:"flex",alignItems:"center",justifyContent:"center"};
const rowTitle={fontWeight:600,fontSize:15,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"};
const rowSub={fontSize:13,color:C.inkSoft};
const note=(bg)=>({display:"flex",gap:9,alignItems:"flex-start",background:bg,border:`1px solid ${C.line}`,borderRadius:10,padding:"11px 13px",fontSize:13.5,color:C.inkSoft,marginTop:10});
