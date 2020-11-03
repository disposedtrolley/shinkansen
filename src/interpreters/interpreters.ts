export interface InterpreterProvider {
    connect(): Promise<any>;
    onReceive: ((data: string) => void);
    onError: ((error: Error) => void);
    onDisconnect: (() => void);
    send(data: string): void;
}