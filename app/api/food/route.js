import { normLive } from "../../../lib/data";

// GET /api/food?barcode=...   or   /api/food?q=tortilla+chips
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get("barcode");
  const q = searchParams.get("q");
  const fields = "product_name,brands,image_front_small_url,image_url,nova_group,ingredients_text,ingredients_text_en,additives_tags,nutriments";

  try {
    if (barcode) {
      const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${fields}`,
        { headers: { "User-Agent": "Plumb/0.1 (food transparency app)" } });
      const d = await r.json();
      if (d?.product && (d.product.product_name || d.product.ingredients_text)) {
        return Response.json({ ok: true, products: [normLive(d.product)] });
      }
      return Response.json({ ok: true, products: [] });
    }
    if (q) {
      const r = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=20&fields=${fields}`,
        { headers: { "User-Agent": "Plumb/0.1 (food transparency app)" } });
      const d = await r.json();
      const products = (d.products || [])
        .filter(p => p.product_name && (p.ingredients_text || p.ingredients_text_en))
        .map(normLive);
      return Response.json({ ok: true, products });
    }
    return Response.json({ ok: false, error: "Provide ?barcode= or ?q=" }, { status: 400 });
  } catch (e) {
    return Response.json({ ok: false, error: "Lookup failed" }, { status: 502 });
  }
}
