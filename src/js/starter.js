import {loggerFunc, parseSettings} from "netutils";
import settings from "./settings.js";
import {writeUrlWithTimeout} from "./nfcutils.js";


export default function starter(window, document) {
    const changed = parseSettings(window.location.search, settings);
    const logElem = document.querySelector(settings.logger);
    const mainLogger = loggerFunc(document, settings, settings.logLevel, logElem);
    if (Array.isArray(changed) && changed.length !== 0) {
        mainLogger.log("Extra options " + JSON.stringify(changed));
    }

    window.addEventListener("unhandledrejection", (event) => {
        mainLogger.log(`UNHANDLED PROMISE REJECTION: ${event.reason}`);
        // event.preventDefault();
    });

    const writeBtn = document.querySelector(".js-write-nfc");
    const writeImgBtn = document.querySelector(".js-write-nfc-img");
    const writeSmartBtn = document.querySelector(".js-write-smart");
    const readBtn = document.querySelector(".js-read-nfc");
    const cleanBtn = document.querySelector(".js-clean");
    const serialEl = document.querySelector("#serial");
    const input = document.querySelector("#dataInput");
    const inputSsid = document.querySelector("#ssidInput");
    const passwordInput = document.querySelector("#passwordInput");
    try {
        cleanBtn.addEventListener("click", () => {
            logElem.innerHTML = "";
        });
        const writer = writeUrlWithTimeout(mainLogger);

        writeImgBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
                await writer.writeImage("./images/small/abra.png", 30000);
            } catch (e) {
                mainLogger.error(e);
            }
        });
        writeSmartBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
                await writer.writeImage("./images/small/dratini.png", 30000);
            } catch (e) {
                mainLogger.error(e);
            }
        });
        writeBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
                await writer.writeWifi(inputSsid.value, passwordInput.value, input.value, 10000);
            } catch (e) {
                mainLogger.error(e);
            }
        });

        readBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
                input.value = "";
                inputSsid.value = "";
                passwordInput.value = "";
                serialEl.textContent = "";

                const dataObj = await writer.read(5000, document);
                if (dataObj.serialNumber) {
                    serialEl.textContent = dataObj.serialNumber;
                }
                if (dataObj.url) {
                    input.value = dataObj.url;
                }
                if (dataObj.ssid) {
                    inputSsid.value = dataObj.ssid;
                }
                if (dataObj.networkKey) {
                    passwordInput.value = dataObj.networkKey;
                }
            } catch (e) {
                mainLogger.error(e);
            }
        });
    } catch (e) {
        mainLogger.error(e);
    }
}
