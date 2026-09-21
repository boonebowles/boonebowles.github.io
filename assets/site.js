"use strict";
document.body.classList.add("js");
const nav = document.querySelector("#site-nav");
const menuButton = document.querySelector(".menu-toggle");
const submenus = [...document.querySelectorAll(".submenu-toggle")].map(button => ({
  button,
  menu: document.getElementById(button.getAttribute("aria-controls")),
  group: button.closest(".nav-group"),
}));
const searchButton = document.querySelector(".search-toggle");
const searchDialog = document.querySelector("#site-search");
const searchInput = document.querySelector("#search-input");
const results = document.querySelector("#search-results");
const status = document.querySelector("#search-status");
const base = document.body.dataset.base;
for (const button of [menuButton, ...submenus.map(submenu => submenu.button), searchButton]) button.hidden = false;
function toggle(button, open) { button.setAttribute("aria-expanded", String(open)); }
menuButton.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  toggle(menuButton, open);
  menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
});
for (const { button, menu } of submenus) {
  button.addEventListener("click", () => {
    menu.hidden = !menu.hidden;
    toggle(button, !menu.hidden);
  });
}
document.addEventListener("click", event => {
  for (const { button, menu, group } of submenus) {
    if (!group.contains(event.target)) {
      menu.hidden = true;
      toggle(button, false);
    }
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
    const openSubmenu = submenus.find(({ menu }) => !menu.hidden);
    if (openSubmenu) {
      openSubmenu.menu.hidden = true;
      toggle(openSubmenu.button, false);
      openSubmenu.button.focus();
      return;
    }
    if (nav.classList.contains("is-open")) menuButton.focus();
    nav.classList.remove("is-open");
    toggle(menuButton, false);
    menuButton.setAttribute("aria-label", "Open navigation");
  }
});
let index;
let loadPromise;
async function loadIndex() {
  if (index) return;
  if (!loadPromise) {
    loadPromise = fetch(`${base}/search-index.json`, {cache: "no-cache"}).then(response => {
      if (!response.ok) throw new Error("Search index unavailable");
      return response.json();
    }).then(data => { index = data; }).catch(error => {
      loadPromise = undefined;
      throw error;
    });
  }
  await loadPromise;
}
function searchText(value) {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[’‘']/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}
function showResults() {
  results.replaceChildren();
  const query = searchText(searchInput.value);
  if (!query) { status.textContent = "Enter a word or phrase to search the site."; return; }
  const words = query.split(/\s+/);
  const matches = index.filter(page => words.every(word =>
    searchText(`${page.title} ${page.text} ${(page.aliases || []).join(" ")}`).includes(word)));
  const score = page => {
    const title = searchText(page.title);
    return (title === query ? 6 : words.every(word => title.includes(word)) ? 3 : 0)
      + (page.kind === "paper" ? 1 : 0);
  };
  matches.sort((a, b) => score(b) - score(a));
  status.textContent = `${matches.length} ${matches.length === 1 ? "result" : "results"} found.`;
  for (const page of matches) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = `${base}${page.path}`;
    link.textContent = page.title;
    const snippet = document.createElement("p");
    let position = Math.max(0, page.text.toLowerCase().indexOf(words[0]) - 50);
    if (position > 0) position = page.text.indexOf(" ", position) + 1;
    let end = Math.min(page.text.length, position + 210);
    if (end < page.text.length) end = page.text.lastIndexOf(" ", end);
    snippet.textContent = `${position ? "…" : ""}${page.text.slice(position, end)}${end < page.text.length ? "…" : ""}`;
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
results.addEventListener("click", event => {
  if (event.target.closest("a") && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
    searchDialog.close();
  }
});
searchDialog.addEventListener("click", event => {
  if (event.target !== searchDialog) return;
  const box = searchDialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) searchDialog.close();
});
