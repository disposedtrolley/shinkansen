import { createConnection, Socket } from "net";
import { spawn, ChildProcess } from 'child_process';
import { InterpreterProvider, InterpreterResult } from './interpreters';
import { hostname } from 'os';

/**
 * The PythonInterpreterProvider establishes a connection to a remote Python 3 
 * REPL.
 */
export class PythonInterpreterProvider implements InterpreterProvider {
    private port: number;
    private serverPath: string;
    private remoteProcess?: ChildProcess;
    private connection?: Socket;
    public onReceive: (data: InterpreterResult) => void;
    public onError: (error: Error) => void;
    public onDisconnect: () => void;

    constructor(
        serverPath: string,
        port: number,
        onReceive: (data: InterpreterResult) => void,
        onError: (error: Error) => void,
        onDisconnect: () => void) {

        this.serverPath = serverPath;
        this.port = port;
        this.onReceive = onReceive;
        this.onError = onError;
        this.onDisconnect = onDisconnect;
    }

    /**
     * Returns an empty promise (heh) when the connection is successful.
     * Internally establishes all required callbacks to interact with the socket.
     */
    connect(): Promise<any> {
        return new Promise((resolve, _) => {
            if (this.connection) { resolve(); };

            // @TODO this should use the full path of the Python 3 executable
            // currently selected in VSCode.
            this.remoteProcess = spawn('python3', [this.serverPath]);
            this.remoteProcess.stdout!.on('data', (data: string) => {
                console.log(`[Python REPL] stdout: ${data}`);

                // We'll know when the server has started by looking for the startup
                // message. @TODO this should be more robust!
                if (data.includes("Server listening on")) {
                    setTimeout(() => {
                        console.log('Python REPL is ready...');
                        this.connection = createConnection({ port: this.port }, () => {
                            resolve();
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

                    }, 1000);
                }
            });

            this.remoteProcess.stderr!.on('data', (data) => {
                console.error(`[Python REPL] stderr: ${data}`);
                this.onError(new Error(data));
            });

            this.remoteProcess!.on('close', (code) => {
                console.log(`[Python REPL] cexited with code ${code}`);
                this.onDisconnect();
            });
        });
    }

    disconnect(): void {
        // End the socket connection to the remote REPL, then kill it.
        this.connection?.end(() => {
            this.remoteProcess?.kill();
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