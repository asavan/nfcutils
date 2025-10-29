"use strict";

import test from "node:test";
import assert from "node:assert/strict";
import {hexToU8, readDataView} from "../src/js/tlv_reader.js";
import {dataViewToHexString} from "../src/js/common.js";

test("read tlv MAY BEACH", () => {
    /* eslint-disable */
    const data = "100e003d1026000101104500124d415920424541434820484f54454c205433100300020020100f0002000810270008313233343536373810200006ffffffffffff";
    /* eslint-enable */
    const u8 = hexToU8(data);
    const dataView = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);

    const str = dataViewToHexString(dataView);
    assert.equal(data, str);
    readDataView(dataView);
    assert.equal(1, 1);
});

test("read tlv serb", () => {
    /* eslint-disable */
    const data = "100e00341026000101104500086c756b6963203547100300020022100f00020008102700096d6f6a61626f72626110200006ffffffffffff";
    /* eslint-enable */
    const u8 = hexToU8(data);
    const dataView = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);

    const str = dataViewToHexString(dataView);
    assert.equal(data, str);
    readDataView(dataView);
    assert.equal(1, 1);
});
