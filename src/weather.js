// Real weather outside your window, from Open-Meteo (free, no key): rain, snow, storms, fog, clouds and wind.
// The place comes from your internet connection's rough location, or a city you type in Settings.
(() => {
  const FORECAST = "https://api.open-meteo.com/v1/forecast";
  const GEO = "https://geocoding-api.open-meteo.com/v1/search";
  const IPGEO = "https://get.geojs.io/v1/ip/geo.json";

  // WMO weather codes → what we draw
  function kindOf(code) {
    if (code === 0) return "clear";
    if (code <= 3) return "cloud";
    if (code === 45 || code === 48) return "fog";
    if (code >= 51 && code <= 57) return "drizzle";
    if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
    if (code >= 95) return "storm";
    return "cloud";
  }
  const ICON = { clear: "☀️", cloud: "☁️", fog: "🌫️", drizzle: "🌦️", rain: "🌧️", snow: "❄️", storm: "⛈️" };

  function create(o) {
    const { world } = o;
    let timer = 0, last = null;
    const getJSON = async (url) => { const r = await fetch(url, { cache: "no-store" }); if (!r.ok) throw new Error(r.status); return r.json(); };

    async function locate() {
      const j = await getJSON(IPGEO);
      const lat = +j.latitude, lon = +j.longitude;
      if (!isFinite(lat) || !isFinite(lon)) throw new Error("no location");
      return { name: j.city || j.region || j.country || "?", lat, lon, auto: true };
    }
    async function findCity(name, lang) {
      const j = await getJSON(`${GEO}?name=${encodeURIComponent(name)}&count=1&format=json&language=${lang || "en"}`);
      const r = j.results && j.results[0]; if (!r) return null;
      return { name: r.name + (r.country_code ? `, ${r.country_code}` : ""), lat: r.latitude, lon: r.longitude, auto: false };
    }
    async function refresh(force) {
      clearTimeout(timer); timer = setTimeout(refresh, 60 * 60e3);           // look at the clock once an hour, ask the service once a day (light on the computer)
      if (!o.isOn()) { world.weather = null; o.onUpdate && o.onUpdate(null); return; }
      // one reading a day is plenty (kept in the save, so restarting the app doesn't ask again)
      const cached = o.getCache && o.getCache();
      if (!force && cached && cached.day === new Date().toDateString() && (!o.getLoc() || cached.place === o.getLoc().name)) { last = cached; if (!world.weather || !world.weather.preview) world.weather = last; o.onUpdate && o.onUpdate(last); return; }
      try {
        let loc = o.getLoc();
        if (!loc) { loc = await locate(); o.setLoc(loc); }
        const j = await getJSON(`${FORECAST}?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,weather_code,is_day,wind_speed_10m,wind_direction_10m`);
        const c = j.current || {};
        last = { kind: kindOf(+c.weather_code), code: +c.weather_code, temp: c.temperature_2m, wind: c.wind_speed_10m || 0,
          windDir: (c.wind_direction_10m || 0) > 180 ? 1 : -1, place: loc.name, at: Date.now(), day: new Date().toDateString() };
        o.setCache && o.setCache(last);
        if (!world.weather || !world.weather.preview) world.weather = last;
      } catch (e) {
        last = last && Date.now() - last.at < 3 * 3.6e6 ? last : null;   // keep a recent reading if we're offline for a bit
        world.weather = last;
      }
      o.onUpdate && o.onUpdate(last);
    }
    // try a weather out for a minute (from ⚙️ Settings), then back to the real one
    let prevT = 0;
    function preview(kind) {
      clearTimeout(prevT);
      world.weather = { kind, wind: kind === "storm" ? 35 : 14, windDir: 1, temp: kind === "snow" ? -2 : 12, preview: true, place: last ? last.place : "" };
      world.snowDepth = 0; world.flakes = []; world.drops = [];
      if (kind === "cloud" || kind === "rain" || kind === "storm" || kind === "drizzle") world.cloudT = 0;
      prevT = setTimeout(() => { world.weather = o.isOn() ? last : null; world.snowDepth = 0; }, 60e3);
    }
    return { refresh, findCity, preview, get now() { return last; }, ICON };
  }
  window.CatWeather = { create, kindOf };
})();
