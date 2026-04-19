/**
 * LoL Item Explorer - Core Engine
 * league.malierdogan.com
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

let appData = { SR: null, ARAM: null };
let currentState = {
  map: "ARAM",
  category: "Legendary",
  role: "All",
  stat: "All",
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
    console.error("Initialization Failed:", e);
  }
}

// BU FONKSİYON METİN KARMAŞASINI BİTİRİR
function cleanDescription(text) {
  if (!text) return "";

  // 1. Riot'un <stats>...</stats> içindeki sayısal verilerini siliyoruz (Çünkü zaten kartta ayrı gösteriyoruz)
  let clean = text.replace(/<stats>.*?<\/stats>/gi, "");

  // 2. Kalan tüm HTML taglerini siliyoruz
  clean = clean.replace(/<[^>]*>/g, " ");

  // 3. Fazla boşlukları alıyoruz
  return clean.replace(/\s\s+/g, " ").trim();
}

function setupEventListeners() {
  // Tüm filtre butonlarını dinle
  document.querySelectorAll(".filter-group").forEach((group) => {
    group.addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON") {
        const parent = e.target.closest(".filter-group");
        const filterType = parent.id; // map-toggle, role-toggle vb.
        const val = e.target.dataset.value;

        parent
          .querySelectorAll("button")
          .forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");

        if (filterType === "map-toggle") currentState.map = val;
        if (filterType === "category-toggle") currentState.category = val;
        if (filterType === "role-toggle") currentState.role = val;
        if (filterType === "stat-toggle") currentState.stat = val;

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

  // --- PROFESYONEL FİLTRELEME ---
  items = items.filter((item) => {
    const isBoots = item.tags.includes("Boots");

    // Kategori Kontrolü
    const catMatch =
      currentState.category === "Ornn"
        ? item.isOrnn
        : currentState.category === "Boots"
          ? isBoots
          : !item.isOrnn && !isBoots;

    // Rol Kontrolü (Market Rolleri)
    const roleMatch =
      currentState.role === "All" || item.tags.includes(currentState.role);

    // Stat Kontrolü (Haste, Pen vb.)
    let statMatch = currentState.stat === "All";
    if (!statMatch) {
      if (currentState.stat === "ArmorPenetration") {
        statMatch =
          item.tags.includes("ArmorPenetration") ||
          item.tags.includes("Lethality");
      } else {
        statMatch = item.tags.includes(currentState.stat);
      }
    }

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

  // --- KARTLARI BAS ---
  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "item-card";

    // Statları hizalı şekilde oluştur
    let statsHtml = Object.entries(item.stats)
      .map(([k, v]) => {
        const rawKey = k.replace("Flat", "").replace("Mod", "");
        const val = v < 1 && v > 0 ? `+${(v * 100).toFixed(0)}%` : `+${v}`;
        return `<div class="stat-line"><span>${rawKey}</span><strong>${val}</strong></div>`;
      })
      .join("");

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
                <p class="description-text">${cleanDescription(item.description)}</p>
            </div>
        `;
    grid.appendChild(card);
  });
}

init();
