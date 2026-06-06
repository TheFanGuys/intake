# Plumb — food & water transparency app

A working web app with three tools:

1. **Scan & Search** — look up a grocery item by name or barcode and see its ingredients, additives, and processing level in plain language.
2. **Ingredient Finder** — find products that *contain* an ingredient (like beef tallow) or are *made without* it (like seed oils).
3. **Water by ZIP** — enter a ZIP code, see the local water system, reported violations, and the certified filter type that matches each contaminant.

It uses **OpenFoodFacts** (food), **EPA SDWIS/ECHO** (water), and is ready to add **openFDA** (recalls). No medical or safety claims — only facts, regulatory status, and comparisons.

---

## You do NOT need to be a programmer to put this online

You also do **not** need to install anything or run any commands on your own computer. The hosting service (Vercel) builds the app for you in the cloud. Here is the whole process in plain English.

### What you need (all free)
- A **GitHub** account → https://github.com/signup
- A **Vercel** account → https://vercel.com/signup (sign up *with your GitHub account* — it links them automatically)

### Step 1 — Put the code on GitHub
1. Unzip the project folder so you have a folder called `plumb` with files inside it.
2. Go to https://github.com/new and create a new repository. Name it `plumb` (or anything). Leave everything else default and click **Create repository**.
3. On the new repo page, click **uploading an existing file** (it's a link in the middle of the page).
4. Drag **all the files and folders** from inside the `plumb` folder into the upload box. (Drag the *contents*, not the outer folder.)
5. Click **Commit changes**. Your code now lives on GitHub.

### Step 2 — Deploy on Vercel
1. Go to https://vercel.com/new.
2. You'll see your GitHub repositories. Find `plumb` and click **Import**.
3. Don't change any settings — Vercel detects Next.js automatically. Click **Deploy**.
4. Wait about a minute. When it finishes, you get a live web address like `plumb.vercel.app`. That's your app, on the internet, on a phone or computer.

### Step 3 — Make changes later
Any time you edit a file on GitHub (you can edit right in the browser — click a file, click the pencil icon, save), Vercel automatically rebuilds and updates your live site within a minute. No need to re-do anything.

---

## How to customize it (easy edits)

**Rename the app:** open `lib/data.js`, change the line `export const APP_NAME = "Plumb";` to your name. Save. Done — it updates everywhere.

**Change what the Ingredient Finder watches for:** in `lib/data.js`, find the `WATCHLIST` list. Each entry has a `label` (what shows on the button) and `terms` (the words it searches for in ingredient lists). Add, remove, or edit entries. Example — to track "carrageenan":
```
{ id:"carrageenan", label:"Carrageenan", terms:["carrageenan"] },
```

**Add or edit additive facts:** in `lib/data.js`, the `KB` list holds every additive the app explains. Copy an existing entry and change the fields. `status` can be `"restricted"`, `"debated"`, or `"common"`.

**Change filter recommendations:** in `lib/data.js`, edit `FILTER_MAP`.

---

## Want to run it on your own computer first (optional)
If you ever want to preview it locally, you'd install Node.js, then in the project folder run `npm install` and `npm run dev`, and open http://localhost:3000. This step is optional — Vercel does all of this for you.

---

## Honest notes / to-do
- **Live data:** the food and water lookups run on the server, so they work once deployed. If a lookup ever fails, the app quietly shows built-in sample data so it never looks broken.
- **Water contaminant → filter:** the EPA violation feed needs a bit more parsing to map specific contaminant codes to the filter list. The structure is in `app/api/water/route.js`, marked with a comment.
- **Recalls:** add a file at `app/api/recall/route.js` that queries openFDA, then call it from the product detail view.
- **Regulatory facts change.** The additive notes are accurate to early 2026 but should be reviewed periodically. The app already tells users to verify with official sources.
- **Not medical or legal advice.** Keep all wording comparative ("lower sodium," "restricted in the EU"), never "safe" or "healthy."

---

## Project structure
```
plumb/
  app/
    api/food/route.js     → server lookup for OpenFoodFacts
    api/water/route.js    → server lookup for EPA water data
    layout.js             → page shell + fonts
    page.js               → the whole interface (3 tools)
    globals.css           → base styles
  lib/
    data.js               → app name, additive list, watchlist, filter map, samples  ← edit here
  package.json
```
