import {loggerFunc, parseSettings} from "netutils";
import settings from "./settings.js";
import {writeUrlWithTimeout} from "./nfcutils.js";


export default function starter(window, document) {
    const changed = parseSettings(window.location.search, settings);
    const mainLogger = loggerFunc(document, settings);
    mainLogger.log("Extra options " + JSON.stringify(changed));

    const writeBtn = document.querySelector(".js-write-nfc");
    const writeWiFiBtn = document.querySelector(".js-write-wifi-nfc");
    const readBtn = document.querySelector(".js-read-nfc");
    const cleanBtn = document.querySelector(".js-clean");
    const logElem = document.querySelector(".log");
    const input = document.querySelector("#dataInput");
    const hotel = "SSID:\tMAY BEACH HOTEL T3\n" +
        "Protocol:\tWi-Fi 5 (802.11ac)\n" +
        "Security type:\tWPA2-Personal\n" +
        "Manufacturer:\tIntel Corporation\n" +
        "Description:\tIntel(R) Wireless-AC 9560 160MHz #3\n" +
        "Driver version:\t23.110.0.5\n" +
        "Network band (channel):\t5 GHz (149)\n" +
        "Aggregated link speed (Receive/Transmit):\t351/260 (Mbps)\n" +
        "Link-local IPv6 address:\tfe80::e6e1:7568:9df5:8857%22\n" +
        "IPv4 address:\t192.168.110.48\n" +
        "IPv4 default gateway:\t192.168.110.1\n" +
        "IPv4 DNS servers:\t192.168.110.1 (Unencrypted)\n" +
        "Physical address (MAC):\tCC:D9:AC:B1:62:19\n";
    const ssidHolel = "MAY BEACH HOTEL T3";
    const pass = "12345678";
    console.log(hotel);
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

        writeWiFiBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            const url = input.value;
            mainLogger.log("value " + url);
            try {
                const res = await writer.writeWifi(ssidHolel, pass, 5000);
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
