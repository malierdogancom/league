/**
 * LoL Item Explorer - Final Master Logic
 * Professional Mapping & Role Filtering
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

const ROLE_MAP = {
  Mage: ["SpellDamage", "Mana", "SpellBlock"],
  Tank: ["Health", "Armor", "SpellBlock", "HealthRegen"],
  Assassin: ["Lethality", "PhysicalDamage"],
  Marksman: ["AttackSpeed", "CriticalStrike", "PhysicalDamage"],
  Support: ["ManaRegen", "Active"],
};

let appData = { SR: null, ARAM: null };
let currentState = {
  map: "ARAM",
  category: "Legendary",
  role: "All",
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
    console.error("Data error:", e);
  }
}

// DDragon'un kirli description metnini temizleyen fonksiyon
function cleanRiotDescription(text, stats) {
  if (!text) return "";
  let clean = text;
  // 1. Statların description içindeki tekrarlarını sil (Örn: "100 Health" kısmını metinden çıkar)
  Object.values(STAT_MAP).forEach((s) => {
    const regex = new RegExp(`[0-9%\\+.]+\\s*${s}`, "gi");
    clean = clean.replace(regex, "");
  });
  // 2. HTML etiketlerini ve gereksiz boşlukları temizle
  clean = clean
    .replace(/<[^>]*>/g, " ")
    .replace(/\s\s+/g, " ")
    .trim();
  return clean;
}

function setupEventListeners() {
  // Map & Category
  document.querySelectorAll(".filter-group button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const group = e.target.parentElement.id;
      const val = e.target.dataset.value;
      document
        .querySelectorAll(`#${group} button`)
        .forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");

      if (group === "map-toggle") currentState.map = val;
      if (group === "category-toggle") currentState.category = val;
      if (group === "role-toggle") currentState.role = val;
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
}

function render() {
  const grid = document.getElementById("items-grid");
  grid.innerHTML = "";
  let items = appData[currentState.map].items;

  // Filter: Category & Role
  items = items.filter((item) => {
    const isBoots = item.tags.includes("Boots");
    const catMatch =
      currentState.category === "Ornn"
        ? item.isOrnn
        : currentState.category === "Boots"
          ? isBoots
          : !item.isOrnn && !isBoots;
    const roleMatch =
      currentState.role === "All" ||
      item.tags.some((tag) => currentState.role.includes(tag));
    const searchMatch = item.name.toLowerCase().includes(currentState.search);
    return catMatch && roleMatch && searchMatch;
  });

  // Sort
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

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "item-card";

    let statsHtml = "";
    for (const [key, value] of Object.entries(item.stats)) {
      const rawKey = key.replace("Flat", "").replace("Mod", "");
      const cleanName = STAT_MAP[key] || rawKey;
      const displayVal =
        value < 1 && value > 0 ? `+${(value * 100).toFixed(0)}%` : `+${value}`;

      statsHtml += `
                <div class="stat-line">
                    <span class="raw-label">${rawKey}</span>
                    <span class="raw-value">${displayVal}</span>
                </div>`;
    }

    const cleanDesc = cleanRiotDescription(item.description, item.stats);

    card.innerHTML = `
            <div class="card-header">
                <img src="${item.image_url}" alt="${item.name}">
                <div class="header-info">
                    <h3>${item.name}</h3>
                    <div class="gold-text">${item.gold} Gold</div>
                </div>
            </div>
            <div class="stats-preview">${statsHtml}</div>
            <div class="card-details">
                <p class="description">${cleanDesc}</p>
            </div>
        `;
    grid.appendChild(card);
  });
}

init();
