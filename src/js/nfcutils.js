import {bufferToBytes, createWpsPayload} from "./nfc_payload.js";
import {dataViewToHexString} from "./common.js";
import ndefWifiSimple from "./lib/ndef-wifi-simple.js";

function readUrlRecord(record, logger) {
    console.assert(record.recordType === "url");
    const textDecoder = new TextDecoder();
    const str = textDecoder.decode(record.data);
    logger.log(`URL: ${str}`);
    return str;
}

function readTextRecord(record, logger) {
    console.assert(record.recordType === "text");
    const textDecoder = new TextDecoder(record.encoding);
    const str = textDecoder.decode(record.data);
    logger.log(`Text: ${str} (${record.lang})`);
    return str;
}

function readMimeRecord(record, logger) {
    console.assert(record.recordType === "mime");
    if (record.mediaType === "application/vnd.wfa.wsc") {
        const payload = bufferToBytes(record.data.buffer);
        const decoded = ndefWifiSimple.decodePayload(payload);
        logger.log("ssid " + decoded.ssid);
        logger.log("pass " + decoded.networkKey);
        return decoded;
    } else {
        const str = dataViewToHexString(record.data);
        logger.log("Data len " + record.data.byteLength);
        logger.log("Data: " + dataViewToHexString(record.data));
        return str;
    }
}

const parseEventWithLogger = (logger) => (event) => {
    const message = event.message;
    logger.log("Read tag: " + event.serialNumber);
    const dataObj = {};
    dataObj.serialNumber = event.serialNumber;
    for (const record of message.records) {
        switch (record.recordType) {
        case "text": {
            const text = readTextRecord(record, logger);
            dataObj.text = text;
        }
            break;
        case "url": {
            const url = readUrlRecord(record, logger);
            dataObj.url = url;
        }
            break;
        case "mime": {
            const mime = readMimeRecord(record, logger);
            if (mime.ssid) {
                dataObj.ssid = mime.ssid;
                if (mime.networkKey) {
                    dataObj.networkKey = mime.networkKey;
                }
            } else {
                dataObj.data = mime;
            }
        }
            break;
        default:
            logger.log("Unknown type " + record.recordType);
        }
    }
    return dataObj;
};

export function writeUrlWithTimeout(logger) {
    /* eslint-disable no-undef */
    const ndef = new NDEFReader();
    /* eslint-enable no-undef */
    const parser = parseEventWithLogger(logger);
    let ignoreRead = false;
    let promiseWithResolver = Promise.withResolvers();
    ndef.onreading = (event) => {
        if (ignoreRead) {
            logger.log("Ignore");
            return; // write pending, ignore read.
        }
        const dataObj = parser(event);
        promiseWithResolver.resolve(dataObj);
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

    const read = async (timeout) => {
        await readNfc(ndef, logger, timeout);
        promiseWithResolver = Promise.withResolvers();
        return promiseWithResolver.promise;
    };

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
