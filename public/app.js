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

// Riot description başında tekrar eden stat isimleri — bunları ve önlerindeki sayıları sileceğiz
const STAT_NAMES = [
  "Ability Power",
  "Attack Damage",
  "Critical Strike Chance",
  "Critical Strike Damage",
  "Attack Speed",
  "Ultimate Ability Haste",
  "Ability Haste",
  "Move Speed",
  "Movement Speed",
  "Magic Penetration",
  "Armor Penetration",
  "Lethality",
  "Heal and Shield Power",
  "Base Mana Regen",
  "Base Health Regen",
  "Bonus Attack Damage",
  "Magic Resist",
  "Health",
  "Armor",
  "Mana",
  "Life Steal",
  "Omnivamp",
];

function cleanDescription(text) {
  if (!text) return "";

  // HTML taglerini temizle
  let clean = text.replace(/<[^>]*>/g, " ").trim();

  // Başındaki "75 Attack Damage25% Critical Strike Chance15 Ability Haste" gibi
  // stat bloklarını sil. Bilinen her stat ismini ve önündeki sayıyı tek tek sil.
  const escaped = STAT_NAMES.map((s) =>
    s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  ).join("|");
  const statBlockRe = new RegExp(`\\d[\\d.]*\\s*%?\\s*(${escaped})`, "gi");
  clean = clean.replace(statBlockRe, "");

  // Temizleme sonrası baştaki tek kelime artıklarını sil
  // (örn: "Haste", "Steal", "Power", "Regen", "Chance" — passive isminin önüne yapışmış)
  // Passive ismi daima 2+ büyük harfli kelimedir (PascalCase birleşik)
  clean = clean.replace(/^[A-Z][a-z]+(?=[A-Z])/, "");

  return clean.replace(/\s{2,}/g, " ").trim();
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

let appData = { SR: null, ARAM: null };
let currentState = {
  map: "SR",
  category: "Normal",
  search: "",
  sort: "gold-desc",
};

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

function setupEventListeners() {
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

  document.getElementById("search-input").addEventListener("input", (e) => {
    currentState.search = e.target.value.toLowerCase();
    render();
  });

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

function render() {
  const grid = document.getElementById("items-grid");
  grid.innerHTML = "";

  const source = appData[currentState.map];
  if (!source || !source.items) {
    grid.innerHTML = `<p style="color:red">Veri bulunamadı: ${currentState.map}</p>`;
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

  // Arama
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
