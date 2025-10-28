import {loggerFunc, parseSettings} from "netutils";
import settings from "./settings.js";
import {readNfc, writeUrlWithTimeout} from "./nfcutils.js";


export default function starter(window, document) {
    const changed = parseSettings(window.location.search, settings);
    const mainLogger = loggerFunc(document, settings);
    mainLogger.log("Choosen mode " + settings.mode, changed);

    const writeBtn = document.querySelector(".js-write-nfc");
    const readBtn = document.querySelector(".js-read-nfc");
    const input = document.querySelector("#dataInput");
    writeBtn.addEventListener("click", (e)=> {
        e.preventDefault();
        const url = input.value;
        mainLogger.log("value " + url);
        const writer = writeUrlWithTimeout(window, mainLogger);
        writer.writeUrl(url, 5000);
    });

    readBtn.addEventListener("click", (e) => {
        e.preventDefault();
        readNfc(window, mainLogger, 5000);
    });

}
