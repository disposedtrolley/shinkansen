import * as vscode from 'vscode';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
} from 'vscode-languageclient';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
    console.log('"shinkansen" is now active!');

    let disposable = vscode.commands.registerCommand('shinkansen.evaluate', () => {
        vscode.window.showInformationMessage('Hello World!');
    });

    context.subscriptions.push(disposable);

    // LSP
    let serverOptions: ServerOptions = {
        command: "pyls",
        args: ["--verbose"]
    };

    let clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'python' }],
    };

    client = new LanguageClient(
        'shinkansenPython',
        'Shinkansen - pyls',
        serverOptions,
        clientOptions
    );

    client.start();
};

export function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
