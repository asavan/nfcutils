import {bufferToBytes, createWpsPayload} from "./nfc_payload.js";
import {dataViewToHexString} from "./common.js";
import ndefWifiSimple from "./lib/ndef-wifi-simple.js";

function readUrlRecord(record, logger) {
    console.assert(record.recordType === "url");
    const textDecoder = new TextDecoder();
    logger.log(`URL: ${textDecoder.decode(record.data)}`);
}

function readTextRecord(record, logger) {
    console.assert(record.recordType === "text");
    const textDecoder = new TextDecoder(record.encoding);
    logger.log(`Text: ${textDecoder.decode(record.data)} (${record.lang})`);
}

function readMimeRecord(record, logger) {
    console.assert(record.recordType === "mime");
    if (record.mediaType === "application/vnd.wfa.wsc") {
        const payload = bufferToBytes(record.data.buffer);
        const decoded = ndefWifiSimple.decodePayload(payload);
        logger.log("ssid " + decoded.ssid);
        logger.log("pass " + decoded.networkKey);
    } else {
        logger.log("Data len " + record.data.byteLength);
        logger.log("Data: " + dataViewToHexString(record.data));
    }
}

const parseEventWithLogger = (logger) => (event) => {
    const message = event.message;
    logger.log("Read tag: " + event.serialNumber);
    for (const record of message.records) {
        switch (record.recordType) {
        case "text":
            readTextRecord(record, logger);
            break;
        case "url":
            readUrlRecord(record, logger);
            break;
        case "mime":
            readMimeRecord(record, logger);
            break;
        default:
            logger.log("Unknown type " + record.recordType);
        }
    }
};

export function writeUrlWithTimeout(logger) {
    /* eslint-disable no-undef */
    const ndef = new NDEFReader();
    /* eslint-enable no-undef */
    const parser = parseEventWithLogger(logger);
    let ignoreRead = false;
    ndef.onreading = (event) => {
        if (ignoreRead) {
            logger.log("Ignore");
            return; // write pending, ignore read.
        }
        parser(event);
    };

    ndef.onreadingerror = (event) => {
        logger.error(
            "Error! Cannot read data from the NFC tag. Try a different one?",
            event);
        logger.error(event);
    };

    function write(data, signal) {
        ignoreRead = true;
        return new Promise((resolve, reject) => {
            signal.onabort = () =>
                reject(new Error("Time is up " + signal.reason));

            ndef.addEventListener(
                "reading",
                (event) => {
                    logger.log("event1", event);
                    ndef.write(data, {signal}).then(resolve, reject).finally(() => (ignoreRead = false));
                },
                {once: true},
            );
        });
    }

    const writeUrl = async (url, timeout) => {
        const signal = AbortSignal.timeout(timeout);
        await ndef.scan({signal});
        logger.log("touch tag with phone to write");
        const data = {
            records: [{recordType: "url", data: url}],
        };
        // Let's wait for 5 seconds only.
        await write(data, signal);
        logger.log("We wrote url to a tag!");
    };

    const writeWifi = async (ssid, pass, url, timeout) => {
        const signal = AbortSignal.timeout(timeout);
        await ndef.scan({signal});
        logger.log("touch tag with phone to write");
        const data = {
            records: [
                // {
                //     recordType: "url",
                //     data: "https://asavan.github.io"
                // },
                // {
                //     recordType: "mime",
                //     mediaType: "application/vnd.wfa.wsc",
                //     data: payload
                // }
            ]
        };
        if (url) {
            data.records.push({recordType: "url", data: url});
        }
        if (ssid || pass) {
            const payload = createWpsPayload(ssid, pass);
            const recordWifi = {
                recordType: "mime",
                mediaType: "application/vnd.wfa.wsc",
                data: payload
            };
            data.records.push(recordWifi);
        }
        // Let's wait for write or timeout.
        await write(data, signal);
        logger.log("We wrote data to a tag!");
    };

    const read = (timeout) => readNfc(ndef, logger, timeout);

    return {
        read,
        write,
        writeWifi,
        writeUrl
    };
}

async function readNfc(ndef, logger, ms) {
    const signal = AbortSignal.timeout(ms);
    try {
        await ndef.scan({signal});
        logger.log("touch tag with phone to read");
    } catch (error) {
        logger.log(`Error! Scan failed to start: ${error}.`);
    }
}
