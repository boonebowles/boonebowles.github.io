"use strict";
document.body.classList.add("js");
const nav = document.querySelector("#site-nav");
const menuButton = document.querySelector(".menu-toggle");
const teachingButton = document.querySelector(".submenu-toggle");
const teachingMenu = document.querySelector("#teaching-menu");
const searchButton = document.querySelector(".search-toggle");
const searchDialog = document.querySelector("#site-search");
const searchInput = document.querySelector("#search-input");
const results = document.querySelector("#search-results");
const status = document.querySelector("#search-status");
const base = document.body.dataset.base;
for (const button of [menuButton, teachingButton, searchButton]) button.hidden = false;
function toggle(button, open) { button.setAttribute("aria-expanded", String(open)); }
menuButton.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  toggle(menuButton, open);
  menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
});
teachingButton.addEventListener("click", () => {
  teachingMenu.hidden = !teachingMenu.hidden;
  toggle(teachingButton, !teachingMenu.hidden);
});
document.addEventListener("click", event => {
  if (!event.target.closest(".nav-teaching")) {
    teachingMenu.hidden = true;
    toggle(teachingButton, false);
  }
  if (!event.target.closest(".site-header")) {
    nav.classList.remove("is-open");
    toggle(menuButton, false);
    menuButton.setAttribute("aria-label", "Open navigation");
  }
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    if (searchDialog.open) {
      event.preventDefault();
      searchDialog.close();
      searchButton.focus();
      return;
    }
    if (!teachingMenu.hidden) teachingButton.focus();
    else if (nav.classList.contains("is-open")) menuButton.focus();
    teachingMenu.hidden = true;
    nav.classList.remove("is-open");
    toggle(teachingButton, false);
    toggle(menuButton, false);
    menuButton.setAttribute("aria-label", "Open navigation");
  }
});
let index;
let loadPromise;
async function loadIndex() {
  if (index) return;
  if (!loadPromise) {
    loadPromise = fetch(`${base}/search-index.json`).then(response => {
      if (!response.ok) throw new Error("Search index unavailable");
      return response.json();
    }).then(data => { index = data; }).catch(error => {
      loadPromise = undefined;
      throw error;
    });
  }
  await loadPromise;
}
function showResults() {
  results.replaceChildren();
  const query = searchInput.value.trim().toLowerCase();
  if (!query) { status.textContent = "Enter a word or phrase to search the site."; return; }
  const words = query.split(/\s+/);
  const matches = index.filter(page => words.every(word => `${page.title} ${page.text}`.toLowerCase().includes(word)));
  status.textContent = `${matches.length} ${matches.length === 1 ? "page" : "pages"} found.`;
  for (const page of matches) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = `${base}${page.path}`;
    link.textContent = page.title;
    const snippet = document.createElement("p");
    const position = Math.max(0, page.text.toLowerCase().indexOf(words[0]) - 50);
    snippet.textContent = `${position ? "…" : ""}${page.text.slice(position, position + 210)}${page.text.length > position + 210 ? "…" : ""}`;
    item.append(link, snippet);
    results.append(item);
  }
}
async function search() {
  status.textContent = "Loading search…";
  try { await loadIndex(); showResults(); }
  catch { status.textContent = "Search is temporarily unavailable. Please use the navigation links."; }
}
searchButton.addEventListener("click", () => {
  searchDialog.showModal();
  searchInput.focus();
  search();
});
searchInput.addEventListener("input", search);
searchDialog.addEventListener("click", event => {
  if (event.target !== searchDialog) return;
  const box = searchDialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) searchDialog.close();
});
