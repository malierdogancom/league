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
  return key.startsWith("Percent") || key === "FlatCritChanceMod"
    ? `+${(v * 100).toFixed(0)}%`
    : `+${v}`;
}

let appData = { SR: null, ARAM: null };
let state = { map: "SR", category: "Normal", search: "", sort: "gold-desc" };

async function init() {
  try {
    const [srRes, aramRes] = await Promise.all([
      fetch("./data/sr_data.json?v=" + Date.now()),
      fetch("./data/aram_data.json?v=" + Date.now()),
    ]);
    appData.SR = await srRes.json();
    appData.ARAM = await aramRes.json();
    buildSortOptions();
    setupListeners();
    render();
  } catch (err) {
    console.error("Veri yüklenemedi:", err);
    document.getElementById("version-display").textContent =
      "Veri yüklenemedi!";
  }
}

function buildSortOptions() {
  const sel = document.getElementById("sort-select");
  sel.innerHTML = `
    <option value="gold-desc">Price: High to Low</option>
    <option value="gold-asc">Price: Low to High</option>
  `;
  Object.entries(STAT_MAP).forEach(([key, label]) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = label + ": High to Low";
    sel.appendChild(opt);
  });
}

function setupListeners() {
  document.getElementById("map-toggle").addEventListener("click", (e) => {
    if (e.target.tagName !== "BUTTON") return;
    document
      .querySelectorAll("#map-toggle button")
      .forEach((b) => b.classList.remove("active"));
    e.target.classList.add("active");
    state.map = e.target.dataset.value;
    render();
  });

  document.getElementById("category-toggle").addEventListener("click", (e) => {
    if (e.target.tagName !== "BUTTON") return;
    document
      .querySelectorAll("#category-toggle button")
      .forEach((b) => b.classList.remove("active"));
    e.target.classList.add("active");
    state.category = e.target.dataset.value;
    render();
  });

  document.getElementById("search-input").addEventListener("input", (e) => {
    state.search = e.target.value.toLowerCase().trim();
    render();
  });

  document.getElementById("sort-select").addEventListener("change", (e) => {
    state.sort = e.target.value;
    render();
  });
}

function render() {
  const grid = document.getElementById("items-grid");
  grid.innerHTML = "";

  const source = appData[state.map];
  if (!source || !Array.isArray(source.items)) {
    grid.innerHTML = `<p style="color:#e74c3c;padding:20px">"${state.map}" verisi bulunamadı.</p>`;
    return;
  }

  let items = [...source.items];

  items = items.filter((item) => {
    const tags = Array.isArray(item.tags) ? item.tags : [];
    const isOrnn = item.isOrnn === true;
    const isBoots = tags.includes("Boots");
    if (state.category === "Ornn") return isOrnn;
    if (state.category === "Boots") return isBoots && !isOrnn;
    return !isOrnn && !isBoots;
  });

  if (state.search) {
    items = items.filter((item) =>
      item.name.toLowerCase().includes(state.search),
    );
  }

  items.sort((a, b) => {
    if (state.sort === "gold-desc") return b.gold - a.gold;
    if (state.sort === "gold-asc") return a.gold - b.gold;
    return (b.stats?.[state.sort] ?? 0) - (a.stats?.[state.sort] ?? 0);
  });

  const version = source.version || "";
  document.getElementById("version-display").textContent =
    (version ? "Patch " + version + " · " : "") +
    items.length +
    " items · " +
    (state.map === "ARAM" ? "ARAM" : "Summoner's Rift");

  if (items.length === 0) {
    grid.innerHTML = `<p style="color:#a09b8c;padding:20px">Eşleşen item bulunamadı.</p>`;
    return;
  }

  items.forEach((item) => {
    const stats = item.stats || {};
    const entries = Object.entries(stats).sort(([a], [b]) => {
      if (a === state.sort) return -1;
      if (b === state.sort) return 1;
      return 0;
    });

    const statsHtml = entries
      .map(([k, v]) => {
        const hl = k === state.sort && !state.sort.includes("gold");
        return `<div class="stat-line${hl ? " stat-highlight" : ""}">
        <span>${statLabel(k)}</span>
        <span class="stat-value">${statValue(k, v)}</span>
      </div>`;
      })
      .join("");

    const card = document.createElement("div");
    card.className = "item-card";
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
      </div>
    `;
    grid.appendChild(card);
  });
}

init();
