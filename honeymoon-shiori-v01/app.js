const state = {
  trip: window.TRIP_DATA,
  currentDayId: null
};

const selectors = {
  nav: document.getElementById("day-nav"),
  hero: document.getElementById("day-hero"),
  timeline: document.getElementById("timeline"),
  checks: document.getElementById("check-list"),
  transport: document.getElementById("transport-stack"),
  hotels: document.getElementById("hotel-stack"),
  print: document.getElementById("print-button"),
  copy: document.getElementById("copy-button"),
  screenTitle: document.getElementById("screen-title")
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

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
    .map(
      (day) => `
        <button class="day-tab" type="button" data-day="${escapeHtml(day.id)}" aria-selected="${day.id === state.currentDayId}">
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
    .map(
      (hotel) => `
        <article class="info-row hotel-row">
          <p class="hotel-meta">${escapeHtml(hotel.label)} / ${escapeHtml(hotel.area)}</p>
          <h4>${escapeHtml(hotel.name)}</h4>
          <dl class="hotel-details">
            <div><dt>IN</dt><dd>${escapeHtml(hotel.checkin)}</dd></div>
            <div><dt>OUT</dt><dd>${escapeHtml(hotel.checkout)}</dd></div>
            <div><dt>食事</dt><dd>${escapeHtml(hotel.meal)}</dd></div>
            <div><dt>支払</dt><dd>${escapeHtml(hotel.payment)}</dd></div>
          </dl>
          <ul>
            ${hotel.notes.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </article>
      `
    )
    .join("");
}

function renderStaticPanels() {
  const { meta, transport, hotels } = state.trip;
  selectors.screenTitle.textContent = meta.subtitle;
  renderTransport(transport);
  renderHotels(hotels);
}

function removeDeprecatedBlocks() {
  document
    .querySelectorAll("#privacy-note, .notice-strip, #summary-grid, .summary-grid")
    .forEach((element) => element.remove());
}

function renderDay() {
  const day = state.trip.days.find((item) => item.id === state.currentDayId);
  if (!day) return;

  const embedUrl = googleEmbedUrl(day.map);
  const hotel = state.trip.hotels.find((item) => item.id === day.hotelId);

  document.title = `${day.date} ${day.title} | ${state.trip.meta.title}`;
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
        ${hotel ? `<p class="arrival-note">宿: ${escapeHtml(hotel.name)} / ${escapeHtml(hotel.checkin)}</p>` : ""}
      </div>
    </div>
    <section class="map-frame" aria-label="${escapeHtml(day.date)}のGoogle Mapsルート">
      <iframe
        title="${escapeHtml(day.date)} ${escapeHtml(day.title)}のGoogle Mapsルート"
        data-map-src="${escapeHtml(embedUrl)}"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        allowfullscreen
      ></iframe>
    </section>
  `;

  const iframe = selectors.hero.querySelector("[data-map-src]");
  if (iframe) {
    requestAnimationFrame(() => {
      const height = Math.round(iframe.getBoundingClientRect().height);
      if (height > 0) {
        iframe.style.height = `${height}px`;
      }
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
  removeDeprecatedBlocks();
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