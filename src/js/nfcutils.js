export function writeUrlWithTimeout(window, logger) {
    const ndef = new window.NDEFReader();
    ndef.onreading = (event) => {
        logger.log("We read a tag!");
        logger.log(event);
    };

    function write(data, { timeout } = {}) {
        return new Promise((resolve, reject) => {
            const controller = new AbortController();
            controller.signal.onabort = () =>
                reject(new Error("Time is up, bailing out!"));
            setTimeout(() => controller.abort(), timeout);

            ndef.addEventListener(
                "reading",
                (event) => {
                    logger.log("event1", event);
                    ndef.write(data, { signal: controller.signal }).then(resolve, reject);
                },
                { once: true },
            );
        });
    }

    const writeUrl = async (url, timeout) => {
        await ndef.scan();
        try {
            const data = {
                records: [{ recordType: "url", data: url }],
            };
            // Let's wait for 5 seconds only.
            await write(data, { timeout: timeout });
        } catch (err) {
            logger.error("Something went wrong", err);
        } finally {
            logger.log("We wrote to a tag!");
        }
    };

    return {
        write,
        writeUrl
    };
}

export function readNfc(window, logger, ms) {
    const signal = AbortSignal.timeout(ms);
    const ndef = new window.NDEFReader();
    ndef
        .scan(signal)
        .then(() => {
            console.log("Scan started successfully.");
            ndef.onreadingerror = (event) => {
                logger.log(
                    "Error! Cannot read data from the NFC tag. Try a different one?",
                    event);
            };
            ndef.onreading = (event) => {
                logger.log("NDEF message read." + event);
            };
        })
        .catch((error) => {
            logger.log(`Error! Scan failed to start: ${error}.`);
        });
}
