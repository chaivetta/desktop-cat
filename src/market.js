// 🛒 The market: food and furniture for coins, your things (with how worn they are), and how to earn.
(() => {
  const STR = {
    tr: {
      bowlN: "Mama kabı", bowlD: "Önce ortaya çıkar, sonra dolaptan mamayı koy. İşin bitince envantere geri koyabilirsin.", fillBowl: (n) => `Mamayı koy (${n} öğün)`, noMeal: "Dolapta mama yok",
      pickOne: "Bir şeye dokun: ne yapabileceğin burada çıkar 👆", stow: "🎒 Envantere koy", noFood: "Dolap boş. Marketten mama alabilirsin.", noToys: "Oyuncağın yok. Marketten alabilirsin.",
      toyNote: "Oyuncaklar envantere gelir; oradan çıkarır ya da geri koyarsın. Oynadıkça (ve dışarıda kaldıkça) eskir, bitince yenisini alman gerekir.", inInv: (c) => `🎒 Envanterde · %${c}`, again: "Bir daha",
      catsT: "Kediler", toysT: "Oyuncak", posts: "gönderi", atHome: "evde", price: "fiyat", free: "Ücretsiz", unlocked: "Açık",
      adopt: "🐾 Yavrusunu sahiplen", unlock: (n) => `🔒 Kilidi aç ⭐ ${n}`, needStars: (n) => `⭐ ${n} yıldız daha lazım`, full: "Evin dolu (en çok 8 kedi)",
      catsNote: "Sarman ücretsiz. Diğer cinsler görevlerden kazandığın yıldızlarla bir kez açılır, sonra istediğin kadar sahiplenirsin.",
      unlockedMsg: (n) => `🎉 ${n} artık seninle! Sahiplenebilirsin`,
      bios: { ginger: "Turuncu çizgili, mama düşkünü, en tatlı başlangıç 🧡", black: "Gece kadar kara, sarı gözlü, sessiz ama hep yanında 🌙", white: "Bembeyaz pamuk, mavi gözlü, biraz nazlı ☁️", grey: "Gri tekir, meraklı ve oyunbaz 🐾", tuxedo: "Smokinli beyefendi, her an bir davete hazır 🎩", calico: "Üç renkli şans kedisi, karakteri güçlü 🍀", siamese: "Siyam: konuşkan, mavi gözlü, ilgi ister 💙" },
      caps: ["merhaba 👋", "uyku vakti 💤", "ekmek modu 🍞", "gerin gerin", "temizlik 🫧", "göbek göster 😹"],
      toyPlay: "Çıkar", toyOn: "Aç", toyOff: "Kapat", onCard: "Kartta kullanılır", clearToys: "🧺 Oyuncakları topla", yarnFree: "Ücretsiz",
      title: "Market", food: "Mama", furniture: "Eşyalar", mine: "Envanter", earn: "Kazan", luck: "Şans",
      pantryH: "Dolap", thingsH: "Eşyalar", use: { catnip: "Yere at", litter: "Kum kabını temizle", medicine: "Karttaki kediye ver", shampoo: "Karttaki kediyi yıka" }, useMeal: "Kaba koy",
      basics: "Temel", specials: "Güçlendirici mamalar",
      treatNote: "Numara öğretirken kendiliğinden kullanılır", buyMore: "Al", none: "Yok",
      chest: "Günlük hediye kasası", chestHint: "Her gün bir kez ücretsiz", openChest: "🎁 Aç", tomorrow: (h) => `⏳ ${h} sonra yenisi`,
      wheel: "Şans çarkı", spin: (n) => `Çevir 🪙 ${n}`, odds: "Şanslar", oddsNote: "Büyük ödüller çok nadirdir.",
      prize: { nothing: "Bu sefer boş çıktı 🙈", coins: (n) => `${n} altın kazandın! 🪙`, star: "Bir yıldız! ⭐", food: (e, nm, n) => `${e} ${nm} (×${n}) dolaba eklendi`, furniture: (nm) => `🎉 İnanılmaz! Bir ${nm} kazandın, envanterde`, cloth: (nm) => `👑 Efsane! Yeni bir model açıldı: ${nm}` },
      seg: { nothing: "Boş", furniture: "Eşya", cloth: "Kıyafet", star: "Yıldız" },
      toysH: "Oyuncaklar", homeH: "Ev eşyaları", ownedToy: "Senin ✓",
      toyE: { yarn: "🧶", mouse: "🐭", box: "📦", butterfly: "🦋", wand: "🪶", post: "🪵", shelf: "🪜", laser: "🔴", brush: "🪮" },
      toys: { yarn: ["Yumak", "Fırlat, yakalasınlar. Yumağı ya da ipini tutup sallayabilirsin"], brush: ["Kedi fırçası", "Kartta 'Tara' ile kedini tararsın; temizlik ve sevgi"], mouse: ["Kurmalı fare", "Kurunca koşturur, kediler avlar"], box: ["Karton kutu", "İçine girip saklanırlar"], butterfly: ["Kelebek", "Uçuşur, kediler peşinden koşar"],
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
      wearNote: "Çoğu eşya ve oyuncak kullandıkça ve zamanla eskir (✨ Eskimez yazanlar hariç). Kırılan eşyayı tamir edebilir ya da satabilirsin; biten oyuncak gider.",
      needMore: (n) => `${n} altın daha lazım`,
      ways: [
        ["🎯", "Görevler", "Her görev 1🪙, bir kedinin üç görevi de bitince +3🪙 ve 1⭐."],
        ["🔴", "Lazer avı", "Yakalanan her iki yıldıza 1🪙 (günde en çok 25🪙). 20 ve üstü skor 1⭐ (günde bir kez). Lazer gerekir."],
        ["💻", "Bilgisayar başında", "Sen bilgisayarı kullandıkça her 15 dakikada 1🪙 (günde en çok 20🪙)."],
        ["🧳", "Misafir kediler", "Küçük bir kedi oteli gibi: 1-2 saatte bir (günde en çok 7) bir komşu kedisini bir günden bir haftaya kadar bırakmak ister. Ücret günlük: ne kadar uzun kalırsa o kadar çok. İyi bak, evin güzel olsun; hasta ya da ilgisiz kalırsa para yok, ünün düşer."],
        ["⭐", "Yıldızlar", "Yıldızlarla yeni kedi cinslerinin kilidini (Kediler sekmesi) ve kartın dolabındaki şapka, aksesuar, kıyafetleri açarsın."],
      ],
      today: (pc, g) => `Bugün: bilgisayardan ${pc}/20🪙 · oyundan ${g}/25🪙`,
      pantry: "Dolap", empty: "Mama bitti! Buradan alabilirsin 🥣",
    },
    en: {
      bowlN: "Food bowl", bowlD: "Take it out first, then put food in it from the cupboard. Put it away when you're done.", fillBowl: (n) => `Fill it (${n} meals)`, noMeal: "No food in the cupboard",
      pickOne: "Tap something to see what you can do with it 👆", stow: "🎒 Put away", noFood: "The cupboard is empty. Buy food in the market.", noToys: "No toys yet. Buy some in the market.",
      toyNote: "Toys go to your inventory, where you take them out or put them away. They wear out with play (and while left out); when one's gone you'll need a new one.", inInv: (c) => `🎒 In inventory · ${c}%`, again: "Again",
      catsT: "Cats", toysT: "Toys", posts: "posts", atHome: "at home", price: "price", free: "Free", unlocked: "Unlocked",
      adopt: "🐾 Adopt a kitten", unlock: (n) => `🔒 Unlock for ⭐ ${n}`, needStars: (n) => `⭐ ${n} more stars needed`, full: "Your home is full (8 cats at most)",
      catsNote: "The ginger tabby is free. Every other coat is unlocked once with stars from tasks, then you can adopt as many as you like.",
      unlockedMsg: (n) => `🎉 ${n} is yours! You can adopt one now`,
      bios: { ginger: "Orange stripes, loves food, the sweetest start 🧡", black: "Black as night, yellow eyes, quiet but always near 🌙", white: "Soft as cotton, blue eyes, a little fussy ☁️", grey: "Grey tabby, curious and playful 🐾", tuxedo: "A gentleman in a tux, always ready for a party 🎩", calico: "Lucky three-colour cat with lots of character 🍀", siamese: "Siamese: chatty, blue-eyed, wants attention 💙" },
      caps: ["hello 👋", "nap time 💤", "loaf mode 🍞", "big stretch", "bath time 🫧", "belly up 😹"],
      toyPlay: "Take out", toyOn: "On", toyOff: "Off", onCard: "Used from the card", clearToys: "🧺 Put toys away", yarnFree: "Free",
      title: "Market", food: "Food", furniture: "Furniture", mine: "Inventory", earn: "Earn", luck: "Luck",
      pantryH: "Cupboard", thingsH: "Things", use: { catnip: "Drop it", litter: "Clean the litter box", medicine: "Give to the open card's cat", shampoo: "Bath the open card's cat" }, useMeal: "Fill the bowl",
      basics: "Basics", specials: "Special meals (buffs)",
      treatNote: "Used automatically while teaching tricks", buyMore: "Buy", none: "None",
      chest: "Daily gift chest", chestHint: "Free once a day", openChest: "🎁 Open", tomorrow: (h) => `⏳ next one in ${h}`,
      wheel: "Wheel of luck", spin: (n) => `Spin 🪙 ${n}`, odds: "Odds", oddsNote: "Big prizes are very rare.",
      prize: { nothing: "Nothing this time 🙈", coins: (n) => `You won ${n} coins! 🪙`, star: "A star! ⭐", food: (e, nm, n) => `${e} ${nm} (×${n}) added to the cupboard`, furniture: (nm) => `🎉 Amazing! You won a ${nm}, it's in your inventory`, cloth: (nm) => `👑 Legendary! A new design unlocked: ${nm}` },
      seg: { nothing: "Nothing", furniture: "Furniture", cloth: "Outfit", star: "Star" },
      toysH: "Toys", homeH: "Furniture", ownedToy: "Yours ✓",
      toyE: { yarn: "🧶", mouse: "🐭", box: "📦", butterfly: "🦋", wand: "🪶", post: "🪵", shelf: "🪜", laser: "🔴", brush: "🪮" },
      toys: { yarn: ["Yarn", "Throw it for them, or swing it by the ball or the string"], brush: ["Cat brush", "Brush your cat from its card: cleaner and happier"], mouse: ["Wind-up mouse", "Scurries about; the cats hunt it"], box: ["Cardboard box", "They climb in and hide"], butterfly: ["Butterfly", "Flutters about; the cats chase it"],
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
      wearNote: "Most things and toys wear out with use and over time (not the ones marked ✨ Never wears out). Repair or sell broken things; a worn-out toy is gone.",
      needMore: (n) => `${n} more coins needed`,
      ways: [
        ["🎯", "Tasks", "1🪙 per task, +3🪙 and 1⭐ when all three of a cat's tasks are done."],
        ["🔴", "Laser hunt", "1🪙 for every two stars caught (up to 25🪙 a day). A score of 20+ earns 1⭐ (once a day). Needs the laser."],
        ["💻", "At your computer", "1🪙 every 15 minutes while you're using your computer (up to 20🪙 a day)."],
        ["🧳", "Guest cats", "Like a little cat hotel: every 1–2 hours (at most 7 a day) a neighbour asks you to keep their cat for a day up to a week. The pay is per day. Look after it well and keep a nice home; if it gets ill or neglected, no pay and your name suffers."],
        ["⭐", "Stars", "Stars unlock new cat coats (the Cats tab) and the hats, accessories and outfits in the card's wardrobe."],
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
    let tab = o.only || "cats", coatSel = "ginger", sel = "", note = "", key = "", result = "", spinning = false, wheelAngle = 0;
    const t = () => STR[L.lang] || STR.en;

    const repairCost = (it) => Math.ceil(DC.FURN[it.k].price * 0.5 * (1 - it.cond / 100) * (1 - 0.15 * (L.sk ? L.sk("k1") : 0)));
    const sellPrice = (it) => Math.floor(DC.FURN[it.k].price * 0.3 * Math.max(0.2, it.cond / 100) * (1 + 0.2 * (L.sk ? L.sk("k3") : 0)));
    const condLabel = (it, s) => it.cond <= 0 ? s.broken : it.cond < 40 ? s.worn : "";

    function render() {
      const s = t(), H = L.home, E = L.econToday();
      const k = [L.lang, tab, sel, L.prog ? L.prog.lvl : 1, JSON.stringify(L.toyCond), coatSel, (L.wallet.coats || []).join(), o.catCount ? o.catCount() : 0, o.toyOn ? Object.keys(L.TOY_PRICES).map(o.toyOn).join() : "", o.bowl ? o.bowl().out() : "", L.toys.join(), note, result, L.luck.chestDay, spinning, L.wallet.coins, L.wallet.stars, JSON.stringify(L.pantry), H.items.map((i) => `${i.id}${Math.round(i.cond)}${i.x != null}`).join()].join("|");
      if (k === key) return; key = k;
      // the inventory has its own panel (🎒 on the card); the market keeps the shop tabs
      const tabs = o.only ? [] : [["cats", "🐱", s.catsT], ["food", "🍗", s.food], ["toys", "🧸", s.toysT], ["furniture", "🛋️", s.furniture], ["luck", "🎁", s.luck], ["earn", "🪙", s.earn]];
      let body = "";
      if (tab === "food") {
        const foodCard = ([f, d]) => card(`<div class="mk-emo">${d.e}</div>`, s.foods[f][0], s.foods[f][1], s.inStock(L.pantry[f] || 0), `<button type="button" class="mk-buy" data-food="${f}"${L.wallet.coins < d.price ? " disabled" : ""}>${s.buy(d.price)}</button>`, d.n > 1 ? `×${d.n}` : d.buff ? L.BUFFS[d.buff[0]] : "");
        const keys = Object.keys(L.FOOD), cut = keys.indexOf("chicken"), all = Object.entries(L.FOOD);
        body = `<div class="mk-pantry"><b>🧺 ${esc(s.pantry)}</b>${keys.filter((f) => L.pantry[f]).map((f) => `<span title="${esc(s.foods[f][0])}">${L.FOOD[f].e} ${L.pantry[f]}</span>`).join("")}</div>`
          + `<h4 class="mk-h">🥣 ${esc(s.basics)}</h4><div class="mk-grid">${all.slice(0, cut).map(foodCard).join("")}</div>`
          + `<h4 class="mk-h">✨ ${esc(s.specials)}</h4><div class="mk-grid">${all.slice(cut).map(foodCard).join("")}</div>`;
      } else if (tab === "cats") {
        body = catsTab(s);
      } else if (tab === "toys") {
        // toys are bought here and live in the inventory (🎒), where you take them out or put them away; they wear out with play
        body = `<p class="mk-note">${esc(s.toyNote)}</p><div class="mk-grid">${Object.keys(L.TOY_PRICES).map((k) => { const price = L.TOY_PRICES[k], own = L.toys.includes(k), [nm, ds] = s.toys[k];
            const btn = own ? `<span class="mk-have">✓</span>` : `<button type="button" class="mk-buy" data-toy="${k}"${L.wallet.coins < price ? " disabled" : ""}>${s.buy(price)}</button>`;
            return card(`<div class="mk-emo">${s.toyE[k]}</div>`, nm, ds, own ? s.inInv(L.toyCondOf(k)) : "", btn); }).join("")}</div>`;
      } else if (tab === "furniture") {
        body = `<h4 class="mk-h">🛋️ ${esc(s.homeH)}</h4><div class="mk-grid">${Object.entries(DC.FURN).map(([f, d]) => { const n = H.items.filter((i) => i.k === f).length, [nm, ds] = L.t("furn")[f];
          return card(`<canvas width="96" height="72" data-f="${f}"></canvas>`, nm, ds, n ? s.owned(n) : "", (L.furnLevel && L.prog.lvl < L.furnLevel(d.price) ? `<button type="button" class="mk-buy" disabled>🔒 ${L.lang === "tr" ? "Sv." : "Lv."} ${L.furnLevel(d.price)}</button>` : `<button type="button" class="mk-buy" data-furn="${f}"${L.wallet.coins < d.price ? " disabled" : ""}>${s.buy(d.price)}</button>`)); }).join("")}</div>`;
      } else if (tab === "mine") {
        // icons in a grid: food, toys and things; tap one to see what you can do with it
        const foods = Object.keys(L.FOOD).filter((f) => (L.pantry[f] || 0) > 0), toys = L.toys.filter((k) => s.toys[k]), items = H.items;
        const bar = (c) => `<span class="iv-bar"><i style="--c:${c}%;--h:${Math.round(c * 1.2)}"></i></span>`;
        const tile = (id, pic, badge, extra, out) => `<button type="button" class="iv-tile${sel === id ? " sel" : ""}${out ? " out" : ""}" data-sel="${id}">${pic}${badge ? `<b class="iv-n">${badge}</b>` : ""}${extra}</button>`;
        const grid = (h, list, empty) => `<h4 class="mk-h">${h}</h4>${list.length ? `<div class="iv-grid">${list.join("")}</div>` : `<p class="iv-empty">${esc(empty)}</p>`}`;
        if (!sel || !(sel === "b:bowl" || (sel.startsWith("f:") && foods.includes(sel.slice(2))) || (sel.startsWith("t:") && toys.includes(sel.slice(2))) || (sel.startsWith("i:") && items.some((i) => i.id === sel.slice(2))))) sel = "";
        body = `<div class="iv-detail">${detail(s)}</div>`
          + grid(`🧺 ${esc(s.pantryH)}`, foods.map((f) => tile("f:" + f, `<span class="iv-e">${L.FOOD[f].e}</span>`, "×" + L.pantry[f], "", false)), s.noFood)
          + grid(`🧸 ${esc(s.toysH)}`, toys.map((k) => tile("t:" + k, `<span class="iv-e">${s.toyE[k]}</span>`, "", bar(L.toyCondOf(k)), o.toyOn && o.toyOn(k))), s.noToys)
          + grid(`🛋️ ${esc(s.thingsH)}`, [tile("b:bowl", `<span class="iv-e">🥣</span>`, "", "", o.bowl && o.bowl().out())].concat(items.map((it) => { if (DC.FURN[it.k].durable) it.cond = 100; return tile("i:" + it.id, `<canvas width="56" height="42" data-f="${it.k}"></canvas>`, "", DC.FURN[it.k].durable ? "" : bar(Math.round(it.cond)), it.x != null); })), s.noItems)
          + `<div class="iv-foot"><button type="button" class="mk-wide" data-clear="1">${esc(s.clearToys)}</button><small>${esc(s.wearNote)}</small></div>`;
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
        body = `<div class="mk-ways">${s.ways.map(([e, h, d]) => `<div class="mk-way"><span>${e}</span><div><b>${esc(h)}</b><small>${esc(d)}</small></div></div>`).join("")}</div><p class="mk-today">${esc(s.today(E.pc, E.game))}</p>${L.guests ? `<p class="mk-today">🧳 ${L.lang === "tr" ? "Bakıcı ünün" : "Sitter rating"}: ${"★".repeat(Math.max(0, Math.round(L.guests.rep / 2)))}${"☆".repeat(5 - Math.max(0, Math.round(L.guests.rep / 2)))} · ${L.lang === "tr" ? "bakılan" : "looked after"}: ${L.guests.done}</p>` : ""}`;
      }
      root.innerHTML = `
        <div class="mk-head"><b>${o.only ? "🎒 " + esc(s.mine) : "🛒 " + esc(s.title)}</b><span class="mk-wal"><span class="coin">${s.coins(L.wallet.coins)}</span><span class="star">${s.stars(L.wallet.stars)}</span></span><button type="button" class="st-x" data-a="close">×</button></div>
        ${o.only ? "" : `<div class="mk-tabs">${tabs.map(([id, e, l]) => `<button type="button" data-tab="${id}" class="${tab === id ? "on" : ""}"><span>${e}</span>${esc(l)}</button>`).join("")}</div>`}
        ${note ? `<div class="mk-flash">${esc(note)}</div>` : ""}
        <div class="mk-body">${body}</div>`;
      root.querySelectorAll("canvas[data-f]").forEach((c) => DC.furnitureThumb(c.dataset.f, c.getContext("2d")));
      const wc = root.querySelector(".mk-wheel canvas"); if (wc) drawWheel(wc, s);
      if (tab === "cats") drawCats();
    }
    // 🐱 the cats, like a little photo profile each: a round picture, a bio, and a grid of "posts"
    const POSTS = [["sit", "#ffe1ea"], ["sleep", "#dff3ff"], ["loaf", "#fff1b8"], ["stretch", "#e4f8ee"], ["groom", "#f1e4ff"], ["bellyUp", "#ffe9d6"]];
    const likes = (c, i) => { let h = 2166136261; for (const ch of c + "#" + i) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return 60 + ((h >>> 0) % 900); };
    function catsTab(s) {
      const DCk = DC.COAT_KEYS, c = coatSel, own = L.hasCoat(c), price = L.COAT_PRICES[c] || 0, nm = L.COAT_NAMES[c][L.lang];
      const home = (o.catCountOf ? o.catCountOf(c) : 0), full = o.catCount && o.catCount() >= (L.MAX_CATS || 8);
      const handle = "@" + L.COAT_NAMES[c].en.toLowerCase().replace(/[^a-z]+/g, ".") + ".cat";
      const btn = !own ? (L.wallet.stars >= price ? `<button type="button" class="ig-btn gold" data-unlock="${c}">${esc(s.unlock(price))}</button>` : `<button type="button" class="ig-btn" disabled>${esc(s.unlock(price))}</button><small class="ig-need">${esc(s.needStars(price - L.wallet.stars))}</small>`)
        : full ? `<button type="button" class="ig-btn" disabled>${esc(s.full)}</button>` : `<button type="button" class="ig-btn pink" data-adopt="${c}">${esc(s.adopt)}</button>`;
      return `<div class="ig-stories">${DCk.map((k) => `<button type="button" class="ig-st${k === c ? " sel" : ""}${L.hasCoat(k) ? "" : " locked"}" data-coat="${k}"><span class="ig-ring"><canvas width="52" height="52" data-av="${k}"></canvas></span><small>${esc(L.COAT_NAMES[k][L.lang])}</small></button>`).join("")}</div>
        <div class="ig-prof">
          <div class="ig-top"><span class="ig-ring big${own ? "" : " locked"}"><canvas width="84" height="84" data-av="${c}"></canvas></span>
            <div class="ig-stats"><div><b>${POSTS.length}</b><small>${esc(s.posts)}</small></div><div><b>${home}</b><small>${esc(s.atHome)}</small></div><div><b>${!price ? esc(s.free) : own ? "✓" : "⭐" + price}</b><small>${esc(!price || !own ? s.price : s.unlocked)}</small></div></div></div>
          <b class="ig-name">${esc(nm)}</b><small class="ig-handle">${esc(handle)}</small>
          <p class="ig-bio">${esc(s.bios[c] || "")}</p>
          ${btn}
          <div class="ig-grid">${POSTS.map(([pose, bg], i) => `<div class="ig-post" style="--bg:${bg}"><canvas width="120" height="120" data-post="${pose}"></canvas><span class="ig-cap">${esc(s.caps[i])}</span><span class="ig-like">♥ ${likes(c, i)}</span></div>`).join("")}</div>
        </div>
        <p class="mk-note">${esc(s.catsNote)}</p>`;
    }
    function drawCats() {
      root.querySelectorAll("canvas[data-av]").forEach((cv) => { const g = cv.getContext("2d"), k = cv.width / 52; DC.portrait(g, cv.dataset.av, { scale: k > 1.3 ? 1.5 : 1, dx: 2, dy: 3 }); });
      root.querySelectorAll("canvas[data-post]").forEach((cv, i) => { const g = cv.getContext("2d"); g.fillStyle = "rgba(91,58,41,.08)"; g.fillRect(0, 96, 120, 24); DC.portrait(g, coatSel, { scale: 2, dx: 0, dy: 6, pose: cv.dataset.post, t: 0.4, blink: cv.dataset.post === "sleep" }); });
    }
    // what you can do with the selected thing
    function detail(s) {
      if (!sel) return `<p class="iv-hint">${esc(s.pickOne)}</p>`;
      const [kind, id] = [sel.slice(0, 1), sel.slice(2)];
      const head = (pic, nm, sub) => `<div class="iv-dh">${pic}<div><b>${esc(nm)}</b><small>${sub}</small></div></div>`;
      if (sel === "b:bowl") {
        const B = o.bowl(), out = B.out(), meals = Object.keys(L.FOOD).filter((f) => L.FOOD[f].meal || ["dry", "wet", "fish"].includes(f)).reduce((a, f) => a + (L.pantry[f] || 0), 0);
        return head(`<span class="iv-e big">🥣</span>`, s.bowlN, `${esc(out ? s.out : s.stored)} · ✨ ${esc(s.durable)}<br>${esc(s.bowlD)}`)
          + `<div class="iv-acts">${out ? `<button type="button" data-bowl="stow">${esc(s.stow)}</button><button type="button" class="gold" data-bowl="fill"${meals ? "" : " disabled"}>${esc(meals ? s.fillBowl(meals) : s.noMeal)}</button>` : `<button type="button" class="gold" data-bowl="take">${esc(s.toyPlay)}</button>`}</div>`;
      }
      if (kind === "f") {
        const f = id, d = L.FOOD[f], n = L.pantry[f] || 0;
        const btn = f === "treat" ? `<small class="mk-tn">${esc(s.treatNote)}</small>` : `<button type="button" class="gold" data-use="${f}">${esc(s.use[f] || s.useMeal)}</button>`;
        return head(`<span class="iv-e big">${d.e}</span>`, s.foods[f][0], `×${n} · ${esc(s.foods[f][1])}`) + `<div class="iv-acts">${btn}<button type="button" class="ghost" data-tab="food">${esc(s.buyMore)}</button></div>`;
      }
      if (kind === "t") {
        const k = id, out = o.toyOn && o.toyOn(k), c = L.toyCondOf(k), [nm, ds] = s.toys[k];
        let btns;
        if (k === "brush") btns = `<small class="mk-tn">${esc(s.onCard)}</small>`;
        else if (k === "laser" || k === "wand") btns = `<button type="button" class="${out ? "" : "gold"}" data-play="${k}">${esc(out ? s.toyOff : s.toyOn)}</button>`;
        else btns = out ? `<button type="button" data-stow="${k}">${esc(s.stow)}</button><button type="button" class="gold" data-play="${k}">${esc(s.again)}</button>` : `<button type="button" class="gold" data-play="${k}">${esc(s.toyPlay)}</button>`;
        return head(`<span class="iv-e big">${s.toyE[k]}</span>`, nm, `${esc(out ? s.out : s.stored)} · ${esc(s.cond)} ${c}%${c < 30 ? ` · <em>${esc(s.worn)}</em>` : ""}<br>${esc(ds)}`) + `<div class="iv-acts">${btns}</div>`;
      }
      const it = L.home.items.find((i) => i.id === id), [nm, ds] = L.t("furn")[it.k], dur = DC.FURN[it.k].durable, c = Math.round(it.cond), lab = condLabel(it, s), rc = repairCost(it);
      return head(`<canvas width="64" height="48" data-f="${it.k}"></canvas>`, nm, `${esc(it.x != null ? s.out : s.stored)}${dur ? ` · ✨ ${esc(s.durable)}` : ` · ${esc(s.cond)} ${c}%`}${lab ? ` · <em>${esc(lab)}</em>` : ""}<br>${esc(ds)}`)
        + `<div class="iv-acts" data-id="${it.id}"><button type="button" class="${it.x != null ? "" : "gold"}" data-it="${it.x != null ? "store" : "put"}">${esc(it.x != null ? s.stow : s.put)}</button>
          ${!dur && it.cond < 90 ? `<button type="button" class="gold" data-it="repair"${L.wallet.coins < rc ? " disabled" : ""}>${esc(s.repair(rc))}</button>` : ""}
          <button type="button" class="ghost" data-it="sell">${esc(s.sell(sellPrice(it)))}</button></div>`;
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
      fab.hidden = !!o.only || world.cats.some((c) => c.profile);
      fab.style.bottom = `${bottom}px`;
      if (window.CatCard.beside(root)) return;
      root.style.height = ""; root.style.left = "auto"; root.style.right = "14px"; root.style.top = "auto"; root.style.bottom = `${bottom + 52}px`;
      root.style.setProperty("--maxh", `${Math.max(260, innerHeight - bottom - 80)}px`);
    }
    function open(which, msg, pick) { if (pick) sel = pick; if (o.only) which = o.only; if (!o.only && which === "mine") return o.openInventory && o.openInventory(msg); if (which) tab = which; note = msg || ""; root.hidden = false; key = ""; render(); place(); o.onOpen && o.onOpen(); }
    function close() { root.hidden = true; note = ""; o.onClose && o.onClose(); }
    fab.onclick = () => (root.hidden ? open() : close());

    root.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b || b.disabled) return;
      if (b.dataset.a === "close") return close();
      if (b.dataset.tab && o.only) { close(); return o.openMarket && o.openMarket(b.dataset.tab); }
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
      if (b.dataset.sel) { sel = sel === b.dataset.sel ? "" : b.dataset.sel; key = ""; return render(); }
      if (b.dataset.bowl) { const B = o.bowl(); B[b.dataset.bowl](); pop(b, "🥣"); key = ""; return render(); }
      if (b.dataset.stow) { o.storeToy && o.storeToy(b.dataset.stow); pop(b, "🎒"); key = ""; return render(); }
      if (b.dataset.coat) { coatSel = b.dataset.coat; key = ""; return render(); }
      if (b.dataset.unlock) { if (L.buyCoat(b.dataset.unlock)) { note = t().unlockedMsg(L.COAT_NAMES[b.dataset.unlock][L.lang]); world.confetti(innerWidth / 2, 140, 40); } key = ""; return render(); }
      if (b.dataset.adopt) { o.adopt && o.adopt(b.dataset.adopt); return; }
      if (b.dataset.play) { o.playToy && o.playToy(b.dataset.play); if (b.dataset.play !== "laser" && b.dataset.play !== "wand") pop(b, t().toyE[b.dataset.play]); key = ""; return render(); }
      if (b.dataset.clear) { o.clearToys && o.clearToys(); key = ""; return render(); }
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
    return { opts: o, open, close, render: () => { key = ""; if (!root.hidden) render(); }, get isOpen() { return !root.hidden; }, t };
  }
  window.CatMarket = { create };
})();
