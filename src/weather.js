// The weather outside your window, worked out by the game itself, with no internet and no outside service:
// the place comes from your computer's time zone (or a city you pick in Settings), and the weather follows
// that place's climate: the season (the right way round in the southern half of the world), how warm it is
// at that latitude, how rainy that kind of land is (jungle, desert, steppe, fjord…), with a different day every
// day. It's the same for everyone in the same place on the same day, and it can change every six hours.
(() => {
  const ICON = { clear: "☀️", cloud: "☁️", fog: "🌫️", drizzle: "🌦️", rain: "🌧️", snow: "❄️", storm: "⛈️" };
  // big time-zone cities that aren't capitals (the capitals themselves come from the world map's list)
  const TZ = {
    Istanbul: [41.0, 29.0, "city"], New_York: [40.7, -74.0, "city"], Chicago: [41.9, -87.6, "city"], Denver: [39.7, -105.0, "mountain"],
    Los_Angeles: [34.05, -118.2, "med"], Phoenix: [33.4, -112.1, "desert"], Anchorage: [61.2, -149.9, "taiga"], Toronto: [43.7, -79.4, "city"],
    Vancouver: [49.3, -123.1, "fjord"], Halifax: [44.6, -63.6, "city"], Sao_Paulo: [-23.5, -46.6, "city"], Sydney: [-33.9, 151.2, "city"],
    Melbourne: [-37.8, 145.0, "city"], Perth: [-31.95, 115.9, "med"], Brisbane: [-27.5, 153.0, "city"], Adelaide: [-34.9, 138.6, "med"],
    Shanghai: [31.2, 121.5, "city"], Hong_Kong: [22.3, 114.2, "city"], Kolkata: [22.6, 88.4, "city"], Calcutta: [22.6, 88.4, "city"],
    Dubai: [25.2, 55.3, "desert"], Karachi: [24.9, 67.0, "desert"], Almaty: [43.2, 76.9, "steppe"], Johannesburg: [-26.2, 28.0, "savanna"],
    Casablanca: [33.6, -7.6, "med"], Lagos: [6.5, 3.4, "jungle"], Auckland: [-36.85, 174.8, "city"], Honolulu: [21.3, -157.9, "island"],
    Mexico_City: [19.4, -99.1, "city"], Bogota: [4.7, -74.1, "mountain"], Lima: [-12.05, -77.0, "desert"], Santiago: [-33.45, -70.7, "med"],
    Buenos_Aires: [-34.6, -58.4, "pampas"], Yekaterinburg: [56.8, 60.6, "taiga"], Novosibirsk: [55.0, 82.9, "taiga"], Vladivostok: [43.1, 131.9, "taiga"],
  };
  // how often each kind of land gets rain or snow (a chance per day)
  const WET = { city: 0.32, island: 0.4, polar: 0.3, jungle: 0.62, desert: 0.05, savanna: 0.25, mountain: 0.4, taiga: 0.36, fjord: 0.5,
    steppe: 0.2, pampas: 0.3, sakura: 0.36, bamboo: 0.42, outback: 0.1, med: 0.26 };

  // a dice that always lands the same way for the same text (the same place on the same day)
  function dice(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return () => { h += 0x6d2b79f5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  const cities = () => (window.CatWorldData ? window.CatWorldData.CITIES : []);
  const near = (lat, lon) => { let best = null, bd = 1e9; for (const c of cities()) { const d = (c.lat - lat) ** 2 + ((c.lon - lon) * Math.cos(lat * Math.PI / 180)) ** 2; if (d < bd) { bd = d; best = c; } } return best; };
  const placeOf = (c, lang) => ({ name: c.name[lang] || c.name.en, lat: c.lat, lon: c.lon, biome: c.biome || "city", id: c.id });

  // your computer's time zone → a place: its own city if we know it, otherwise the nearest capital to where that zone sits
  function fromClock(lang) {
    let tz = ""; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch {}
    const city = tz.split("/").pop() || "", nice = city.replace(/_/g, " ");
    const cap = cities().find((c) => c.name.en.toLowerCase() === nice.toLowerCase() || c.id === city.toLowerCase());
    if (cap) return placeOf(cap, lang);
    if (TZ[city]) { const [lat, lon, biome] = TZ[city]; return { name: nice, lat, lon, biome, id: "tz:" + city }; }
    // nothing by name: guess from the clock (15° of longitude an hour) and the part of the world in the zone's name
    const off = -new Date().getTimezoneOffset() / 60, lon = Math.max(-170, Math.min(175, off * 15));
    const lat = { Europe: 48, Asia: 30, Africa: 5, America: 25, Australia: -30, Pacific: -10, Atlantic: 40, Indian: -10, Antarctica: -70 }[tz.split("/")[0]] ?? 40;
    const c = near(lat, lon); return c ? placeOf(c, lang) : { name: "?", lat, lon, biome: "city", id: "guess" };
  }
  // a city you type: any capital on the world map (in Turkish or English, or its country), or one of the big zone cities
  function findCity(name, lang) {
    const q = name.trim().toLocaleLowerCase("tr");
    if (!q) return null;
    const hit = (s) => s && s.toLocaleLowerCase("tr").startsWith(q);
    const c = cities().find((c) => hit(c.name.tr) || hit(c.name.en)) || cities().find((c) => hit(c.country.tr) || hit(c.country.en));
    if (c) return placeOf(c, lang);
    const k = Object.keys(TZ).find((k) => k.replace(/_/g, " ").toLowerCase().startsWith(q));
    if (k) { const [lat, lon, biome] = TZ[k]; return { name: k.replace(/_/g, " "), lat, lon, biome, id: "tz:" + k }; }
    return null;
  }

  // the weather at a place at a time
  function climate(loc, when = new Date()) {
    const day = Math.floor((when - new Date(when.getFullYear(), 0, 0)) / 864e5), block = Math.floor(when.getHours() / 6);
    const a = Math.abs(loc.lat), north = loc.lat >= 0;
    const summer = Math.cos(2 * Math.PI * (day - 200) / 365.25) * (north ? 1 : -1);          // +1 high summer, −1 deep winter
    const biome = loc.biome || "city";
    const daily = dice(`${loc.id}|${when.getFullYear()}|${day}`), slot = dice(`${loc.id}|${when.getFullYear()}|${day}|${block}`);
    // temperature: warm near the equator, cold near the poles, swings more with the seasons the further from the equator
    let mean = 28 - 0.42 * Math.max(0, a - 10), amp = Math.min(16, 0.26 * a);
    if (biome === "desert" || biome === "outback") { mean += 3; amp += 2; }
    if (biome === "mountain") mean -= 6; if (biome === "polar") mean -= 8; if (biome === "island" || biome === "fjord") amp *= 0.7;
    const hourly = [-4, 1, 4, 0][block];                                                     // night, morning, afternoon, evening
    const dayTemp = mean + amp * summer + (daily() - 0.5) * 8, temp = dayTemp + hourly;
    // how likely rain is today: the land's own wetness, drier summers by the Mediterranean, wet summers in the monsoon lands
    let wet = WET[biome] ?? 0.3;
    if (biome === "med") wet *= 1 - 0.8 * Math.max(0, summer);
    if (biome === "jungle" || biome === "bamboo" || biome === "savanna") wet *= 1 + 0.5 * Math.max(0, summer);
    const r1 = daily(), r2 = daily(), r3 = daily(), r4 = daily(), rb = slot();
    let kind;
    if (r1 < wet) {
      if (rb < 0.3) kind = "cloud";                                                          // it isn't raining every hour of a rainy day
      else if (dayTemp <= 2.5 || temp <= 0.5) kind = "snow";                                   // a cold day snows all day long
      else if (temp > 18 && r2 < 0.25) kind = "storm";
      else kind = r2 < 0.5 ? "drizzle" : "rain";
    } else if (summer < 0.2 && temp < 12 && r4 < 0.14 && block <= 1) kind = "fog";            // foggy cool mornings
    else kind = r3 < 0.38 + wet * 0.4 ? "cloud" : "clear";
    const wind = kind === "storm" ? 35 + r2 * 20 : 5 + r3 * 22;
    return { kind, temp: Math.round(temp * 10) / 10, wind, windDir: r4 < 0.5 ? 1 : -1, place: loc.name, at: +when, day: when.toDateString(), block };
  }

  function create(o) {
    const { world } = o;
    let timer = 0, last = null, prevT = 0;
    const lang = () => (window.CatLife && window.CatLife.lang) || "en";
    function where() {
      let l = o.getLoc();
      if (l && l.lat != null && !l.biome) { const c = near(l.lat, l.lon); l = { ...l, biome: (c && c.biome) || "city", id: l.id || l.name }; o.setLoc(l); }     // a place saved by an older version
      if (!l || l.lat == null) { l = fromClock(lang()); if (!o.getLoc() || o.getLoc().auto !== false) o.setLoc({ ...l, auto: true }); } return l; }
    function refresh() {
      clearTimeout(timer); timer = setTimeout(refresh, 15 * 60e3);           // a look every quarter of an hour: just a few sums, nothing goes online
      if (!o.isOn()) { world.weather = null; o.onUpdate && o.onUpdate(null); return Promise.resolve(); }
      last = climate(where());
      if (!world.weather || !world.weather.preview) world.weather = last;
      o.onUpdate && o.onUpdate(last);
      return Promise.resolve();
    }
    // try a weather out for a minute (from ⚙️ Settings), then back to the usual one
    function preview(kind) {
      clearTimeout(prevT);
      world.weather = { kind, wind: kind === "storm" ? 35 : 14, windDir: 1, temp: kind === "snow" ? -2 : 12, preview: true, place: last ? last.place : "" };
      world.snowDepth = 0; world.flakes = []; world.drops = [];
      if (kind === "cloud" || kind === "rain" || kind === "storm" || kind === "drizzle") world.cloudT = 0;
      prevT = setTimeout(() => { world.weather = o.isOn() ? last : null; world.snowDepth = 0; }, 60e3);
    }
    return { refresh, findCity: async (name) => findCity(name, lang()), preview, get now() { return last; }, ICON };
  }
  window.CatWeather = { create, climate, fromClock, findCity };
})();
