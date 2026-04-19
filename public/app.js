/**
 * LoL Item Explorer - Final Master Logic
 * Created for: league.malierdogan.com
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

let appData = { SR: null, ARAM: null, currentVersion: "" };
let currentState = {
  map: "SR",
  category: "Normal",
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
    appData.currentVersion = appData.SR.version;
    document.getElementById("version-display").innerText =
      `Patch: ${appData.currentVersion}`;
    setupEventListeners();
    render();
  } catch (error) {
    console.error("Initialization error:", error);
  }
}

function setupEventListeners() {
  document.getElementById("map-toggle").addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") {
      document
        .querySelectorAll("#map-toggle button")
        .forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      currentState.map = e.target.dataset.value;
      render();
    }
  });

  document.getElementById("category-toggle").addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") {
      document
        .querySelectorAll("#category-toggle button")
        .forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      currentState.category = e.target.dataset.value;
      render();
    }
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

  // Category Filter
  items = items.filter((item) => {
    const isBoots = item.tags.includes("Boots");
    if (currentState.category === "Ornn") return item.isOrnn;
    if (currentState.category === "Boots") return isBoots;
    return !item.isOrnn && !isBoots;
  });

  // Search Filter
  if (currentState.search) {
    items = items.filter((item) =>
      item.name.toLowerCase().includes(currentState.search),
    );
  }

  // Sort
  items.sort((a, b) => {
    if (currentState.sort === "gold-desc") return b.gold - a.gold;
    if (currentState.sort === "gold-asc") return a.gold - b.gold;
    const statA = a.stats[currentState.sort] || 0;
    const statB = b.stats[currentState.sort] || 0;
    return statB - statA;
  });

  items.forEach((item) => {
    if (currentState.sort !== "gold-desc" && currentState.sort !== "gold-asc") {
      if ((item.stats[currentState.sort] || 0) === 0) return;
    }

    const card = document.createElement("div");
    card.className = "item-card";

    let rawStatsHtml = "";
    let mappedStatsHtml = "";

    for (const [key, value] of Object.entries(item.stats)) {
      const rawKey = key.replace("Flat", "").replace("Mod", "");
      const cleanName = STAT_MAP[key] || rawKey;

      // Format Values (Handle Decimals like 0.03 -> 3%)
      let displayVal =
        value < 1 && value > 0 ? `${(value * 100).toFixed(0)}%` : `+${value}`;
      if (key.includes("AttackSpeed") && value < 1)
        displayVal = `+${(value * 100).toFixed(0)}%`;

      // Top Section (Raw-ish look)
      rawStatsHtml += `<div class="stat-line raw"><span>${rawKey}</span> <span>${displayVal}</span></div>`;

      // Expanded Section (Clean look)
      mappedStatsHtml += `<div class="stat-line mapped"><strong>${value}${value < 1 ? "%" : ""} ${cleanName}</strong></div>`;
    }

    card.innerHTML = `
            <div class="card-header">
                <img src="${item.image_url}" alt="${item.name}">
                <div class="header-info">
                    <h3>${item.name}</h3>
                    <div class="gold-text">${item.gold} Gold</div>
                </div>
            </div>
            <div class="card-body-preview">
                ${rawStatsHtml}
            </div>
            <div class="card-details">
                <div class="mapped-stats">${mappedStatsHtml}</div>
                <div class="desc-text">${item.description}</div>
            </div>
        `;

    card.addEventListener("click", () => card.classList.toggle("expanded"));
    grid.appendChild(card);
  });
}

init();
