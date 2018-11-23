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

import Paho from 'paho-client';
import CBOR from 'cbor-js';

import ArduinoCloudError from './ArduinoCloudError';

const connections = {};
const propertyCallback = {};
const arduinoCloudPort = 8443;
const arduinoCloudHost = 'wss.iot.arduino.cc';
const arduinoAuthURL = 'https://auth.arduino.cc';

const getUserId = (apiUrl, token) => fetch(apiUrl, {
  method: 'get',
  headers: new Headers({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }),
}).then(res => res.json());


// Connect establishes a connection with mqtt, using token as the password, and returns a promise
// of a Symbol identifying the mqtt client
const connect = options => new Promise((resolve, reject) => {
  let ssl = false;
  if (options.ssl !== false) {
    ssl = true;
  }
  const opts = {
    host: options.host || arduinoCloudHost,
    port: options.port || arduinoCloudPort,
    apiUrl: options.apiUrl || arduinoAuthURL,
    ssl,
    token: options.token,
    onDisconnect: options.onDisconnect,
    onTrace: options.onTrace,
  };

  if (!opts.host) {
    return reject(new Error('connection failed: you need to provide a valid host (broker)'));
  }

  if (!opts.token) {
    return reject(new Error('connection failed: you need to provide a valid token'));
  }

  if (!opts.apiUrl) {
    return reject(new Error('no apiUrl parameter is provided'));
  }

  return getUserId(`${opts.apiUrl}/v1/users/byID/me`, options.token).then((res) => {
    const clientID = `${res.id}:${new Date().getTime()}`;
    const client = new Paho.Client(opts.host, opts.port, clientID);
    client.topics = {};
    client.properties = {};

    client.onMessageArrived = (msg) => {
      if (msg.topic.indexOf('/s/o') > -1) {
        client.topics[msg.topic].forEach((cb) => {
          cb(msg.payloadString);
        });
      } else {
        const buf = new ArrayBuffer(msg.payloadBytes.length);
        const bufView = new Uint8Array(buf);
        for (let i = 0, strLen = msg.payloadBytes.length; i < strLen; i += 1) {
          bufView[i] = msg.payloadBytes[i];
        }

        const propertyValue = CBOR.decode(buf);
        propertyValue.forEach((p) => {
          if (propertyCallback[msg.topic][p.n]) {
            let value = null;

            if (!(p.v === undefined)) {
              value = p.v;
            } else if (!(p.vs === undefined)) {
              value = p.vs;
            } else if (!(p.vb === undefined)) {
              value = p.vb;
            }

            propertyCallback[msg.topic][p.n](value);
          }
        });
      }
    };

    if (typeof onDisconnect === 'function') {
      client.onConnectionLost = opts.onDisconnect;
    }

    const connectionOpts = {
      useSSL: opts.ssl,
      timeout: 30,
      mqttVersion: 4,
      userName: res.id,
      // password: token,
      mqttVersionExplicit: true,
      // If reconnect is set to true, in the event that the connection is lost, the client will
      // attempt to reconnect to the server. It will initially wait 1 second before it attempts
      // to reconnect, for every failed reconnect attempt, the delay will double until it is at
      // 2 minutes at which point the delay will stay at 2 minutes.
      reconnect: true,
      keepAliveInterval: 30,
      onSuccess: () => {
        const id = Symbol(clientID);
        connections[id] = client;
        return resolve(id);
      },
      onFailure: ({ errorCode, errorMessage }) => reject(
        new ArduinoCloudError(errorCode, errorMessage),
      ),
    };


    connectionOpts.password = opts.token;

    if (typeof opts.onTrace === 'function') {
      client.trace = (log) => {
        opts.onTrace(log);
      };
    }

    client.connect(connectionOpts);
  }, (error) => {
    throw new Error(error);
  });
});

const disconnect = id => new Promise((resolve, reject) => {
  const client = connections[id];
  if (!client) {
    return reject(new Error('disconnection failed: client not found'));
  }

  client.disconnect();
  return resolve();
});

const subscribe = (id, topic, cb) => new Promise((resolve, reject) => {
  const client = connections[id];
  if (!client) {
    return reject(new Error('disconnection failed: client not found'));
  }

  return client.subscribe(topic, {
    onSuccess: () => {
      if (!client.topics[topic]) {
        client.topics[topic] = [];
      }
      client.topics[topic].push(cb);
      return resolve(topic);
    },
    onFailure: () => reject(),
  });
});

const unsubscribe = (id, topic) => new Promise((resolve, reject) => {
  const client = connections[id];
  if (!client) {
    return reject(new Error('disconnection failed: client not found'));
  }

  return client.unsubscribe(topic, {
    onSuccess: () => resolve(topic),
    onFailure: () => reject(),
  });
});


const arrayBufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const sendMessage = (id, topic, message) => new Promise((resolve, reject) => {
  const client = connections[id];
  if (!client) {
    return reject(new Error('disconnection failed: client not found'));
  }

  client.publish(topic, message, 1, false);
  return resolve();
});

const openCloudMonitor = (id, deviceId, cb) => {
  const cloudMonitorOutputTopic = `/a/d/${deviceId}/s/o`;
  return subscribe(id, cloudMonitorOutputTopic, cb);
};

const writeCloudMonitor = (id, deviceId, message) => {
  const cloudMonitorInputTopic = `/a/d/${deviceId}/s/i`;
  return sendMessage(id, cloudMonitorInputTopic, message);
};

const closeCloudMonitor = (id, deviceId) => {
  const cloudMonitorOutputTopic = `/a/d/${deviceId}/s/o`;
  return unsubscribe(id, cloudMonitorOutputTopic);
};

const sendProperty = (connectionId, thingId, name, value, timestamp) => {
  const propertyInputTopic = `/a/t/${thingId}/e/i`;

  if (timestamp && !Number.isInteger(timestamp)) {
    throw new Error('Timestamp must be Integer');
  }

  if (name === undefined || typeof name !== 'string') {
    throw new Error('Name must be a valid string');
  }

  const cborValue = {
    bt: timestamp || new Date().getTime(),
    n: name,
  };

  switch (typeof value) {
    case 'string':
      cborValue.vs = value;
      break;
    case 'number':
      cborValue.v = value;
      break;
    case 'boolean':
      cborValue.vb = value;
      break;
    default:
      break;
  }

  return sendMessage(connectionId, propertyInputTopic, CBOR.encode([cborValue]));
};

const getSenml = (deviceId, name, value, timestamp) => {
  if (timestamp && !Number.isInteger(timestamp)) {
    throw new Error('Timestamp must be Integer');
  }

  if (name === undefined || typeof name !== 'string') {
    throw new Error('Name must be a valid string');
  }

  const senMl = {
    bt: timestamp || new Date().getTime(),
    n: name,
  };

  if (deviceId) {
    senMl.bn = `urn:uuid:${deviceId}`;
  }

  switch (typeof value) {
    case 'string':
      senMl.vs = value;
      break;
    case 'number':
      senMl.v = value;
      break;
    case 'boolean':
      senMl.vb = value;
      break;
    default:
      break;
  }
  return senMl;
};

const getCborValue = (senMl) => {
  const cborEncoded = CBOR.encode(senMl);
  return arrayBufferToBase64(cborEncoded);
};

const sendPropertyAsDevice = (connectionId, deviceId, thingId, name, value, timestamp) => {
  const propertyInputTopic = `/a/t/${thingId}/e/o`;

  if (timestamp && !Number.isInteger(timestamp)) {
    throw new Error('Timestamp must be Integer');
  }

  if (name === undefined || typeof name !== 'string') {
    throw new Error('Name must be a valid string');
  }

  const senMlValue = getSenml(deviceId, name, value, timestamp);
  return sendMessage(connectionId, propertyInputTopic, CBOR.encode([senMlValue]));
};

const onPropertyValue = (connectionId, thingId, name, cb) => {
  if (!name) {
    throw new Error('Invalid property name');
  }
  if (typeof cb !== 'function') {
    throw new Error('Invalid callback');
  }
  const propOutputTopic = `/a/t/${thingId}/e/o`;

  if (!propertyCallback[propOutputTopic]) {
    propertyCallback[propOutputTopic] = {};
    propertyCallback[propOutputTopic][name] = cb;
    subscribe(connectionId, propOutputTopic, cb);
  } else if (propertyCallback[propOutputTopic] && !propertyCallback[propOutputTopic][name]) {
    propertyCallback[propOutputTopic][name] = cb;
  }
  return Promise.resolve(propOutputTopic);
};

export default {
  connect,
  disconnect,
  subscribe,
  unsubscribe,
  sendMessage,
  openCloudMonitor,
  writeCloudMonitor,
  closeCloudMonitor,
  sendProperty,
  sendPropertyAsDevice,
  onPropertyValue,
  getCborValue,
  getSenml,
  ArduinoCloudError,
};
