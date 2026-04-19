/**
 * LoL Item Explorer - Stat Focused
 */

const STAT_MAP = {
  FlatMagicDamageMod: { label: "Ability Power", short: "AP" },
  FlatPhysicalDamageMod: { label: "Attack Damage", short: "AD" },
  FlatCritChanceMod: { label: "Crit Chance", short: "Crit" },
  PercentAttackSpeedMod: { label: "Attack Speed", short: "AS" },
  FlatMagicPenetrationMod: { label: "Magic Pen", short: "MPen" },
  PercentMagicPenetrationMod: { label: "Magic Pen %", short: "MPen%" },
  FlatPhysicalLethality: { label: "Lethality", short: "Leth" },
  PercentArmorPenetrationMod: { label: "Armor Pen %", short: "APen%" },
  FlatHPPoolMod: { label: "Health", short: "HP" },
  FlatArmorMod: { label: "Armor", short: "Armor" },
  FlatSpellBlockMod: { label: "Magic Resist", short: "MR" },
  FlatMPPoolMod: { label: "Mana", short: "Mana" },
  FlatAbilityHaste: { label: "Ability Haste", short: "AH" },
  PercentMovementSpeedMod: { label: "Move Speed %", short: "MS%" },
  FlatMovementSpeedMod: { label: "Move Speed", short: "MS" },
  PercentLifeStealMod: { label: "Life Steal", short: "LS" },
  PercentOmnivampMod: { label: "Omnivamp", short: "OV" },
};

function formatStatKey(key) {
  return STAT_MAP[key]
    ? STAT_MAP[key].label
    : key.replace(/^(Flat|Percent)/, "").replace(/Mod$/, "");
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

    buildSortOptions();
    setupEventListeners();
    render();
  } catch (e) {
    console.error("Data Load Fail:", e);
    const el = document.getElementById("version-display");
    if (el) el.textContent = "Veri yüklenemedi!";
  }
}

// ── Sort Options — tüm stat'lar için dinamik oluştur ──
function buildSortOptions() {
  const select = document.getElementById("sort-select");
  select.innerHTML = `
    <option value="gold-desc">💰 Price: High → Low</option>
    <option value="gold-asc">💰 Price: Low → High</option>
    <option disabled>──────────────</option>
  `;

  Object.entries(STAT_MAP).forEach(([key, { label }]) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = `${label}: High → Low`;
    select.appendChild(opt);
  });
}

// ── Events ────────────────────────────────────────────
function setupEventListeners() {
  document.querySelectorAll(".toggle-buttons").forEach((group) => {
    group.addEventListener("click", (e) => {
      if (e.target.tagName !== "BUTTON") return;
      group
        .querySelectorAll("button")
        .forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");

      const val = e.target.dataset.value;
      if (group.id === "map-toggle") {
        currentState.map = val;
        // Harita değişince Ornn seçiliyse Normal'e dön (ARAM'da Ornn yok olabilir)
        if (val === "ARAM" && currentState.category === "Ornn") {
          currentState.category = "Normal";
          document.querySelectorAll("#category-toggle button").forEach((b) => {
            b.classList.toggle("active", b.dataset.value === "Normal");
          });
        }
      }
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

  // Kart expand/collapse
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
    grid.innerHTML = `<p style="color:#e74c3c;padding:20px">
      Veri yüklenemedi: <strong>${currentState.map}</strong>
    </p>`;
    return;
  }

  let items = [...source.items];

  // ── Kategori filtresi ──
  items = items.filter((item) => {
    const tags = item.tags || [];
    const isBoots = tags.includes("Boots");
    const isOrnn = item.isOrnn === true;

    if (currentState.category === "Ornn") return isOrnn;
    if (currentState.category === "Boots") return isBoots && !isOrnn;
    // Normal: ne Ornn ne Boots
    return !isOrnn && !isBoots;
  });

  // ── Arama filtresi ──
  if (currentState.search) {
    items = items.filter((item) =>
      item.name.toLowerCase().includes(currentState.search),
    );
  }

  // ── Sıralama ──
  items.sort((a, b) => {
    if (currentState.sort === "gold-desc") return b.gold - a.gold;
    if (currentState.sort === "gold-asc") return a.gold - b.gold;
    const aVal = a.stats?.[currentState.sort] ?? 0;
    const bVal = b.stats?.[currentState.sort] ?? 0;
    return bVal - aVal;
  });

  // ── Versiyon + sayı ──
  const version = source.version || "";
  const versionEl = document.getElementById("version-display");
  if (versionEl) {
    const mapLabel = currentState.map === "ARAM" ? "ARAM" : "SR";
    versionEl.textContent =
      (version ? "Patch " + version + " · " : "") +
      items.length +
      " items · " +
      mapLabel;
  }

  // ── Kartlar ──
  if (items.length === 0) {
    grid.innerHTML = `<p style="color:#a09b8c;padding:20px">Bu filtreyle eşleşen item bulunamadı.</p>`;
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "item-card";

    // Hangi stat sıralama yapılıyorsa onu öne çıkar
    const sortKey = currentState.sort;
    const stats = item.stats || {};

    // Sıralama statını öne al, geri kalanları alfabetik sırala
    const statEntries = Object.entries(stats).sort(([a], [b]) => {
      if (a === sortKey) return -1;
      if (b === sortKey) return 1;
      return 0;
    });

    const statsHtml = statEntries
      .map(([k, v]) => {
        const isActive = k === sortKey && !sortKey.includes("gold");
        return `<div class="stat-line${isActive ? " stat-highlight" : ""}">
          <span>${formatStatKey(k)}</span>
          <span class="stat-value">${formatStatValue(k, v)}</span>
        </div>`;
      })
      .join("");

    card.innerHTML = `
      <div class="card-header">
        <img src="${item.image_url}" alt="${item.name}"
             onerror="this.style.opacity='0.3'">
        <div class="header-info">
          <h3>${item.name}</h3>
          <div class="gold-text">💰 ${item.gold} Gold</div>
        </div>
      </div>
      <div class="card-details">
        <div class="stats-section">${statsHtml}</div>
      </div>
    `;

    grid.appendChild(card);
  });
}

init();
