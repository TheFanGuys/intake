// ============================================================
//  lib/data.js  —  all the "brains" of the app live here
//  TO RENAME THE APP: change APP_NAME on the next line. That's it.
// ============================================================
export const APP_NAME = "Plumb";
export const APP_TAGLINE = "Know what's in it.";

export const C = {
  paper:"#f4efe6", card:"#fffdf8", ink:"#211c16", inkSoft:"#6b6358",
  line:"#e3dccd", clay:"#b9583b", amber:"#c98a2b", sage:"#5f7a52",
  blue:"#3f6f86", sageBg:"#eef1e8", amberBg:"#f8efdc", clayBg:"#f7e6df", blueBg:"#e6eef2",
};

// ---- additive knowledge base (status: restricted | debated | common) ----
export const KB = [
  { keys:["e102","tartrazine","yellow 5"], name:"Tartrazine (Yellow 5)", what:"Synthetic yellow color.", status:"restricted", note:"EU requires an on-pack notice that it may affect activity and attention in children. Permitted in the US.", regions:"Label required: EU/UK" },
  { keys:["e129","allura red","red 40"], name:"Allura Red (Red 40)", what:"Synthetic red color, very common in US foods.", status:"restricted", note:"Carries an EU activity/attention notice; some US states are restricting dyes in school foods.", regions:"Label required: EU/UK" },
  { keys:["e127","erythrosine","red 3","red no. 3"], name:"Erythrosine (Red 3)", what:"Synthetic cherry-red color.", status:"restricted", note:"FDA announced in Jan 2025 it is revoking authorization for Red No. 3 in food, with a phase-out window.", regions:"Phasing out: US" },
  { keys:["e924","potassium bromate"], name:"Potassium bromate", what:"Flour strengthener.", status:"restricted", note:"IARC: possibly carcinogenic. Banned for food in EU/UK/Canada; California requires a label.", regions:"Banned: EU/UK/Canada" },
  { keys:["partially hydrogenated","hydrogenated oil","trans fat"], name:"Partially hydrogenated oil (trans fat)", what:"Processed oil for shelf life/texture.", status:"restricted", note:"FDA removed its GRAS status; no longer permitted to be added to US foods.", regions:"Not permitted: US/EU" },
  { keys:["e171","titanium dioxide"], name:"Titanium dioxide", what:"White color/brightener.", status:"restricted", note:"EU banned it as a food additive in 2022; permitted in the US.", regions:"Banned: EU" },
  { keys:["brominated vegetable oil","bvo"], name:"Brominated vegetable oil (BVO)", what:"Emulsifier formerly in some citrus sodas.", status:"restricted", note:"FDA revoked authorization for BVO in food in 2024.", regions:"Not permitted: US/EU" },
  { keys:["e320","bha"], name:"BHA", what:"Antioxidant preservative.", status:"debated", note:"Listed by the US National Toxicology Program as reasonably anticipated to be a carcinogen (animal data). Still permitted.", regions:"Permitted, debated" },
  { keys:["e321","bht"], name:"BHT", what:"Antioxidant preservative.", status:"debated", note:"Permitted; evidence mixed. Some makers have removed it on consumer preference.", regions:"Permitted, debated" },
  { keys:["e951","aspartame"], name:"Aspartame", what:"Low-calorie sweetener.", status:"debated", note:"IARC (2023): possibly carcinogenic, while the FAO/WHO committee kept its intake limit unchanged. Contains phenylalanine (matters for PKU).", regions:"Permitted: US/EU" },
  { keys:["e250","sodium nitrite"], name:"Sodium nitrite", what:"Curing salt in bacon/ham/hot dogs.", status:"debated", note:"IARC links processed meat (group 1) to colorectal cancer; nitrites are part of that. Permitted with limits.", regions:"Permitted with limits" },
  { keys:["e150d","caramel color"], name:"Caramel color (Class IV)", what:"Brown coloring for colas/sauces.", status:"debated", note:"Some types contain 4-MEI, listed under California Prop 65 above set levels.", regions:"Labeled above limits: CA" },
  { keys:["e621","monosodium glutamate","msg"], name:"MSG", what:"Savory flavor enhancer.", status:"common", note:"Repeatedly reviewed and permitted; large reviews have not confirmed the widely-reported reactions.", regions:"Permitted: US/EU" },
  { keys:["e407","carrageenan"], name:"Carrageenan", what:"Seaweed thickener.", status:"debated", note:"Permitted; some studies raise digestive questions about degraded forms.", regions:"Permitted: US/EU" },
  { keys:["e330","citric acid"], name:"Citric acid", what:"Acidity regulator / tart flavor.", status:"common", note:"One of the most common food acids.", regions:"Permitted: US/EU" },
  { keys:["e322","lecithin","soy lecithin"], name:"Lecithin", what:"Emulsifier (often soy/sunflower).", status:"common", note:"Naturally occurring emulsifier.", regions:"Permitted: US/EU" },
  { keys:["maltodextrin"], name:"Maltodextrin", what:"Starch-derived thickener/filler.", status:"debated", note:"Permitted; high glycemic index is sometimes flagged by consumers.", regions:"Permitted: US/EU" },
];

export const findEntry = (t) => { const x=t.toLowerCase().replace(/^en:/,"").trim(); return KB.find(e=>e.keys.some(k=>x===k||x.includes(k)||k.includes(x))); };
export const scanText = (txt) => { if(!txt) return []; const l=txt.toLowerCase(); const s=new Set(); KB.forEach(e=>{if(e.keys.some(k=>l.includes(k)))s.add(e);}); return [...s]; };

// ---- ingredient finder watchlist (icons attached in the UI by id) ----
export const WATCHLIST = [
  { id:"tallow", label:"Beef tallow", terms:["beef tallow","tallow"] },
  { id:"seedoils", label:"Seed oils", terms:["soybean oil","canola oil","sunflower oil","safflower oil","cottonseed oil","grapeseed oil","corn oil","vegetable oil"] },
  { id:"palm", label:"Palm oil", terms:["palm oil","palm kernel"] },
  { id:"hfcs", label:"High-fructose corn syrup", terms:["high fructose corn syrup","high-fructose corn syrup"] },
  { id:"dyes", label:"Artificial dyes", terms:["red 40","yellow 5","yellow 6","blue 1","red 3","allura","tartrazine"] },
  { id:"maltodextrin", label:"Maltodextrin", terms:["maltodextrin"] },
];

// ---- nutrition bands (UK FSA per-100g traffic-light guide) ----
export function band(n,v){ if(v==null||isNaN(v))return null; const g={sugar:{low:5,high:22.5},sat:{low:1.5,high:5},sodium:{low:120,high:600}}[n]; if(!g)return null; let level="moderate"; if(v<=g.low)level="lower"; else if(v>g.high)level="higher"; return {level}; }
export const bandColor={lower:C.sage,moderate:C.amber,higher:C.clay};

// ---- water: contaminant -> certified filter type ----
export const FILTER_MAP = {
  lead:     { name:"Lead", std:"NSF/ANSI 53 (carbon block) or 58 (reverse osmosis)", t:"hazard" },
  pfas:     { name:"PFAS (PFOA/PFOS, 'forever chemicals')", std:"NSF/ANSI 53, P473, or 58 (reverse osmosis)", t:"hazard" },
  nitrate:  { name:"Nitrate / Nitrite", std:"NSF/ANSI 58 (reverse osmosis) or 53 ion-exchange", t:"hazard" },
  arsenic:  { name:"Arsenic", std:"NSF/ANSI 58 (reverse osmosis)", t:"hazard" },
  tthm:     { name:"Disinfection byproducts (TTHM/HAA5)", std:"NSF/ANSI 53 (carbon)", t:"watch" },
  copper:   { name:"Copper", std:"NSF/ANSI 53 (carbon block) or 58 (RO)", t:"watch" },
  coliform: { name:"Total coliform / bacteria", std:"Microbiological — follow utility guidance; UV or NSF 53 cyst-rated", t:"hazard" },
  chlorine: { name:"Chlorine / taste & odor", std:"NSF/ANSI 42 (carbon)", t:"taste" },
};

// ---- sample foods (offline demo + fallback when live lookup is unavailable) ----
export const FOODS = [
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

// ---- sample water systems (fallback when live EPA lookup is unavailable) ----
export const WATER = {
  "90": { pwsid:"CA0000123", name:"Example Metro Water District", pop:"~310,000", state:"CA", contaminants:["lead","tthm","chlorine"], violations:[ {type:"Lead Action Level Exceedance", date:"2024", status:"Returned to compliance"}, {type:"TTHM (disinfection byproducts) MCL", date:"2023", status:"Resolved"} ] },
  "07": { pwsid:"NJ0000456", name:"Example Township Utilities", pop:"~58,000", state:"NJ", contaminants:["pfas","lead","chlorine"], violations:[ {type:"PFOA/PFOS above state MCL", date:"2024", status:"Under treatment upgrade"} ] },
  "53": { pwsid:"WI0000789", name:"Example Lakeside Water Works", pop:"~120,000", state:"WI", contaminants:["chlorine"], violations:[] },
  "85": { pwsid:"AZ0000321", name:"Example Desert Regional Water", pop:"~95,000", state:"AZ", contaminants:["arsenic","nitrate","chlorine"], violations:[ {type:"Arsenic MCL exceedance", date:"2023", status:"Monitoring"} ] },
};

// ---- normalize one OpenFoodFacts product into our shape ----
export function normLive(p){
  const u=p.nutriments||{};
  return {
    name:p.product_name||"Unnamed product", brand:p.brands||"",
    image:p.image_front_small_url||p.image_url||null, nova:p.nova_group||null,
    ingredients_text:p.ingredients_text_en||p.ingredients_text||"", additives_tags:p.additives_tags||[],
    n:{ energy:u["energy-kcal_100g"], sugars:u["sugars_100g"], sodium:u["sodium_100g"]!=null?u["sodium_100g"]*1000:null, sat:u["saturated-fat_100g"], protein:u["proteins_100g"], fiber:u["fiber_100g"] },
  };
}

// ---- turn a product's ingredients into labeled flags ----
export function analyze(p){
  const m=new Map();
  (p.additives_tags||[]).forEach(t=>{const e=findEntry(t);if(e)m.set(e.name,e);});
  scanText(p.ingredients_text).forEach(e=>m.set(e.name,e));
  const o={restricted:0,debated:1,common:2};
  return [...m.values()].sort((a,b)=>o[a.status]-o[b.status]);
}
