import {loggerFunc, parseSettings} from "netutils";
import settings from "./settings.js";
import {writeUrlWithTimeout} from "./nfcutils.js";


export default function starter(window, document) {
    const changed = parseSettings(window.location.search, settings);
    const mainLogger = loggerFunc(document, settings);
    mainLogger.log("Choosen mode " + settings.mode, changed);

    const writeBtn = document.querySelector(".js-write-nfc");
    const readBtn = document.querySelector(".js-read-nfc");
    const cleanBtn = document.querySelector(".js-clean");
    const logElem = document.querySelector(".log");
    const input = document.querySelector("#dataInput");
    try {
        cleanBtn.addEventListener("click", () => {
            logElem.innerHTML = "";
        });
        const writer = writeUrlWithTimeout(mainLogger);
        writeBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            const url = input.value;
            mainLogger.log("value " + url);
            try {
                const res = await writer.writeUrl(url, 5000);
                mainLogger.log("result " + res);
            } catch (e) {
                mainLogger.error(e);
            }
        });

        readBtn.addEventListener("click", (e) => {
            e.preventDefault();
            try {
                writer.read(5000);
            } catch (e) {
                mainLogger.error(e);
            }
        });
    } catch (e) {
        mainLogger.error(e);
    }
}
