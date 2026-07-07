const state = {
  trip: null,
  currentDayId: null
};

const selectors = {
  nav: document.getElementById("day-nav"),
  privacy: document.getElementById("privacy-note"),
  summary: document.getElementById("summary-grid"),
  hero: document.getElementById("day-hero"),
  timeline: document.getElementById("timeline"),
  checks: document.getElementById("check-list"),
  transport: document.getElementById("transport-stack"),
  hotels: document.getElementById("hotel-stack"),
  print: document.getElementById("print-button"),
  copy: document.getElementById("copy-button")
};

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function dayFromHash(days) {
  const id = window.location.hash.replace("#", "");
  return days.find((day) => day.id === id)?.id ?? days[0].id;
}

function renderNav() {
  const { days } = state.trip;
  selectors.nav.innerHTML = days
    .map(
      (day) => `
        <button class="day-tab" type="button" data-day="${day.id}" aria-selected="${day.id === state.currentDayId}">
          <span class="day-date">${escapeHtml(day.date)}<br />${escapeHtml(day.weekday)}</span>
          <span>
            <span class="day-title">${escapeHtml(day.title)}</span>
            <span class="day-anchor">${escapeHtml(day.anchor)}</span>
          </span>
        </button>
      `
    )
    .join("");
}

function renderStaticPanels() {
  const { privacy, summary, transport, hotels } = state.trip;
  selectors.privacy.innerHTML = `<strong>${escapeHtml(privacy.label)}:</strong> ${escapeHtml(privacy.note)}`;
  selectors.summary.innerHTML = summary
    .map(
      (item) => `
        <article class="summary-card">
          <p class="summary-label">${escapeHtml(item.label)}</p>
          <p class="summary-value">${escapeHtml(item.value)}</p>
        </article>
      `
    )
    .join("");

  selectors.transport.innerHTML = Object.values(transport)
    .map(
      (block) => `
        <article class="mini-card">
          <h4>${escapeHtml(block.title)}</h4>
          <ul>
            ${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </article>
      `
    )
    .join("");

  selectors.hotels.innerHTML = hotels
    .map(
      (hotel) => `
        <article class="mini-card">
          <p class="hotel-meta">${escapeHtml(hotel.label)} / ${escapeHtml(hotel.area)}</p>
          <p class="hotel-status">${escapeHtml(hotel.status)}</p>
        </article>
      `
    )
    .join("");
}

function renderDay() {
  const day = state.trip.days.find((item) => item.id === state.currentDayId);
  if (!day) return;

  document.title = `${day.date} ${day.title} | 新婚旅行のしおり_v01`;
  renderNav();

  selectors.hero.innerHTML = `
    <div class="day-copy">
      <div>
        <span class="date-chip">${escapeHtml(day.date)}(${escapeHtml(day.weekday)})</span>
        <h2>${escapeHtml(day.title)}</h2>
        <p class="route-text">${escapeHtml(day.route)}</p>
      </div>
      <div class="focus-box">
        <p>${escapeHtml(day.weatherFocus)}</p>
      </div>
    </div>
    <figure class="map-frame">
      <img src="${escapeHtml(day.map)}" alt="${escapeHtml(day.date)}の行程地図" />
      <figcaption class="map-label">v34地図素材</figcaption>
    </figure>
  `;

  selectors.timeline.innerHTML = day.timePlan
    .map(
      (item) => `
        <li>
          <span class="time-label">${escapeHtml(item.time)}</span>
          <p>${escapeHtml(item.body)}</p>
        </li>
      `
    )
    .join("");

  selectors.checks.innerHTML = day.checks
    .map(
      (item) => `
        <li>
          <span class="check-mark" aria-hidden="true">✓</span>
          <p>${escapeHtml(item)}</p>
        </li>
      `
    )
    .join("");
}

function setDay(dayId, pushHash = true) {
  state.currentDayId = dayId;
  if (pushHash) {
    history.replaceState(null, "", `#${dayId}`);
  }
  renderDay();
}

async function copyCurrentDay() {
  const day = state.trip.days.find((item) => item.id === state.currentDayId);
  if (!day) return;
  const text = [
    `${day.date}(${day.weekday}) ${day.title}`,
    day.route,
    `重点: ${day.weatherFocus}`,
    "確認:",
    ...day.checks.map((item) => `- ${item}`)
  ].join("\n");
  await navigator.clipboard.writeText(text);
}

async function init() {
  state.trip = window.TRIP_DATA;
  state.currentDayId = dayFromHash(state.trip.days);
  renderStaticPanels();
  renderDay();

  selectors.nav.addEventListener("click", (event) => {
    const button = event.target.closest("[data-day]");
    if (!button) return;
    setDay(button.dataset.day);
  });
  selectors.print.addEventListener("click", () => window.print());
  selectors.copy.addEventListener("click", () => {
    copyCurrentDay().catch(() => {});
  });
  window.addEventListener("hashchange", () => setDay(dayFromHash(state.trip.days), false));
}

init().catch((error) => {
  document.body.innerHTML = `<main class="panel" style="margin: 24px">${escapeHtml(error.message)}</main>`;
});
