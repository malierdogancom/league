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

const CDN_STRAWBERRY = "https://raw.communitydragon.org/latest/game/assets/ux/strawberry/detailview/statsicons/";
const CDN_MINI = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/statsicon/";
const CDN_STATMODS = "https://raw.communitydragon.org/latest/game/assets/perks/statmods/";

const STAT_ICON_MAP = {
  FlatMagicDamageMod:         CDN_MINI       + "miniap.png",
  FlatPhysicalDamageMod:      CDN_STRAWBERRY + "attackdamage.png",
  FlatCritChanceMod:          CDN_STRAWBERRY + "criticalstrikechance.png",
  PercentAttackSpeedMod:      CDN_STATMODS   + "statmodsattackspeedicon.png",
  FlatMagicPenetrationMod:    CDN_MINI       + "scalempen.png",
  PercentMagicPenetrationMod: CDN_MINI       + "scalempen.png",
  FlatPhysicalLethality:      CDN_MINI       + "scaleapen.png",
  PercentArmorPenetrationMod: CDN_MINI       + "scaleapen.png",
  FlatHPPoolMod:              CDN_MINI       + "minihealth.png",
  FlatArmorMod:               CDN_STRAWBERRY + "armor.png",
  FlatSpellBlockMod:          CDN_MINI       + "minimr.png",
  FlatMPPoolMod:              CDN_MINI       + "scalemana.png",
  FlatAbilityHaste:           CDN_STRAWBERRY + "abilityhaste.png",
  PercentMovementSpeedMod:    CDN_STRAWBERRY + "movementspeed.png",
  FlatMovementSpeedMod:       CDN_STRAWBERRY + "movementspeed.png",
  PercentLifeStealMod:        CDN_MINI       + "scalels.png",
  PercentOmnivampMod:         CDN_MINI       + "scalels.png",
  PercentTenacityMod:         CDN_MINI       + "scaletenacity.png",
  PercentCritDamageMod:       CDN_MINI       + "scalecritmult.png",
};

const TAG_LABELS = {
  Damage: "Damage",
  SpellDamage: "Magic Dmg",
  CriticalStrike: "Crit",
  AttackSpeed: "Atk Speed",
  LifeSteal: "Life Steal",
  Health: "Health",
  Armor: "Armor",
  SpellBlock: "Magic Res",
  HealthRegen: "HP Regen",
  Mana: "Mana",
  ManaRegen: "Mana Regen",
  CooldownReduction: "Ability Haste",
  Jungle: "Jungle",
  Lane: "Lane",
  Tenacity: "Tenacity",
  NonbootsMovement: "Movement",
  Slow: "Slow",
  OnHit: "On-Hit",
  Active: "Active",
  Aura: "Aura",
  Vision: "Vision",
  Stealth: "Stealth",
};

// Gold value per raw unit (Percent stats stored 0–1, so 1% crit = 0.01 * 4000 = 40g)
const GOLD_VALUES = {
  FlatMagicDamageMod:    21.3,
  FlatPhysicalDamageMod: 35,
  FlatCritChanceMod:     4000,
  PercentAttackSpeedMod: 3330,
  FlatMagicPenetrationMod:  31.25,
  FlatPhysicalLethality:    31.25,
  FlatHPPoolMod:   2.67,
  FlatArmorMod:    20,
  FlatSpellBlockMod: 18,
  FlatMPPoolMod:   1.5,
  FlatAbilityHaste: 26.67,
  FlatMovementSpeedMod: 31.25,
  PercentLifeStealMod:  3750,
  PercentOmnivampMod:   3000,
};

function calcGoldEfficiency(item) {
  const rawValue = Object.entries(item.stats || {}).reduce(
    (sum, [k, v]) => sum + (GOLD_VALUES[k] || 0) * v,
    0
  );
  if (!item.gold || rawValue === 0) return null;
  return Math.round((rawValue / item.gold) * 100);
}

const EFF_TOOLTIP =
  "Base stat efficiency only — passives not counted.\n" +
  "Gold values used:\n" +
  "  AP 21.3g · AD 35g · Health 2.67g\n" +
  "  Armor 20g · Magic Res 18g · Mana 1.5g\n" +
  "  Ability Haste 26.67g · Move Speed 31.25g\n" +
  "  Lethality 31.25g · Magic Pen 31.25g\n" +
  "  Crit Chance 40g/1% · Atk Speed 33.3g/1%\n" +
  "  Life Steal 37.5g/1% · Omnivamp 30g/1%\n" +
  "Source: wiki.leagueoflegends.com/en-us/wiki/Gold_efficiency";

function effBadge(item) {
  const eff = calcGoldEfficiency(item);
  if (eff === null) return "";
  const cls = eff >= 85 ? "eff-high" : eff >= 60 ? "eff-mid" : "eff-low";
  return `<span class="efficiency ${cls}" title="${EFF_TOOLTIP}">${eff}%</span>`;
}

function statLabel(key) {
  return STAT_MAP[key] || key;
}

function statValue(key, v) {
  return key.startsWith("Percent") || key === "FlatCritChanceMod"
    ? `+${(v * 100).toFixed(0)}%`
    : `+${v}`;
}

let appData = { SR: null, ARAM: null };
let state = {
  map: "SR",
  category: "Normal",
  search: "",
  goldSort: "gold-desc",
  selectedStats: [],
  selectedTags: [],
  build: [],
  buildStatsOpen: false,
};

async function init() {
  try {
    const [srRes, aramRes] = await Promise.all([
      fetch("./data/sr_data.json?v=" + Date.now()),
      fetch("./data/aram_data.json?v=" + Date.now()),
    ]);
    appData.SR = await srRes.json();
    appData.ARAM = await aramRes.json();
    buildSortIcons();
    buildTagFilter();
    setupListeners();
    render();
  } catch (err) {
    console.error("Veri yüklenemedi:", err);
    document.getElementById("version-display").textContent = "Veri yüklenemedi!";
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

  container.appendChild(makeBtn("gold-desc",   `<span class="sort-btn-gold">↓</span>`, "Price ↓", true));
  container.appendChild(makeBtn("gold-asc",    `<span class="sort-btn-gold">↑</span>`, "Price ↑", false));
  container.appendChild(makeBtn("efficiency",  `<span class="sort-btn-gold">%</span>`,  "Efficiency", false));

  Object.entries(STAT_MAP).forEach(([key, label]) => {
    const iconUrl = STAT_ICON_MAP[key];
    const iconHtml = iconUrl
      ? `<img class="sort-btn-icon" src="${iconUrl}" alt="${label}">`
      : `<span class="sort-btn-icon">?</span>`;
    container.appendChild(makeBtn(key, iconHtml, label, false));
  });
}

function buildTagFilter() {
  const source = appData[state.map];
  if (!source) return;

  const tagSet = new Set();
  source.items.forEach((item) => (item.tags || []).forEach((t) => tagSet.add(t)));
  tagSet.delete("Boots");

  const container = document.getElementById("tag-filter");
  container.innerHTML = "";

  [...tagSet].sort().forEach((tag) => {
    const btn = document.createElement("button");
    btn.className = "tag-btn" + (state.selectedTags.includes(tag) ? " active" : "");
    btn.dataset.value = tag;
    btn.textContent = TAG_LABELS[tag] || tag;
    container.appendChild(btn);
  });
}

function setupListeners() {
  document.getElementById("map-toggle").addEventListener("click", (e) => {
    if (e.target.tagName !== "BUTTON") return;
    document.querySelectorAll("#map-toggle button").forEach((b) => b.classList.remove("active"));
    e.target.classList.add("active");
    state.map = e.target.dataset.value;
    state.selectedTags = [];
    buildTagFilter();
    render();
  });

  document.getElementById("category-toggle").addEventListener("click", (e) => {
    if (e.target.tagName !== "BUTTON") return;
    document.querySelectorAll("#category-toggle button").forEach((b) => b.classList.remove("active"));
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
    const val = btn.dataset.value;

    if (val === "gold-desc" || val === "gold-asc" || val === "efficiency") {
      document.querySelectorAll("#sort-icons .sort-btn[data-value='gold-desc'], #sort-icons .sort-btn[data-value='gold-asc'], #sort-icons .sort-btn[data-value='efficiency']")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.goldSort = val;
    } else {
      if (state.selectedStats.includes(val)) {
        state.selectedStats = state.selectedStats.filter((s) => s !== val);
        btn.classList.remove("active");
      } else {
        state.selectedStats.push(val);
        btn.classList.add("active");
      }
      document.getElementById("clear-stats").style.display =
        state.selectedStats.length > 0 ? "inline-block" : "none";
    }
    render();
  });

  document.getElementById("clear-stats").addEventListener("click", () => {
    state.selectedStats = [];
    document.querySelectorAll("#sort-icons .sort-btn").forEach((b) => {
      if (b.dataset.value !== "gold-desc" && b.dataset.value !== "gold-asc") {
        b.classList.remove("active");
      }
    });
    document.getElementById("clear-stats").style.display = "none";
    render();
  });

  document.getElementById("tag-filter").addEventListener("click", (e) => {
    const btn = e.target.closest(".tag-btn");
    if (!btn) return;
    const val = btn.dataset.value;
    if (state.selectedTags.includes(val)) {
      state.selectedTags = state.selectedTags.filter((t) => t !== val);
      btn.classList.remove("active");
    } else {
      state.selectedTags.push(val);
      btn.classList.add("active");
    }
    document.getElementById("clear-tags").style.display =
      state.selectedTags.length > 0 ? "inline-block" : "none";
    render();
  });

  document.getElementById("clear-tags").addEventListener("click", () => {
    state.selectedTags = [];
    document.querySelectorAll("#tag-filter .tag-btn").forEach((b) => b.classList.remove("active"));
    document.getElementById("clear-tags").style.display = "none";
    render();
  });

  document.getElementById("clear-build").addEventListener("click", () => {
    state.build = [];
    updateBuildPanel();
    render();
  });

  document.getElementById("build-toggle-stats").addEventListener("click", () => {
    state.buildStatsOpen = !state.buildStatsOpen;
    const panel = document.getElementById("build-stats-panel");
    const btn = document.getElementById("build-toggle-stats");
    panel.style.display = state.buildStatsOpen ? "flex" : "none";
    btn.textContent = state.buildStatsOpen ? "Stats ▲" : "Stats ▼";
  });
}

function updateBuildPanel() {
  const panel = document.getElementById("build-panel");
  const hasBuild = state.build.length > 0;
  panel.style.display = hasBuild ? "block" : "none";
  document.body.classList.toggle("has-build", hasBuild);

  if (!hasBuild) return;

  document.getElementById("build-count").textContent = state.build.length;

  // Slots
  const slotsEl = document.getElementById("build-slots");
  slotsEl.innerHTML = "";
  for (let i = 0; i < 6; i++) {
    const slot = document.createElement("div");
    slot.className = "build-slot";
    if (state.build[i]) {
      slot.innerHTML = `<img src="${state.build[i].image_url}" alt="${state.build[i].name}" title="${state.build[i].name}">`;
      const idx = i;
      slot.addEventListener("click", () => {
        state.build.splice(idx, 1);
        updateBuildPanel();
        render();
      });
      slot.classList.add("filled");
    }
    slotsEl.appendChild(slot);
  }

  // Total gold
  const totalGold = state.build.reduce((s, item) => s + (item.gold || 0), 0);
  document.getElementById("build-total-gold").textContent = totalGold.toLocaleString() + " Gold";

  // Combined stats
  const totals = {};
  state.build.forEach((item) => {
    Object.entries(item.stats || {}).forEach(([k, v]) => {
      totals[k] = (totals[k] || 0) + v;
    });
  });

  const statsEl = document.getElementById("build-stats-panel");
  statsEl.innerHTML = Object.entries(totals)
    .sort(([a], [b]) => (STAT_MAP[a] || a).localeCompare(STAT_MAP[b] || b))
    .map(([k, v]) => {
      const iconUrl = STAT_ICON_MAP[k];
      const icon = iconUrl ? `<img class="stat-icon" src="${iconUrl}" alt="">` : "";
      return `<div class="build-stat-row">${icon}<span>${statLabel(k)}</span><span class="stat-value">${statValue(k, v)}</span></div>`;
    })
    .join("");
  statsEl.style.display = state.buildStatsOpen ? "flex" : "none";
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

  // Category filter (boots vs normal)
  items = items.filter((item) => {
    const tags = Array.isArray(item.tags) ? item.tags : [];
    const isBoots = tags.includes("Boots");
    if (state.category === "Boots") return isBoots;
    return !isBoots;
  });

  // Tag filter (OR — item has at least one selected tag)
  if (state.selectedTags.length > 0) {
    items = items.filter((item) =>
      (item.tags || []).some((t) => state.selectedTags.includes(t))
    );
  }

  // Stat filter (AND — item must have all selected stats)
  if (state.selectedStats.length > 0) {
    items = items.filter((item) =>
      state.selectedStats.every((stat) => item.stats?.[stat] != null)
    );
  }

  if (state.search) {
    items = items.filter((item) =>
      item.name.toLowerCase().includes(state.search)
    );
  }

  // Sort
  if (state.selectedStats.length > 0) {
    const primary = state.selectedStats[0];
    items.sort((a, b) => (b.stats?.[primary] ?? 0) - (a.stats?.[primary] ?? 0));
  } else if (state.goldSort === "efficiency") {
    items.sort((a, b) => (calcGoldEfficiency(b) ?? -1) - (calcGoldEfficiency(a) ?? -1));
  } else {
    items.sort((a, b) =>
      state.goldSort === "gold-desc" ? b.gold - a.gold : a.gold - b.gold
    );
  }

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
    const primary = state.selectedStats[0];
    const entries = Object.entries(stats).sort(([a], [b]) => {
      if (a === primary) return -1;
      if (b === primary) return 1;
      return 0;
    });

    const toStatLine = ([k, v]) => {
      const hl = k === primary;
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

    const inBuild = state.build.some((b) => b.id === item.id);
    const buildFull = state.build.length >= 6;
    const addBtnClass = "add-btn" + (inBuild ? " in-build" : buildFull ? " disabled" : "");
    const addBtnText = inBuild ? "✓" : "+";

    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <div class="card-header">
        <img src="${item.image_url}" alt="${item.name}" onerror="this.style.opacity='0.3'">
        <div class="header-info">
          <h3>${item.name}</h3>
          <div class="gold-text">${item.gold} Gold ${effBadge(item)}</div>
        </div>
        <button class="${addBtnClass}" title="${inBuild ? "Remove from build" : "Add to build"}">${addBtnText}</button>
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

    card.querySelector(".add-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      const nowInBuild = state.build.some((b) => b.id === item.id);
      if (nowInBuild) {
        state.build = state.build.filter((b) => b.id !== item.id);
      } else if (state.build.length < 6) {
        state.build.push(item);
      }
      updateBuildPanel();
      render();
    });

    grid.appendChild(card);
  });

  updateBuildPanel();
}

init();
