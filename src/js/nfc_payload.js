//
// https://stackoverflow.com/questions/57832849/creating-an-ndef-wifi-record-using-application-vnd-wfa-wsc-in-swift

/**
 * Generates a binary Wi-Fi Protected Setup (WPS) payload from network credentials.
 * @param {string} ssid The name of the Wi-Fi network.
 * @param {string} networkKey The password for the Wi-Fi network.
 * @returns {ArrayBuffer} The binary WPS payload as an ArrayBuffer.
 */
export function createWpsPayloadBytes(ssid, networkKey) {
    const encoder = new TextEncoder();

    // Define TLV tags and types based on the WPS specification
    const TAG_WPS_CREDENTIAL = [0x10, 0x0E];
    const TAG_WPS_NETWORK_INDEX = [0x10, 0x26];
    const TAG_WPS_SSID = [0x10, 0x45];
    const TAG_WPS_AUTH_TYPE = [0x10, 0x03];
    const TAG_WPS_ENCR_TYPE = [0x10, 0x0F];
    const TAG_WPS_NETWORK_KEY = [0x10, 0x27];
    const TAG_WPS_MAC_ADDR = [0x10, 0x20];

    // Map authentication and encryption types to their byte values
    const authenticationTypes = {
        "Open": [0x00, 0x01],
        "WPA-Personal": [0x00, 0x02],
        "Shared": [0x00, 0x04],
        "WPA-Enterprise": [0x00, 0x08],
        "WPA2-Enterprise": [0x00, 0x10],
        "WPA2-Personal": [0x00, 0x20]
    };

    const encryptionTypes = {
        "None": [0x00, 0x01],
        "WEP": [0x00, 0x02],
        "TKIP": [0x00, 0x04],
        "AES": [0x00, 0x08],
        "AES/TKIP (mixed)": [0x00, 0x0c]
    };

    // Convert strings to byte arrays
    const ssidBytes = encoder.encode(ssid);
    const networkKeyBytes = encoder.encode(networkKey);

    // Construct individual Type-Length-Value (TLV) items
    const networkIndex = [...TAG_WPS_NETWORK_INDEX, 0x00, 0x01, 0x01];
    const ssidTlv = [...TAG_WPS_SSID, 0x00, ssidBytes.length, ...ssidBytes];
    const authTypeTlv = [...TAG_WPS_AUTH_TYPE, 0x00, 0x02, ...authenticationTypes["WPA2-Personal"]];
    const encrTypeTlv = [...TAG_WPS_ENCR_TYPE, 0x00, 0x02, ...encryptionTypes["AES"]];
    const networkKeyTlv = [...TAG_WPS_NETWORK_KEY, 0x00, networkKeyBytes.length, ...networkKeyBytes];
    const macAddressTlv = [...TAG_WPS_MAC_ADDR, 0x00, 0x06, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF];

    // Combine TLVs into a single credential block
    const credential = [
        ...networkIndex,
        ...ssidTlv,
        ...authTypeTlv,
        ...encrTypeTlv,
        ...networkKeyTlv,
        ...macAddressTlv
    ];

    // Create the final payload structure
    const payload = [
        ...TAG_WPS_CREDENTIAL,
        Math.floor(credential.length/256),
        (credential.length % 256),
        ...credential
    ];

    // Return the payload as an ArrayBuffer
    return payload;
}

export function createWpsPayload(ssid, networkKey) {
    return new Uint8Array(createWpsPayloadBytes(ssid, networkKey)).buffer;
}
