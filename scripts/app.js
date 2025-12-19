const defaultEvents = [
  {
    id: 'sp-001',
    name: 'Summer 5v5 Soccer League',
    type: 'league',
    start: '2024-07-08T18:30',
    location: 'Summit Fieldhouse',
    cost: 120,
    notes: '8-week regular season + playoffs. Certified officials, jerseys included.'
  },
  {
    id: 'sp-002',
    name: 'Independence Day 3x3 Basketball Tournament',
    type: 'tournament',
    start: '2024-07-04T09:00',
    location: 'Civic Arena Courts',
    cost: 85,
    notes: 'Pool play into single elimination. Two-game minimum. Live DJ + concessions.'
  },
  {
    id: 'sp-003',
    name: 'Elite Volleyball Clinic',
    type: 'clinic',
    start: '2024-07-15T17:00',
    location: 'Northside Sportsplex',
    cost: 60,
    notes: 'Positional breakout sessions led by college coaches.'
  },
  {
    id: 'sp-004',
    name: 'Friday Night Lights Flag Football',
    type: 'pickup',
    start: '2024-06-21T19:30',
    location: 'Summit Fieldhouse',
    cost: 25,
    notes: 'Open play with rotating QB. Warmup at 7:15 PM.'
  }
];

const defaultUpdates = [
  {
    title: 'Weather watch for Saturday',
    body: 'We are monitoring storms for the Saturday tournament. Final call will be posted by 7:00 AM with any field changes.',
    audience: 'all',
    relatedEvent: 'sp-002',
    createdAt: new Date().toISOString()
  },
  {
    title: 'Roster deadline approaching',
    body: 'Team rosters for the Summer 5v5 League are due Friday at 5:00 PM. Send updates through your team portal or email us.',
    audience: 'coaches',
    relatedEvent: 'sp-001',
    createdAt: new Date().toISOString()
  }
];

const storage = {
  getEvents() {
    const events = localStorage.getItem('sp_events');
    return events ? JSON.parse(events) : [...defaultEvents];
  },
  saveEvents(events) { localStorage.setItem('sp_events', JSON.stringify(events)); },
  getRegistrations() {
    const registrations = localStorage.getItem('sp_regs');
    return registrations ? JSON.parse(registrations) : [];
  },
  saveRegistrations(regs) { localStorage.setItem('sp_regs', JSON.stringify(regs)); },
  getUpdates() {
    const updates = localStorage.getItem('sp_updates');
    return updates ? JSON.parse(updates) : [...defaultUpdates];
  },
  saveUpdates(updates) { localStorage.setItem('sp_updates', JSON.stringify(updates)); }
};

const state = {
  events: storage.getEvents(),
  registrations: storage.getRegistrations(),
  updates: storage.getUpdates()
};

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function uniqueBy(items, key) {
  const values = typeof key === 'function'
    ? items.map(key)
    : items.map(item => item[key]);

  return [...new Set(values.filter(value => value !== undefined && value !== null))];
}

function renderHeroEvents() {
  const hero = document.getElementById('heroEvents');
  const soonest = [...state.events].sort((a, b) => new Date(a.start) - new Date(b.start)).slice(0, 3);
  hero.innerHTML = soonest.map(event => `
    <li>
      <div class="meta">${formatDate(event.start)} · ${event.location}</div>
      <strong>${event.name}</strong>
      <div class="meta">${event.type.toUpperCase()} · $${event.cost}</div>
    </li>
  `).join('');
}

function renderFilters() {
  const locationSelect = document.getElementById('filterLocation');
  const monthSelect = document.getElementById('filterMonth');
  const locations = ['all', ...uniqueBy(state.events, 'location')];
  const months = ['all', ...uniqueBy(state.events, event => new Date(event.start).getMonth())];

  locationSelect.innerHTML = locations.map(loc => `<option value="${loc}">${loc === 'all' ? 'All locations' : loc}</option>`).join('');

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  monthSelect.innerHTML = months.map(month => {
    const label = month === 'all' ? 'All months' : monthNames[month];
    return `<option value="${month}">${label}</option>`;
  }).join('');
}

function renderEventSelectors() {
  const selectIds = ['regEvent', 'updateEvent'];
  selectIds.forEach(id => {
    const select = document.getElementById(id);
    select.innerHTML = state.events.map(event => `<option value="${event.id}">${event.name}</option>`).join('');
  });
}

function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  const filterType = document.getElementById('filterType').value;
  const filterLocation = document.getElementById('filterLocation').value;
  const filterMonth = document.getElementById('filterMonth').value;

  const filtered = state.events.filter(event => {
    const matchesType = filterType === 'all' || event.type === filterType;
    const matchesLocation = filterLocation === 'all' || event.location === filterLocation;
    const eventMonth = new Date(event.start).getMonth().toString();
    const matchesMonth = filterMonth === 'all' || filterMonth === eventMonth;
    return matchesType && matchesLocation && matchesMonth;
  }).sort((a, b) => new Date(a.start) - new Date(b.start));

  if (!filtered.length) {
    grid.innerHTML = '<p class="muted">No events match your filters yet.</p>';
    return;
  }

  grid.innerHTML = filtered.map(event => `
    <article class="event-card">
      <span class="badge ${event.type}">${event.type}</span>
      <p class="type">${formatDate(event.start)}</p>
      <h4>${event.name}</h4>
      <div class="meta">
        <span>Location: ${event.location}</span>
        <span>$${event.cost}</span>
      </div>
      <p class="meta">${event.notes || ''}</p>
    </article>
  `).join('');
}

function renderRegistrations() {
  const tbody = document.querySelector('#registrationTable tbody');
  if (!state.registrations.length) {
    tbody.innerHTML = '<tr><td colspan="5">No registrations yet.</td></tr>';
    return;
  }

  tbody.innerHTML = state.registrations.map(reg => {
    const event = state.events.find(e => e.id === reg.eventId);
    return `
      <tr>
        <td>${event ? event.name : 'Event removed'}</td>
        <td>${reg.name}</td>
        <td>${reg.email}</td>
        <td>${reg.payment}</td>
        <td>${reg.notes || ''}</td>
      </tr>
    `;
  }).join('');
}

function renderUpdates() {
  const list = document.getElementById('updatesList');
  if (!state.updates.length) {
    list.innerHTML = '<li class="update-item">No updates yet.</li>';
    return;
  }

  list.innerHTML = state.updates.slice().reverse().map(update => {
    const event = state.events.find(e => e.id === update.relatedEvent);
    const date = new Date(update.createdAt);
    return `
      <li class="update-item">
        <h4>${update.title}</h4>
        <div class="update-meta">
          <span>${date.toLocaleString()}</span>
          <span>Audience: ${update.audience}</span>
          ${event ? `<span>Event: ${event.name}</span>` : ''}
        </div>
        <p>${update.body}</p>
      </li>
    `;
  }).join('');
}

function renderJsonPreview() {
  const preview = document.getElementById('jsonPreview');
  const payload = { events: state.events, registrations: state.registrations, updates: state.updates };
  preview.textContent = JSON.stringify(payload, null, 2);
}

function exportCsv() {
  if (!state.registrations.length) return alert('No registrations to export yet.');
  const rows = [['Event', 'Participant', 'Email', 'Payment', 'Notes']];
  state.registrations.forEach(reg => {
    const event = state.events.find(e => e.id === reg.eventId);
    rows.push([event ? event.name : 'Event removed', reg.name, reg.email, reg.payment, reg.notes || '']);
  });
  const csv = rows.map(r => r.map(value => `"${value}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'summit-playbook-registrations.csv';
  link.click();
}

function copyJson() {
  const preview = document.getElementById('jsonPreview');
  navigator.clipboard.writeText(preview.textContent).then(() => {
    alert('JSON copied. Paste into Airtable, Sheets, or your CRM.');
  });
}

function attachEventListeners() {
  document.getElementById('eventForm').addEventListener('submit', e => {
    e.preventDefault();
    const form = e.target;
    const newEvent = {
      id: `sp-${Date.now()}`,
      name: form.eventName.value,
      type: form.eventType.value,
      start: form.eventStart.value,
      location: form.eventLocation.value,
      cost: Number(form.eventCost.value),
      notes: form.eventNotes.value
    };
    state.events.push(newEvent);
    storage.saveEvents(state.events);
    renderFilters();
    renderEventSelectors();
    renderCalendar();
    renderHeroEvents();
    document.getElementById('eventMessage').textContent = 'Event published to the calendar.';
    form.reset();
  });

  document.getElementById('registrationForm').addEventListener('submit', e => {
    e.preventDefault();
    const form = e.target;
    const registration = {
      eventId: form.regEvent.value,
      name: form.participantName.value,
      email: form.participantEmail.value,
      phone: form.participantPhone.value,
      payment: form.paymentStatus.value,
      notes: form.notes.value
    };
    state.registrations.push(registration);
    storage.saveRegistrations(state.registrations);
    renderRegistrations();
    renderJsonPreview();
    document.getElementById('registrationMessage').textContent = 'Registration saved. Send payment link to confirm.';
    form.reset();
  });

  document.getElementById('updateForm').addEventListener('submit', e => {
    e.preventDefault();
    const form = e.target;
    const update = {
      title: form.updateTitle.value,
      body: form.updateBody.value,
      audience: form.updateAudience.value,
      relatedEvent: form.updateEvent.value,
      createdAt: new Date().toISOString()
    };
    state.updates.push(update);
    storage.saveUpdates(state.updates);
    renderUpdates();
    renderJsonPreview();
    document.getElementById('updateMessage').textContent = 'Update posted and pinned to the calendar.';
    form.reset();
  });

  ['filterType','filterLocation','filterMonth'].forEach(id => {
    document.getElementById(id).addEventListener('change', renderCalendar);
  });

  document.getElementById('exportCsv').addEventListener('click', exportCsv);
  document.getElementById('copyJson').addEventListener('click', copyJson);
}

function init() {
  renderHeroEvents();
  renderFilters();
  renderEventSelectors();
  renderCalendar();
  renderRegistrations();
  renderUpdates();
  renderJsonPreview();
  attachEventListeners();
}

document.addEventListener('DOMContentLoaded', init);
