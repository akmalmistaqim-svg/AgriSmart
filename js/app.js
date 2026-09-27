/* ==========================================================
   AgriSmart — Main Application JavaScript
   ========================================================== */

// ===== DOM References =====
const themeToggle = document.getElementById("themeToggle");
const iconSun = document.getElementById("iconSun");
const iconMoon = document.getElementById("iconMoon");
const html = document.documentElement;
const hamburger = document.getElementById("hamburger");
const mobileNav = document.getElementById("mobileNav");

// ===========================
//  DARK / LIGHT MODE
// ===========================
function initTheme() {
  const savedTheme = localStorage.getItem("agrismart-theme");
  if (savedTheme === "dark") {
    html.setAttribute("data-theme", "dark");
    iconSun.style.display = "none";
    iconMoon.style.display = "block";
  }
}

function toggleTheme() {
  const isDark = html.getAttribute("data-theme") === "dark";
  if (isDark) {
    html.removeAttribute("data-theme");
    iconSun.style.display = "block";
    iconMoon.style.display = "none";
    localStorage.setItem("agrismart-theme", "light");
  } else {
    html.setAttribute("data-theme", "dark");
    iconSun.style.display = "none";
    iconMoon.style.display = "block";
    localStorage.setItem("agrismart-theme", "dark");
  }
  // Redraw chart for new theme colors
  setTimeout(drawMoistureChart, 50);
}

themeToggle.addEventListener("click", toggleTheme);
initTheme();

// ===========================
//  MOBILE NAV
// ===========================
hamburger.addEventListener("click", () => {
  mobileNav.classList.toggle("show");
});

function closeMobileNav() {
  mobileNav.classList.remove("show");
}

// ===========================
//  SMOOTH SCROLL
// ===========================
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ===========================
//  ACTIVE NAV HIGHLIGHT
// ===========================
const navLinks = document.querySelectorAll(".navbar-nav a, .mobile-nav a");
const sections = document.querySelectorAll("section[id], .card[id]");

window.addEventListener("scroll", () => {
  let current = "";
  sections.forEach((s) => {
    if (window.scrollY >= s.offsetTop - 120) {
      current = s.getAttribute("id");
    }
  });
  navLinks.forEach((link) => {
    link.classList.remove("active");
    if (link.getAttribute("href") === "#" + current) {
      link.classList.add("active");
    }
  });
});

// ===========================
//  ROBOT CONTROL LOGIC
// ===========================
let currentMode = "auto";

function setMode(mode) {
  currentMode = mode;
  document
    .getElementById("modeAuto")
    .classList.toggle("active", mode === "auto");
  document
    .getElementById("modeManual")
    .classList.toggle("active", mode === "manual");
}

function controlAction(action) {
  const statusText = document.getElementById("statusText");
  const statusDot = document.getElementById("statusDot");
  switch (action) {
    case "start":
      statusText.textContent = "Sedang Berjalan";
      statusDot.className = "status-dot active";
      break;
    case "pause":
      statusText.textContent = "Dijeda";
      statusDot.className = "status-dot idle";
      break;
    case "return":
      statusText.textContent = "Kembali ke Pangkalan";
      statusDot.className = "status-dot active";
      break;
  }
}

// ===========================
//  GARDEN GRID
// ===========================
function buildGardenGrid() {
  const grid = document.getElementById("gardenGrid");
  grid.innerHTML = "";

  // 5 rows × 8 cols
  // 2 = robot position, 1 = watered, 0 = not watered
  const map = [
    [1, 1, 1, 1, 1, 1, 1, 1], // Jalur 1 — all watered
    [1, 1, 1, 1, 1, 1, 1, 1], // Jalur 2 — all watered
    [1, 1, 1, 1, 2, 0, 0, 0], // Jalur 3 — partial + robot
    [0, 0, 0, 0, 0, 0, 0, 0], // Jalur 4 — not watered
    [0, 0, 0, 0, 0, 0, 0, 0], // Jalur 5 — not watered
  ];

  for (let r = 0; r < map.length; r++) {
    for (let c = 0; c < map[r].length; c++) {
      const cell = document.createElement("div");
      cell.className = "garden-cell";
      const val = map[r][c];
      if (val === 2) {
        cell.classList.add("robot-here");
        cell.innerHTML = "🤖";
      } else if (val === 1) {
        cell.classList.add("watered");
        cell.innerHTML = "🍈";
      } else {
        cell.classList.add("not-watered");
        cell.innerHTML = "🌱";
      }
      grid.appendChild(cell);
    }
  }
}

buildGardenGrid();

// ===========================
//  MOISTURE CHART (Canvas)
// ===========================
function drawMoistureChart() {
  const canvas = document.getElementById("moistureChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const rect = canvas.parentElement.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = rect.width + "px";
  canvas.style.height = rect.height + "px";
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const padding = { top: 10, right: 10, bottom: 28, left: 36 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  // Dummy 24-hour data
  const data = [
    45, 48, 52, 55, 60, 58, 62, 65, 63, 67, 70, 68, 72, 69, 65, 63, 60, 58,
    62, 65, 67, 70, 68, 67,
  ];
  const labels = Array.from(
    { length: 24 },
    (_, i) => String(i).padStart(2, "0") + ":00"
  );
  const minV = 30;
  const maxV = 100;

  // Theme-aware colors
  const isDark = html.getAttribute("data-theme") === "dark";
  const textColor = isDark ? "#64748b" : "#9ca3af";
  const gridColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const lineColor = "#22c55e";
  const fillTop = isDark ? "rgba(34,197,94,0.08)" : "rgba(34,197,94,0.12)";

  ctx.clearRect(0, 0, w, h);

  // Horizontal grid lines
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();
  }

  // Y-axis labels
  ctx.fillStyle = textColor;
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const val = maxV - ((maxV - minV) / 4) * i;
    const y = padding.top + (chartH / 4) * i;
    ctx.fillText(Math.round(val) + "%", padding.left - 6, y + 3);
  }

  // X-axis labels
  ctx.textAlign = "center";
  const step = Math.ceil(data.length / 6);
  for (let i = 0; i < data.length; i += step) {
    const x = padding.left + (chartW / (data.length - 1)) * i;
    ctx.fillText(labels[i], x, h - 4);
  }

  // Calculate plot points
  const points = data.map((v, i) => ({
    x: padding.left + (chartW / (data.length - 1)) * i,
    y: padding.top + chartH - ((v - minV) / (maxV - minV)) * chartH,
  }));

  // Fill gradient area
  ctx.beginPath();
  ctx.moveTo(points[0].x, padding.top + chartH);
  points.forEach((p) => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
  ctx.closePath();
  const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
  gradient.addColorStop(0, fillTop);
  gradient.addColorStop(1, "transparent");
  ctx.fillStyle = gradient;
  ctx.fill();

  // Draw line
  ctx.beginPath();
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();

  // Current value dot (last point)
  const last = points[points.length - 1];
  ctx.beginPath();
  ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = lineColor;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(last.x, last.y, 6, 0, Math.PI * 2);
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.3;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

window.addEventListener("load", drawMoistureChart);
window.addEventListener("resize", drawMoistureChart);

// ===========================
//  PARTNER TABLE
// ===========================
let partners = [
  {
    name: "Pak Hendra Wijaya",
    location: "GH-01 Subang, Jawa Barat",
    robots: 2,
    status: "Aktif",
  },
  {
    name: "Ibu Siti Rahayu",
    location: "GH-03 Karawang, Jawa Barat",
    robots: 1,
    status: "Aktif",
  },
  {
    name: "CV Melon Sejahtera",
    location: "GH-07 Indramayu, Jawa Barat",
    robots: 3,
    status: "Aktif",
  },
  {
    name: "Koperasi Tani Makmur",
    location: "GH-02 Cirebon, Jawa Barat",
    robots: 2,
    status: "Nonaktif",
  },
  {
    name: "Pak Ahmad Fauzi",
    location: "GH-12 Brebes, Jawa Tengah",
    robots: 1,
    status: "Aktif",
  },
];

function renderPartners() {
  const tbody = document.getElementById("partnerBody");
  tbody.innerHTML = "";
  partners.forEach((p, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td style="font-weight:600;">${p.name}</td>
      <td>${p.location}</td>
      <td style="text-align:center; font-weight:600;">${p.robots}</td>
      <td><span class="status-badge ${p.status === "Aktif" ? "active" : "inactive"}">${p.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

renderPartners();

// ===========================
//  MODAL (Add Partner)
// ===========================
function openModal() {
  document.getElementById("modalOverlay").classList.add("show");
}

function closeModal(e) {
  if (!e || e.target === document.getElementById("modalOverlay")) {
    document.getElementById("modalOverlay").classList.remove("show");
    document.getElementById("inputName").value = "";
    document.getElementById("inputLocation").value = "";
    document.getElementById("inputRobots").value = "1";
    document.getElementById("inputStatus").value = "Aktif";
  }
}

function addPartner() {
  const name = document.getElementById("inputName").value.trim();
  const location = document.getElementById("inputLocation").value.trim();
  const robots = parseInt(document.getElementById("inputRobots").value) || 1;
  const status = document.getElementById("inputStatus").value;

  if (!name || !location) {
    alert("Mohon isi nama mitra dan lokasi.");
    return;
  }

  partners.push({ name, location, robots, status });
  renderPartners();
  closeModal();
}

// ===========================
//  SCROLL ANIMATIONS
// ===========================
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
);

document.querySelectorAll(".fade-up").forEach((el) => observer.observe(el));

// ===========================
//  LIVE SIMULATION
// ===========================
setInterval(() => {
  // Tank: slowly decrease
  const tankEl = document.getElementById("tankPercent");
  const barEl = document.getElementById("tankBar");
  const litersEl = document.getElementById("tankLiters");
  let tankCurrent = parseInt(tankEl.textContent);
  const decrease = Math.random() > 0.6 ? 1 : 0;
  tankCurrent = Math.max(10, tankCurrent - decrease);
  tankEl.innerHTML = tankCurrent + '<span>%</span>';
  barEl.style.width = tankCurrent + "%";
  const liters = Math.round(tankCurrent * 0.6);
  litersEl.textContent = liters + " / 60 Liter";

  // Moisture: slight variation
  const moistureEl = document.getElementById("moisturePercent");
  let mCurrent = parseInt(moistureEl.textContent);
  const change = Math.random() > 0.5 ? 1 : -1;
  mCurrent = Math.min(90, Math.max(40, mCurrent + change));
  moistureEl.innerHTML = mCurrent + '<span>%</span>';

  // Update moisture badge
  const badge = document.getElementById("moistureBadge");
  if (mCurrent < 40) {
    badge.textContent = "Kering";
    badge.className = "moisture-badge";
    badge.style.background = "#fee2e2";
    badge.style.color = "#dc2626";
  } else if (mCurrent > 80) {
    badge.textContent = "Terlalu Basah";
    badge.className = "moisture-badge";
    badge.style.background = "#dbeafe";
    badge.style.color = "#1d4ed8";
  } else {
    badge.innerHTML =
      '<svg width="12" height="12" fill="currentColor"><circle cx="6" cy="6" r="4"/></svg> Lembap Optimal';
    badge.className = "moisture-badge optimal";
    badge.style.background = "";
    badge.style.color = "";
  }
}, 5000);
