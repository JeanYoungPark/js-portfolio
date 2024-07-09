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
