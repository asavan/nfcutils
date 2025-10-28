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

    function write(data, timeout) {
        ignoreRead = true;
        return new Promise((resolve, reject) => {
            const signal = AbortSignal.timeout(timeout);
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
        await ndef.scan();
        try {
            const data = {
                records: [{recordType: "url", data: url}],
            };
            // Let's wait for 5 seconds only.
            await write(data, timeout);
        } catch (err) {
            logger.error("Something went wrong", err);
        } finally {
            logger.log("We wrote to a tag!");
        }
    };

    const read = (timeout) => readNfc(ndef, logger, timeout);

    return {
        read,
        write,
        writeUrl
    };
}

export function readNfc(ndef, logger, ms) {
    const signal = AbortSignal.timeout(ms);
    ndef
        .scan({signal})
        .then(() => {
            logger.log("Scan started successfully.");
            ndef.onreadingerror = (event) => {
                logger.log(
                    "Error! Cannot read data from the NFC tag. Try a different one?",
                    event);
            };
            const parser = parseEventWithLogger(logger);
            ndef.onreading = parser;
        })
        .catch((error) => {
            logger.log(`Error! Scan failed to start: ${error}.`);
        });
}
