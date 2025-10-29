//
// https://stackoverflow.com/questions/57832849/creating-an-ndef-wifi-record-using-application-vnd-wfa-wsc-in-swift

// Type-Length-Value
function makeTLV(type, bytes) {
    console.assert(type.length === 2, "Bad type");
    return [
        ...type,
        Math.floor(bytes.length / 256),
        (bytes.length % 256),
        ...bytes
    ];
}

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
        "WPA2-Personal": [0x00, 0x20],
        "WPA-WPA2-Personal": [0x00, 0x22]
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
    const networkIndex = makeTLV(TAG_WPS_NETWORK_INDEX, [0x01]);
    const ssidTlv = makeTLV(TAG_WPS_SSID, ssidBytes);
    const authTypeTlv = makeTLV(TAG_WPS_AUTH_TYPE, authenticationTypes["WPA2-Personal"]);
    const encrTypeTlv = makeTLV(TAG_WPS_ENCR_TYPE, encryptionTypes["AES"]);
    const networkKeyTlv = makeTLV(TAG_WPS_NETWORK_KEY, networkKeyBytes);
    const macAddressTlv = makeTLV(TAG_WPS_MAC_ADDR, [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);

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
    const payload = makeTLV(TAG_WPS_CREDENTIAL, credential);
    console.log("payload len " + payload.length);

    // Return the payload as an ArrayBuffer
    return payload;
}

export function createWpsPayload(ssid, networkKey) {
    return new Uint8Array(createWpsPayloadBytes(ssid, networkKey)).buffer;
}

// https://github.com/revtel/react-native-nfc-manager/issues/188
/**
 * Generates a binary Wi-Fi Protected Setup (WPS) payload from network credentials,
 * mimicking the logic of the provided Java `generateNdefPayload` function.
 * @param {string} ssid The name of the Wi-Fi network.
 * @param {string} networkKey The password for the Wi-Fi network.
 * @returns {ArrayBuffer} The binary WPS payload as an ArrayBuffer.
 */
export function createWpsPayload2(ssid, networkKey) {
    const encoder = new TextEncoder();

    // Field IDs and values based on the Java code
    const CREDENTIAL_FIELD_ID = 0x100E;
    const SSID_FIELD_ID = 0x1045;
    const AUTH_TYPE_FIELD_ID = 0x1003;
    const AUTH_TYPE_WPA2_PSK = 0x0020;
    const NETWORK_KEY_FIELD_ID = 0x1027;

    // Convert strings to byte arrays
    const ssidBytes = encoder.encode(ssid);
    const networkKeyBytes = encoder.encode(networkKey);

    const ssidSize = ssidBytes.length;
    const networkKeySize = networkKeyBytes.length;

    // Calculate the total buffer size
    const bufferSize = 18 + ssidSize + networkKeySize;

    // Create the ArrayBuffer and a DataView to write data
    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);
    const fullView = new Uint8Array(buffer);

    let offset = 0; // Track the current position in the buffer

    // Write the Credential attribute
    view.setUint16(offset, CREDENTIAL_FIELD_ID, false); // Big endian
    offset += 2;
    view.setUint16(offset, bufferSize - 4, false); // Big endian
    offset += 2;

    // Write the SSID attribute
    view.setUint16(offset, SSID_FIELD_ID, false); // Big endian
    offset += 2;
    view.setUint16(offset, ssidSize, false); // Big endian
    offset += 2;
    fullView.set(ssidBytes, offset); // Use the full view to set the bytes
    offset += ssidSize;

    // Write the Authentication Type TLV (Type + Length + Value)
    view.setUint16(offset, AUTH_TYPE_FIELD_ID, false); // Big endian
    offset += 2;
    view.setUint16(offset, 2, false); // Big endian
    offset += 2;
    view.setUint16(offset, AUTH_TYPE_WPA2_PSK, false); // Big endian
    offset += 2;

    // Write the Network Key attribute
    view.setUint16(offset, NETWORK_KEY_FIELD_ID, false); // Big endian
    offset += 2;
    view.setUint16(offset, networkKeySize, false); // Big endian
    offset += 2;
    fullView.set(networkKeyBytes, offset); // Use the full view to set the bytes

    return buffer;
}

export function bufferToBytes(arrayBuffer) {
    const uint8Array = new Uint8Array(arrayBuffer);
    return Array.from(uint8Array);
}
