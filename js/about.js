// typing

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

// scroll reading

const typingWrapper = document.querySelector(".typing-container");
const aboutWrapper = document.querySelector(".about-container");
const description = document.querySelector(".description");

const descriptionText = document.querySelector(".description p");
const descriptionTextContent = descriptionText.textContent;
descriptionText.innerHTML = "";

for (let index = 0; index < descriptionTextContent.length - 4; index++) {
    let letter;

    if (descriptionTextContent.slice(index, index + 4) === "\\r\\n") {
        letter = document.createElement("br");
        index += 3;
    } else {
        letter = document.createElement("span");
        letter.textContent = descriptionTextContent[index];
    }

    descriptionText.appendChild(letter);
}

const spans = descriptionText.querySelectorAll("span");
const aboutScrollHeight = (aboutWrapper.offsetHeight - window.innerHeight) / descriptionTextContent.length;

window.addEventListener("scroll", () => {
    if (window.scrollY >= typingWrapper.offsetHeight && window.scrollY) {
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

//scroll icon

const scrollIcon = document.querySelector("#scroll");
window.addEventListener("scroll", () => {
    if (window.scrollY > window.innerHeight / 4) {
        scrollIcon.classList.add("none");
    } else {
        scrollIcon.classList.remove("none");
    }
});

// skills icon
const skillsWrapper = document.querySelector(".skill-container");

window.addEventListener("scroll", () => {
    if (document.body.offsetHeight - window.scrollY - window.innerHeight === 0) {
        skillsWrapper.querySelector(".skill-list").classList.add("active");
    } else {
        skillsWrapper.querySelector(".skill-list").classList.remove("active");
    }
});
