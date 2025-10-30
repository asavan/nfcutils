import {dataViewToHexString} from "./common.js";

export function hexToU8(str) {
    if (globalThis.Buffer) {
        return Uint8Array.from(globalThis.Buffer.from(str, "hex"));
    }
    return Uint8Array.fromHex(str);
}

const CREDENTIAL_FIELD_ID = 0x100E;
const SSID_FIELD_ID = 0x1045;
const AUTH_TYPE_FIELD_ID = 0x1003;
const AUTH_TYPE_WPA2_PSK = 0x0020;
const NETWORK_KEY_FIELD_ID = 0x1027;
const NETWORK_INDEX_ID = parseInt("0x1026", 16);
const ENCRYPTION_TYPE_ID = parseInt("0x100F", 16);
const MAC_ADDRESS_ID = parseInt("0x1020", 16);

const AUTH_TYPE_OPEN = 0;
const AUTH_TYPE_WPA_PSK = parseInt("0x0002", 16);
const AUTH_TYPE_WPA_EAP = parseInt("0x0008", 16);
const AUTH_TYPE_WPA2_EAP = parseInt("0x0010", 16);
const AUTH_TYPE_WPA_WPA2_PERSONAL = parseInt("0x0022", 16);

const tlvTypes = {
    CREDENTIAL_FIELD_ID,
    SSID_FIELD_ID,
    AUTH_TYPE_FIELD_ID,
    AUTH_TYPE_WPA2_PSK,
    NETWORK_KEY_FIELD_ID,
    NETWORK_INDEX_ID,
    ENCRYPTION_TYPE_ID,
    MAC_ADDRESS_ID,
    AUTH_TYPE_OPEN,
    AUTH_TYPE_WPA_PSK,
    AUTH_TYPE_WPA_EAP,
    AUTH_TYPE_WPA2_EAP,
    AUTH_TYPE_WPA_WPA2_PERSONAL
};

const idToName = new Map();
function initNames() {
    for (const [key, value] of Object.entries(tlvTypes)) {
        idToName.set(value, key);
    }
}

initNames();

const textTypes = new Set([
    SSID_FIELD_ID,
    NETWORK_KEY_FIELD_ID
]);

const recurrTypes = new Set([
    CREDENTIAL_FIELD_ID
]);

function isTextField(type) {
    return textTypes.has(type);
}

function isRecurrType(type) {
    return recurrTypes.has(type);
}

export function readDataView(dataView, level, logger) {
    if (dataView.byteLength <= 4) {
        console.error("bad view");
        return;
    }
    // console.log("readDataView", level, dataView.byteLength, dataView.byteOffset);
    const textDecoder = new TextDecoder();
    let offset = 0;
    const type = dataView.getUint16(offset);
    const type1 = dataView.getUint8(offset);
    const type2 = dataView.getUint8(offset + 1);
    offset += 2;
    if (!idToName.has(type)) {
        console.log("Unknown type", type.toString(16), type1, type2);
    }
    const size = dataView.getUint16(offset);
    // console.log("data size " + size);
    console.assert(size > 0, "Bad size");
    offset += 2;
    console.assert(size <= dataView.byteLength - offset, "Bad size");
    if (size === 0 || dataView.byteLength < offset + size) {
        console.error("Bad size", size);
        return;
    }
    const rest = new DataView(dataView.buffer, dataView.byteOffset + offset, size);
    if (isRecurrType(type)) {
        console.log(idToName.get(type));
        // console.log(dataViewToHexString(rest));
        console.group();
        readDataView(rest, level + 1, logger);
        console.groupEnd();
    } else {
        if (isTextField(type)) {
            const str = textDecoder.decode(rest);
            logger.log(idToName.get(type), str);
        } else if (size === 2) {
            const intVal = rest.getUint16(0);
            const val = idToName.get(intVal);
            if (val) {
                console.log(idToName.get(type), val);
            } else {
                console.log("Unknown type " + idToName.get(type) + " " + intVal.toString(16));
            }
        } else {
            console.log(idToName.get(type), "non text", dataViewToHexString(rest));
        }
    }
    offset += size;
    if (dataView.byteLength > offset) {
        // console.log("rest some data");
        const rest = new DataView(dataView.buffer, dataView.byteOffset + offset, dataView.byteLength - offset);
        readDataView(rest, level, logger);
    } else if (dataView.byteLength < offset) {
        console.error("BAD data");
    } else {
        // console.log("Done");
    }
}
