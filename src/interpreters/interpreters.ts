/**
 * An InterpreterResult is the parsed response from an IntepreterProvider,
 * containing the new state of the program after evaluating an expression.
 */
export interface InterpreterResult {
    locals: [string: any];
    lastExprResult: string;
    lastExprError: string;
    incomplete: boolean;
}

/**
 * InterpreterProviders are classes which connect to a remote REPL of some sort,
 * allowing program expressions to be sent, and results to be received.
 */
export interface InterpreterProvider {
    connect(): Promise<any>;
    disconnect(): void;
    onReceive: ((data: InterpreterResult) => void);
    onError: ((error: Error) => void);
    onDisconnect: (() => void);
    send(data: string): void;
}