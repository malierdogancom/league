/**
 * LoL Item Explorer
 * HTML ile tam uyumlu — description yok, sadece statlar
 */

// Tüm stat key → okunabilir isim eşleştirmesi
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

function statLabel(key) {
  return STAT_MAP[key] || key;
}

function statValue(key, v) {
  const isPercent = key.startsWith("Percent") || key === "FlatCritChanceMod";
  return isPercent ? `+${(v * 100).toFixed(0)}%` : `+${v}`;
}

// ── Uygulama durumu ───────────────────────────────────
let appData = { SR: null, ARAM: null };
let state = {
  map: "SR",
  category: "Normal",
  search: "",
  sort: "gold-desc",
};

// ── Başlangıç ────────────────────────────────────────
async function init() {
  try {
    const [srRes, aramRes] = await Promise.all([
      fetch("./data/sr_data.json?v=" + Date.now()),
      fetch("./data/aram_data.json?v=" + Date.now()),
    ]);
    appData.SR = await srRes.json();
    appData.ARAM = await aramRes.json();

    // Sort dropdown'ı tüm stat'larla doldur
    buildSortOptions();
    setupListeners();
    render();
  } catch (err) {
    console.error("Veri yüklenemedi:", err);
    document.getElementById("version-display").textContent =
      "Veri yüklenemedi!";
  }
}

// Sort seçeneklerini dinamik oluştur (HTML'deki hardcoded olanları değiştir)
function buildSortOptions() {
  const sel = document.getElementById("sort-select");
  sel.innerHTML = `
    <option value="gold-desc">Price: High → Low</option>
    <option value="gold-asc">Price: Low → High</option>
  `;
  Object.entries(STAT_MAP).forEach(([key, label]) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = label + ": High → Low";
    sel.appendChild(opt);
  });
}

// ── Event Listener'lar ────────────────────────────────
function setupListeners() {
  // Map toggle — id="map-toggle"
  document.getElementById("map-toggle").addEventListener("click", (e) => {
    if (e.target.tagName !== "BUTTON") return;
    setActiveButton("map-toggle", e.target);
    state.map = e.target.dataset.value;
    render();
  });

  // Category toggle — id="category-toggle"
  document.getElementById("category-toggle").addEventListener("click", (e) => {
    if (e.target.tagName !== "BUTTON") return;
    setActiveButton("category-toggle", e.target);
    state.category = e.target.dataset.value;
    render();
  });

  // Arama — id="search-input"
  document.getElementById("search-input").addEventListener("input", (e) => {
    state.search = e.target.value.toLowerCase().trim();
    render();
  });

  // Sıralama — id="sort-select"
  document.getElementById("sort-select").addEventListener("change", (e) => {
    state.sort = e.target.value;
    render();
  });

  // Kart tıklama (expand/collapse) — id="items-grid"
  document.getElementById("items-grid").addEventListener("click", (e) => {
    const card = e.target.closest(".item-card");
    if (card) card.classList.toggle("expanded");
  });
}

function setActiveButton(groupId, clickedBtn) {
  document
    .querySelectorAll(`#${groupId} button`)
    .forEach((b) => b.classList.remove("active"));
  clickedBtn.classList.add("active");
}

// ── Render ────────────────────────────────────────────
function render() {
  const grid = document.getElementById("items-grid");
  grid.innerHTML = "";

  const source = appData[state.map];
  if (!source || !Array.isArray(source.items)) {
    grid.innerHTML = `<p style="color:#e74c3c;padding:20px">
      "${state.map}" verisi bulunamadı.
    </p>`;
    return;
  }

  let items = [...source.items];

  // 1. Kategori filtresi
  items = items.filter((item) => {
    const tags = Array.isArray(item.tags) ? item.tags : [];
    const isOrnn = item.isOrnn === true;
    const isBoots = tags.includes("Boots");

    if (state.category === "Ornn") return isOrnn;
    if (state.category === "Boots") return isBoots && !isOrnn;
    return !isOrnn && !isBoots; // Normal
  });

  // 2. Arama filtresi
  if (state.search) {
    items = items.filter((item) =>
      item.name.toLowerCase().includes(state.search),
    );
  }

  // 3. Sıralama
  items.sort((a, b) => {
    if (state.sort === "gold-desc") return b.gold - a.gold;
    if (state.sort === "gold-asc") return a.gold - b.gold;
    return (b.stats?.[state.sort] ?? 0) - (a.stats?.[state.sort] ?? 0);
  });

  // 4. Versiyon + sayı güncelle
  const version = source.version || "";
  document.getElementById("version-display").textContent =
    (version ? "Patch " + version + "  ·  " : "") +
    items.length +
    " items  ·  " +
    (state.map === "ARAM" ? "ARAM" : "Summoner's Rift");

  // 5. Sonuç yoksa mesaj
  if (items.length === 0) {
    grid.innerHTML = `<p style="color:#a09b8c;padding:20px">
      Eşleşen item bulunamadı.
    </p>`;
    return;
  }

  // 6. Kartları oluştur
  items.forEach((item) => {
    const stats = item.stats || {};

    // Sıralama statını en üste al
    const entries = Object.entries(stats).sort(([a], [b]) => {
      if (a === state.sort) return -1;
      if (b === state.sort) return 1;
      return 0;
    });

    const statsHtml = entries
      .map(([k, v]) => {
        const highlight = k === state.sort && !state.sort.includes("gold");
        return `
        <div class="stat-line${highlight ? " stat-highlight" : ""}">
          <span>${statLabel(k)}</span>
          <span class="stat-value">${statValue(k, v)}</span>
        </div>`;
      })
      .join("");

    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <div class="card-header">
        <img src="${item.image_url}" alt="${item.name}"
             onerror="this.style.opacity='0.3'">
        <div class="header-info">
          <h3>${item.name}</h3>
          <div class="gold-text">${item.gold} Gold</div>
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
