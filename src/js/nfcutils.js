// https://developer.chrome.com/docs/capabilities/nfc?hl=ru

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

const parseEventWithLogger = (logger) => (event) => {
    const message = event.message;
    for (const record of message.records) {
        logger.log("Record type:  " + record.recordType);
        logger.log("MIME type:    " + record.mediaType);
        logger.log("Record id:    " + record.id);
        switch (record.recordType) {
        case "text":
            readTextRecord(record, logger);
            break;
        case "url":
            readUrlRecord(record, logger);
            break;
        default:
            logger.log("Data " + JSON.stringify(record));
        }
    }
};

export function writeUrlWithTimeout(logger) {
    /* eslint-disable no-undef */
    const ndef = new NDEFReader();
    let ignoreRead = false;
    let counter = 0;
    /* eslint-enable no-undef */
    ndef.onreading = (event) => {
        if (ignoreRead) {
            return; // write pending, ignore read.
        }
        ++counter;
        logger.log("We read a tag! " + counter);
        const parser = parseEventWithLogger(logger);
        logger.log(event);
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
        const written = await write(data, signal);
        logger.log("We wrote to a tag! " + written);
        return written;
    };

    const read = (timeout) => readNfc(ndef, logger, timeout);

    return {
        read,
        write,
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
