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
