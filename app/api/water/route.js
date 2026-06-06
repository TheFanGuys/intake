// GET /api/water?zip=90210
// Queries EPA Envirofacts (SDWIS). Falls back gracefully; the client also
// keeps sample systems so the UI always shows something.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const zip = (searchParams.get("zip") || "").replace(/\D/g, "").slice(0, 5);
  if (zip.length < 5) {
    return Response.json({ ok: false, error: "Enter a 5-digit ZIP code." }, { status: 400 });
  }

  try {
    // Water systems whose record carries this ZIP
    const sysRes = await fetch(`https://data.epa.gov/efservice/WATER_SYSTEM/ZIP_CODE/${zip}/JSON`);
    const rows = await sysRes.json();
    if (!Array.isArray(rows) || rows.length === 0) throw new Error("no system");

    const sys = rows[0];
    const pwsid = sys.PWSID;

    // Best-effort: pull recent violations for that system
    let violations = [];
    try {
      const vRes = await fetch(`https://data.epa.gov/efservice/VIOLATION/PWSID/${pwsid}/JSON`);
      const vRows = await vRes.json();
      if (Array.isArray(vRows)) {
        violations = vRows.slice(0, 8).map(v => ({
          type: v.VIOLATION_CATEGORY_CODE || v.CONTAMINANT_CODE || "Reported violation",
          date: (v.COMPL_PER_BEGIN_DATE || "").slice(0, 4) || "—",
          status: v.VIOLATION_STATUS || "On record",
        }));
      }
    } catch { /* leave violations empty */ }

    return Response.json({
      ok: true,
      live: true,
      system: {
        pwsid,
        name: sys.PWS_NAME || "Local water system",
        state: sys.STATE_CODE || "",
        pop: sys.POPULATION_SERVED_COUNT ? `~${Number(sys.POPULATION_SERVED_COUNT).toLocaleString()}` : "—",
        contaminants: [], // map specific contaminant codes here as you refine the violation parsing
        violations,
      },
    });
  } catch (e) {
    return Response.json({ ok: false, error: "EPA lookup unavailable" }, { status: 502 });
  }
}
