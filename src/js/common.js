export function arrayBufferToHexString(buffer) {
    // Create a Uint8Array view of the ArrayBuffer
    const uint8Array = new Uint8Array(buffer);

    // Use Array.from and map to convert each byte to a hex string
    // padStart(2, '0') ensures each hex value is two digits (e.g., '0A' instead of 'A')
    const hexString = Array.from(uint8Array)
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");

    return hexString;
}

export function dataViewToHexString(dataView) {
    let hexString = "";
    for (let i = 0; i < dataView.byteLength; i++) {
        // Get the byte at the current offset
        const byte = dataView.getUint8(i);

        // Convert the byte to a hexadecimal string
        // .toString(16) converts to hex
        // .padStart(2, '0') ensures two digits (e.g., 5 becomes "05")
        const hexByte = byte.toString(16).padStart(2, "0");

        // Append to the overall hex string
        hexString += hexByte;
    }
    return hexString;
}
