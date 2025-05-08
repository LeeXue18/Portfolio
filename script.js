const words = ["User Interface", "Experience", "Installation"];
const wordEl = document.getElementById("changing-word");
let index = 0;

setInterval(() => {
  wordEl.style.opacity = 0;

  setTimeout(() => {
    index = (index + 1) % words.length;
    wordEl.textContent = words[index];
    wordEl.style.opacity = 1;
  }, 300); // 300ms 等待淡出后再切换
}, 2000); // 每2秒切换一次

const contactLink = document.getElementById("contact-link");
const contactInfo = document.getElementById("contact-info");

let contactVisible = false;

contactLink.addEventListener("click", () => {
  contactVisible = !contactVisible;
  contactInfo.style.display = contactVisible ? "block" : "none";
});

