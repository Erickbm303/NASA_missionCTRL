// worker.js
export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      // -------- Serve HTML --------
      if (url.pathname === "/") {
        const html = await fetch("https://ctrl-meteor.erickdamian-buitrago.workers.dev/index_meteor.html");
        return new Response(await html.text(), { headers: { "content-type": "text/html; charset=UTF-8" } });
      }

      // -------- Serve static CSV files from assets --------
      if (url.pathname.endsWith(".csv")) {
        const assetPath = url.pathname.slice(1); // remove leading "/"
        const asset = await ctx.assets.get(assetPath);
        if (!asset) return new Response("CSV not found", { status: 404 });
        return new Response(asset.body, { headers: { "content-type": "text/csv" } });
      }

      // -------- /simulate endpoint --------
      if (url.pathname === "/simulate") {
        const { lat, lon, diameter_km = 1, density = 3000 } = await request.json();
        const radiusM = (diameter_km * 1000) / 2;
        const mass = (4 / 3) * Math.PI * Math.pow(radiusM, 3) * density;
        const velocity = 20000; // m/s
        const energyJ = 0.5 * mass * velocity ** 2;
        const energyMt = energyJ / 4.184e15;
        const craterRadiusKm = Math.cbrt(energyMt) * 1.3;
        const tsunamiRadiusKm = craterRadiusKm * 4.5;

        return new Response(JSON.stringify({
          lat, lon, diameter_km,
          crater_radius_km: craterRadiusKm,
          tsunami_radius_km: tsunamiRadiusKm,
          impact_energy_mt: energyMt.toFixed(2),
          message: "Simulation completed successfully."
        }, null, 2), { headers: { "content-type": "application/json" } });
      }

      // -------- /story endpoint --------
      if (url.pathname === "/story") {
        const { lat, lon, impact_energy_mt } = await request.json();
        const story = `At coordinates (${lat.toFixed(2)}, ${lon.toFixed(2)}), a meteor impact released ${impact_energy_mt} megatons of TNT — rivaling the most powerful nuclear tests in history.`;
        return new Response(JSON.stringify({ story }), { headers: { "content-type": "application/json" } });
      }

      // -------- /save endpoint --------
      if (url.pathname === "/save") {
        const data = await request.json();
        const key = `impact_${Date.now()}.json`;
        if (!env.R2_BUCKET) return new Response("❌ R2 bucket not configured", { status: 500 });
        await env.R2_BUCKET.put(key, JSON.stringify(data, null, 2));
        return new Response(JSON.stringify({ ok: true, saved_as: key }), { headers: { "content-type": "application/json" } });
      }

      return new Response("404 — Route not found", { status: 404 });

    } catch (err) {
      return new Response(`❌ Worker Error: ${err.message}`, { status: 500 });
    }
  }
};
