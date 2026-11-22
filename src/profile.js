/* Desktop Cat — each cat's life: a name, a personality, growing up, love, and a little diary.
 * Everything here is plain data so it can be saved between runs. The cats call
 * CatLife.care(cat, kind) whenever something nice happens to them. */
(() => {
  "use strict";

  const NAMES = {
    tr: ["Pamuk", "Boncuk", "Tarçın", "Fındık", "Zeytin", "Lokum", "Duman", "Minnoş", "Sütlaç", "Karamel", "Mırmır", "Paşa",
         "Badem", "Kestane", "Bal", "Şeker", "Limon", "Köpük", "Pofuduk", "Cimcime", "Fıstık", "Kurabiye", "Ponçik", "Leblebi",
         "Muhallebi", "Tombik", "Bıdık", "Gece", "Kahve", "Mantı"],
    en: ["Biscuit", "Mochi", "Pumpkin", "Pickle", "Noodle", "Toffee", "Waffles", "Pepper", "Olive", "Muffin", "Peanut", "Clover",
         "Ziggy", "Luna", "Miso", "Nugget", "Sprout", "Tofu", "Bean", "Pixel", "Crumpet", "Marble", "Pudding", "Sushi"],
  };

  // personality traits nudge what a cat likes to do (multipliers on its choices)
  const TRAITS = {
    playful: { e: "🧶", tr: "Oyuncu", en: "Playful", mods: { yarn: 1.5, dangle: 1.5, mouse: 1.4, butterfly: 1.4, zoom: 2, fight: 1.4, tailChase: 2, pronk: 1.6 } },
    sleepy:  { e: "💤", tr: "Uykucu", en: "Sleepy", mods: { sleep: 2.2, zoom: 0.6, loaf: 1.8, tailChase: 0.5 } },
    cuddly:  { e: "💗", tr: "Sevgi pıtırcığı", en: "Cuddly", mods: { sleep: 1.2, blink: 2.2, loaf: 1.3 }, love: 1.5 },
    curious: { e: "🔍", tr: "Meraklı", en: "Curious", mods: { walk: 1.6, box: 2, meerkat: 2.4 } },
    foodie:  { e: "🍗", tr: "Obur", en: "Foodie", mods: { bowl: 1.5, _eat: 1.6 } },
    tidy:    { e: "🫧", tr: "Titiz", en: "Tidy", mods: { groom: 2.2 } },
    rascal:  { e: "😼", tr: "Haylaz", en: "Rascal", mods: { fight: 2.5, zoom: 1.4, post: 1.6 } },
    hunter:  { e: "🐾", tr: "Avcı", en: "Hunter", mods: { mouse: 2, butterfly: 2, yarn: 1.3 } },
    lazy:    { e: "🛋️", tr: "Tembel", en: "Lazy", mods: { walk: 0.5, sit: 1.6, roll: 1.4, zoom: 0.5, loaf: 2, sploot: 2.2, meerkat: 0.4, tailChase: 0.3 } },
  };
  const CLASH = [["sleepy", "playful"], ["lazy", "playful"], ["lazy", "curious"], ["lazy", "rascal"], ["sleepy", "rascal"]];

  const TOYS = {
    yarn: { e: "🧶", tr: "Yumak", en: "Yarn", goals: ["yarn", "dangle"] },
    mouse: { e: "🐭", tr: "Kurmalı fare", en: "Wind-up mouse", goals: ["mouse"] },
    feather: { e: "🪶", tr: "Tüylü olta", en: "Feather wand", goals: [] },
    butterfly: { e: "🦋", tr: "Kelebek", en: "Butterfly", goals: ["butterfly"] },
    laser: { e: "🔴", tr: "Lazer", en: "Laser", goals: [] },
    box: { e: "📦", tr: "Karton kutu", en: "Box", goals: ["box"] },
    catnip: { e: "🌿", tr: "Kedi otu", en: "Catnip", goals: ["catnip"] },
    post: { e: "🪵", tr: "Tırmalama direği", en: "Scratching post", goals: ["post"] },
  };

  // Growing up is earned: a cat only grows while the app is running, it isn't hungry and it feels loved (love 30+).
  // Much later a cat becomes a wise old one: a grey muzzle and a slower pace, but it stays with you.
  const STAGES = [
    { id: "kitten", min: 0, e: "🍼", tr: "Yavru", en: "Kitten" },
    { id: "young", min: 0.4, e: "🐱", tr: "Genç", en: "Young cat" },
    { id: "adult", min: 1, e: "👑", tr: "Yetişkin", en: "Grown-up" },
    { id: "elder", min: 1, e: "🦉", tr: "Bilge", en: "Wise old cat" },
  ];
  const ADULT = 360, GROW_PER_DAY = 0.9 / 90, ELDER_DAYS = 365;      // (old calendar growth, only used to convert older saves); wise and old after a year

  // tricks you can teach: a few good lessons and it knows it for good
  const TRICKS = {
    paw:  { e: "🐾", state: "bat", dur: 1.4, tr: "Pati ver", en: "Give a paw", learnTr: "Pati vermeyi öğrendi!", learnEn: "Learned to give a paw!" },
    spin: { e: "🌀", state: "tailChase", dur: 1.6, tr: "Dön", en: "Spin", learnTr: "Kendi etrafında dönmeyi öğrendi!", learnEn: "Learned to spin!" },
    beg:  { e: "🙏", state: "meerkat", dur: 2, tr: "Kalk", en: "Stand up", learnTr: "Arka ayaklarının üstüne kalkmayı öğrendi!", learnEn: "Learned to stand up!" },
    roll: { e: "🙃", state: "roll", dur: 2.2, tr: "Yuvarlan", en: "Roll over", learnTr: "Yuvarlanmayı öğrendi!", learnEn: "Learned to roll over!" },
    jump: { e: "⬆️", state: "pronk", dur: 2, tr: "Zıpla", en: "Jump", learnTr: "Komutla zıplamayı öğrendi!", learnEn: "Learned to jump on cue!" },
  };
  const LESSONS = 5;
  // days together worth a party (counted from your very first cat)
  const TOGETHER = [7, 30, 50, 100, 200, 300];

  const COAT_NAMES = {
    ginger: { tr: "Sarman", en: "Ginger tabby" }, black: { tr: "Kara kedi", en: "Black" }, white: { tr: "Bembeyaz", en: "White" },
    grey: { tr: "Gri tekir", en: "Grey tabby" }, calico: { tr: "Üç renkli", en: "Calico" }, siamese: { tr: "Siyam", en: "Siamese" },
    tuxedo: { tr: "Smokin", en: "Tuxedo" },
  };

  // little daily tasks: three a day per cat, picked from these; each one listens for a care() event
  const TASKS = {
    pet:       { e: "💗", n: 5, on: "pet", tr: (n) => `${n} kez sev`, en: (n) => `Pet ${n} times` },
    fed:       { e: "🍗", n: 1, on: "fed", tr: () => "Karnını doyur", en: () => "Give dinner" },
    yarn:      { e: "🧶", n: 3, on: "play:yarn", tr: (n) => `Yumağa ${n} kez pati atsın`, en: (n) => `Bat the yarn ${n} times` },
    mouse:     { e: "🐭", n: 2, on: "play:mouse", tr: (n) => `Kurmalı fareyi ${n} kez yakalasın`, en: (n) => `Catch the wind-up mouse ${n} times` },
    feather:   { e: "🪶", n: 3, on: "play:feather", tr: (n) => `Tüylü oltaya ${n} kez saldırsın`, en: (n) => `Pounce on the feather ${n} times` },
    butterfly: { e: "🦋", n: 2, on: "play:butterfly", tr: (n) => `Kelebeği ${n} kez kovalasın`, en: (n) => `Chase the butterfly ${n} times` },
    laser:     { e: "🔴", n: 4, on: "play:laser", tr: () => "Lazerin peşinden koşsun", en: () => "Chase the laser dot" },
    catnip:    { e: "🌿", n: 1, on: "catnip", tr: () => "Kedi otuyla şenlensin", en: () => "Have some catnip" },
    bed:       { e: "🛏️", n: 1, on: "bed", tr: () => "Yatağında şekerleme yapsın", en: () => "Nap in the cat bed" },
    scratch:   { e: "🪵", n: 1, on: "scratch", tr: () => "Tırnaklarını direkte bilesin", en: () => "Use the scratching post" },
    box:       { e: "📦", n: 1, on: "box", tr: () => "Bir kutuya saklansın", en: () => "Hide in a box" },
    shelf:     { e: "🪜", n: 1, on: "shelf", tr: () => "Rafa zıplasın", en: () => "Jump up onto a shelf" },
    held:      { e: "🤲", n: 2, on: "held", tr: (n) => `${n} kez kucağına al`, en: (n) => `Pick it up ${n} times` },
    photo:     { e: "📸", n: 1, on: "photo", tr: () => "Fotoğrafını çek", en: () => "Take its photo" },
    dress:     { e: "👗", n: 1, on: "dress", tr: () => "Ona yeni bir şey giydir", en: () => "Dress it up" },
  };
  // Stars are hard-won: a cat's three tasks together are worth one star a day.
  const TASK_REWARD = { xp: 6, love: 6, stars: 0, coins: 2 }, ALL_REWARD = { xp: 15, love: 10, stars: 1, coins: 5 };
  // Two currencies: 🪙 coins (food and furniture, from tasks, the game and simply using your computer)
  // and ⭐ stars (the wardrobe, only from finishing all of a cat's tasks or a great game).
  const FOOD = {
    dry:    { e: "🥣", price: 10, n: 2 },        // 10 coins for two meals
    wet:    { e: "🥫", price: 9, n: 1, love: 6 },
    fish:   { e: "🐟", price: 25, n: 1, love: 12, grow: 0.01 },
    treat:  { e: "🍬", price: 6, n: 3, love: 10 },
    catnip: { e: "🌿", price: 8, n: 1 },
    litter: { e: "🪣", price: 12, n: 3 },          // three clean-ups of the litter box
  };
  const HUNGRY_AFTER = 8 * 3.6e6;                      // a meal keeps a cat full for eight hours
  const GROW_PER_HOUR = 0.9 / 250;                     // ~250 hours of being fed and loved, with the app running, to grow up
  // Every design in the wardrobe is locked and bought with stars (it then comes in all ten colours).
  const PRICES = {
    hat: { beanie: 3, cap: 3, party: 5, beret: 5, witch: 7, chef: 7, tophat: 9, flowers: 9, santa: 11, crown: 15 },
    collar: { plain: 2, bowtie: 3, bell: 4, bandana: 4, scarf: 5, tag: 6, studs: 6, bigbow: 8, lei: 8, pearls: 14 },
    outfit: { sweater: 4, stripes: 4, dots: 6, plaid: 6, zigzag: 7, overalls: 8, raincoat: 9, vertical: 9, diagonal: 10, stars: 15 },
  };
  const MAX_CATS = 8, KIT_COOL = 24 * 3.6e6;           // breeding: at most 8 cats, a mother or father rests a day between litters
  // Love fades when nobody pays attention. A lonely kitten or young cat may pack up and leave;
  // grown-ups stay, and a wise old cat only very rarely wanders off.
  const LOVE_FADE = 8 / 3600, LONELY = 15, LEAVE_PER_HOUR = { kitten: 0.12, young: 0.12, adult: 0, elder: 0.012 };
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

  // what happens when: xp and love rewards, how often they can be earned, how often they get written in the diary
  const RULES = {
    pet:     { xp: 1, love: 4, every: 6e3, log: 3 * 60e3 },
    fed:     { xp: 4, love: 8, every: 60e3, log: 30 * 60e3 },
    play:    { xp: 2, love: 2, every: 10e3, log: 5 * 60e3 },
    bed:     { xp: 6, love: 3, every: 60e3, log: 20 * 60e3 },
    scratch: { xp: 3, love: 1, every: 10e3, log: 10 * 60e3 },
    catnip:  { xp: 5, love: 6, every: 20e3, log: 10 * 60e3 },
    zoom:    { xp: 1, love: 0, every: 30e3, log: 15 * 60e3 },
    race:    { xp: 2, love: 0, every: 30e3, log: 10 * 60e3 },
    fight:   { xp: 2, love: 0, every: 30e3, log: 10 * 60e3 },
    boop:    { xp: 2, love: 1, every: 30e3, log: 10 * 60e3 },
    box:     { xp: 2, love: 1, every: 30e3, log: 15 * 60e3 },
    held:    { xp: 0, love: 0, every: 30e3, log: 10 * 60e3 },
    dress:   { xp: 1, love: 1, every: 10e3, log: 2 * 60e3 },
    photo:   { xp: 1, love: 2, every: 5e3, log: 60e3 },
    blink:   { xp: 2, love: 4, every: 60e3, log: 20 * 60e3 },
    drink:   { xp: 1, love: 2, every: 60e3, log: 30 * 60e3 },
    greet:   { xp: 2, love: 5, every: 10 * 60e3, log: 10 * 60e3 },
    morning: { xp: 2, love: 3, every: 6 * 3.6e6, log: 6 * 3.6e6 },
    napNear: { xp: 1, love: 2, every: 20 * 60e3, log: 30 * 60e3 },
    shelf:   { xp: 2, love: 1, every: 30e3, log: 10 * 60e3 },
  };

  // Turkish genitive: Pamuk'un, Toffee'nin, Duman'ın
  const nin = (n) => { const v = (String(n).toLocaleLowerCase("tr").match(/[aeıioöuü]/g) || ["e"]).pop();
    return `${n}'${/[aeıioöuüAEIİOÖUÜ]$/.test(n) ? "n" : ""}${{ a: "ın", ı: "ın", e: "in", i: "in", o: "un", u: "un", ö: "ün", ü: "ün" }[v]}`; };
  const STR = {
    tr: {
      love: "Sevgi", growth: "Büyüme", traits: "Karakteri", fav: "En sevdiği", diary: "Günlük", paneCat: "Durum", tasks: "Görevler", tasksToday: "Bugünün görevleri", newTasks: "Yeni görevler gece yarısı",
      allDone: "Hepsi bitti! Yarın yenileri gelecek 🌙", stars: (n) => `⭐ ${n} yıldız`, streak: (n) => `🔥 ${n} gün üst üste`, friend: "Yakın arkadaşı",
      parents: (a, b) => `${a} ve ${nin(b)} yavrusu`, taskToast: "Görev tamam!",
      wallet: (n) => `⭐ ${n} yıldızın var`, earned: (n) => `bu kedi ${n}⭐ kazandırdı`, howStars: "Üç görevin hepsini bitirince 1⭐",
      locked: "Kilitli", unlock: (n) => `⭐ ${n} ile aç`, need: (n) => `${n} yıldız daha lazım, görevlere bak 🎯`, needTasks: "Yıldız kazanmak için ayarlardan görevleri aç 🎯", unlocked: "Açıldı!", showName: "İsmini başının üstünde göster",
      pet: "Sev", feed: "Mama ver", play: "Oyna", rename: "İsmini değiştir", dice: "Rastgele isim", ok: "Kaydet", close: "Kapat",
      adopt: "Yeni yavru", newKitten: "Yeni bir yavru geldi! Adını koyalım mı?", empty: "Henüz bir şey yazmadı…",
      grownUp: "Tamamen büyüdü", toNext: (h) => `büyümesine ≈${Math.ceil(h)} saat bakım`, hungry: "🍽️ Karnı aç", notGrowing: "Büyümesi için tok ve mutlu olmalı", height: (g) => `Boyu ${g.toFixed(1).replace(".", ",")}`,
      memories: "Anılar", family: "Ailesi", parentsL: "Annesi ve babası", siblings: "Kardeşleri", kids: "Yavruları", noMem: "Anılar burada birikecek…",
      together: (n) => `💞 Birlikte ${n} gündür`, tricks: "Numaralar", teach: "Öğret", lessons: (n, m) => `${n}/${m} ders`, learnHint: "Dokun, öğret",
      trickFail: ["Kafası karıştı", "Şimdi canı istemedi", "Esnedi geçti", "Kuyruğunu salladı"], gone: "artık yok",
      home: "Ev", homeHint: "Yıldızlarla ev eşyası al; her birinden istediğin kadar alabilirsin. Yerleştirdiklerini sürükleyip istediğin yere koy.", place: "Koy", putAway: "Kaldır",
      ownedN: (o, p) => `${o} tane · ${p} ortada`,
      furn: { tunnel: ["Kedi tüneli", "İçinden koşa koşa geçer, saklanır"], fountain: ["Su çeşmesi", "Taze su; kediler gelip içer"], litter: ["Kum kabı", "Temiz tutarsan kediler daha mutlu; kirlenince tıkla, temizle"], bed: ["Kedi yatağı", "Yumuşacık, içinde kıvrılıp uyur"], house: ["Kedi kulübesi", "İçine girip saklanarak uyur"], rug: ["Halı", "Üstünde yuvarlanır, ekmek gibi oturur"], plant: ["Saksı çiçeği", "Ara sıra yapraklarını kemirir"], cushion: ["Minder", "En sevdiği uyku yeri olur"],
        tree: ["Kedi ağacı", "İki katlı, tepesine tırmanır"], aquarium: ["Akvaryum", "Balıkları izler, cama pati atar"] },
      game: "Lazer avı", gameHelp: "30 saniye: lazerle kedileri parlayan yıldızlara götür!", again: "Tekrar oyna", closeB: "Kapat",
      gameOver: (n, st, best) => `${n} yıldız yakaladınız!${best ? " Yeni rekor! 🏆" : ""}${st ? ` +${st}⭐ kazandın` : ""}`, gameCap: "Bugünlük oyun ödülleri doldu, yarın yine gel 🌙", market: "Market", settings: "Ayarlar", bestL: (n) => `Rekor: ${n}`,
      sexF: "♀ Dişi", sexM: "♂ Erkek", lonely: "Kendini yalnız hissediyor 💔 Biraz ilgi lazım", leftHome: (n) => `${n} evden ayrıldı 💔`,
      strayTag: (n) => `Sokak kedisi ${"🐾".repeat(n)}${"·".repeat(3 - n)}`, gameHud: (t, n) => `🔴 Lazer avı · ⏱ ${t} · ⭐ ${n}`,
      voices: "Kedi sesleri", back: "Geri", addFiles: "Ses ekle", voiceN: (n) => n ? `${n} kayıt` : "henüz yok",
      voice_kitten: "Yavru miyavı", voice_adult: "Yetişkin miyavı", voice_elder: "Yaşlı miyavı", voice_purr: "Mırlama",
      voicesHelp: "🎤 ile mikrofona miyavla ya da mırla (kendin de olur, kedin de 😸), ya da ＋ ile ses dosyası ekle; dosyaları buraya sürükleyebilirsin de. Sessiz kısımları kendim kırpıyorum. Bir grup boşsa diğerinin sesi inceltilip kalınlaştırılarak kullanılır.",
      recTitle: "Mikrofonla kaydet (en fazla 5 saniye)", micNo: "Mikrofona ulaşamadım. Mikrofon izni verdiğinden emin ol.", recQuiet: "Hiç ses gelmedi, biraz daha yüksek miyavla 😸",
      wardrobe: "Dolap", hat: "Şapka", collar: "Tasma", outfit: "Kıyafet", none: "Hiçbiri", surprise: "Rastgele kombin", undress: "Hepsini çıkar",
      nothingOn: "Üstünde bir şey yok", photo: "Fotoğraf", remove: "Kediyi kaldır", removeQ: (n) => `${n} gitsin mi? Bu geri alınamaz.`, yes: "Evet, kaldır", no: "Vazgeç",
      size: "Kart boyutu", pin: "Kedinin üstüne geri taşı", soundOff: "Sesleri kapat", soundOn: "Sesleri aç", birthdayToday: "Bugün doğum günü!", photoOf: (n, d, st) => `${n} · ${d} · ${st}`,
      age1: (d) => d < 30 ? "1 haftalık" : d < 365 ? `${Math.round(d / 30)} aylık` : `${Math.round(d / 365)} yaşında`,
      age: (d) => d < 1 ? "yeni geldi" : `${d} günlük`, born: (d) => `Doğum günü: ${d}`,
      mood: (l) => l >= 85 ? "Sana bayılıyor" : l >= 60 ? "Çok mutlu" : l >= 35 ? "Keyfi yerinde" : l >= 15 ? "Biraz ilgi bekliyor" : "Seni çok özledi",
      ago: (ms) => { const m = Math.floor(ms / 60e3); return m < 1 ? "az önce" : m < 60 ? `${m} dk önce` : m < 1440 ? `${Math.floor(m / 60)} sa önce` : `${Math.floor(m / 1440)} gün önce`; },
      log: {
        born: (a) => `${a.n} aramıza katıldı`, named: (a) => `Adı artık ${a.n}`, fed: () => "Mamasını afiyetle yedi",
        pet: () => "Sevildi, mır mır mırladı", play: (a) => `${a.toy} ile oynadı`, bed: () => "Yatağında kıvrılıp uyudu",
        scratch: () => "Direkte tırnaklarını biledi", catnip: () => "Kedi otuyla kendinden geçti", zoom: () => "Zoomies! Odayı baştan başa koştu",
        race: (a) => `${a.o} ile yarıştı`, fight: (a) => `${a.o} ile şakadan dövüştü`, boop: (a) => `${a.o} ile burun buruna geldi`,
        box: () => "Kutuya saklandı", held: () => "Kucağa alındı", grew: (a) => `Büyüdü, artık ${a.stage}!`, lovemax: () => "Sevgi barı doldu! Sana bayılıyor",
        hello: () => "Seninle masaüstünde yaşamaya başladı",
        dress: (a) => `${a.itemName} ${a.kind === "outfit" ? "giydi" : "taktı"}`, photo: () => "Fotoğrafı çekildi", blink: () => "Sana yavaşça göz kırptı, kedi dilinde \"seni seviyorum\" demek", shelf: () => "Rafa zıplayıp oturdu",
        birthday: (a) => `${STR.tr.age1(a.days)} oldu! İyi ki doğdun`,
        trick: (a) => TRICKS[a.id] ? TRICKS[a.id].learnTr : "", elder: () => "Artık bilge bir kedi, burnunun etrafı kırlaştı",
        together: (a) => `Birlikte ${a.n} gün oldu!`, greet: (a) => a.long ? "Seni çok özlemiş, gelir gelmez karşıladı" : "Seni kapıda karşıladı",
        morning: () => "Günaydın! Gerinip seni selamladı", napNear: () => "Sen yokken yanında uyuyakaldı", memPhoto: () => "Birlikte bir fotoğraf",
        strayIn: () => "Sokaktan geldi, artık burası onun evi", drink: () => "Çeşmeden kana kana su içti",
        lonely: () => "Kimse onunla ilgilenmedi, çok yalnız hissetti", left: (a) => `${a.n} kimse ilgilenmeyince evi terk etti`,
        task: (a) => `Görevi bitirdi: ${a.txt}`, tasksDone: () => "Bugünün bütün görevlerini bitirdi ⭐",
        bornOf: (a) => `${a.a} ve ${nin(a.b)} yavrusu olarak dünyaya geldi`, kitten: (a) => `${a.o} ile bir yavruları oldu: ${a.n}`,
      },
    },
    en: {
      love: "Love", growth: "Growing up", traits: "Personality", fav: "Favourite", diary: "Diary", paneCat: "Status", tasks: "Tasks", tasksToday: "Today's tasks", newTasks: "New tasks at midnight",
      allDone: "All done! New ones tomorrow 🌙", stars: (n) => `⭐ ${n} star${n === 1 ? "" : "s"}`, streak: (n) => `🔥 ${n} days in a row`, friend: "Best friend",
      parents: (a, b) => `Kitten of ${a} and ${b}`, taskToast: "Task done!",
      wallet: (n) => `⭐ You have ${n} star${n === 1 ? "" : "s"}`, earned: (n) => `this cat earned ${n}⭐`, howStars: "Finish all three tasks for 1⭐",
      locked: "Locked", unlock: (n) => `Unlock for ⭐ ${n}`, need: (n) => `${n} more star${n === 1 ? "" : "s"} needed, see the tasks 🎯`, needTasks: "Switch tasks on in the settings to earn stars 🎯", unlocked: "Unlocked!", showName: "Show name above head",
      pet: "Pet", feed: "Feed", play: "Play", rename: "Rename", dice: "Random name", ok: "Save", close: "Close",
      adopt: "New kitten", newKitten: "A new kitten arrived! Want to name it?", empty: "Nothing written yet…",
      grownUp: "All grown up", toNext: (h) => `≈${Math.ceil(h)} hours of care to grow`, hungry: "🍽️ Hungry", notGrowing: "Needs to be fed and happy to grow", height: (g) => `Height ${g.toFixed(1)}`,
      memories: "Memories", family: "Family", parentsL: "Parents", siblings: "Siblings", kids: "Kittens", noMem: "Memories will gather here…",
      together: (n) => `💞 Together for ${n} days`, tricks: "Tricks", teach: "Teach", lessons: (n, m) => `${n}/${m} lessons`, learnHint: "Tap to teach",
      trickFail: ["Got confused", "Not in the mood", "Yawned instead", "Flicked its tail"], gone: "gone",
      home: "Home", homeHint: "Buy furniture with stars, as many of each as you like. Drag anything you've placed to move it.", place: "Place", putAway: "Put away",
      ownedN: (o, p) => `own ${o} · ${p} out`,
      furn: { tunnel: ["Cat tunnel", "Dashes through it and hides inside"], fountain: ["Water fountain", "Fresh water; the cats come for a drink"], litter: ["Litter box", "Keep it clean and the cats are happier; click it to clean"], bed: ["Cat bed", "Soft and round, curls up in it"], house: ["Cat house", "Crawls inside to sleep, hidden away"], rug: ["Rug", "Rolls about and loafs on it"], plant: ["Potted plant", "Nibbles the leaves now and then"], cushion: ["Cushion", "Becomes the favourite napping spot"],
        tree: ["Cat tree", "Two levels to climb up to"], aquarium: ["Aquarium", "Watches the fish and paws at the glass"] },
      game: "Laser hunt", gameHelp: "30 seconds: use the laser to lead the cats onto the twinkling stars!", again: "Play again", closeB: "Close",
      gameOver: (n, st, best) => `You caught ${n} star${n === 1 ? "" : "s"}!${best ? " New record! 🏆" : ""}${st ? ` +${st}⭐ earned` : ""}`, gameCap: "That's all the game rewards for today, come back tomorrow 🌙", market: "Market", settings: "Settings", bestL: (n) => `Best: ${n}`,
      sexF: "♀ Female", sexM: "♂ Male", lonely: "Feeling lonely 💔 needs some attention", leftHome: (n) => `${n} left home 💔`,
      strayTag: (n) => `Stray ${"🐾".repeat(n)}${"·".repeat(3 - n)}`, gameHud: (t, n) => `🔴 Laser hunt · ⏱ ${t} · ⭐ ${n}`,
      voices: "Cat sounds", back: "Back", addFiles: "Add sounds", voiceN: (n) => n ? `${n} recording${n > 1 ? "s" : ""}` : "none yet",
      voice_kitten: "Kitten meow", voice_adult: "Grown-up meow", voice_elder: "Old cat meow", voice_purr: "Purr",
      voicesHelp: "Meow or purr into the mic with 🎤 (you or your cat 😸), or add sound files with ＋; you can also drop them here. Silence gets trimmed for you. If a group is empty, another group's sounds are used, pitched up or down.",
      recTitle: "Record with the microphone (up to 5 seconds)", micNo: "Couldn't reach the microphone. Make sure it's allowed.", recQuiet: "Didn't hear anything, try a louder meow 😸",
      wardrobe: "Wardrobe", hat: "Hats", collar: "Collars", outfit: "Outfits", none: "None", surprise: "Surprise outfit", undress: "Take it all off",
      nothingOn: "Wearing nothing", photo: "Photo", remove: "Remove cat", removeQ: (n) => `Say goodbye to ${n}? This can't be undone.`, yes: "Yes, remove", no: "Keep",
      size: "Card size", pin: "Put it back above the cat", soundOff: "Mute the cats", soundOn: "Turn sounds on", birthdayToday: "Birthday today!", photoOf: (n, d, st) => `${n} · ${d} · ${st}`,
      age1: (d) => d < 30 ? "1 week old" : d < 365 ? `${Math.round(d / 30)} months old` : `${Math.round(d / 365)} year${d >= 730 ? "s" : ""} old`,
      age: (d) => d < 1 ? "just arrived" : `${d} day${d > 1 ? "s" : ""} old`, born: (d) => `Birthday: ${d}`,
      mood: (l) => l >= 85 ? "Adores you" : l >= 60 ? "Very happy" : l >= 35 ? "Content" : l >= 15 ? "Wants some attention" : "Misses you a lot",
      ago: (ms) => { const m = Math.floor(ms / 60e3); return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.floor(m / 60)} h ago` : `${Math.floor(m / 1440)} d ago`; },
      log: {
        born: (a) => `${a.n} joined the family`, named: (a) => `Now called ${a.n}`, fed: () => "Had a lovely dinner",
        pet: () => "Got pets and purred", play: (a) => `Played with the ${a.toy.toLowerCase()}`, bed: () => "Curled up in the bed for a nap",
        scratch: () => "Sharpened claws on the post", catnip: () => "Went wild for catnip", zoom: () => "Zoomies! Sprinted across the room",
        race: (a) => `Raced ${a.o}`, fight: (a) => `Play-fought with ${a.o}`, boop: (a) => `Booped noses with ${a.o}`,
        box: () => "Hid in a box", held: () => "Got picked up", grew: (a) => `Grew up — now a ${a.stage.toLowerCase()}!`, lovemax: () => "Love bar full! Adores you",
        hello: () => "Moved in on your desktop",
        dress: (a) => `Put on the ${a.itemName}`, photo: () => "Had a photo taken", blink: () => "Gave you a slow blink. That's cat for \"I love you\"", shelf: () => "Jumped up onto the shelf",
        birthday: (a) => `${STR.en.age1(a.days)} today! Happy birthday`,
        trick: (a) => TRICKS[a.id] ? TRICKS[a.id].learnEn : "", elder: () => "A wise old cat now, with a little grey round the nose",
        together: (a) => `${a.n} days together!`, greet: (a) => a.long ? "Missed you so much, ran to meet you" : "Came to say hello when you got back",
        morning: () => "Good morning! Stretched and said hi", napNear: () => "Fell asleep next to you while you were away", memPhoto: () => "A photo together",
        strayIn: () => "Came in from the street; this is home now", drink: () => "Had a good drink at the fountain",
        lonely: () => "Nobody paid it any attention and it felt very lonely", left: (a) => `${a.n} left home after being ignored`,
        task: (a) => `Finished a task: ${a.txt}`, tasksDone: () => "Finished all of today's tasks ⭐",
        bornOf: (a) => `Born to ${a.a} and ${a.b}`, kitten: (a) => `Had a kitten with ${a.o}: ${a.n}`,
      },
    },
  };
  const LOG_ICON = { born: "🐣", named: "🏷️", fed: "🍗", pet: "💗", play: "🧶", bed: "🛏️", scratch: "🪵", catnip: "🌿", zoom: "💨",
    race: "🏁", fight: "🥊", boop: "👃", box: "📦", held: "🤲", grew: "🌟", lovemax: "💖", hello: "🏠", dress: "👗", photo: "📸", blink: "😌", shelf: "🪜", birthday: "🎂", task: "✅", tasksDone: "⭐", strayIn: "🏡", drink: "💧", lonely: "💔", left: "🚪", trick: "🎓", elder: "🦉", together: "💞", greet: "👋", morning: "🌅", napNear: "😴", memPhoto: "📸", bornOf: "🐣", kitten: "🍼" };

  const pickOne = (a) => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const L = {
    lang: (navigator.language || "en").toLowerCase().startsWith("tr") ? "tr" : "en",
    NAMES, TRAITS, TOYS, STAGES, ADULT, STR, LOG_ICON, COAT_NAMES, TASKS, MAX_CATS, TRICKS, LESSONS,
    since: Date.now(), togetherDone: 0,  // the day your first cat arrived, and how many "days together" parties so far
    tasksOn: true, breedOn: true,         // both can be switched off in the settings
    wallet: { stars: 0, coins: 0, owned: [] },
    FOOD, pantry: { dry: 0, wet: 0, fish: 0, treat: 0, catnip: 0 },
    econ: { day: "", pc: 0, game: 0, gameStars: 0 },    // today's coins from using the computer and from the game (both capped)
    onEarn: null,                                          // set by the page: a little "+🪙" where it happened
    earn(n, at) { n = Math.max(0, Math.round(n)); if (!n) return 0; L.wallet.coins += n; if (L.onEarn) L.onEarn(n, at); L.changed(); return n; },
    econToday() { const d = new Date().toDateString(); if (L.econ.day !== d) L.econ = { day: d, pc: 0, game: 0, gameStars: 0 }; return L.econ; },
    // ---------------- luck: a free gift chest once a day, and a wheel that costs coins. Big prizes are very, very rare.
    luck: { chestDay: "" },
    CHEST: [["coins", 55, [5, 15]], ["dry", 20], ["wet", 8], ["treat", 6], ["catnip", 4], ["litter", 3], ["coins", 2.5, [30, 30]], ["star", 1], ["furniture", 0.4], ["cloth", 0.1]],
    WHEEL_COST: 25,
    WHEEL: [["nothing", 30], ["coins", 22, [5, 5]], ["coins", 14, [10, 10]], ["coins", 8, [20, 20]], ["coins", 2.4, [50, 50]], ["dry", 12], ["wet", 6], ["treat", 3], ["star", 1.5], ["furniture", 0.8], ["cloth", 0.3]],
    roll(table) { const tot = table.reduce((a, r) => a + r[1], 0); let x = Math.random() * tot; for (let i = 0; i < table.length; i++) { x -= table[i][1]; if (x <= 0) return i; } return 0; },
    // hand out a prize: returns what was won ({ k, n, item, design })
    grant(row) {
      const [k, , range] = row, out = { k };
      if (k === "coins") { out.n = range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1)); L.wallet.coins += out.n; }
      else if (FOOD[k]) { out.n = FOOD[k].n; L.pantry[k] = (L.pantry[k] || 0) + out.n; }
      else if (k === "star") { out.n = 1; L.wallet.stars += 1; }
      else if (k === "furniture") {
        const kinds = Object.keys(window.DesktopCat.FURN), f = kinds[Math.floor(Math.random() * kinds.length)];
        out.item = { id: Math.random().toString(36).slice(2, 9), k: f, cond: 100, x: null }; L.home.items.push(out.item);
      } else if (k === "cloth") {
        const locked = []; for (const kind of Object.keys(PRICES)) for (const d of Object.keys(PRICES[kind])) if (L.price(kind, d)) locked.push([kind, d]);
        if (locked.length) { const [kind, d] = locked[Math.floor(Math.random() * locked.length)]; L.wallet.owned.push(`${kind}:${d}`); out.design = [kind, d]; }
        else { out.k = "coins"; out.n = 50; L.wallet.coins += 50; }
      }
      L.changed(); return out;
    },
    chestReady() { return L.luck.chestDay !== new Date().toDateString(); },
    openChest() { if (!L.chestReady()) return null; L.luck.chestDay = new Date().toDateString(); return L.grant(L.CHEST[L.roll(L.CHEST)]); },
    spinWheel() { if (L.wallet.coins < L.WHEEL_COST) return null; L.wallet.coins -= L.WHEEL_COST; const i = L.roll(L.WHEEL); return { i, prize: L.grant(L.WHEEL[i]) }; },
    buyFood(k) { const f = FOOD[k]; if (!f || L.wallet.coins < f.price) return false; L.wallet.coins -= f.price; L.pantry[k] = (L.pantry[k] || 0) + f.n; L.changed(); return true; },
    // the best meal in the cupboard (or a specific one); returns its kind, or null if the cupboard is bare
    takeMeal(k) { const order = k ? [k] : ["dry", "wet", "fish"]; const f = order.find((x) => (L.pantry[x] || 0) > 0); if (!f) return null; L.pantry[f]--; L.changed(); return f; },
    home: { items: [] },                  // every piece of furniture you own: { id, k, cond (0-100), x (share of the screen width, or null when stored) }
    game: { best: 0, day: "", stars: 0 },      // stars from tasks, shared by all cats, and the wardrobe designs bought with them
    PRICES,
    // load the wallet from a save; designs someone is already wearing stay theirs
    loadWallet(w, profiles) {
      // v2: nothing comes unlocked for free any more, whether tasks are on or off (stars already earned are kept)
      L.wallet = { v: 4, stars: Math.max(0, +(w && w.stars) || 0), coins: Math.max(0, +(w && w.coins) || 0), owned: w && w.v >= 2 && Array.isArray(w.owned) ? w.owned.slice() : [] };
      if (!w || !(w.v >= 4)) { L.wallet.coins += 30; L.pantry.dry += 4; }      // everyone starts the market with 30 coins and two bags of food
      // v3: the whole wardrobe is locked, so anything a cat wears that hasn't been bought comes off
      for (const p of profiles) for (const [k, id] of Object.entries(p.acc || {})) if (L.price(k, String(id).split(":")[0])) delete p.acc[k];
    },
    // what a design costs right now: 0 when it's one of the free ones or already bought
    price(kind, d) {
      const c = (PRICES[kind] || {})[d] || 0;
      return c && !L.wallet.owned.includes(`${kind}:${d}`) ? c : 0;
    },
    buy(kind, d) {
      const c = L.price(kind, d); if (!c || L.wallet.stars < c) return false;
      L.wallet.stars -= c; L.wallet.owned.push(`${kind}:${d}`); L.changed(); return true;
    },
    onChange: null,                     // set by the page: called when anything worth saving happens
    t(k) { return STR[L.lang][k]; },
    randomName(taken = []) {
      const pool = NAMES[L.lang].filter((n) => !taken.includes(n));
      return pickOne(pool.length ? pool : NAMES[L.lang]);
    },
    randomTraits() {
      const keys = Object.keys(TRAITS);
      for (;;) {
        const a = pickOne(keys), b = pickOne(keys);
        if (a !== b && !CLASH.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return [a, b];
      }
    },
    make(coat, o = {}) {
      const now = Date.now();
      const p = {
        id: Math.random().toString(36).slice(2, 10), coat, name: o.name || L.randomName(o.taken), traits: L.randomTraits(),
        fav: pickOne(Object.keys(TOYS)), born: now, xp: o.xp ?? 0, love: o.love ?? 40, showName: true, log: [], lastR: {}, lastL: {}, seen: now,
        g: o.g0 ?? 0.1, g0: o.g0 ?? 0.1, gT: now, fedAt: now, mem: [], tricks: {}, sex: o.sex || (Math.random() < 0.5 ? "f" : "m"),
      };
      p.stageId = L.stage(p).id;
      L.write(p, o.migrated ? "hello" : "born", { n: p.name });
      if (!o.quiet) L.remember(p, o.migrated ? "hello" : "born", { n: p.name });
      return p;
    },
    // bring an old save (just a list of coats) into the new world, as grown-up cats who already live here
    migrate(coats) { const taken = []; return coats.map((c) => { const p = L.make(c, { xp: ADULT, g0: 1, love: 60, migrated: true, taken }); taken.push(p.name); return p; }); },
    // time passes while the app is closed: love fades a little, never all the way
    welcomeBack(p) {
      const hours = Math.max(0, (Date.now() - (p.seen || Date.now())) / 3.6e6);
      p.love = Math.max(LONELY + 1, p.love - Math.min(60, hours * 3)); p.seen = Date.now();   // fades while you're away, but nobody leaves while the app is closed
      if (p.sex !== "f" && p.sex !== "m") p.sex = Math.random() < 0.5 ? "f" : "m";
      p.lastR = p.lastR || {}; p.lastL = p.lastL || {}; p.log = p.log || []; p.mem = p.mem || []; p.tricks = p.tricks || {};
      if (p.g0 == null) { p.g0 = p.xp >= ADULT ? 1 : clamp(0.1 + 0.9 * p.xp / ADULT, 0.1, 1); p.gT = Date.now(); }   // saves from before growth by days
      if (p.g == null) { p.g = L.growth(p); p.fedAt = Date.now(); }                                                    // saves from before growth by care
      if (!p.stageId) p.stageId = L.stage(p).id;
      if (!TRAITS[p.traits?.[0]] || !TRAITS[p.traits?.[1]]) p.traits = L.randomTraits();
      if (!TOYS[p.fav]) p.fav = pickOne(Object.keys(TOYS));
      return p;
    },
    growth(p) { return p.g != null ? clamp(p.g, 0.1, 1) : clamp((p.g0 ?? 1) + (Date.now() - (p.gT || Date.now())) / 864e5 * GROW_PER_DAY, 0.1, 1); },
    isHungry(p) { return !!p && Date.now() - (p.fedAt || 0) > HUNGRY_AFTER; },
    growing(p) { return !!p && !L.isHungry(p) && p.love >= 30 && L.growth(p) < 1; },
    ageDays(p) { return (Date.now() - p.born) / 864e5; },
    isElder(p) { return !!p && L.growth(p) >= 1 && L.ageDays(p) >= ELDER_DAYS; },
    stage(p) {
      if (typeof p === "number") p = { g0: p >= ADULT ? 1 : 0.1 + 0.9 * p / ADULT, gT: Date.now(), born: Date.now() };
      if (L.isElder(p)) return STAGES[3];
      const g = L.growth(p); let s = STAGES[0]; for (const st of STAGES.slice(0, 3)) if (g >= st.min - 1e-9) s = st; return s;
    },
    nextStage(p) { const g = L.growth(p); return STAGES.slice(0, 3).find((st) => st.min > g + 1e-9) || null; },
    hoursToNext(p) { const nx = L.nextStage(p); return nx ? (nx.min - L.growth(p)) / GROW_PER_HOUR : 0; },
    daysToNext(p) { return L.hoursToNext(p) / 24; },
    // how big it looks: a newborn (0.1) is drawn small but still readable, a grown-up (1.0) at today's full size
    size(p) { return typeof p === "number" ? 1 : 0.3 + 0.7 * L.growth(p); },
    mods(p) {
      const m = {};
      for (const t of p.traits) for (const [k, v] of Object.entries(TRAITS[t].mods)) m[k] = (m[k] || 1) * v;
      for (const g of TOYS[p.fav].goals) m[g] = (m[g] || 1) * 1.6;
      return m;
    },
    write(p, k, a = {}) {
      p.log.unshift({ t: Date.now(), k, a });
      if (p.log.length > 80) p.log.length = 80;
    },
    text(entry) {
      const f = STR[L.lang].log[entry.k]; if (!f) return "";
      const a = { ...entry.a };
      if (a.task && TASKS[a.task]) a.txt = L.taskText(a.task);
      if (a.toyKey && TOYS[a.toyKey]) a.toy = TOYS[a.toyKey][L.lang];
      if (a.stageKey) { const st = STAGES.find((s) => s.id === a.stageKey); if (st) a.stage = st[L.lang]; }
      if (a.item) a.itemName = L.itemName(a.kind, a.item);
      return f(a);
    },
    icon(entry) { return entry.k === "play" && TOYS[entry.a?.toyKey] ? TOYS[entry.a.toyKey].e : LOG_ICON[entry.k] || "🐾"; },
    // "Cherry top hat" / "Kiraz silindir şapka"
    itemName(kind, id) {
      const W = window.DesktopCat && window.DesktopCat.WARDROBE; if (!W || !id) return "";
      const [d, sc] = String(id).split(":"), des = W[kind] && W[kind][d], sch = W.schemes[sc];
      if (!des || !sch) return "";
      return L.lang === "tr" ? `${sch.tr} ${des.tr}` : `${sch.en} ${des.en.charAt(0).toLowerCase() + des.en.slice(1)}`.replace(/^./, (c) => c.toUpperCase());
    },
    // birthdays: one week, then 1, 2, 3 and 6 months, then every year
    milestones(age) { const m = [7, 30, 60, 90, 180]; for (let y = 365; y <= age + 365; y += 365) m.push(y); return m.filter((d) => d <= age); },
    birthdayDue(p) {
      const age = (Date.now() - p.born) / 864e5, done = L.milestones(age);
      if (done.length > (p.bdays || 0)) { p.bdays = done.length; p.lastBday = Date.now(); const days = done[done.length - 1]; L.write(p, "birthday", { days }); L.remember(p, "birthday", { days }); L.changed(); return days; }
      return 0;
    },
    isBirthday(p) { return p.lastBday && Date.now() - p.lastBday < 864e5; },
    rename(cat, name) {
      const p = cat.profile; name = String(name || "").trim().slice(0, 14); if (!name || name === p.name) return;
      p.name = name; L.write(p, "named", { n: name }); L.changed();
    },
    changed() { if (L.onChange) L.onChange(); },

    // ------------------------------------------------ the cats report in here
    care(cat, kind, arg = {}) {
      const p = cat.profile, r = RULES[kind]; if (!p || !r) return;
      const now = Date.now(), key = kind + (arg.toyKey ? ":" + arg.toyKey : "");
      if (now - (p.lastR[key] || 0) > r.every) {
        p.lastR[key] = now;
        let love = r.love;
        for (const t of p.traits) love *= TRAITS[t].love || 1;
        if (arg.toyKey && arg.toyKey === p.fav) love *= 1.6;
        L.addXP(cat, r.xp); L.addLove(cat, love);
      }
      if (now - (p.lastL[key] || 0) > r.log) { p.lastL[key] = now; L.write(p, kind, arg); L.changed(); }
      if (kind === "fed") {
        p.fedAt = Date.now();
        const f = FOOD[arg.food]; if (f && f.love) L.addLove(cat, f.love); if (f && f.grow) p.g = Math.min(1, L.growth(p) + f.grow);
      }
      if (arg.oid && ["boop", "race", "fight"].includes(kind)) { p.bond = p.bond || {}; p.bond[arg.oid] = Math.min(50, (p.bond[arg.oid] || 0) + (kind === "fight" ? 0.5 : 1)); }
      if (L.tasksOn) L.taskEvent(cat, kind + (arg.toyKey ? ":" + arg.toyKey : ""));
    },

    // ------------------------------------------------ memories: the big moments, kept as little polaroids
    // (stored as what the cat looked like, and drawn again when you look at them)
    remember(p, k, a = {}) {
      p.mem = p.mem || [];
      if (k === "photo" && p.mem.filter((m) => m.k === "photo").length >= 12) p.mem.splice(p.mem.findIndex((m) => m.k === "photo"), 1);
      p.mem.unshift({ t: Date.now(), k, a, acc: { ...(p.acc || {}) }, g: L.growth(p), grey: L.isElder(p), pose: { born: "sleep", bornOf: "sleep", grew: "sit", elder: "loaf", birthday: "sit", lovemax: "sit",
        kitten: "sit", trick: "sit", together: "sit", photo: "sit", hello: "sit", first: "sit" }[k] || "sit" });
      if (p.mem.length > 40) p.mem.length = 40;
    },
    memText(m) {
      const t = STR[L.lang], a = { ...m.a };
      if (a.stageKey) { const st = STAGES.find((s) => s.id === a.stageKey); if (st) a.stage = st[L.lang]; }
      const f = m.k === "photo" ? t.log.memPhoto : t.log[m.k]; return f ? f(a) : "";
    },
    // ------------------------------------------------ tricks
    // a lesson: the better it knows the trick (and the more it loves you), the likelier it gets it right
    teach(cat, id) {
      const p = cat.profile, tr = TRICKS[id]; if (!tr) return null;
      p.tricks = p.tricks || {};
      const n = p.tricks[id] || 0, learned = n >= LESSONS;
      // a treat from the cupboard makes the lesson go much better
      const treat = !learned && (L.pantry.treat || 0) > 0; if (treat) L.pantry.treat--;
      const ok = learned || Math.random() < 0.25 + n * 0.08 + p.love / 500 + (treat ? 0.3 : 0);
      if (ok && !learned) {
        p.tricks[id] = n + 1; L.addXP(cat, 4); L.addLove(cat, 2);
        if (n + 1 >= LESSONS) { L.write(p, "trick", { id }); L.remember(p, "trick", { id }); if (cat.world) cat.world.confetti(cat.x, cat.y - 30 * cat.s, 24); }
        L.changed();
      }
      return { ok, learned: (p.tricks[id] || 0) >= LESSONS, n: p.tricks[id] || 0 };
    },
    // ------------------------------------------------ days together
    togetherDays() { return Math.floor((Date.now() - L.since) / 864e5); },
    togetherDue() {
      const d = L.togetherDays(), ms = TOGETHER.slice(); for (let y = 365; y <= d + 365; y += 365) ms.push(y);
      const done = ms.filter((m) => m <= d).sort((a, b) => a - b);
      if (done.length > L.togetherDone) { L.togetherDone = done.length; return done[done.length - 1]; }
      return 0;
    },

    // ------------------------------------------------ daily tasks
    taskText(id) { const d = TASKS[id]; return d ? d[L.lang](d.n) : ""; },
    // today's three tasks (new ones every day); one of them is often about its favourite toy
    tasks(p) {
      const d = today();
      if (!p.tasks || p.tasks.day !== d) {
        const keys = Object.keys(TASKS), pick = [];
        const favTask = { yarn: "yarn", mouse: "mouse", feather: "feather", butterfly: "butterfly", laser: "laser", catnip: "catnip", box: "box", post: "scratch" }[p.fav];
        if (favTask && Math.random() < 0.6) pick.push(favTask);
        if (!pick.includes("pet") && Math.random() < 0.5) pick.push("pet");
        while (pick.length < 3) { const k = pickOne(keys); if (!pick.includes(k)) pick.push(k); }
        const prev = p.tasks, yesterday = new Date(Date.now() - 864e5);
        const yd = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;
        if (!(prev && prev.day === yd && prev.all)) p.streak = 0;
        p.tasks = { day: d, list: pick.map((id) => ({ id, n: 0 })), all: false };
      }
      return p.tasks;
    },
    taskEvent(cat, on) {
      const p = cat.profile, ts = L.tasks(p), now = Date.now();
      let hit = false;
      for (const k of ts.list) {
        const d = TASKS[k.id]; if (!d || d.on !== on || k.n >= d.n) continue;
        if (now - (k.t || 0) < 1500) continue;           // the laser fires every frame: count at most one every 1.5 s
        k.t = now; k.n++; hit = true;
        if (k.n >= d.n) {
          L.addXP(cat, TASK_REWARD.xp); L.addLove(cat, TASK_REWARD.love); L.write(p, "task", { task: k.id });
          L.wallet.stars += TASK_REWARD.stars; p.stars = (p.stars || 0) + TASK_REWARD.stars; L.earn(TASK_REWARD.coins, cat);
          const w = cat.world, s = cat.s; if (w) { w.burst(cat.x, cat.y - 34 * s, "spark", "#ffd34d", 4); w.burst(cat.x, cat.y - 30 * s, "heart", "#e2557a", 2); }
        }
      }
      if (hit && !ts.all && ts.list.every((k) => k.n >= TASKS[k.id].n)) {
        ts.all = true; p.stars = (p.stars || 0) + ALL_REWARD.stars; L.wallet.stars += ALL_REWARD.stars; L.earn(ALL_REWARD.coins, cat); p.streak = (p.streak || 0) + 1;
        L.addXP(cat, ALL_REWARD.xp); L.addLove(cat, ALL_REWARD.love); L.write(p, "tasksDone");
        if (cat.world) cat.world.confetti(cat.x, cat.y - 30 * cat.s, 30);
      }
      if (hit) L.changed();
    },

    // ------------------------------------------------ kittens
    // the closest friend: the cat it has booped, raced and play-fought the most
    bestFriend(p, cats) {
      let best = null, v = 1.5;
      for (const c of cats) if (c.profile && c.profile !== p && (p.bond || {})[c.profile.id] >= v) { v = p.bond[c.profile.id]; best = c; }
      return best;
    },
    // Two grown-up friends who are both very happy can have a kitten now and then.
    // Called once a minute; returns the new kitten's profile, or null.
    tryBreed(world, force = false) {
      if (!L.breedOn && !force) return null;
      const cats = world.cats.filter((c) => c.profile);
      if (cats.length >= MAX_CATS) return null;
      const now = Date.now(), ready = (c) => !c.leaving && L.growth(c.profile) >= 1 && c.profile.love >= 70 && now - (c.profile.lastKit || 0) > KIT_COOL
        && !["held", "fall", "leap"].includes(c.state);
      const pairs = [];
      for (const a of cats) for (const b of cats) {
        if (a.profile.id >= b.profile.id || !ready(a) || !ready(b) || a.profile.sex === b.profile.sex) continue;   // a mother and a father
        const bond = Math.min((a.profile.bond || {})[b.profile.id] || 0, (b.profile.bond || {})[a.profile.id] || 0);
        if (bond >= 2 || force) pairs.push([a, b, bond]);
      }
      if (!pairs.length || (!force && Math.random() > 0.05)) return null;
      pairs.sort((x, y) => y[2] - x[2]);
      const [a, b] = pairs[0], taken = cats.map((c) => c.profile.name);
      // a litter: usually one, sometimes two or three (never more than there's room for)
      const r0 = Math.random(), size = Math.min(MAX_CATS - cats.length, r0 < 0.6 ? 1 : r0 < 0.9 ? 2 : 3), kits = [];
      for (let i = 0; i < size; i++) {
        const r = Math.random(), coat = r < 0.45 ? a.profile.coat : r < 0.9 ? b.profile.coat : pickOne(Object.keys(COAT_NAMES));
        const k = L.make(coat, { taken, love: 60, quiet: true }); taken.push(k.name);
        k.log = []; k.parents = [a.profile.id, b.profile.id];
        k.parentInfo = [a, b].map((c) => ({ id: c.profile.id, name: c.profile.name, coat: c.profile.coat }));
        L.write(k, "bornOf", { a: a.profile.name, b: b.profile.name }); L.remember(k, "bornOf", { a: a.profile.name, b: b.profile.name });
        for (const [x, y] of [[a, b], [b, a]]) {
          x.profile.lastKit = now; L.write(x.profile, "kitten", { o: y.profile.name, n: k.name });
          (x.profile.kids = x.profile.kids || []).push({ id: k.id, name: k.name, coat: k.coat });
          if (i === 0) L.remember(x.profile, "kitten", { o: y.profile.name, n: k.name, with: { coat: y.profile.coat, acc: y.profile.acc || {} }, kit: { coat: k.coat } });
        }
        kits.push(k);
      }
      L.changed();
      return { profile: kits[0], kits, parents: [a, b] };
    },
    // ------------------------------------------------ loneliness
    isLonely(p) { return !!p && p.love < LONELY; },
    lonely(cat, dt) {
      const p = cat.profile; if (!L.isLonely(p) || cat.leaving) return;
      if (Date.now() - (p.lastL.lonely || 0) > 3 * 3.6e6) { p.lastL.lonely = Date.now(); L.write(p, "lonely"); L.changed(); }
      const w = cat.world; if (w && Math.random() < dt / 25) w.burst(cat.x, cat.y - 34 * cat.s, "sad", "#7d8fb3", 1);
      const per = LEAVE_PER_HOUR[L.stage(p).id] || 0;
      if (per && Math.random() < per * dt / 3600 && w && w.catLeaves) w.catLeaves(cat);
    },
    addXP(cat, n) {
      const p = cat.profile; p.xp = Math.max(0, p.xp + n);
    },
    // a new stage of life: kitten → young → grown-up → wise old cat
    grewUp(cat, after) {
      const p = cat.profile;
      {
        L.write(p, after.id === "elder" ? "elder" : "grew", { stageKey: after.id }); L.remember(p, after.id === "elder" ? "elder" : "grew", { stageKey: after.id }); L.changed();
        const w = cat.world, s = cat.s;
        w.burst(cat.x, cat.y - 34 * s, "spark", "#ffd34d", 5); w.burst(cat.x, cat.y - 30 * s, "heart", "#e2557a", 3);
        if (!["held", "fall", "leap", "inbox"].includes(cat.state) && !cat.bed) cat.set("happy", 2.6, { eyes: null });
      }
    },
    addLove(cat, n) {
      const p = cat.profile, before = p.love;
      p.love = clamp(p.love + n, 0, 100);
      if (before < 100 && p.love >= 100 && now() - (p.lastL.lovemax || 0) > 6 * 3.6e6) { p.lastL.lovemax = now(); L.write(p, "lovemax"); if (!p.memLove) { p.memLove = 1; L.remember(p, "lovemax"); } L.changed(); }
    },
    // a little every frame: growing up slowly just by being around, love fading very slowly
    tick(cat, dt) {
      const p = cat.profile; if (!p) return;
      p.seen = Date.now();
      L.addXP(cat, dt / 120);
      const boxes = cat.world ? cat.world.furniture.filter((f) => f.kind === "litter") : [];
      const litterK = !boxes.length ? 1 : boxes.some((f) => (f.item.dirty || 0) < 4) ? 0.8 : 1.4;     // clean box: love lasts longer; only dirty ones: it fades faster
      p.love = Math.max(0, p.love - dt * LOVE_FADE * (L.isHungry(p) ? 1.5 : 1) * litterK);
      L.lonely(cat, dt);
      if (L.growing(p)) p.g = Math.min(1, L.growth(p) + dt / 3600 * GROW_PER_HOUR);
      cat.size = L.size(p);
      const st = L.stage(p);
      if (st.id !== p.stageId) { p.stageId = st.id; L.grewUp(cat, st); }
    },
  };
  const now = () => Date.now();

  window.CatLife = L;
})();
