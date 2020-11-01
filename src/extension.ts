import * as vscode from 'vscode';

import {
    DocumentSymbolRequest,
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
} from 'vscode-languageclient';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
    console.log('"shinkansen" is now active!');

    let disposable = vscode.commands.registerCommand('shinkansen.evaluate', () => {
        const editor: vscode.TextEditor = vscode.window.activeTextEditor!;

        client.sendRequest(DocumentSymbolRequest.method, {
            textDocument: {
                uri: editor.document.uri.toString()
            }
        })
            .then((data) => {
                const symbols = data as vscode.SymbolInformation[];
                console.log("active:");
                console.log(editor.selection.active);
                console.log("symbols");
                console.log(symbols);

                symbols.forEach((symbol: vscode.SymbolInformation) => {
                    const range = new vscode.Range(
                        new vscode.Position(symbol.location.range.start.line, symbol.location.range.start.character),
                        new vscode.Position(symbol.location.range.end.line, symbol.location.range.end.character)
                    );
                    if (range.contains(editor.selection.active)) {
                        console.log("found symbol at current cursor!");
                        console.log(symbol);
                    }
                });
            });
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
