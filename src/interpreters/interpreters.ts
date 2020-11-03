/**
 * InterpreterProviders are classes which connect to a remote REPL of some sort,
 * allowing program expressions to be sent, and results to be received.
 */

export interface InterpreterResult {
    locals: [string: any];
    lastExprResult: string;
    lastExprError: string;
    incomplete: boolean;
}

export interface InterpreterProvider {
    connect(): Promise<any>;
    onReceive: ((data: InterpreterResult) => void);
    onError: ((error: Error) => void);
    onDisconnect: (() => void);
    send(data: string): void;
}