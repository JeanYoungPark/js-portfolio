VanillaTilt.init(document.querySelector(".card"), {
    max: 15,
    speed: 400,
    glare: true,
});

emailjs.init({
    publicKey: "YOUR_PUBLIC_KEY",
    // Do not allow headless browsers
    blockHeadless: true,
    blockList: {
        // Block the suspended emails
        list: ["foo@emailjs.com", "bar@emailjs.com"],
        // The variable contains the email address
        watchVariable: "userEmail",
    },
    limitRate: {
        // Set the limit rate for the application
        id: "app",
        // Allow 1 request per 10s
        throttle: 10000,
    },
});

let templateParams = {
    name: "James",
    notes: "Check this out!",
};

emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", templateParams).then(
    (response) => {
        console.log("SUCCESS!", response.status, response.text);
    },
    (error) => {
        console.log("FAILED...", error);
    }
);
