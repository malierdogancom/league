/**
 * LoL Item Explorer - Core Logic
 * Project: league.malierdogan.com
 */

const STAT_MAP = {
  // Offensive
  FlatMagicDamageMod: "Ability Power",
  FlatPhysicalDamageMod: "Attack Damage",
  FlatCritChanceMod: "Crit Chance",
  PercentAttackSpeedMod: "Attack Speed",
  FlatMagicPenetrationMod: "Magic Penetration",
  PercentMagicPenetrationMod: "Magic Penetration (%)",
  FlatPhysicalLethality: "Lethality",
  PercentArmorPenetrationMod: "Armor Penetration (%)",

  // Defensive
  FlatHPPoolMod: "Health",
  FlatArmorMod: "Armor",
  FlatSpellBlockMod: "Magic Resist",

  // Resource & Utility
  FlatMPPoolMod: "Mana",
  FlatAbilityHaste: "Ability Haste",
  PercentMovementSpeedMod: "Move Speed",
  FlatMovementSpeedMod: "Move Speed",
  PercentLifeStealMod: "Life Steal",
  PercentOmnivampMod: "Omnivamp",
  FlatHPRegenMod: "Health Regen",
  PercentBaseHPRegenMod: "Base Health Regen (%)",
};

let appData = {
  SR: null,
  ARAM: null,
  currentVersion: "",
};

let currentState = {
  map: "SR",
  category: "Normal", // 'Normal', 'Boots', 'Ornn'
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
    console.error("Data load error:", error);
    document.getElementById("items-grid").innerHTML =
      '<p style="color:red;">JSON files not found. Run the Python script first.</p>';
  }
}

function setupEventListeners() {
  // Map Toggle (SR vs ARAM)
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

  // Category Toggle (Legendary vs Boots vs Ornn)
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

  // Search Input
  document.getElementById("search-input").addEventListener("input", (e) => {
    currentState.search = e.target.value.toLowerCase();
    render();
  });

  // Sort Selection
  document.getElementById("sort-select").addEventListener("change", (e) => {
    currentState.sort = e.target.value;
    render();
  });
}

function render() {
  const grid = document.getElementById("items-grid");
  grid.innerHTML = "";

  // 1. Get Data Source
  let items = appData[currentState.map].items;

  // 2. Filter by Category
  items = items.filter((item) => {
    const isBoots = item.tags.includes("Boots");
    if (currentState.category === "Ornn") return item.isOrnn;
    if (currentState.category === "Boots") return isBoots;
    if (currentState.category === "Normal") return !item.isOrnn && !isBoots;
    return true;
  });

  // 3. Filter by Search
  if (currentState.search) {
    items = items.filter((item) =>
      item.name.toLowerCase().includes(currentState.search),
    );
  }

  // 4. Sorting Logic
  items.sort((a, b) => {
    if (currentState.sort === "gold-desc") return b.gold - a.gold;
    if (currentState.sort === "gold-asc") return a.gold - b.gold;

    // Stat based sorting
    const statA = a.stats[currentState.sort] || 0;
    const statB = b.stats[currentState.sort] || 0;
    return statB - statA;
  });

  // 5. Build UI Cards
  items.forEach((item) => {
    // If sorting by a specific stat, hide items that don't have that stat
    if (currentState.sort !== "gold-desc" && currentState.sort !== "gold-asc") {
      if ((item.stats[currentState.sort] || 0) === 0) return;
    }

    const card = document.createElement("div");
    card.className = "item-card";

    // Process Stats for Display
    let statsHtml = "";
    for (const [key, value] of Object.entries(item.stats)) {
      let displayName =
        STAT_MAP[key] || key.replace("Flat", "").replace("Mod", "");
      let displayValue = "";

      if (
        key.includes("Percent") ||
        key.includes("AttackSpeed") ||
        key.includes("MovementSpeed")
      ) {
        // Formatting decimals (e.g., 0.04 to 4%)
        let val = value < 1 && value > 0 ? (value * 100).toFixed(0) : value;
        displayValue = `${val}%`;
      } else {
        displayValue = `+${value}`;
      }

      statsHtml += `<div class="stat-line"><span>${displayName}</span> <span class="stat-value">${displayValue}</span></div>`;
    }

    card.innerHTML = `
            <div class="card-header">
                <img src="${item.image_url}" alt="${item.name}" loading="lazy">
                <div class="header-info">
                    <h3>${item.name}</h3>
                    <div class="gold-text">${item.gold} Gold</div>
                </div>
            </div>
            <div class="card-details">
                <div class="stats-container">${statsHtml}</div>
                <div class="desc-text">${item.description}</div>
            </div>
        `;

    card.addEventListener("click", () => {
      card.classList.toggle("expanded");
    });

    grid.appendChild(card);
  });
}

init();
