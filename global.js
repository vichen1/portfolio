console.log("IT'S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const BASE_PATH =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "/"
    : "/portfolio/";

let pages = [
  { url: BASE_PATH, title: "Home" },
  { url: BASE_PATH + "projects/", title: "Projects" },
  { url: BASE_PATH + "resume/", title: "CV" },
  { url: BASE_PATH + "contact/", title: "Contact" },
  { url: "https://github.com/vichen1", title: "GitHub" }
];

let nav = document.createElement("nav");
document.body.prepend(nav);

for (let p of pages) {
  let a = document.createElement("a");
  a.href = p.url;
  a.textContent = p.title;

  a.classList.toggle(
    "current",
    a.host === location.host && a.pathname === location.pathname
  );

  if (a.host !== location.host) {
    a.target = "_blank";
  }

  nav.append(a);
}

nav.insertAdjacentHTML(
  "afterbegin",
  `
  <label class="color-scheme">
    Theme:
    <select id="theme">
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  `
);

const select = document.querySelector("#theme");

function setColorScheme(value) {
  document.documentElement.style.setProperty("color-scheme", value);
  select.value = value;
  localStorage.colorScheme = value; 
}

if ("colorScheme" in localStorage) {
  setColorScheme(localStorage.colorScheme);
} else {
  setColorScheme("light dark"); 
}

select.addEventListener("input", (event) => {
  console.log("Color scheme changed to:", event.target.value);
  setColorScheme(event.target.value);
});
