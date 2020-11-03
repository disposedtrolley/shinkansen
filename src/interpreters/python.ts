import { createConnection, Socket } from "net";
import { InterpreterProvider, InterpreterResult } from './interpreters';

/**
 * The PythonInterpreterProvider establishes a connection to a remote Python 3 
 * REPL.
 */
export class PythonInterpreterProvider implements InterpreterProvider {
    private port: number;
    private connection?: Socket;
    public onReceive: (data: InterpreterResult) => void;
    public onError: (error: Error) => void;
    public onDisconnect: () => void;

    constructor(port: number,
        onReceive: (data: InterpreterResult) => void,
        onError: (error: Error) => void,
        onDisconnect: () => void) {
        this.port = port;
        this.onReceive = onReceive;
        this.onError = onError;
        this.onDisconnect = onDisconnect;
    }

    /**
     * Returns an empty promise (heh) when the connection is successful.
     * Internally establishes all required callbacks to interact with the socket.
     */
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
            const json = JSON.parse(d.toString());
            this.onReceive({
                locals: json["locals"],
                lastExprResult: json["last_expr_result"],
                lastExprError: json["last_expr_error"],
                incomplete: json["incomplete"]
            });
        });

        this.connection.on('end', () => {
            this.onDisconnect();
        });
    }

    /**
     * Attempts to send a string to the remote REPL. Throws an error if the
     * socket connection hasn't been initialised yet, i.e. if `connect()`
     * hasn't been called.
     * @param data String to send to the remote REPL.
     */
    send(data: string): void {
        if (!this.connection) {
            throw new Error("No connection to server. Did you call `connect()`?");
        }

        this.connection!.write(data);
    }
}