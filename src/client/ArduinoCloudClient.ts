import { filter } from "rxjs/operators";
import { Subscription, Subject, Observable } from "rxjs";

import SenML from "../senML";
import Utils from "../utils";
import { IConnectionBuilder } from '../builder/IConnectionBuilder';
import { IConnection, CloudMessage } from "../connection/IConnection";
import { IArduinoCloudClient, CloudOptions, OnMessageCallback, CloudMessageValue } from "./IArduinoCloudClient";

const NOOP = () => null;
export class ArduinoCloudClient implements IArduinoCloudClient {
  private connection: IConnection;
  private subscriptions: { [key: string]: Subscription[] } = {};
  private callbacks: { [key: string]: OnMessageCallback<any>[] } = {};

  private options: CloudOptions = {
    ssl: false,
    host: 'wss.iot.arduino.cc',
    port: 8443,
    token: undefined,
    useCloudProtocolV2: false,
    onOffline: NOOP,
    onConnected: NOOP,
    onDisconnect: NOOP,
  };

  public static From(connection: IConnection): ArduinoCloudClient {
    const client = new ArduinoCloudClient();
    client.init(connection);
    return client;
  }

  constructor(private builders: IConnectionBuilder[] = []) { }

  public async connect(options: CloudOptions): Promise<IConnection> {
    this.options = { ...this.options, ...options };
    const builder = this.builders.find(b => b.canBuild(this.options));

    if (!builder) throw new Error('connection failed: options not valid');

    const connection = await builder.build(this.options)
    return this.init(connection);
  }

  private async init(connection: IConnection): Promise<IConnection> {
    if (this.connection) throw new Error('connection failed: connection already open');
    this.connection = connection;

    return new Promise<IConnection>(async (resolve, reject) => {
      this.connection.on('offline', () => this.options.onOffline());
      this.connection.on('disconnect', () => this.options.onDisconnect());
      this.connection.on('error', (err) => reject(new Utils.ArduinoCloudError(5, err.toString())));
      this.connection.on('connect', () => {
        this.options.onConnected();
        return resolve(this.connection);
      });
    });
  }

  public disconnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.connection) return reject(new Error('disconnection failed: connection closed'));

      try {
        this.connection.end(true);
      } catch (error) {
        return reject(error);
      }

      this.connection = null;
      Object.values(this.subscriptions).forEach((subs, topic) => {
        subs.forEach(sub => sub.unsubscribe())
        delete this.callbacks[topic];
        delete this.subscriptions[topic];
      });

      return resolve();
    });
  }

  public async reconnect(): Promise<void> {
    this.connection.reconnect();
  }

  public async updateToken(newToken: string): Promise<void> {
    while (true) {
      try {
        if (this.connection) {
          this.connection.end();
          this.connection = null;
        }

        await this.connect({ ...this.options, token: newToken });

        Object.keys(this.subscriptions).forEach(topic => {
          this.subscriptions[topic].forEach(sub => sub.unsubscribe());
          delete this.subscriptions[topic];

          const callbacks = [...this.callbacks[topic]];
          delete this.callbacks[topic];
          callbacks.forEach(cb => this.subscribe(topic, cb));
        })

        const { onConnected = NOOP } = this.options;
        onConnected();
        return;
      } catch (error) {
        console.error(error);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  public subscribe<T extends CloudMessageValue>(topic: string, cb: OnMessageCallback<T>): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.callbacks[topic] = this.callbacks[topic] = [];
        this.callbacks[topic].push(cb);

        this.subscriptions[topic] = this.subscriptions[topic] = [];
        this.subscriptions[topic].push(
          this.messagesFrom(topic)
            .subscribe(v => cb(v.value as T)));

        return resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  public unsubscribe(topic: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.connection) return reject(new Error('unsubscribe failed: no connection found'));

      return this.connection.unsubscribe(topic, null, (err) => err ? reject() : resolve());
    });
  }

  public sendMessage(topic: string, message: string | ArrayBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.connection) return reject(new Error('send message failed: no connection found'));

      const body = Utils.isString(message) ? Buffer.from(message, 'utf8') : message;
      this.connection.publish(topic, Utils.toBuffer(body), { qos: 1, retain: false });
      return resolve();
    });
  }

  public openCloudMonitor<T extends CloudMessageValue>(deviceId: string, cb: OnMessageCallback<T>): Promise<void> {
    return this.subscribe(`/a/d/${deviceId}/s/o`, cb);
  }

  public writeCloudMonitor(deviceId: string, message: string | ArrayBuffer): Promise<void> {
    return this.sendMessage(`/a/d/${deviceId}/s/i`, message);
  }

  public closeCloudMonitor(deviceId: string): Promise<void> {
    return this.unsubscribe(`/a/d/${deviceId}/s/o`);
  }

  public async sendProperty<T extends CloudMessageValue>(thingId: string, name: string, value: T, timestamp: number = new Date().getTime()): Promise<void> {
    const topic = `/a/t/${thingId}/e/i`;
    const values = SenML.parse(name, value, timestamp, this.options.useCloudProtocolV2, null);
    return this.sendMessage(topic, SenML.CBOR.encode(Utils.isArray(values) ? values : [values], true));
  }

  public async onPropertyValue<T extends CloudMessageValue>(thingId: string, name: string, cb: OnMessageCallback<T>): Promise<void> {
    if (!name) throw new Error('Invalid property name');
    if (typeof cb !== 'function') throw new Error('Invalid callback');

    const topic = `/a/t/${thingId}/e/o`;

    this.callbacks[topic] = this.callbacks[topic] = [];
    this.subscriptions[topic] = this.subscriptions[topic] = [];

    this.callbacks[topic].push(cb);
    this.subscriptions[topic].push(
      this.messagesFrom(topic)
        .pipe(filter(v => v.propertyName === name))
        .subscribe(v => cb(v.value as T)));
  }

  private messagesFrom(topic: string): Observable<CloudMessage> {
    if (!this.connection) throw new Error('subscription failed: no connection found');

    let subscription: Subscription;
    const subject = new Subject<CloudMessage>();
    this.connection.subscribe(topic, (err) => {
      if (err) throw new Error(`subscription failed: ${err.toString()}`);

      subscription = this.connection.messages
        .pipe(filter(v => v.topic === topic))
        .subscribe(v => subject.next(v));
    });

    const originalMethod = subject.unsubscribe;
    subject.unsubscribe = () => {
      subscription.unsubscribe();
      originalMethod();
    }
    return subject;
  }
}
