/**
 * LoL Item Explorer - Final Master Pro Logic
 * Features: Market Roles, Multi-Stat Filtering, Lethality/Pen Merge
 */

const STAT_MAP = {
  FlatMagicDamageMod: "Ability Power",
  FlatPhysicalDamageMod: "Attack Damage",
  FlatCritChanceMod: "Crit Chance",
  PercentAttackSpeedMod: "Attack Speed",
  FlatMagicPenetrationMod: "Magic Penetration",
  PercentMagicPenetrationMod: "Magic Penetration (%)",
  FlatPhysicalLethality: "Lethality",
  PercentArmorPenetrationMod: "Armor Penetration (%)",
  FlatHPPoolMod: "Health",
  FlatArmorMod: "Armor",
  FlatSpellBlockMod: "Magic Resist",
  FlatMPPoolMod: "Mana",
  FlatAbilityHaste: "Ability Haste",
  PercentMovementSpeedMod: "Move Speed",
  FlatMovementSpeedMod: "Move Speed",
  PercentLifeStealMod: "Life Steal",
  PercentOmnivampMod: "Omnivamp",
};

// Market Rolleri ve Stat Grupları
const FILTERS = {
  roles: ["Fighter", "Marksman", "Assassin", "Mage", "Tank", "Support"],
  stats: [
    "AbilityHaste",
    "ArmorPenetration",
    "CriticalStrike",
    "LifeSteal",
    "Mana",
    "MovementSpeed",
    "SpellVamp",
  ],
};

let appData = { SR: null, ARAM: null };
let currentState = {
  map: "ARAM",
  category: "Legendary",
  role: "All",
  statFilter: "All",
  search: "",
  sort: "gold-desc",
};

async function init() {
  try {
    const [srRes, aramRes] = await Promise.all([
      fetch("./data/sr_data.json"),
      fetch("./data/aram_data.json"),
    ]);
    appData.SR = await srRes.json();
    appData.ARAM = await aramRes.json();
    setupEventListeners();
    render();
  } catch (e) {
    console.error("Load Error:", e);
  }
}

// Metin Temizleme Motoru (Gelişmiş)
function cleanDescription(text) {
  if (!text) return "";
  // Riot'un iç içe geçmiş stat metinlerini ve taglerini siler
  let clean = text.replace(/<stats>.*?<\/stats>/gi, ""); // Önce stat bloğunu at
  clean = clean.replace(/<[^>]*>/g, " "); // Tüm HTML taglerini sil
  clean = clean.replace(/\s\s+/g, " ").trim(); // Boşlukları temizle
  return clean;
}

function setupEventListeners() {
  // Tüm buton grupları için (Map, Role, Stat, Category)
  document.querySelectorAll(".filter-group").forEach((group) => {
    group.addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON") {
        const parent = e.target.parentElement;
        const type = parent.dataset.type;
        const val = e.target.dataset.value;

        parent
          .querySelectorAll("button")
          .forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");

        if (type === "map") currentState.map = val;
        if (type === "category") currentState.category = val;
        if (type === "role") currentState.role = val;
        if (type === "stat") currentState.statFilter = val;

        render();
      }
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
}

function render() {
  const grid = document.getElementById("items-grid");
  grid.innerHTML = "";
  let items = appData[currentState.map].items;

  // --- FILTRELEME ---
  items = items.filter((item) => {
    // 1. Kategori (Legendary/Boots/Ornn)
    const isBoots = item.tags.includes("Boots");
    const catMatch =
      currentState.category === "Ornn"
        ? item.isOrnn
        : currentState.category === "Boots"
          ? isBoots
          : !item.isOrnn && !isBoots;

    // 2. Rol (Fighter, Tank vb.)
    const roleMatch =
      currentState.role === "All" || item.tags.includes(currentState.role);

    // 3. Stat Filtresi (Haste, Pen vb.)
    // ArmorPen ve Lethality tek sekmede birleştirildi
    let statMatch = true;
    if (currentState.statFilter !== "All") {
      if (currentState.statFilter === "ArmorPenetration") {
        statMatch =
          item.tags.includes("ArmorPenetration") ||
          item.tags.includes("Lethality");
      } else {
        statMatch = item.tags.includes(currentState.statFilter);
      }
    }

    // 4. Arama
    const searchMatch = item.name.toLowerCase().includes(currentState.search);

    return catMatch && roleMatch && statMatch && searchMatch;
  });

  // --- SIRALAMA ---
  items.sort((a, b) => {
    if (currentState.sort.includes("gold")) {
      return currentState.sort === "gold-desc"
        ? b.gold - a.gold
        : a.gold - b.gold;
    }
    return (
      (b.stats[currentState.sort] || 0) - (a.stats[currentState.sort] || 0)
    );
  });

  // --- BASMA ---
  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "item-card";

    let statsHtml = "";
    for (const [key, value] of Object.entries(item.stats)) {
      const rawKey = key.replace("Flat", "").replace("Mod", "");
      const displayVal =
        value < 1 && value > 0 ? `+${(value * 100).toFixed(0)}%` : `+${value}`;
      statsHtml += `<div class="stat-line"><span class="stat-name">${rawKey}</span><span class="stat-value">${displayVal}</span></div>`;
    }

    card.innerHTML = `
            <div class="card-header">
                <img src="${item.image_url}" alt="${item.name}">
                <div class="header-info">
                    <h3>${item.name}</h3>
                    <div class="gold-text">${item.gold} Gold</div>
                </div>
            </div>
            <div class="stats-preview">${statsHtml}</div>
            <div class="card-description">
                <p>${cleanDescription(item.description)}</p>
            </div>
        `;
    grid.appendChild(card);
  });
}

init();
