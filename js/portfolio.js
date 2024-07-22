const container = document.querySelector(".portfolio-container");
const cards = document.querySelector(".cards");
const card = document.querySelectorAll(".card");
const cardArray = Array.from(card);

let startX = 0,
    startY = 0,
    newX = 0,
    newY = 0,
    thisIndex = -1;

container.addEventListener("mousedown", (e) => {
    container.style.cursor = "grabbing";
    startX = e.clientX;
    startY = e.clientY;
});

document.addEventListener("mouseup", (e) => {
    container.style.cursor = "grab";

    if (startY - e.clientY > 200) {
        thisIndex = cardArray.findIndex((el) => el.classList.contains("active"));
        let nextIndex = thisIndex + 1;

        for (let index = 0; index < card.length; index++) {
            if (nextIndex === card.length) {
                card[index].querySelector("div").style.transform = `rotate(${-360 + 45 * -index}deg) rotateX(-30deg) translateZ(-100px)`;
            } else {
                card[index].querySelector("div").style.transform = `rotate(${-360 + 45 * (nextIndex - index)}deg) rotateX(-30deg) translateZ(-100px)`;
            }
        }

        if (cardArray.length === nextIndex) {
            cardArray[thisIndex].classList.remove("active");
            cardArray[0].classList.add("active");
            cards.style.transform = "rotate(0deg)";
            return;
        }

        if (thisIndex > -1) {
            cardArray[thisIndex].classList.remove("active");
            cardArray[nextIndex].classList.add("active");
            cards.style.transform = `rotate(${nextIndex * -45}deg)`;
            return;
        }
    } else if (e.clientY - startY > 200) {
        thisIndex = cardArray.findIndex((el) => el.classList.contains("active"));
        let prevIndex = thisIndex - 1;

        for (let index = 0; index < card.length; index++) {
            if (prevIndex === -1) {
                card[index].querySelector("div").style.transform = `rotate(${-360 + 45 * -index}deg) rotateX(-30deg) translateZ(-100px)`;
            } else {
                card[index].querySelector("div").style.transform = `rotate(${-360 + 45 * (prevIndex - index)}deg) rotateX(-30deg) translateZ(-100px)`;
            }
        }

        if (cardArray.length === prevIndex) {
            cardArray[thisIndex].classList.remove("active");
            cardArray[0].classList.add("active");
            cards.style.transform = "rotate(0deg)";
            return;
        }

        if (thisIndex > -1) {
            cardArray[thisIndex].classList.remove("active");
            cardArray[prevIndex].classList.add("active");
            cards.style.transform = `rotate(${prevIndex * -45}deg)`;
            return;
        }
    }
});
