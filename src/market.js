// 🛒 The market: food and furniture for coins, your things (with how worn they are), and how to earn.
(() => {
  const STR = {
    tr: {
      title: "Market", food: "Mama", furniture: "Eşyalar", mine: "Envanter", earn: "Kazan", luck: "Şans",
      pantryH: "Dolap", thingsH: "Eşyalar", use: { catnip: "Yere at", litter: "Kum kabını temizle", medicine: "Karttaki kediye ver", shampoo: "Karttaki kediyi yıka" }, useMeal: "Kaba koy",
      basics: "Temel", specials: "Güçlendirici mamalar",
      treatNote: "Numara öğretirken kendiliğinden kullanılır", buyMore: "Al", none: "Yok",
      chest: "Günlük hediye kasası", chestHint: "Her gün bir kez ücretsiz", openChest: "🎁 Aç", tomorrow: (h) => `⏳ ${h} sonra yenisi`,
      wheel: "Şans çarkı", spin: (n) => `Çevir 🪙 ${n}`, odds: "Şanslar", oddsNote: "Büyük ödüller çok nadirdir.",
      prize: { nothing: "Bu sefer boş çıktı 🙈", coins: (n) => `${n} altın kazandın! 🪙`, star: "Bir yıldız! ⭐", food: (e, nm, n) => `${e} ${nm} (×${n}) dolaba eklendi`, furniture: (nm) => `🎉 İnanılmaz! Bir ${nm} kazandın, envanterde`, cloth: (nm) => `👑 Efsane! Yeni bir model açıldı: ${nm}` },
      seg: { nothing: "Boş", furniture: "Eşya", cloth: "Kıyafet", star: "Yıldız" },
      toysH: "Oyuncaklar", homeH: "Ev eşyaları", ownedToy: "Senin ✓",
      toyE: { mouse: "🐭", box: "📦", butterfly: "🦋", wand: "🪶", post: "🪵", shelf: "🪜", laser: "🔴", brush: "🪮" },
      toys: { brush: ["Kedi fırçası", "Kartta 'Tara' ile kedini tararsın; temizlik ve sevgi"], mouse: ["Kurmalı fare", "Kurunca koşturur, kediler avlar"], box: ["Karton kutu", "İçine girip saklanırlar"], butterfly: ["Kelebek", "Uçuşur, kediler peşinden koşar"],
        wand: ["Tüylü olta", "Farenle sallarsın, zıplayıp yakalamaya çalışırlar"], post: ["Tırmalama direği", "Tırnaklarını biler"], shelf: ["Duvar rafı", "Yükseğe zıplayıp otururlar"],
        laser: ["Lazer", "Kırmızı noktayı kovalarlar. Lazer avı oyunu için gerekli"] },
      coins: (n) => `🪙 ${n}`, stars: (n) => `⭐ ${n}`, buy: (n) => `🪙 ${n}`, inStock: (n) => `Dolapta: ${n}`, owned: (n) => `${n} tane var`,
      foods: {
        dry: ["Kuru mama", "İki öğünlük bir paket. Karnı doyar, büyümeye devam eder."],
        wet: ["Yaş mama", "Tek öğün ama çok sever: biraz da sevgi kazandırır."],
        fish: ["Balık ziyafeti", "Özel gün yemeği: bol sevgi ve biraz büyüme."],
        treat: ["Ödül maması", "Üç tane. Numara öğretirken kullanılır, öğrenmesi kolaylaşır."],
        catnip: ["Kedi otu", "Bir kullanımlık. Kediler çılgına döner."],
        litter: ["Kedi kumu", "Kum kabını üç kez temizlemeye yeter."],
        medicine: ["İlaç", "Hasta bir kediyi iyileştirir."], shampoo: ["Kedi şampuanı", "İki banyo: tertemiz yapar ama kedi pek sevmez."],
        chicken: ["Tavuk", "Tok: 12 saat daha uzun tok tutar."], sardine: ["Sardalya", "Zeki: 4 saat numara öğrenmesi kolaylaşır."], tuna: ["Ton balığı", "Sevgi kalkanı: 6 saat sevgisi azalmaz."],
        mackerel: ["Uskumru", "Enerjik: 4 saat daha oyuncu."], liver: ["Ciğer", "Sağlıklı: 24 saat hastalanmaz, hastaysa iyileşir."], turkey: ["Hindi", "Huzurlu: 12 saat yalnızlık çekmez."],
        beef: ["Dana kıyma", "Enerjik: 8 saat koşturur, zıplar."], salmon: ["Somon", "Hızlı büyüme: 8 saat iki kat büyür."], lamb: ["Kuzu", "Şanslı: 6 saat görevlerden iki kat altın."],
        duck: ["Ördek", "Tok: bütün gün tok tutar."], shrimp: ["Karides", "Parlak: 6 saat ışıl ışıl, sevgisi daha hızlı dolar."], crab: ["Yengeç", "Şanslı: 12 saat görevlerden iki kat altın."],
        rabbit: ["Tavşan", "Hızlı büyüme: 12 saat iki kat büyür."], milk: ["Kedi sütü", "Uykucu ama mutlu: biraz sevgi kazandırır."], egg: ["Yumurta", "Zeki: 2 saat."],
        yogurt: ["Yoğurt", "Sağlıklı: 4 saat."], pumpkin: ["Balkabağı püresi", "Sağlıklı: 12 saat."], premium: ["Premium mama", "Üç öğünlük ekonomik paket."],
        catcake: ["Kedi pastası", "Sevgi kalkanı 12 saat, bol sevgi."], caviar: ["Havyar", "Kraliyet: 12 saat sevgi kalkanı, hızlı büyüme ve zekâ birden."],
      },
      put: "Ortaya koy", store: "Kaldır", repair: (n) => `Tamir 🪙 ${n}`, sell: (n) => `Sat 🪙 ${n}`, out: "Ortada", stored: "Depoda", worn: "Eskimiş", broken: "Kırık",
      durable: "Eskimez", noItems: "Henüz eşyan yok. Eşyalar sekmesinden alabilirsin.", cond: "Durumu",
      wearNote: "Çoğu eşya kullandıkça ve zamanla eskir; ✨ Eskimez yazanlar hariç. Kırılan eşyayı kediler kullanmaz; tamir edebilir ya da satabilirsin.",
      needMore: (n) => `${n} altın daha lazım`,
      ways: [
        ["🎯", "Görevler", "Her görev 1🪙, bir kedinin üç görevi de bitince +3🪙 ve 1⭐."],
        ["🔴", "Lazer avı", "Yakalanan her iki yıldıza 1🪙 (günde en çok 25🪙). 20 ve üstü skor 1⭐ (günde bir kez). Lazer gerekir."],
        ["💻", "Bilgisayar başında", "Sen bilgisayarı kullandıkça her 15 dakikada 1🪙 (günde en çok 20🪙)."],
        ["⭐", "Yıldızlar", "Yıldızlar sadece kedi kartındaki dolapta: şapka, tasma ve kıyafetler."],
      ],
      today: (pc, g) => `Bugün: bilgisayardan ${pc}/20🪙 · oyundan ${g}/25🪙`,
      pantry: "Dolap", empty: "Mama bitti! Buradan alabilirsin 🥣",
    },
    en: {
      title: "Market", food: "Food", furniture: "Furniture", mine: "Inventory", earn: "Earn", luck: "Luck",
      pantryH: "Cupboard", thingsH: "Things", use: { catnip: "Drop it", litter: "Clean the litter box", medicine: "Give to the open card's cat", shampoo: "Bath the open card's cat" }, useMeal: "Fill the bowl",
      basics: "Basics", specials: "Special meals (buffs)",
      treatNote: "Used automatically while teaching tricks", buyMore: "Buy", none: "None",
      chest: "Daily gift chest", chestHint: "Free once a day", openChest: "🎁 Open", tomorrow: (h) => `⏳ next one in ${h}`,
      wheel: "Wheel of luck", spin: (n) => `Spin 🪙 ${n}`, odds: "Odds", oddsNote: "Big prizes are very rare.",
      prize: { nothing: "Nothing this time 🙈", coins: (n) => `You won ${n} coins! 🪙`, star: "A star! ⭐", food: (e, nm, n) => `${e} ${nm} (×${n}) added to the cupboard`, furniture: (nm) => `🎉 Amazing! You won a ${nm}, it's in your inventory`, cloth: (nm) => `👑 Legendary! A new design unlocked: ${nm}` },
      seg: { nothing: "Nothing", furniture: "Furniture", cloth: "Outfit", star: "Star" },
      toysH: "Toys", homeH: "Furniture", ownedToy: "Yours ✓",
      toyE: { mouse: "🐭", box: "📦", butterfly: "🦋", wand: "🪶", post: "🪵", shelf: "🪜", laser: "🔴", brush: "🪮" },
      toys: { brush: ["Cat brush", "Brush your cat from its card: cleaner and happier"], mouse: ["Wind-up mouse", "Scurries about; the cats hunt it"], box: ["Cardboard box", "They climb in and hide"], butterfly: ["Butterfly", "Flutters about; the cats chase it"],
        wand: ["Feather wand", "Swing it with your mouse; they leap for it"], post: ["Scratching post", "For sharpening claws"], shelf: ["Wall shelf", "They leap up and lounge on it"],
        laser: ["Laser pointer", "They chase the red dot. Needed for the laser hunt"] },
      coins: (n) => `🪙 ${n}`, stars: (n) => `⭐ ${n}`, buy: (n) => `🪙 ${n}`, inStock: (n) => `In the cupboard: ${n}`, owned: (n) => `you own ${n}`,
      foods: {
        dry: ["Dry food", "A bag with two meals. Keeps them full so they keep growing."],
        wet: ["Wet food", "One meal they love: a little extra love too."],
        fish: ["Fish feast", "A special dinner: lots of love and a bit of growing."],
        treat: ["Treats", "Three of them. Used while teaching tricks, they learn faster."],
        catnip: ["Catnip", "One go. The cats go wild."],
        litter: ["Cat litter", "Enough to clean the litter box three times."],
        medicine: ["Medicine", "Makes a sick cat better."], shampoo: ["Cat shampoo", "Two baths: spotless, but the cat isn't a fan."],
        chicken: ["Chicken", "Full: stays full twice as long, 12 h."], sardine: ["Sardines", "Clever: learns tricks more easily, 4 h."], tuna: ["Tuna", "Love shield: love doesn't fade, 6 h."],
        mackerel: ["Mackerel", "Energetic: more playful, 4 h."], liver: ["Liver", "Healthy: can't get ill for 24 h, and cures."], turkey: ["Turkey", "Calm: never lonely, 12 h."],
        beef: ["Minced beef", "Energetic: runs and bounces, 8 h."], salmon: ["Salmon", "Growth boost: grows twice as fast, 8 h."], lamb: ["Lamb", "Lucky: double coins from tasks, 6 h."],
        duck: ["Duck", "Full: full all day."], shrimp: ["Shrimp", "Shiny: sparkles, love fills faster, 6 h."], crab: ["Crab", "Lucky: double coins from tasks, 12 h."],
        rabbit: ["Rabbit", "Growth boost: twice as fast, 12 h."], milk: ["Cat milk", "Sleepy but happy: a little love."], egg: ["Egg", "Clever: 2 h."],
        yogurt: ["Yoghurt", "Healthy: 4 h."], pumpkin: ["Pumpkin purée", "Healthy: 12 h."], premium: ["Premium food", "A good-value bag of three meals."],
        catcake: ["Cat cake", "Love shield for 12 h, and lots of love."], caviar: ["Caviar", "Royal: love shield, growth boost and cleverness for 12 h."],
      },
      put: "Place", store: "Put away", repair: (n) => `Repair 🪙 ${n}`, sell: (n) => `Sell 🪙 ${n}`, out: "Out", stored: "Stored", worn: "Worn", broken: "Broken",
      durable: "Never wears out", noItems: "You don't own anything yet. Have a look under Furniture.", cond: "Condition",
      wearNote: "Most things wear out with use and over time, except the ones marked ✨ Never wears out. Cats won't use something broken; repair it or sell it.",
      needMore: (n) => `${n} more coins needed`,
      ways: [
        ["🎯", "Tasks", "1🪙 per task, +3🪙 and 1⭐ when all three of a cat's tasks are done."],
        ["🔴", "Laser hunt", "1🪙 for every two stars caught (up to 25🪙 a day). A score of 20+ earns 1⭐ (once a day). Needs the laser."],
        ["💻", "At your computer", "1🪙 every 15 minutes while you're using your computer (up to 20🪙 a day)."],
        ["⭐", "Stars", "Stars are only for the wardrobe on the cat card: hats, collars and outfits."],
      ],
      today: (pc, g) => `Today: ${pc}/20🪙 from the computer · ${g}/25🪙 from the game`,
      pantry: "Cupboard", empty: "Out of food! You can buy some here 🥣",
    },
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function create(o) {
    const { world } = o, L = window.CatLife, DC = window.DesktopCat;
    const fab = document.createElement("button");
    fab.className = "ui st-fab mk-fab"; fab.type = "button"; fab.textContent = "🛒";
    const root = document.createElement("div");
    root.className = "ui mk"; root.hidden = true;
    document.body.append(fab, root);
    let tab = "food", note = "", key = "", result = "", spinning = false, wheelAngle = 0;
    const t = () => STR[L.lang] || STR.en;

    const repairCost = (it) => Math.ceil(DC.FURN[it.k].price * 0.5 * (1 - it.cond / 100));
    const sellPrice = (it) => Math.floor(DC.FURN[it.k].price * 0.3 * Math.max(0.2, it.cond / 100));
    const condLabel = (it, s) => it.cond <= 0 ? s.broken : it.cond < 40 ? s.worn : "";

    function render() {
      const s = t(), H = L.home, E = L.econToday();
      const k = [L.lang, tab, note, result, L.luck.chestDay, spinning, L.wallet.coins, L.wallet.stars, JSON.stringify(L.pantry), H.items.map((i) => `${i.id}${Math.round(i.cond)}${i.x != null}`).join()].join("|");
      if (k === key) return; key = k;
      const tabs = [["food", "🍗", s.food], ["furniture", "🛋️", s.furniture], ["mine", "🎒", s.mine], ["luck", "🎁", s.luck], ["earn", "🪙", s.earn]];
      let body = "";
      if (tab === "food") {
        const foodCard = ([f, d]) => card(`<div class="mk-emo">${d.e}</div>`, s.foods[f][0], s.foods[f][1], s.inStock(L.pantry[f] || 0), `<button type="button" class="mk-buy" data-food="${f}"${L.wallet.coins < d.price ? " disabled" : ""}>${s.buy(d.price)}</button>`, d.n > 1 ? `×${d.n}` : d.buff ? L.BUFFS[d.buff[0]] : "");
        const keys = Object.keys(L.FOOD), cut = keys.indexOf("chicken"), all = Object.entries(L.FOOD);
        body = `<div class="mk-pantry"><b>🧺 ${esc(s.pantry)}</b>${keys.filter((f) => L.pantry[f]).map((f) => `<span title="${esc(s.foods[f][0])}">${L.FOOD[f].e} ${L.pantry[f]}</span>`).join("")}</div>`
          + `<h4 class="mk-h">🥣 ${esc(s.basics)}</h4><div class="mk-grid">${all.slice(0, cut).map(foodCard).join("")}</div>`
          + `<h4 class="mk-h">✨ ${esc(s.specials)}</h4><div class="mk-grid">${all.slice(cut).map(foodCard).join("")}</div>`;
      } else if (tab === "furniture") {
        body = `<h4 class="mk-h">🧸 ${esc(s.toysH)}</h4><div class="mk-grid">${Object.entries(L.TOY_PRICES).map(([k, price]) => { const own = L.toys.includes(k), [nm, ds] = s.toys[k];
            return card(`<div class="mk-emo">${s.toyE[k]}</div>`, nm, ds, own ? s.ownedToy : "", own ? `<span class="mk-have">✓</span>` : `<button type="button" class="mk-buy" data-toy="${k}"${L.wallet.coins < price ? " disabled" : ""}>${s.buy(price)}</button>`); }).join("")}</div>
          <h4 class="mk-h">🛋️ ${esc(s.homeH)}</h4><div class="mk-grid">${Object.entries(DC.FURN).map(([f, d]) => { const n = H.items.filter((i) => i.k === f).length, [nm, ds] = L.t("furn")[f];
          return card(`<canvas width="96" height="72" data-f="${f}"></canvas>`, nm, ds, n ? s.owned(n) : "", `<button type="button" class="mk-buy" data-furn="${f}"${L.wallet.coins < d.price ? " disabled" : ""}>${s.buy(d.price)}</button>`); }).join("")}</div>`;
      } else if (tab === "mine") {
        // the cupboard: everything you've bought to eat or use, with what to do with it
        body = `<h4 class="mk-h">🧺 ${esc(s.pantryH)}</h4><div class="mk-list">${Object.entries(L.FOOD).filter(([f, d]) => !d.buff || L.pantry[f]).map(([f, d]) => { const n = L.pantry[f] || 0;
            const act = f === "treat" ? `<small class="mk-tn">${esc(s.treatNote)}</small>` : `<button type="button" class="gold" data-use="${f}"${n ? "" : " disabled"}>${esc(s.use[f] || s.useMeal)}</button>`;
            return `<div class="mk-prow${n ? "" : " zero"}"><span class="mk-pe">${d.e}</span><div class="mk-info"><b>${esc(s.foods[f][0])}</b><small>×${n}</small></div><div class="mk-acts">${act}${n ? "" : `<button type="button" class="ghost" data-tab="food">${esc(s.buyMore)}</button>`}</div></div>`; }).join("")}</div>
          <h4 class="mk-h">🛋️ ${esc(s.thingsH)}</h4>`;
        body += H.items.length ? `<p class="mk-note">${esc(s.wearNote)}</p><div class="mk-list">${H.items.map((it) => {
          const [nm] = L.t("furn")[it.k], dur = DC.FURN[it.k].durable; if (dur) it.cond = 100;
          const c = Math.round(it.cond), lab = condLabel(it, s), rc = repairCost(it);
          return `<div class="mk-row${it.cond <= 0 ? " broken" : ""}" data-id="${it.id}"><canvas width="64" height="48" data-f="${it.k}"></canvas>
            <div class="mk-info"><b>${esc(nm)}</b><small>${esc(it.x != null ? s.out : s.stored)}${lab ? ` · <em>${esc(lab)}</em>` : ""}</small>
              ${dur ? `<small class="mk-dur">✨ ${esc(s.durable)}</small>` : `<span class="mk-cond" title="${esc(s.cond)} ${c}%"><i style="--c:${c}%;--h:${Math.round(c * 1.2)}"></i></span>`}</div>
            <div class="mk-acts"><button type="button" data-it="${it.x != null ? "store" : "put"}">${esc(it.x != null ? s.store : s.put)}</button>
              ${!dur && it.cond < 90 ? `<button type="button" class="gold" data-it="repair"${L.wallet.coins < rc ? " disabled" : ""}>${esc(s.repair(rc))}</button>` : ""}
              <button type="button" class="ghost" data-it="sell">${esc(s.sell(sellPrice(it)))}</button></div></div>`; }).join("")}</div>` : `<p class="mk-empty">🪑<br>${esc(s.noItems)}</p>`;
      } else if (tab === "luck") {
        const ready = L.chestReady(), left = (() => { const m = new Date(); m.setHours(24, 0, 0, 0); const d = m - Date.now(); return `${Math.floor(d / 3.6e6)}sa ${Math.floor(d / 6e4) % 60}dk`; })();
        const tot = L.WHEEL.reduce((a, r) => a + r[1], 0);
        body = `${result ? `<div class="mk-result">${esc(result)}</div>` : ""}
          <div class="mk-chest${ready ? " ready" : ""}"><span class="mk-chest-e">🎁</span><div><b>${esc(s.chest)}</b><small>${esc(s.chestHint)}</small></div>
            ${ready ? `<button type="button" class="mk-buy" data-chest="1">${esc(s.openChest)}</button>` : `<small class="mk-wait">${esc(s.tomorrow(L.lang === "tr" ? left : left.replace("sa", "h ").replace("dk", "m")))}</small>`}</div>
          <div class="mk-wheelbox"><b>🎡 ${esc(s.wheel)}</b>
            <div class="mk-wheel"><canvas width="440" height="440" style="transform:rotate(${wheelAngle}deg)"></canvas><span class="mk-pointer">▼</span></div>
            <button type="button" class="mk-buy big" data-spin="1"${spinning || L.wallet.coins < L.WHEEL_COST ? " disabled" : ""}>${esc(s.spin(L.WHEEL_COST))}</button>
            <details class="mk-odds"><summary>${esc(s.odds)}</summary><small>${esc(s.oddsNote)}</small><ul>${L.WHEEL.map((r) => `<li><span>${segLabel(r, s)}</span><b>${(r[1] / tot * 100).toFixed(1).replace(".0", "")}%</b></li>`).join("")}</ul></details></div>`;
      } else {
        body = `<div class="mk-ways">${s.ways.map(([e, h, d]) => `<div class="mk-way"><span>${e}</span><div><b>${esc(h)}</b><small>${esc(d)}</small></div></div>`).join("")}</div><p class="mk-today">${esc(s.today(E.pc, E.game))}</p>`;
      }
      root.innerHTML = `
        <div class="mk-head"><b>🛒 ${esc(s.title)}</b><span class="mk-wal"><span class="coin">${s.coins(L.wallet.coins)}</span><span class="star">${s.stars(L.wallet.stars)}</span></span><button type="button" class="st-x" data-a="close">×</button></div>
        <div class="mk-tabs">${tabs.map(([id, e, l]) => `<button type="button" data-tab="${id}" class="${tab === id ? "on" : ""}">${e} ${esc(l)}</button>`).join("")}</div>
        ${note ? `<div class="mk-flash">${esc(note)}</div>` : ""}
        <div class="mk-body">${body}</div>`;
      root.querySelectorAll("canvas[data-f]").forEach((c) => DC.furnitureThumb(c.dataset.f, c.getContext("2d")));
      const wc = root.querySelector(".mk-wheel canvas"); if (wc) drawWheel(wc, s);
    }
    function segLabel(r, s) { const [k, , rg] = r; return k === "coins" ? `🪙 ${rg[0]}` : L.FOOD[k] ? `${L.FOOD[k].e} ${s.foods[k][0]}` : { nothing: "🙈 ", star: "⭐ ", furniture: "🛋️ ", cloth: "👑 " }[k] + s.seg[k]; }
    // the wheel: one slice per prize (slices are equal; the real odds are listed underneath)
    function drawWheel(c, s) {
      const g = c.getContext("2d"), n = L.WHEEL.length, R = 210, cx = 220, cy = 220;
      const cols = ["#ffe1ea", "#fff1b8", "#dff3ff", "#e4f8ee", "#f1e4ff", "#ffe9d6"];
      for (let i = 0; i < n; i++) {
        const a0 = -Math.PI / 2 + (i - 0.5) * 2 * Math.PI / n, a1 = a0 + 2 * Math.PI / n, r = L.WHEEL[i][0];
        g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, a0, a1); g.closePath();
        g.fillStyle = ["furniture", "cloth", "star"].includes(r) ? "#ffd34d" : cols[i % cols.length]; g.fill();
        g.strokeStyle = "#5b3a29"; g.lineWidth = 3; g.stroke();
        g.save(); g.translate(cx, cy); g.rotate((a0 + a1) / 2); g.textAlign = "right"; g.textBaseline = "middle";
        const row = L.WHEEL[i], e = row[0] === "coins" ? "🪙" : L.FOOD[row[0]] ? L.FOOD[row[0]].e : { nothing: "🙈", star: "⭐", furniture: "🛋️", cloth: "👑" }[row[0]];
        g.font = "34px sans-serif"; g.fillText(e, R - 14, 0);
        if (row[0] === "coins") { g.font = '700 24px "Pixelify Sans", monospace'; g.fillStyle = "#5b3a29"; g.fillText(String(row[2][0]), R - 58, 2); }
        g.restore();
      }
      g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.lineWidth = 8; g.strokeStyle = "#5b3a29"; g.stroke();
      g.beginPath(); g.arc(cx, cy, 30, 0, Math.PI * 2); g.fillStyle = "#ff8fab"; g.fill(); g.lineWidth = 5; g.stroke();
    }
    function prizeText(p, s) {
      if (p.k === "nothing") return s.prize.nothing;
      if (p.k === "coins") return s.prize.coins(p.n);
      if (p.k === "star") return s.prize.star;
      if (L.FOOD[p.k]) return s.prize.food(L.FOOD[p.k].e, s.foods[p.k][0], p.n);
      if (p.k === "furniture") return s.prize.furniture(L.t("furn")[p.item.k][0]);
      if (p.k === "cloth") { const W = DC.WARDROBE, [kind, d] = p.design; return s.prize.cloth(W[kind][d][L.lang]); }
      return "";
    }
    function card(pic, name, desc, sub, btn, badge = "") {
      return `<div class="mk-card"><div class="mk-pic">${pic}${badge ? `<span class="mk-badge">${badge}</span>` : ""}</div><b>${esc(name)}</b><small>${esc(desc)}</small><div class="mk-foot"><em>${esc(sub)}</em>${btn}</div></div>`;
    }
    function pop(el, txt) {
      const r = el.getBoundingClientRect(), f = document.createElement("div");
      f.className = "ui mk-pop"; f.textContent = txt; f.style.left = `${r.left + r.width / 2}px`; f.style.top = `${r.top}px`;
      document.body.appendChild(f); setTimeout(() => f.remove(), 900);
    }

    // beside the cat card when it's open; otherwise in the corner above the floor
    function place() {
      const bottom = Math.max(12, innerHeight - world.floor + 10);
      fab.hidden = world.cats.some((c) => c.profile);
      fab.style.bottom = `${bottom}px`;
      if (window.CatCard.beside(root)) return;
      root.style.height = ""; root.style.left = "auto"; root.style.right = "14px"; root.style.top = "auto"; root.style.bottom = `${bottom + 52}px`;
      root.style.setProperty("--maxh", `${Math.max(260, innerHeight - bottom - 80)}px`);
    }
    function open(which, msg) { if (which) tab = which; note = msg || ""; root.hidden = false; key = ""; render(); place(); o.onOpen && o.onOpen(); }
    function close() { root.hidden = true; note = ""; o.onClose && o.onClose(); }
    fab.onclick = () => (root.hidden ? open() : close());

    root.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b || b.disabled) return;
      if (b.dataset.a === "close") return close();
      if (b.dataset.tab) { tab = b.dataset.tab; note = ""; result = ""; return render(); }
      if (b.dataset.use) { o.useFood(b.dataset.use); pop(b, L.FOOD[b.dataset.use].e); key = ""; return render(); }
      if (b.dataset.chest) {
        const p = L.openChest(); if (!p) return;
        const box = root.querySelector(".mk-chest"); box.classList.add("opening");
        setTimeout(() => { result = prizeText(p, t()); key = ""; render(); if (p.k !== "nothing") world.confetti(innerWidth / 2, 140, p.k === "furniture" || p.k === "cloth" ? 60 : 20); }, 900);
        return;
      }
      if (b.dataset.spin) {
        if (spinning) return; const r = L.spinWheel(); if (!r) return;
        spinning = true; result = ""; key = ""; render();
        // land the chosen slice under the pointer, after a few full turns
        const n = L.WHEEL.length, target = -(r.i * 360 / n) + (Math.random() - 0.5) * (300 / n);
        wheelAngle = wheelAngle - (wheelAngle % 360) + 360 * 5 + target;
        const c = root.querySelector(".mk-wheel canvas"); c.style.transition = "transform 3.4s cubic-bezier(.12,.75,.12,1)"; requestAnimationFrame(() => { c.style.transform = `rotate(${wheelAngle}deg)`; });
        setTimeout(() => { spinning = false; result = prizeText(r.prize, t()); key = ""; render(); const p = r.prize.k; if (p !== "nothing") world.confetti(innerWidth / 2, 140, p === "furniture" || p === "cloth" || p === "star" ? 70 : 16); }, 3500);
        return;
      }
      if (b.dataset.food) { if (L.buyFood(b.dataset.food)) { pop(b, `+${L.FOOD[b.dataset.food].n} ${L.FOOD[b.dataset.food].e}`); note = ""; } }
      else if (b.dataset.toy) { if (L.buyToy(b.dataset.toy)) { pop(b, "🎉"); o.onToy && o.onToy(b.dataset.toy); } }
      else if (b.dataset.furn) {
        const k = b.dataset.furn, price = DC.FURN[k].price; if (L.wallet.coins < price) return;
        L.wallet.coins -= price; const it = { id: Math.random().toString(36).slice(2, 9), k, cond: 100, x: null };
        L.home.items.push(it); o.placeItem(it); pop(b, "🎉"); L.changed();
      } else if (b.dataset.it) {
        const it = L.home.items.find((i) => i.id === b.closest("[data-id]").dataset.id); if (!it) return;
        const a = b.dataset.it;
        if (a === "put") o.placeItem(it);
        else if (a === "store") o.storeItem(it);
        else if (a === "repair") { const c = repairCost(it); if (L.wallet.coins >= c) { L.wallet.coins -= c; it.cond = 100; pop(b, "🔧✨"); } }
        else if (a === "sell") { o.storeItem(it); L.home.items = L.home.items.filter((i) => i !== it); L.wallet.coins += sellPrice(it); pop(b, `+🪙${sellPrice(it)}`); }
        L.changed();
      }
      key = ""; render();
    });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && !root.hidden) close(); });
    addEventListener("resize", place);
    place();
    setInterval(() => { place(); if (!root.hidden) render(); }, 1000);
    return { open, close, render: () => { key = ""; if (!root.hidden) render(); }, get isOpen() { return !root.hidden; }, t };
  }
  window.CatMarket = { create };
})();
