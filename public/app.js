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
    // Python'un oluşturduğu verileri çek (Yerel sunucudan veya Firebase'den okuyacak)
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
    console.error("Failed to load data. Did you run the Python script?", error);
    document.getElementById("items-grid").innerHTML =
      '<p style="color:red;">Error loading data. Make sure sr_data.json and aram_data.json exist in the data folder.</p>';
  }
}

function setupEventListeners() {
  // Map Toggle
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

  // Category Toggle
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

  // Search
  document.getElementById("search-input").addEventListener("input", (e) => {
    currentState.search = e.target.value.toLowerCase();
    render();
  });

  // Sort
  document.getElementById("sort-select").addEventListener("change", (e) => {
    currentState.sort = e.target.value;
    render();
  });
}

function render() {
  const grid = document.getElementById("items-grid");
  grid.innerHTML = "";

  // 1. Veri Kaynağını Seç
  let items = appData[currentState.map].items;

  // 2. Kategoriye Göre Filtrele
  items = items.filter((item) => {
    const isBoots = item.tags.includes("Boots");
    if (currentState.category === "Ornn") return item.isOrnn;
    if (currentState.category === "Boots") return isBoots;
    if (currentState.category === "Normal") return !item.isOrnn && !isBoots;
    return true;
  });

  // 3. Aramaya Göre Filtrele
  if (currentState.search) {
    items = items.filter((item) =>
      item.name.toLowerCase().includes(currentState.search),
    );
  }

  // 4. Sırala
  items.sort((a, b) => {
    if (currentState.sort === "gold-desc") return b.gold - a.gold;
    if (currentState.sort === "gold-asc") return a.gold - b.gold;

    // Stat bazlı sıralama (Örn: AP, AD)
    const statA = a.stats[currentState.sort] || 0;
    const statB = b.stats[currentState.sort] || 0;
    return statB - statA; // Default to Descending for stats
  });

  // 5. Ekrana Çiz
  items.forEach((item) => {
    // Eğer stat'a göre sıralıyorsak ve o itemde o stat yoksa, ekrana basma (Sıfır olanları gizle)
    if (currentState.sort !== "gold-desc" && currentState.sort !== "gold-asc") {
      if ((item.stats[currentState.sort] || 0) === 0) return;
    }

    const card = document.createElement("div");
    card.className = "item-card";

    // Statları güzel bir formatta listeleyelim
    let statsHtml = "";
    for (const [key, value] of Object.entries(item.stats)) {
      // Basit isim eşleştirmesi (Mapping) - Bunu ileride daha da geliştirebiliriz
      let statName = key
        .replace("Flat", "")
        .replace("Mod", "")
        .replace("Percent", "% ");
      statsHtml += `<div class="stat-line"><span>${statName}</span> <span class="stat-value">+${value}</span></div>`;
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
                ${statsHtml}
                <div class="desc-text">${item.description}</div>
            </div>
        `;

    // Kart açılma animasyonu (Tıklama Eventi)
    card.addEventListener("click", () => {
      card.classList.toggle("expanded");
    });

    grid.appendChild(card);
  });
}

// Uygulamayı Başlat
init();
