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
  PercentTenacityMod: "Tenacity",
  PercentCritDamageMod: "Crit Damage",
};

const CDN = "https://raw.communitydragon.org/latest/game/assets/perks/statmods/";
const STAT_ICON_MAP = {
  FlatMagicDamageMod:        CDN + "statmodsabilitypowericon.png",
  FlatPhysicalDamageMod:     CDN + "statmodsattackdamageicon.png",
  FlatCritChanceMod:         CDN + "statmodsattackdamageicon.png",
  PercentAttackSpeedMod:     CDN + "statmodsattackspeedicon.png",
  FlatMagicPenetrationMod:   CDN + "statmodsabilitypowericon.png",
  PercentMagicPenetrationMod:CDN + "statmodsabilitypowericon.png",
  FlatPhysicalLethality:     CDN + "statmodsattackdamageicon.png",
  PercentArmorPenetrationMod:CDN + "statmodsattackdamageicon.png",
  FlatHPPoolMod:             CDN + "statmodshealthplusicon.png",
  FlatArmorMod:              CDN + "statmodsarmoricon.png",
  FlatSpellBlockMod:         CDN + "statmodsmagicresicon.png",
  FlatMPPoolMod:             CDN + "statmodscdrscalingicon.png",
  FlatAbilityHaste:          CDN + "statmodscdrscalingicon.png",
  PercentMovementSpeedMod:   CDN + "statmodsmovementspeedicon.png",
  FlatMovementSpeedMod:      CDN + "statmodsmovementspeedicon.png",
  PercentLifeStealMod:       CDN + "statmodsadaptiveforceicon.png",
  PercentOmnivampMod:        CDN + "statmodsadaptiveforceicon.png",
  PercentTenacityMod:        CDN + "statmodstenacityicon.png",
  PercentCritDamageMod:      CDN + "statmodsattackdamageicon.png",
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
    buildSortIcons();
    setupListeners();
    render();
  } catch (err) {
    console.error("Veri yüklenemedi:", err);
    document.getElementById("version-display").textContent =
      "Veri yüklenemedi!";
  }
}

function buildSortIcons() {
  const container = document.getElementById("sort-icons");

  const makeBtn = (value, iconHtml, label, isActive) => {
    const btn = document.createElement("button");
    btn.className = "sort-btn" + (isActive ? " active" : "");
    btn.dataset.value = value;
    btn.innerHTML = `${iconHtml}<span class="sort-btn-label">${label}</span>`;
    return btn;
  };

  container.appendChild(makeBtn("gold-desc", `<span class="sort-btn-gold">↓</span>`, "Price ↓", true));
  container.appendChild(makeBtn("gold-asc",  `<span class="sort-btn-gold">↑</span>`, "Price ↑", false));

  Object.entries(STAT_MAP).forEach(([key, label]) => {
    const iconUrl = STAT_ICON_MAP[key];
    const iconHtml = iconUrl
      ? `<img class="sort-btn-icon" src="${iconUrl}" alt="${label}">`
      : `<span class="sort-btn-icon">?</span>`;
    container.appendChild(makeBtn(key, iconHtml, label, false));
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

  document.getElementById("sort-icons").addEventListener("click", (e) => {
    const btn = e.target.closest(".sort-btn");
    if (!btn) return;
    document
      .querySelectorAll("#sort-icons .sort-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.sort = btn.dataset.value;
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
    const isBoots = tags.includes("Boots");
    if (state.category === "Boots") return isBoots;
    return !isBoots;
  });

  // Filter out items that don't have the selected stat
  if (!state.sort.startsWith("gold")) {
    items = items.filter((item) => item.stats?.[state.sort] != null);
  }

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
  const PREVIEW_COUNT = 4;

  items.forEach((item) => {
    const stats = item.stats || {};
    const entries = Object.entries(stats).sort(([a], [b]) => {
      if (a === state.sort) return -1;
      if (b === state.sort) return 1;
      return 0;
    });

    const toStatLine = ([k, v]) => {
      const hl = k === state.sort && !state.sort.includes("gold");
      const iconUrl = STAT_ICON_MAP[k];
      const iconHtml = iconUrl ? `<img class="stat-icon" src="${iconUrl}" alt="">` : "";
      return `<div class="stat-line${hl ? " stat-highlight" : ""}">
        <span class="stat-name">${iconHtml}${statLabel(k)}</span>
        <span class="stat-value">${statValue(k, v)}</span>
      </div>`;
    };

    const previewEntries = entries.slice(0, PREVIEW_COUNT);
    const extraEntries = entries.slice(PREVIEW_COUNT);

    const emptyLines = Array(Math.max(0, PREVIEW_COUNT - previewEntries.length))
      .fill(`<div class="stat-line stat-empty"></div>`)
      .join("");

    const previewHtml = previewEntries.map(toStatLine).join("") + emptyLines;
    const extraHtml = extraEntries.map(toStatLine).join("");
    const hasMore = extraEntries.length > 0 || !!item.description;

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
        <div class="stats-section">
          ${previewHtml}
          ${extraHtml ? `<div class="stats-extra">${extraHtml}</div>` : ""}
        </div>
        ${item.description ? `<div class="desc-text">${item.description}</div>` : ""}
      </div>
    `;

    if (hasMore) {
      card.addEventListener("click", () => card.classList.toggle("expanded"));
    }

    grid.appendChild(card);
  });
}

init();
