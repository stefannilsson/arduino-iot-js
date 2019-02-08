/*
* Copyright 2018 ARDUINO SA (http://www.arduino.cc/)
* This file is part of arduino-iot-js.
* Copyright (c) 2018
* Authors: Fabrizio Mirabito
*
* This software is released under:
* The GNU General Public License, which covers the main part of
* arduino-iot-js
* The terms of this license can be found at:
* https://www.gnu.org/licenses/gpl-3.0.en.html
*
* You can be released from the requirements of the above licenses by purchasing
* a commercial license. Buying such a license is mandatory if you want to modify or
* otherwise use the software for commercial activities involving the Arduino
* software without disclosing the source code of your own applications. To purchase
* a commercial license, send an email to license@arduino.cc.
*
*/
const ArduinoCloud = require('../dist/index.js');

const deviceId = '1f4ced70-53ad-4b29-b221-1b0abbdfc757';
const timestamp = 1536743296;

const base64toHEX = (base64) => {
  const raw = atob(base64);
  let HEX = '';
  for (let i = 0; i < raw.length; i += 1) {
    const hex = raw.charCodeAt(i).toString(16);
    const hexPart = (hex.length === 2 ? hex : `0${hex}`).toUpperCase();
    HEX += `0x${hexPart},`;
  }
  return HEX;
};


describe('Test CBOR encoding using CloudProtocol v1', () => {
  beforeAll(() => ArduinoCloud.connect({
    // eslint-disable-next-line no-undef
    token,
    useCloudProtocolV2: false,
    onDisconnect: (message) => {
      if (message.errorCode !== 0) {
        throw Error(message);
      }
    },
  }));

  afterAll(() => ArduinoCloud.disconnect());


  // CloudProtocol v1

  it('Generate a valid cbor for a senml string property with basename', () => {
    const output = '0x81,0xA4,0x62,0x62,0x74,0x1A,0x5B,0x98,0xD7,0x80,0x61,0x6E,0x6B,0x74,0x65,0x73,0x74,0x5F,0x73,0x74,0x72,0x69,0x6E,0x67,0x62,0x62,0x6E,0x78,0x2D,0x75,0x72,0x6E,0x3A,0x75,0x75,0x69,0x64,0x3A,0x31,0x66,0x34,0x63,0x65,0x64,0x37,0x30,0x2D,0x35,0x33,0x61,0x64,0x2D,0x34,0x62,0x32,0x39,0x2D,0x62,0x32,0x32,0x31,0x2D,0x31,0x62,0x30,0x61,0x62,0x62,0x64,0x66,0x63,0x37,0x35,0x37,0x62,0x76,0x73,0x71,0x74,0x65,0x73,0x74,0x5F,0x73,0x74,0x72,0x69,0x6E,0x67,0x20,0x76,0x61,0x6C,0x75,0x65,';
    const senMl = ArduinoCloud.getSenml(deviceId, 'test_string', 'test_string value', timestamp, false);
    console.log([senMl]);
    const cborbase64 = ArduinoCloud.getCborValue([senMl], false);
    console.log(cborbase64);
    const cborHex = base64toHEX(cborbase64);
    console.log(cborHex);
    expect(cborHex).toStrictEqual(output);
  });

  it('Generate a valid cbor for a senml string property without basename', () => {
    const output = '0x81,0xA3,0x62,0x62,0x74,0x1A,0x5B,0x98,0xD7,0x80,0x61,0x6E,0x6B,0x74,0x65,0x73,0x74,0x5F,0x73,0x74,0x72,0x69,0x6E,0x67,0x62,0x76,0x73,0x71,0x74,0x65,0x73,0x74,0x5F,0x73,0x74,0x72,0x69,0x6E,0x67,0x20,0x76,0x61,0x6C,0x75,0x65,';
    const senMl = ArduinoCloud.getSenml(null, 'test_string', 'test_string value', timestamp, false);
    console.log([senMl]);
    const cborbase64 = ArduinoCloud.getCborValue([senMl], false);
    console.log(cborbase64);
    const cborHex = base64toHEX(cborbase64);
    console.log(cborHex);
    expect(cborHex).toStrictEqual(output);
  });


  it('Generate a valid cbor for a senml unsigned int property with basename', () => {
    const output = '0x81,0xA4,0x62,0x62,0x74,0x1A,0x5B,0x98,0xD7,0x80,0x61,0x6E,0x69,0x74,0x65,0x73,0x74,0x5F,0x75,0x69,0x6E,0x74,0x62,0x62,0x6E,0x78,0x2D,0x75,0x72,0x6E,0x3A,0x75,0x75,0x69,0x64,0x3A,0x31,0x66,0x34,0x63,0x65,0x64,0x37,0x30,0x2D,0x35,0x33,0x61,0x64,0x2D,0x34,0x62,0x32,0x39,0x2D,0x62,0x32,0x32,0x31,0x2D,0x31,0x62,0x30,0x61,0x62,0x62,0x64,0x66,0x63,0x37,0x35,0x37,0x61,0x76,0x03,';
    const senMl = ArduinoCloud.getSenml(deviceId, 'test_uint', 3, timestamp, false);
    console.log([senMl]);
    const cborbase64 = ArduinoCloud.getCborValue([senMl], false);
    console.log(cborbase64);
    const cborHex = base64toHEX(cborbase64);
    console.log(cborHex);
    expect(cborHex).toStrictEqual(output);
  });


  it('Generate a valid cbor for a senml unsigned int property without basename', () => {
    const output = '0x81,0xA3,0x62,0x62,0x74,0x1A,0x5B,0x98,0xD7,0x80,0x61,0x6E,0x69,0x74,0x65,0x73,0x74,0x5F,0x75,0x69,0x6E,0x74,0x61,0x76,0x03,';
    const senMl = ArduinoCloud.getSenml(null, 'test_uint', 3, timestamp, false);
    console.log([senMl]);
    const cborbase64 = ArduinoCloud.getCborValue([senMl], false);
    console.log(cborbase64);
    const cborHex = base64toHEX(cborbase64);
    console.log(cborHex);
    expect(cborHex).toStrictEqual(output);
  });

  it('Generate a valid cbor for a senml signed int property with basename', () => {
    const output = '0x81,0xA4,0x62,0x62,0x74,0x1A,0x5B,0x98,0xD7,0x80,0x61,0x6E,0x69,0x74,0x65,0x73,0x74,0x5F,0x73,0x69,0x6E,0x74,0x62,0x62,0x6E,0x78,0x2D,0x75,0x72,0x6E,0x3A,0x75,0x75,0x69,0x64,0x3A,0x31,0x66,0x34,0x63,0x65,0x64,0x37,0x30,0x2D,0x35,0x33,0x61,0x64,0x2D,0x34,0x62,0x32,0x39,0x2D,0x62,0x32,0x32,0x31,0x2D,0x31,0x62,0x30,0x61,0x62,0x62,0x64,0x66,0x63,0x37,0x35,0x37,0x61,0x76,0x22,';
    const senMl = ArduinoCloud.getSenml(deviceId, 'test_sint', -3, timestamp, false);
    console.log([senMl]);
    const cborbase64 = ArduinoCloud.getCborValue([senMl], false);
    console.log(cborbase64);
    const cborHex = base64toHEX(cborbase64);
    console.log(cborHex);
    expect(cborHex).toStrictEqual(output);
  });

  it('Generate a valid cbor for a senml signed int property without basename', () => {
    const output = '0x81,0xA3,0x62,0x62,0x74,0x1A,0x5B,0x98,0xD7,0x80,0x61,0x6E,0x69,0x74,0x65,0x73,0x74,0x5F,0x73,0x69,0x6E,0x74,0x61,0x76,0x22,';
    const senMl = ArduinoCloud.getSenml(null, 'test_sint', -3, timestamp, false);
    console.log([senMl]);
    const cborbase64 = ArduinoCloud.getCborValue([senMl], false);
    console.log(cborbase64);
    const cborHex = base64toHEX(cborbase64);
    console.log(cborHex);
    expect(cborHex).toStrictEqual(output);
  });


  it('Generate a valid cbor for a senml float property with basename', () => {
    const output = '0x81,0xA4,0x62,0x62,0x74,0x1A,0x5B,0x98,0xD7,0x80,0x61,0x6E,0x6A,0x74,0x65,0x73,0x74,0x5F,0x66,0x6C,0x6F,0x61,0x74,0x62,0x62,0x6E,0x78,0x2D,0x75,0x72,0x6E,0x3A,0x75,0x75,0x69,0x64,0x3A,0x31,0x66,0x34,0x63,0x65,0x64,0x37,0x30,0x2D,0x35,0x33,0x61,0x64,0x2D,0x34,0x62,0x32,0x39,0x2D,0x62,0x32,0x32,0x31,0x2D,0x31,0x62,0x30,0x61,0x62,0x62,0x64,0x66,0x63,0x37,0x35,0x37,0x61,0x76,0xFB,0x40,0x0C,0x00,0x00,0x00,0x00,0x00,0x00,';
    const senMl = ArduinoCloud.getSenml(deviceId, 'test_float', 3.5, timestamp, false);
    console.log([senMl]);
    const cborbase64 = ArduinoCloud.getCborValue([senMl], false);
    console.log(cborbase64);
    const cborHex = base64toHEX(cborbase64);
    console.log(cborHex);
    expect(cborHex).toStrictEqual(output);
  });

  it('Generate a valid cbor for a senml float property without basename', () => {
    const output = '0x81,0xA3,0x62,0x62,0x74,0x1A,0x5B,0x98,0xD7,0x80,0x61,0x6E,0x6A,0x74,0x65,0x73,0x74,0x5F,0x66,0x6C,0x6F,0x61,0x74,0x61,0x76,0xFB,0x40,0x0C,0x00,0x00,0x00,0x00,0x00,0x00,';
    const senMl = ArduinoCloud.getSenml(null, 'test_float', 3.5, timestamp, false);
    console.log([senMl]);
    const cborbase64 = ArduinoCloud.getCborValue([senMl], false);
    console.log(cborbase64);
    const cborHex = base64toHEX(cborbase64);
    console.log(cborHex);
    expect(cborHex).toStrictEqual(output);
  });


  it('Generate a valid cbor for a senml double property with basename', () => {
    const output = '0x81,0xA4,0x62,0x62,0x74,0x1A,0x5B,0x98,0xD7,0x80,0x61,0x6E,0x6B,0x74,0x65,0x73,0x74,0x5F,0x64,0x6F,0x75,0x62,0x6C,0x65,0x62,0x62,0x6E,0x78,0x2D,0x75,0x72,0x6E,0x3A,0x75,0x75,0x69,0x64,0x3A,0x31,0x66,0x34,0x63,0x65,0x64,0x37,0x30,0x2D,0x35,0x33,0x61,0x64,0x2D,0x34,0x62,0x32,0x39,0x2D,0x62,0x32,0x32,0x31,0x2D,0x31,0x62,0x30,0x61,0x62,0x62,0x64,0x66,0x63,0x37,0x35,0x37,0x61,0x76,0xFB,0x40,0x08,0xFC,0xD6,0xE9,0xBA,0x37,0xB3,';
    const senMl = ArduinoCloud.getSenml(deviceId, 'test_double', 3.1234567890123456, timestamp, false);
    console.log([senMl]);
    const cborbase64 = ArduinoCloud.getCborValue([senMl], false);
    console.log(cborbase64);
    const cborHex = base64toHEX(cborbase64);
    console.log(cborHex);
    expect(cborHex).toStrictEqual(output);
  });

  it('Generate a valid cbor for a senml double property without basename', () => {
    const output = '0x81,0xA3,0x62,0x62,0x74,0x1A,0x5B,0x98,0xD7,0x80,0x61,0x6E,0x6B,0x74,0x65,0x73,0x74,0x5F,0x64,0x6F,0x75,0x62,0x6C,0x65,0x61,0x76,0xFB,0x40,0x08,0xFC,0xD6,0xE9,0xBA,0x37,0xB3,';
    const senMl = ArduinoCloud.getSenml(null, 'test_double', 3.1234567890123456, timestamp, false);
    console.log([senMl]);
    const cborbase64 = ArduinoCloud.getCborValue([senMl], false);
    console.log(cborbase64);
    const cborHex = base64toHEX(cborbase64);
    console.log(cborHex);
    expect(cborHex).toStrictEqual(output);
  });

  it('Generate a valid cbor for a senml boolean property with basename', () => {
    const output = '0x81,0xA4,0x62,0x62,0x74,0x1A,0x5B,0x98,0xD7,0x80,0x61,0x6E,0x69,0x74,0x65,0x73,0x74,0x5F,0x62,0x6F,0x6F,0x6C,0x62,0x62,0x6E,0x78,0x2D,0x75,0x72,0x6E,0x3A,0x75,0x75,0x69,0x64,0x3A,0x31,0x66,0x34,0x63,0x65,0x64,0x37,0x30,0x2D,0x35,0x33,0x61,0x64,0x2D,0x34,0x62,0x32,0x39,0x2D,0x62,0x32,0x32,0x31,0x2D,0x31,0x62,0x30,0x61,0x62,0x62,0x64,0x66,0x63,0x37,0x35,0x37,0x62,0x76,0x62,0xF5,';
    const senMl = ArduinoCloud.getSenml(deviceId, 'test_bool', true, timestamp, false);
    console.log([senMl]);
    const cborbase64 = ArduinoCloud.getCborValue([senMl], false);
    console.log(cborbase64);
    const cborHex = base64toHEX(cborbase64);
    console.log(cborHex);
    expect(cborHex).toStrictEqual(output);
  });

  it('Generate a valid cbor for a senml boolean property without basename', () => {
    const output = '0x81,0xA3,0x62,0x62,0x74,0x1A,0x5B,0x98,0xD7,0x80,0x61,0x6E,0x69,0x74,0x65,0x73,0x74,0x5F,0x62,0x6F,0x6F,0x6C,0x62,0x76,0x62,0xF5,';
    const senMl = ArduinoCloud.getSenml(null, 'test_bool', true, timestamp, false);
    console.log([senMl]);
    const cborbase64 = ArduinoCloud.getCborValue([senMl], false);
    console.log(cborbase64);
    const cborHex = base64toHEX(cborbase64);
    console.log(cborHex);
    expect(cborHex).toStrictEqual(output);
  });


  it('Generate a valid cbor for multiple properties with basename', () => {
    const output = '0x86,0xA4,0x62,0x62,0x74,0x1A,0x5B,0x98,0xD7,0x80,0x61,0x6E,0x69,0x74,0x65,0x73,0x74,0x5F,0x75,0x69,0x6E,0x74,0x62,0x62,0x6E,0x78,0x2D,0x75,0x72,0x6E,0x3A,0x75,0x75,0x69,0x64,0x3A,0x31,0x66,0x34,0x63,0x65,0x64,0x37,0x30,0x2D,0x35,0x33,0x61,0x64,0x2D,0x34,0x62,0x32,0x39,0x2D,0x62,0x32,0x32,0x31,0x2D,0x31,0x62,0x30,0x61,0x62,0x62,0x64,0x66,0x63,0x37,0x35,0x37,0x61,0x76,0x04,0xA4,0x62,0x62,0x74,0x1A,0x5B,0x98,0xD7,0x80,0x61,0x6E,0x69,0x74,0x65,0x73,0x74,0x5F,0x73,0x69,0x6E,0x74,0x62,0x62,0x6E,0x78,0x2D,0x75,0x72,0x6E,0x3A,0x75,0x75,0x69,0x64,0x3A,0x31,0x66,0x34,0x63,0x65,0x64,0x37,0x30,0x2D,0x35,0x33,0x61,0x64,0x2D,0x34,0x62,0x32,0x39,0x2D,0x62,0x32,0x32,0x31,0x2D,0x31,0x62,0x30,0x61,0x62,0x62,0x64,0x66,0x63,0x37,0x35,0x37,0x61,0x76,0x23,0xA4,0x62,0x62,0x74,0x1A,0x5B,0x98,0xD7,0x80,0x61,0x6E,0x6A,0x74,0x65,0x73,0x74,0x5F,0x66,0x6C,0x6F,0x61,0x74,0x62,0x62,0x6E,0x78,0x2D,0x75,0x72,0x6E,0x3A,0x75,0x75,0x69,0x64,0x3A,0x31,0x66,0x34,0x63,0x65,0x64,0x37,0x30,0x2D,0x35,0x33,0x61,0x64,0x2D,0x34,0x62,0x32,0x39,0x2D,0x62,0x32,0x32,0x31,0x2D,0x31,0x62,0x30,0x61,0x62,0x62,0x64,0x66,0x63,0x37,0x35,0x37,0x61,0x76,0xFB,0x40,0x12,0x00,0x00,0x00,0x00,0x00,0x00,0xA4,0x62,0x62,0x74,0x1A,0x5B,0x98,0xD7,0x80,0x61,0x6E,0x6B,0x74,0x65,0x73,0x74,0x5F,0x73,0x74,0x72,0x69,0x6E,0x67,0x62,0x62,0x6E,0x78,0x2D,0x75,0x72,0x6E,0x3A,0x75,0x75,0x69,0x64,0x3A,0x31,0x66,0x34,0x63,0x65,0x64,0x37,0x30,0x2D,0x35,0x33,0x61,0x64,0x2D,0x34,0x62,0x32,0x39,0x2D,0x62,0x32,0x32,0x31,0x2D,0x31,0x62,0x30,0x61,0x62,0x62,0x64,0x66,0x63,0x37,0x35,0x37,0x62,0x76,0x73,0x6A,0x74,0x65,0x73,0x74,0x20,0x76,0x61,0x6C,0x75,0x65,0xA4,0x62,0x62,0x74,0x1A,0x5B,0x98,0xD7,0x80,0x61,0x6E,0x69,0x74,0x65,0x73,0x74,0x5F,0x62,0x6F,0x6F,0x6C,0x62,0x62,0x6E,0x78,0x2D,0x75,0x72,0x6E,0x3A,0x75,0x75,0x69,0x64,0x3A,0x31,0x66,0x34,0x63,0x65,0x64,0x37,0x30,0x2D,0x35,0x33,0x61,0x64,0x2D,0x34,0x62,0x32,0x39,0x2D,0x62,0x32,0x32,0x31,0x2D,0x31,0x62,0x30,0x61,0x62,0x62,0x64,0x66,0x63,0x37,0x35,0x37,0x62,0x76,0x62,0xF5,0xA4,0x62,0x62,0x74,0x1A,0x5B,0x98,0xD7,0x80,0x61,0x6E,0x6B,0x74,0x65,0x73,0x74,0x5F,0x64,0x6F,0x75,0x62,0x6C,0x65,0x62,0x62,0x6E,0x78,0x2D,0x75,0x72,0x6E,0x3A,0x75,0x75,0x69,0x64,0x3A,0x31,0x66,0x34,0x63,0x65,0x64,0x37,0x30,0x2D,0x35,0x33,0x61,0x64,0x2D,0x34,0x62,0x32,0x39,0x2D,0x62,0x32,0x32,0x31,0x2D,0x31,0x62,0x30,0x61,0x62,0x62,0x64,0x66,0x63,0x37,0x35,0x37,0x61,0x76,0xFB,0x7F,0xEF,0xFF,0xFC,0x57,0xCA,0x82,0xAE,';
    const senMlUInt = ArduinoCloud.getSenml(deviceId, 'test_uint', 4, timestamp, false);
    const senMlSInt = ArduinoCloud.getSenml(deviceId, 'test_sint', -4, timestamp, false);
    const senMlFloat = ArduinoCloud.getSenml(deviceId, 'test_float', 4.5, timestamp, false);
    const senMlString = ArduinoCloud.getSenml(deviceId, 'test_string', 'test value', timestamp, false);
    const senMlBool = ArduinoCloud.getSenml(deviceId, 'test_bool', true, timestamp, false);
    const senMlDouble = ArduinoCloud.getSenml(deviceId, 'test_double', 1.79769e+308, timestamp, false);
    const senMl = [senMlUInt, senMlSInt, senMlFloat, senMlString, senMlBool, senMlDouble];
    console.log(senMl);
    const cborbase64 = ArduinoCloud.getCborValue(senMl, false);
    console.log(cborbase64);
    const cborHex = base64toHEX(cborbase64);
    console.log(cborHex);
    expect(cborHex).toStrictEqual(output);
  });


  it('Generate a valid cbor for multiple properties with basename', () => {
    const output = '0x86,0xA3,0x62,0x62,0x74,0x1A,0x5B,0x98,0xD7,0x80,0x61,0x6E,0x69,0x74,0x65,0x73,0x74,0x5F,0x75,0x69,0x6E,0x74,0x61,0x76,0x04,0xA3,0x62,0x62,0x74,0x1A,0x5B,0x98,0xD7,0x80,0x61,0x6E,0x69,0x74,0x65,0x73,0x74,0x5F,0x73,0x69,0x6E,0x74,0x61,0x76,0x23,0xA3,0x62,0x62,0x74,0x1A,0x5B,0x98,0xD7,0x80,0x61,0x6E,0x6A,0x74,0x65,0x73,0x74,0x5F,0x66,0x6C,0x6F,0x61,0x74,0x61,0x76,0xFB,0x40,0x12,0x00,0x00,0x00,0x00,0x00,0x00,0xA3,0x62,0x62,0x74,0x1A,0x5B,0x98,0xD7,0x80,0x61,0x6E,0x6B,0x74,0x65,0x73,0x74,0x5F,0x73,0x74,0x72,0x69,0x6E,0x67,0x62,0x76,0x73,0x6A,0x74,0x65,0x73,0x74,0x20,0x76,0x61,0x6C,0x75,0x65,0xA3,0x62,0x62,0x74,0x1A,0x5B,0x98,0xD7,0x80,0x61,0x6E,0x69,0x74,0x65,0x73,0x74,0x5F,0x62,0x6F,0x6F,0x6C,0x62,0x76,0x62,0xF5,0xA3,0x62,0x62,0x74,0x1A,0x5B,0x98,0xD7,0x80,0x61,0x6E,0x6B,0x74,0x65,0x73,0x74,0x5F,0x64,0x6F,0x75,0x62,0x6C,0x65,0x61,0x76,0xFB,0x7F,0xEF,0xFF,0xFC,0x57,0xCA,0x82,0xAE,';
    const senMlUInt = ArduinoCloud.getSenml(null, 'test_uint', 4, timestamp, false);
    const senMlSInt = ArduinoCloud.getSenml(null, 'test_sint', -4, timestamp, false);
    const senMlFloat = ArduinoCloud.getSenml(null, 'test_float', 4.5, timestamp, false);
    const senMlString = ArduinoCloud.getSenml(null, 'test_string', 'test value', timestamp, false);
    const senMlBool = ArduinoCloud.getSenml(null, 'test_bool', true, timestamp, false);
    const senMlDouble = ArduinoCloud.getSenml(null, 'test_double', 1.79769e+308, timestamp, false);
    const senMl = [senMlUInt, senMlSInt, senMlFloat, senMlString, senMlBool, senMlDouble];
    console.log(senMl);
    const cborbase64 = ArduinoCloud.getCborValue(senMl, false);
    console.log(cborbase64);
    const cborHex = base64toHEX(cborbase64);
    console.log(cborHex);
    expect(cborHex).toStrictEqual(output);
  });
});
