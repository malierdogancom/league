/**
 * LoL Item Explorer
 */

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

// Stat kelimeleri — uzun olanlar önce gelsin (greedy match için)
const STAT_WORDS = [
  "Attack Damage",
  "Ability Power",
  "Critical Strike Chance",
  "Critical Strike Damage",
  "Ultimate Ability Haste",
  "Ability Haste",
  "Attack Speed",
  "Move Speed",
  "Movement Speed",
  "Magic Penetration",
  "Armor Penetration",
  "Heal and Shield Power",
  "Base Mana Regen",
  "Base Health Regen",
  "Bonus Attack Damage",
  "Magic Resist",
  "Life Steal",
  "Omnivamp",
  "Lethality",
  "Tenacity",
  "Health",
  "Armor",
  "Mana",
  "Gold",
  "Haste", // "Ability Haste" sildikten sonra kalan artık "Haste" için
  "Regen", // artık
  "Steal", // artık
  "Power", // artık
  "Speed", // artık
  "Chance", // artık
  "Resist", // artık
];

function cleanDescription(text) {
  if (!text) return "";

  // HTML taglerini temizle
  let s = text.replace(/<[^>]*>/g, " ").trim();

  // 1. Tüm rakamları ve % işaretlerini sil (stat önekleri: "75", "25%", "333")
  s = s.replace(/\d[\d.,]*\s*%?\s*/g, " ").trim();

  // 2. Başından bilinen stat kelimelerini teker teker soy
  const escaped = STAT_WORDS.map((w) =>
    w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  ).join("|");
  const statRe = new RegExp(`^\\s*(${escaped})`, "i");

  let prev = "";
  while (prev !== s) {
    prev = s;
    s = s.replace(statRe, "").trim();
  }

  return s.replace(/\s{2,}/g, " ").trim();
}

function formatStatKey(key) {
  return (
    STAT_MAP[key] || key.replace(/^(Flat|Percent)/, "").replace(/Mod$/, "")
  );
}

function formatStatValue(key, v) {
  if (key.startsWith("Percent") || key === "FlatCritChanceMod") {
    return `+${(v * 100).toFixed(0)}%`;
  }
  return `+${v}`;
}

// ── State ─────────────────────────────────────────────
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
    setupEventListeners();
    render();
  } catch (e) {
    console.error("Data Load Fail:", e);
    const el = document.getElementById("version-display");
    if (el) el.textContent = "Veri yüklenemedi!";
  }
}

// ── Events ────────────────────────────────────────────
function setupEventListeners() {
  // Map ve Category toggle butonları
  document.querySelectorAll(".toggle-buttons").forEach((group) => {
    group.addEventListener("click", (e) => {
      if (e.target.tagName !== "BUTTON") return;
      group
        .querySelectorAll("button")
        .forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");

      const val = e.target.dataset.value;
      if (group.id === "map-toggle") currentState.map = val;
      if (group.id === "category-toggle") currentState.category = val;
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

  // Kart expand/collapse — event delegation
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
  if (!source || !source.items) {
    grid.innerHTML = `<p style="color:red;padding:20px">Veri bulunamadı: ${currentState.map}</p>`;
    return;
  }

  let items = [...source.items];

  // Kategori filtresi
  items = items.filter((item) => {
    const isBoots = item.tags && item.tags.includes("Boots");
    if (currentState.category === "Ornn") return item.isOrnn;
    if (currentState.category === "Boots") return isBoots;
    return !item.isOrnn && !isBoots;
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
    const aVal = a.stats ? a.stats[currentState.sort] || 0 : 0;
    const bVal = b.stats ? b.stats[currentState.sort] || 0 : 0;
    return bVal - aVal;
  });

  // Versiyon + item sayısı
  const version = source.version || "";
  const versionEl = document.getElementById("version-display");
  if (versionEl) {
    versionEl.textContent =
      (version ? "Patch " + version + " · " : "") +
      items.length +
      " item" +
      (currentState.map === "ARAM" ? " (ARAM)" : " (SR)");
  }

  // Kartları oluştur
  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "item-card";

    const statsHtml = item.stats
      ? Object.entries(item.stats)
          .map(
            ([k, v]) =>
              `<div class="stat-line">
                <span>${formatStatKey(k)}</span>
                <span class="stat-value">${formatStatValue(k, v)}</span>
              </div>`,
          )
          .join("")
      : "";

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
        ${statsHtml ? `<div class="stats-section">${statsHtml}</div>` : ""}
        ${desc ? `<div class="desc-text">${desc}</div>` : ""}
      </div>
    `;

    grid.appendChild(card);
  });
}

init();
