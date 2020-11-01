import * as vscode from 'vscode';

import {
    DocumentSymbolRequest,
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
} from 'vscode-languageclient';

let client: LanguageClient;

const currentExpressionDecoration = vscode.window.createTextEditorDecorationType({
    borderWidth: '1px',
    borderStyle: 'solid',
    light: {
        borderColor: 'darkblue'
    },
    dark: {
        borderColor: 'lightblue'
    }
});

export function activate(context: vscode.ExtensionContext) {
    console.log('"shinkansen" is now active!');

    let disposable = vscode.commands.registerCommand('shinkansen.evaluate', () => {
        const editor: vscode.TextEditor = vscode.window.activeTextEditor!;

        client.sendRequest(DocumentSymbolRequest.method, {
            textDocument: {
                uri: editor.document.uri.toString()
            }
        })
            .then((result) => {
                const symbols: vscode.SymbolInformation[] = (result as any[]).map(d => {
                    const range = new vscode.Range(
                        new vscode.Position(d.location.range.start.line, d.location.range.start.character),
                        new vscode.Position(d.location.range.end.line, d.location.range.end.character)
                    );
                    const location = new vscode.Location(
                        vscode.Uri.parse(d.location.uri),
                        range
                    );
                    return new vscode.SymbolInformation(d.name, d.kind, d.containerName, location);
                });

                console.log("active:");
                console.log(editor.selection.active);
                console.log("symbols:");
                console.log(symbols);

                // TODO need to iterate through all symbols at the cursor to inspect nested
                //      symbols, i.e. methods in classes or constants in methods.
                const symbolUnderCursor: vscode.SymbolInformation | undefined = symbols.filter(s => s.location.range.contains(editor.selection.active))[0];
                if (symbolUnderCursor) {
                    console.log("found symbol at current cursor!");
                    console.log(symbolUnderCursor);

                    const source = editor.document.getText(symbolUnderCursor.location.range);
                    console.log(source);
                    editor.setDecorations(currentExpressionDecoration, [symbolUnderCursor.location.range]);
                }
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
