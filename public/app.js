/**
 * LoL Item Explorer - app.js
 */

let appData = { SR: null, ARAM: null };
let currentState = {
  map: "SR",
  category: "Normal",
  search: "",
  sort: "gold-desc",
};

// ── Init ──────────────────────────────────────────────
async function init() {
  try {
    const [srRes, aramRes] = await Promise.all([
      fetch("./data/sr_data.json?v=" + Date.now()),
      fetch("./data/aram_data.json?v=" + Date.now()),
    ]);
    appData.SR = await srRes.json();
    appData.ARAM = await aramRes.json();

    const version = appData.SR.version || appData.ARAM.version || "";
    const versionEl = document.getElementById("version-display");
    if (versionEl && version) versionEl.textContent = "Patch " + version;

    setupEventListeners();
    render();
  } catch (e) {
    console.error("Data Load Fail:", e);
  }
}

// ── Description Cleaner ───────────────────────────────
// Riot description formatı: "75 Attack Damage25% Crit...PassiveName açıklama"
// Başındaki tüm "rakam + stat ismi" bloklarını silerek sadece passive/active açıklamasını bırakır.
function cleanDescription(text) {
  if (!text) return "";

  // HTML tag temizle
  let clean = text.replace(/<[^>]*>/g, " ").trim();

  // Başından rakamla başlayan stat bloklarını teker teker soy
  // Örnek: "75 Attack Damage" | "25% Critical Strike Chance" | "30% Critical Strike Damage"
  // Passive isimleri rakamla başlamaz, büyük harfle başlar ve rakam içermez
  let prev = "";
  while (prev !== clean) {
    prev = clean;
    // Başında rakam varsa o stat bloğunu sil (bir sonraki rakama veya passive ismine kadar)
    clean = clean
      .replace(/^\d[\d\s%+.]*[A-Za-z][a-zA-Z\s]*?(?=\d|[A-Z][a-z]+[A-Z]|$)/, "")
      .trim();
  }

  return clean.replace(/\s{2,}/g, " ").trim();
}

// ── Event Listeners ───────────────────────────────────
function setupEventListeners() {
  // Toggle butonları (map, category)
  document.querySelectorAll(".toggle-buttons").forEach((group) => {
    group.addEventListener("click", (e) => {
      if (e.target.tagName !== "BUTTON") return;

      // Aynı grup içindeki aktif butonu kaldır
      group
        .querySelectorAll("button")
        .forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");

      const groupId = group.id;
      const val = e.target.dataset.value;

      if (groupId === "map-toggle") currentState.map = val;
      if (groupId === "category-toggle") currentState.category = val;

      render();
    });
  });

  // Arama
  document.getElementById("search-input").addEventListener("input", (e) => {
    currentState.search = e.target.value.toLowerCase();
    render();
  });

  // Sıralama
  document.getElementById("sort-select").addEventListener("change", (e) => {
    currentState.sort = e.target.value;
    render();
  });

  // Kart tıklama (expand/collapse) — event delegation
  document.getElementById("items-grid").addEventListener("click", (e) => {
    const card = e.target.closest(".item-card");
    if (card) card.classList.toggle("expanded");
  });
}

// ── Render ────────────────────────────────────────────
function render() {
  const grid = document.getElementById("items-grid");
  grid.innerHTML = "";

  const source = appData[currentState.map];
  if (!source) return;
  let items = [...source.items];

  // Kategori filtresi
  items = items.filter((item) => {
    const isBoots = item.tags.includes("Boots");
    if (currentState.category === "Ornn") return item.isOrnn;
    if (currentState.category === "Boots") return isBoots;
    return !item.isOrnn && !isBoots; // Normal
  });

  // Arama filtresi
  if (currentState.search) {
    items = items.filter((item) =>
      item.name.toLowerCase().includes(currentState.search),
    );
  }

  // Sıralama
  items.sort((a, b) => {
    if (currentState.sort === "gold-desc") return b.gold - a.gold;
    if (currentState.sort === "gold-asc") return a.gold - b.gold;
    return (
      (b.stats[currentState.sort] || 0) - (a.stats[currentState.sort] || 0)
    );
  });

  // Kartları oluştur
  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "item-card";

    // Stats satırları
    const statsHtml = Object.entries(item.stats)
      .map(([k, v]) => {
        const label = formatStatKey(k);
        const value = v > 0 && v < 1 ? `+${(v * 100).toFixed(0)}%` : `+${v}`;
        return `<div class="stat-line"><span>${label}</span><span class="stat-value">${value}</span></div>`;
      })
      .join("");

    const desc = cleanDescription(item.description);

    card.innerHTML = `
      <div class="card-header">
        <img src="${item.image_url}" alt="${item.name}" onerror="this.style.opacity='0.3'">
        <div class="header-info">
          <h3>${item.name}</h3>
          <div class="gold-text">${item.gold} Gold</div>
        </div>
      </div>
      <div class="card-details">
        <div class="stats-section">${statsHtml}</div>
        ${desc ? `<div class="desc-text">${desc}</div>` : ""}
      </div>
    `;

    grid.appendChild(card);
  });

  // Sonuç sayısı
  const versionEl = document.getElementById("version-display");
  const version = source.version || "";
  if (versionEl) {
    versionEl.textContent =
      (version ? "Patch " + version + " · " : "") + items.length + " items";
  }
}

// ── Yardımcı: Stat key → okunabilir isim ─────────────
const STAT_MAP = {
  FlatMagicDamageMod: "Ability Power",
  FlatPhysicalDamageMod: "Attack Damage",
  FlatCritChanceMod: "Crit Chance",
  PercentAttackSpeedMod: "Attack Speed",
  FlatMagicPenetrationMod: "Magic Pen",
  PercentMagicPenetrationMod: "Magic Pen %",
  FlatPhysicalLethality: "Lethality",
  PercentArmorPenetrationMod: "Armor Pen %",
  FlatHPPoolMod: "Health",
  FlatArmorMod: "Armor",
  FlatSpellBlockMod: "Magic Resist",
  FlatMPPoolMod: "Mana",
  FlatAbilityHaste: "Ability Haste",
  PercentMovementSpeedMod: "Move Speed %",
  FlatMovementSpeedMod: "Move Speed",
  PercentLifeStealMod: "Life Steal",
  PercentOmnivampMod: "Omnivamp",
};

function formatStatKey(key) {
  return (
    STAT_MAP[key] || key.replace(/^(Flat|Percent)/, "").replace(/Mod$/, "")
  );
}

init();
