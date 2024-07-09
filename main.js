const menuIcon = document.getElementById("menu");
const menuPopup = document.getElementById("menu-popup");
menuIcon.addEventListener("click", () => {
    menuPopup.classList.add("active");
});
