const infiniteTyping = () => {
    const text = document.querySelector(".sec");

    setTimeout(() => {
        text.textContent = "Frontender";
    }, 0);

    setTimeout(() => {
        text.textContent = "Challenger";
    }, 4000);

    setTimeout(() => {
        text.textContent = "Traveler";
    }, 8000);
};

infiniteTyping();
setInterval(infiniteTyping, 12000);

/**
 *
 */
const typingWrapper = document.querySelector(".typing");
const aboutWrapper = document.querySelector(".about");
const description = document.querySelector(".description");

const descriptionText = document.querySelector(".description p");
const descriptionTextContent = descriptionText.textContent;
descriptionText.innerHTML = "";

for (let s of descriptionTextContent) {
    let span = document.createElement("span");
    span.textContent = s;
    descriptionText.appendChild(span);
}

const spans = descriptionText.querySelectorAll("span");
const aboutScrollHeight = (aboutWrapper.offsetHeight - window.innerHeight) / descriptionTextContent.length;

window.addEventListener("scroll", () => {
    if (window.scrollY >= typingWrapper.offsetHeight) {
        description.classList.add("active");

        spans.forEach((span, index) => {
            if (window.scrollY - typingWrapper.offsetHeight >= (index + 1) * aboutScrollHeight) {
                span.classList.add("active");
            } else {
                span.classList.remove("active");
            }
        });
    } else {
        description.classList.remove("active");
    }
});

/**
 * scroll
 */
const scrollIcon = document.querySelector("#scroll");
window.addEventListener("scroll", () => {
    if (window.scrollY > window.innerHeight / 4) {
        scrollIcon.classList.add("none");
    } else {
        scrollIcon.classList.remove("none");
    }
});
