import { createConnection, Socket } from "net";
import { InterpreterProvider } from './interpreters';

export class PythonInterpreterProvider implements InterpreterProvider {
    private port: number;
    private connection?: Socket;
    public onReceive: (data: string) => void;
    public onError: (error: Error) => void;
    public onDisconnect: () => void;

    constructor(port: number,
        onReceive: (data: string) => void,
        onError: (error: Error) => void,
        onDisconnect: () => void) {
        this.port = port;
        this.onReceive = onReceive;
        this.onError = onError;
        this.onDisconnect = onDisconnect;
    }

    async connect(): Promise<any> {
        this.connection = createConnection({ port: this.port }, () => {
            return new Promise((resolve, _) => {
                resolve();
            });
        });

        this.connection.on('error', (e: Error) => {
            this.onError(e);
        });

        this.connection.on('data', (d: Buffer) => {
            this.onReceive(d.toString());
        });

        this.connection.on('end', () => {
            this.onDisconnect();
        });
    }

    send(data: string): void {
        if (!this.connection) {
            throw new Error("No connection to server. Did you call `connect()`?");
        }

        this.connection!.write(data);
    }
}