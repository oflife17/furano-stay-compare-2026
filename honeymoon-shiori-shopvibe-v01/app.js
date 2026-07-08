const state = {
  trip: window.TRIP_DATA,
  currentDayId: null
};

const selectors = {
  nav: document.getElementById("day-nav"),
  hero: document.getElementById("hero-stage"),
  timeline: document.getElementById("timeline"),
  checks: document.getElementById("check-list"),
  transport: document.getElementById("transport-stack"),
  hotels: document.getElementById("hotel-stack"),
  currentHotel: document.getElementById("current-hotel"),
  print: document.getElementById("print-button"),
  copy: document.getElementById("copy-button"),
  screenTitle: document.getElementById("screen-title"),
  screenSubtitle: document.getElementById("screen-subtitle"),
  summaryGrid: document.getElementById("summary-grid"),
  heroChips: document.getElementById("hero-chips"),
  heroSnapshot: document.getElementById("hero-snapshot")
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function hotelLinkMarkup(hotel, className = "hotel-link") {
  const name = escapeHtml(hotel?.name ?? "");
  if (!hotel?.url) return name;
  return `<a class="${className}" href="${escapeHtml(hotel.url)}" target="_blank" rel="noreferrer">${name}</a>`;
}

function dayFromHash(days) {
  const id = window.location.hash.replace("#", "");
  return days.find((day) => day.id === id)?.id ?? days[0].id;
}

function googleEmbedUrl(map) {
  const stops = [...(map.waypoints || []), map.destination];
  const destination = stops
    .map((stop, index) => encodeURIComponent(index === 0 ? stop : `to:${stop}`))
    .join("%20");
  return `https://maps.google.com/maps?f=d&source=s_d&saddr=${encodeURIComponent(map.origin)}&daddr=${destination}&hl=ja&output=embed`;
}

function renderSummary() {
  selectors.summaryGrid.innerHTML = state.trip.summary
    .map(
      (item) => `
        <div class="summary-item">
          <dt>${escapeHtml(item.label)}</dt>
          <dd>${escapeHtml(item.value)}</dd>
        </div>
      `
    )
    .join("");
}

function renderNav() {
  const { days } = state.trip;
  selectors.nav.innerHTML = days
    .map((day, index) => {
      const isActive = day.id === state.currentDayId;
      const hotel = state.trip.hotels.find((item) => item.id === day.hotelId);
      return `
        <button class="day-card ${isActive ? "is-active" : ""}" type="button" data-day="${escapeHtml(day.id)}" aria-selected="${isActive}">
          <div class="day-card-top">
            <span class="day-badge">DAY ${index + 1}</span>
            <span class="hotel-meta">${escapeHtml(day.date)} (${escapeHtml(day.weekday)})</span>
          </div>
          <strong>${escapeHtml(day.title)}</strong>
          <span class="day-anchor">${escapeHtml(day.anchor)}</span>
          <div class="day-card-meta">
            <span class="hotel-meta">${day.places.length} spots</span>
            <span class="hotel-meta">${escapeHtml(hotel?.area ?? "")}</span>
          </div>
        </button>
      `;
    })
    .join("");
}

function renderTransport(blocks) {
  selectors.transport.innerHTML = Object.values(blocks)
    .map(
      (block) => `
        <article class="transport-card">
          <p class="hotel-meta">${escapeHtml(block.title)}</p>
          <h4>${escapeHtml(block.items[0] ?? block.title)}</h4>
          <ul>
            ${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </article>
      `
    )
    .join("");
}

function renderHotels(hotels) {
  const currentHotelId = state.trip.days.find((day) => day.id === state.currentDayId)?.hotelId;
  selectors.hotels.innerHTML = hotels
    .map(
      (hotel) => `
        <article class="hotel-card ${hotel.id === currentHotelId ? "is-active" : ""}">
          <p class="hotel-meta">${escapeHtml(hotel.label)} / ${escapeHtml(hotel.area)}</p>
          <h4>${hotelLinkMarkup(hotel)}</h4>
          <dl class="hotel-details">
            <div><dt>IN</dt><dd>${escapeHtml(hotel.checkin)}</dd></div>
            <div><dt>OUT</dt><dd>${escapeHtml(hotel.checkout)}</dd></div>
            <div><dt>食事</dt><dd>${escapeHtml(hotel.meal)}</dd></div>
            <div><dt>支払</dt><dd>${escapeHtml(hotel.payment)}</dd></div>
          </dl>
        </article>
      `
    )
    .join("");
}

function renderCurrentHotel(day) {
  const hotel = state.trip.hotels.find((item) => item.id === day.hotelId);
  if (!hotel) {
    selectors.currentHotel.innerHTML = "";
    return;
  }

  selectors.currentHotel.innerHTML = `
    <div class="section-head">
      <div>
        <p class="section-label">Tonight's Stay</p>
        <h3>${hotelLinkMarkup(hotel, "hotel-link hotel-link--strong")}</h3>
      </div>
      <span class="status-chip">CHECK IN</span>
    </div>
    <p class="stay-meta">${escapeHtml(hotel.area)} / ${escapeHtml(hotel.checkin)}</p>
    <ul class="stay-list">
      ${hotel.notes.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>
  `;
}

function renderHeroTray(day, hotel) {
  const firstTime = day.timePlan[0]?.time ?? "-";
  const lastTime = day.timePlan.at(-1)?.time ?? "-";

  selectors.screenTitle.textContent = day.title;
  selectors.screenSubtitle.textContent = `${day.date} (${day.weekday}) / updated ${state.trip.meta.updatedAt}`;
  selectors.heroChips.innerHTML = day.places
    .slice(0, 4)
    .map(
      (place, index) => `
        <span class="spot-chip ${index === 0 ? "is-accent" : ""}">
          ${escapeHtml(place.time)} ${escapeHtml(place.name)}
        </span>
      `
    )
    .join("");
  selectors.heroSnapshot.innerHTML = [
    { label: "Time Window", value: `${firstTime} - ${lastTime}` },
    { label: "Stay", value: hotel?.name ?? "-" },
    { label: "Focus", value: day.anchor }
  ]
    .map(
      (item) => `
        <article class="snapshot-card">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
        </article>
      `
    )
    .join("");
}

function renderDay() {
  const day = state.trip.days.find((item) => item.id === state.currentDayId);
  if (!day) return;

  const hotel = state.trip.hotels.find((item) => item.id === day.hotelId);
  const embedUrl = googleEmbedUrl(day.map);
  const stats = [
    { label: "Route", value: day.anchor },
    { label: "Stops", value: `${day.places.length} spots` },
    { label: "Stay", value: hotel ? hotel.area : "-" },
    { label: "Arrival", value: day.timePlan.at(-1)?.time ?? "-" }
  ];
  const quickPicks = [
    day.timePlan[0],
    day.timePlan[Math.floor(day.timePlan.length / 2)],
    day.timePlan.at(-1)
  ].filter(Boolean);

  document.title = `${day.date} ${day.title} | ${state.trip.meta.title} | ShopVibe`;
  renderNav();
  renderCurrentHotel(day);
  renderHeroTray(day, hotel);

  selectors.hero.innerHTML = `
    <div class="spotlight-copy">
      <div class="spotlight-head">
        <span class="collection-badge">Featured Day</span>
        <span class="route-badge">${escapeHtml(day.date)} (${escapeHtml(day.weekday)})</span>
      </div>
      <div class="spotlight-lead">
        <h2>${escapeHtml(day.title)}</h2>
        <p class="spotlight-route">${escapeHtml(day.route)}</p>
      </div>
      <div class="chip-row">
        ${day.places.map((item, index) => `<span class="spot-chip ${index === 0 ? "is-accent" : ""}">${escapeHtml(item.name)}</span>`).join("")}
      </div>
      <p class="spotlight-note">${escapeHtml(day.weatherFocus)}</p>
      <div class="stat-grid">
        ${stats
          .map(
            (item) => `
              <article class="stat-card">
                <span>${escapeHtml(item.label)}</span>
                <strong>${escapeHtml(item.value)}</strong>
              </article>
            `
          )
          .join("")}
      </div>
      <div class="quick-grid">
        ${quickPicks
          .map(
            (item) => `
              <article class="quick-card">
                <time>${escapeHtml(item.time)}</time>
                <p class="subtle-copy">${escapeHtml(item.body)}</p>
              </article>
            `
          )
          .join("")}
      </div>
    </div>
    <div class="spotlight-map">
      <div class="section-head">
        <div>
          <p class="section-label">Live Map</p>
          <h3>${escapeHtml(day.anchor)}</h3>
        </div>
        <span class="status-chip">Route</span>
      </div>
      <div class="map-frame ${day.map?.size === "tall" ? "map-frame--tall" : ""}">
        <iframe
          title="${escapeHtml(day.date)} ${escapeHtml(day.title)}のGoogle Mapsルート"
          data-map-src="${escapeHtml(embedUrl)}"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          allowfullscreen
        ></iframe>
      </div>
    </div>
  `;

  const iframe = selectors.hero.querySelector("[data-map-src]");
  if (iframe) {
    requestAnimationFrame(() => {
      iframe.src = iframe.dataset.mapSrc;
    });
  }

  selectors.timeline.innerHTML = day.timePlan
    .map(
      (item) => `
        <li class="timeline-item">
          <span class="time-label">${escapeHtml(item.time)}</span>
          <p class="timeline-copy">${escapeHtml(item.body)}</p>
        </li>
      `
    )
    .join("");

  selectors.checks.innerHTML = day.checks
    .map(
      (item) => `
        <li class="check-item">
          <span class="check-dot" aria-hidden="true"></span>
          <p class="check-copy">${escapeHtml(item)}</p>
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
    "行程:",
    ...day.timePlan.map((item) => `- ${item.time} ${item.body}`),
    "確認:",
    ...day.checks.map((item) => `- ${item}`)
  ].join("\n");
  await navigator.clipboard.writeText(text);
}

function renderStaticPanels() {
  renderSummary();
  renderTransport(state.trip.transport);
  renderHotels(state.trip.hotels);
}

function init() {
  if (!state.trip) {
    document.body.innerHTML = '<main class="surface-card" style="margin: 24px">旅行データを読み込めませんでした。</main>';
    return;
  }

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

init();
