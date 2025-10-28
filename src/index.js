import starter from "./js/starter.js";

import { install } from "netutils";

if (__USE_SERVICE_WORKERS__) {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./sw.js", {scope: "./"});
        install(window, document);
    }
}

window.addEventListener("unhandledrejection", (event) => {
    console.warn(`UNHANDLED PROMISE REJECTION: ${event.reason}`);
    // event.preventDefault();
});

starter(window, document);
