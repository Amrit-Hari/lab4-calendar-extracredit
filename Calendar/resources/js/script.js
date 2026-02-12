/* Lab 4 Calendar — Full CRUD + validation + modality toggle + localStorage persistence */

let events = [];        // {id, name, weekday, time, modality, location, remoteUrl, attendees[], category}
let editingId = null;   // null = creating, otherwise editing existing event id
let modal = null;

const STORAGE_KEY = "csci3308_lab4_events_v1";

function $(id) {
  return document.getElementById(id);
}

function uid() {
  return (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
}

function parseAttendees(raw) {
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    events = Array.isArray(parsed) ? parsed : [];
  } catch {
    events = [];
  }
}

function updateLocationOptions(modality) {
  const locationGroup = $("location_group");
  const remoteGroup = $("remote_url_group");

  const locationInput = $("event_location");
  const remoteInput = $("event_remote_url");

  if (modality === "remote") {
    remoteGroup.classList.remove("d-none");
    locationGroup.classList.add("d-none");

    remoteInput.required = true;
    locationInput.required = false;
    locationInput.value = "";
  } else {
    locationGroup.classList.remove("d-none");
    remoteGroup.classList.add("d-none");

    locationInput.required = true;
    remoteInput.required = false;
    remoteInput.value = "";
  }
}

function clearForm() {
  $("event_form").reset();
  $("form_error").classList.add("d-none");
  $("delete_event_btn").classList.add("d-none");
  editingId = null;

  // default to in-person show location
  updateLocationOptions($("event_modality").value || "in-person");
}

function validateForm() {
  const form = $("event_form");
  const ok = form.checkValidity();
  $("form_error").classList.toggle("d-none", ok);
  if (!ok) form.reportValidity();
  return ok;
}

function readForm(existingId = null) {
  const modality = $("event_modality").value;
  return {
    id: existingId || uid(),
    name: $("event_name").value.trim(),
    weekday: $("event_weekday").value,
    time: $("event_time").value,
    modality,
    location: modality === "in-person" ? $("event_location").value.trim() : "",
    remoteUrl: modality === "remote" ? $("event_remote_url").value.trim() : "",
    attendees: parseAttendees($("event_attendees").value),
    category: $("event_category").value,
  };
}

function openForCreate() {
  clearForm();
  $("event_modal_label").textContent = "Create Event";
  modal.show();
}

function openForEdit(ev) {
  clearForm();
  editingId = ev.id;

  $("event_modal_label").textContent = "Edit Event";
  $("delete_event_btn").classList.remove("d-none");

  $("event_name").value = ev.name;
  $("event_weekday").value = ev.weekday;
  $("event_time").value = ev.time;
  $("event_modality").value = ev.modality;
  $("event_category").value = ev.category || "other";

  updateLocationOptions(ev.modality);

  $("event_location").value = ev.location || "";
  $("event_remote_url").value = ev.remoteUrl || "";
  $("event_attendees").value = (ev.attendees || []).join(", ");

  modal.show();
}

function clearCalendarColumns() {
  const days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  for (const d of days) {
    const col = $(d);
    if (!col) continue;
    col.querySelectorAll(".event-card").forEach(n => n.remove());
  }
}

function render() {
  clearCalendarColumns();

  // sort for nice display
  const sorted = [...events].sort((a,b) => (a.weekday.localeCompare(b.weekday) || a.time.localeCompare(b.time)));

  for (const ev of sorted) {
    const col = $(ev.weekday);
    if (!col) continue;

    const card = document.createElement("div");
    card.className = `event-card border rounded p-2 mt-2 cat-${ev.category}`;
    card.dataset.id = ev.id;
    card.style.cursor = "pointer";
    card.title = "Click to edit";

    const where = ev.modality === "remote"
      ? (ev.remoteUrl ? `<a href="${ev.remoteUrl}" target="_blank" rel="noreferrer">Remote link</a>` : "Remote")
      : (ev.location || "In Person");

    card.innerHTML = `
      <div class="fw-semibold">${ev.time} — ${ev.name}</div>
      <div class="small text-muted">${ev.category}</div>
      <div class="small">${where}</div>
      <div class="small">${(ev.attendees || []).join(", ")}</div>
    `;

    card.addEventListener("click", () => {
      const found = events.find(e => e.id === ev.id);
      if (found) openForEdit(found);
    });

    col.appendChild(card);
  }
}

function handleSave() {
  if (!validateForm()) return;

  const ev = readForm(editingId);

  if (editingId) {
    const idx = events.findIndex(e => e.id === editingId);
    if (idx !== -1) events[idx] = ev;
  } else {
    events.push(ev);
  }

  saveToStorage();
  render();
  modal.hide();
}

function handleDelete() {
  if (!editingId) return;
  events = events.filter(e => e.id !== editingId);
  saveToStorage();
  render();
  modal.hide();
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("script.js loaded");

  modal = new bootstrap.Modal($("event_modal"));

  $("create_event_btn").addEventListener("click", openForCreate);
  $("save_event_btn").addEventListener("click", handleSave);
  $("delete_event_btn").addEventListener("click", handleDelete);

  $("event_modality").addEventListener("change", (e) => updateLocationOptions(e.target.value));
  updateLocationOptions($("event_modality").value || "in-person");

  loadFromStorage();
  render();
});
