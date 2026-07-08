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
  screenSubtitle: document.getElementById("screen-subtitle")
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

function renderNav() {
  const { days } = state.trip;
  selectors.nav.innerHTML = days
    .map((day, index) => {
      const isActive = day.id === state.currentDayId;
      return `
        <button class="day-tab" type="button" data-day="${escapeHtml(day.id)}" aria-selected="${isActive}">
          <span class="day-tab-top">
            <span class="day-index">${index + 1}</span>
            <span class="day-status">${isActive ? "LIVE" : "NEXT"}</span>
          </span>
          <span class="day-date">${escapeHtml(day.date)} (${escapeHtml(day.weekday)})</span>
          <strong class="day-title">${escapeHtml(day.title)}</strong>
          <span class="day-anchor">${escapeHtml(day.anchor)}</span>
        </button>
      `;
    })
    .join("");
}

function renderTransport(blocks) {
  selectors.transport.innerHTML = Object.values(blocks)
    .map(
      (block) => `
        <article class="info-row">
          <h4>${escapeHtml(block.title)}</h4>
          <ul>
            ${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </article>
      `
    )
    .join("");
}

function renderHotels(hotels) {
  selectors.hotels.innerHTML = hotels
    .map((hotel) => {
      const isActive = hotel.id === state.trip.days.find((day) => day.id === state.currentDayId)?.hotelId;
      return `
        <article class="info-row hotel-row ${isActive ? "is-active" : ""}">
          <p class="hotel-meta">${escapeHtml(hotel.label)} / ${escapeHtml(hotel.area)}</p>
          <h4>${hotelLinkMarkup(hotel)}</h4>
          <dl class="hotel-details">
            <div><dt>IN</dt><dd>${escapeHtml(hotel.checkin)}</dd></div>
            <div><dt>OUT</dt><dd>${escapeHtml(hotel.checkout)}</dd></div>
            <div><dt>食事</dt><dd>${escapeHtml(hotel.meal)}</dd></div>
            <div><dt>支払</dt><dd>${escapeHtml(hotel.payment)}</dd></div>
          </dl>
        </article>
      `;
    })
    .join("");
}

function renderCurrentHotel(day) {
  const hotel = state.trip.hotels.find((item) => item.id === day.hotelId);
  if (!hotel) {
    selectors.currentHotel.innerHTML = "";
    return;
  }

  selectors.currentHotel.innerHTML = `
    <article class="current-hotel-card">
      <p class="eyebrow eyebrow--tight">Stay Focus</p>
      <h4>${hotelLinkMarkup(hotel, "hotel-link hotel-link--bright")}</h4>
      <p class="current-hotel-meta">${escapeHtml(hotel.area)} / ${escapeHtml(hotel.checkin)}</p>
      <ul>
        ${hotel.notes.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </article>
  `;
}

function renderStaticPanels() {
  const { meta, transport, hotels } = state.trip;
  const [headline, subline = ""] = meta.subtitle.split(" / ");
  selectors.screenTitle.textContent = headline;
  selectors.screenSubtitle.textContent = `${subline} / update ${meta.updatedAt}`;
  renderTransport(transport);
  renderHotels(hotels);
}

function renderDay() {
  const day = state.trip.days.find((item) => item.id === state.currentDayId);
  if (!day) return;

  const hotel = state.trip.hotels.find((item) => item.id === day.hotelId);
  const embedUrl = googleEmbedUrl(day.map);
  const stageStats = [
    { label: "Route", value: day.anchor },
    { label: "Stops", value: `${day.places.length} spots` },
    { label: "Stay", value: hotel ? hotel.area : "-" },
    { label: "Schedule", value: `${day.timePlan[0]?.time} - ${day.timePlan.at(-1)?.time}` }
  ];

  document.title = `${day.date} ${day.title} | ${state.trip.meta.title} | Purple Stream`;
  renderNav();
  renderCurrentHotel(day);

  selectors.hero.innerHTML = `
    <div class="stage-copy">
      <div class="stage-copy-head">
        <span class="live-pill">LIVE DAY ${escapeHtml(day.id.replace("day", ""))}</span>
        <span class="date-pill">${escapeHtml(day.date)} (${escapeHtml(day.weekday)})</span>
      </div>
      <h2>${escapeHtml(day.title)}</h2>
      <p class="route-text">${escapeHtml(day.route)}</p>
      <div class="spot-strip">
        ${day.places.map((item) => `<span class="spot-chip">${escapeHtml(item.name)}</span>`).join("")}
      </div>
      <div class="focus-card">
        <p>${escapeHtml(day.weatherFocus)}</p>
        ${hotel ? `<p class="arrival-note">宿: ${hotelLinkMarkup(hotel, "hotel-link hotel-link--bright")} / ${escapeHtml(hotel.checkin)}</p>` : ""}
      </div>
      <div class="stat-grid">
        ${stageStats
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
    </div>
    <div class="map-stage ${day.map?.size === "tall" ? "map-stage--tall" : ""}">
      <div class="map-stage-head">
        <div>
          <p class="section-label">Route View</p>
          <h3>${escapeHtml(day.anchor)}</h3>
        </div>
        <span class="map-caption">Google Maps</span>
      </div>
      <div class="map-frame">
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
          <span class="check-mark" aria-hidden="true">●</span>
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
    "行程:",
    ...day.timePlan.map((item) => `- ${item.time} ${item.body}`),
    "確認:",
    ...day.checks.map((item) => `- ${item}`)
  ].join("\n");
  await navigator.clipboard.writeText(text);
}

function init() {
  if (!state.trip) {
    document.body.innerHTML = '<main class="panel" style="margin: 24px">旅行データを読み込めませんでした。</main>';
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
