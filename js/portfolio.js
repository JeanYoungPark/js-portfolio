/**
 * card movement class
 * @class CardMovement
 * @construct
 */
class CardMovement {
    constructor() {
        const cards = document.querySelector(".cards");
        const card = document.querySelectorAll(".card");
        const cardArray = Array.from(card);
        // activate index
        const activeCard = document.querySelector(".card.active");

        this.cardElmsWrapper = cards;
        this.cardElms = card;
        this.cardElmsArray = cardArray;
        this.currentIndex = cardArray.indexOf(activeCard);
        this.targetIndex = -1;
    }

    //card slide move up
    up() {
        this.targetIndex = this.currentIndex === this.cardElms.length - 1 ? 0 : this.currentIndex + 1;

        // change all of cards transform
        for (let index = 0; index < this.cardElms.length; index++) {
            // no more last card
            this.cardElms[index].querySelector(".inner").style.transform = `rotate(${
                -360 + 45 * (this.targetIndex - index)
            }deg) rotateX(-30deg) translateZ(-100px)`;
        }

        this.rotateCards();
    }

    //card slide move down
    down() {
        this.targetIndex = this.currentIndex === 0 ? this.cardElms.length - 1 : this.currentIndex - 1;

        for (let index = 0; index < this.cardElms.length; index++) {
            this.cardElms[index].querySelector(".inner").style.transform = `rotate(${
                -360 + 45 * (this.targetIndex - index)
            }deg) rotateX(-30deg) translateZ(-100px)`;
        }

        this.rotateCards();
    }

    // rotate container of cards
    rotateCards() {
        // no more cards
        this.cardElms[this.currentIndex].classList.remove("active");
        this.cardElms[this.targetIndex].classList.add("active");
        this.cardElmsWrapper.style.transform = `rotate(${this.targetIndex * -45}deg)`;
    }

    // click card
    click(elm) {
        this.targetIndex = this.cardElmsArray.indexOf(elm);

        if (this.currentIndex < this.targetIndex) {
            this.up();
        } else {
            this.down();
        }
    }

    // show content clicked card
    clickedCard(elm) {
        if (elm.classList.contains("clicked")) {
            this.cardElms.forEach((card) => {
                card.classList.remove("clicked");
            });
        } else {
            this.cardElms.forEach((card) => {
                card.classList.remove("clicked");
            });

            elm.classList.add("clicked");
            elm.querySelector(".inner").style.transform = `rotate(${
                -360 + 45 * -(this.targetIndex + 1)
            }deg) rotateX(0deg) translateZ(100px) translateY(-100px) translateX(-200px)`;
        }
    }
}

const container = document.querySelector(".portfolio-container");
const card = document.querySelectorAll(".card");

let startX = 0,
    startY = 0,
    newX = 0,
    newY = 0;

// handle pointer and start positions
container.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    container.style.cursor = "grabbing";
    startX = e.clientX;
    startY = e.clientY;
});

// handle pointer and card movement
document.addEventListener("mouseup", (e) => {
    e.stopPropagation();
    const cardClass = new CardMovement();
    container.style.cursor = "grab";

    if (startY - e.clientY > 200) {
        cardClass.up();
    } else if (e.clientY - startY > 200) {
        cardClass.down();
    }
});

// give event to each cards
card.forEach((el) => {
    el.addEventListener("click", (e) => {
        e.stopPropagation();
        const cardClass = new CardMovement();

        if (el.classList.contains("active")) {
            cardClass.clickedCard(el);
        } else {
            card.forEach((card) => {
                card.classList.remove("active");
                card.classList.remove("clicked");
            });

            el.classList.add("active");
            cardClass.click(el);
        }
    });
});
