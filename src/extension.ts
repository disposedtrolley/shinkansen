import * as vscode from 'vscode';
import { createConnection } from 'net';

let currentEditor: vscode.TextEditor;
let symbolUnderCursor: vscode.SymbolInformation | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('"shinkansen" is now active!');

    const interpreterClient = createConnection({ port: 1337 }, () => {
        console.log('connected!');
    });

    interpreterClient.on('end', () => {
        console.log('disconnected');
    });

    interpreterClient.on('data', (data: string) => {
        const j = JSON.parse(data.toString());
        console.log(j);

        currentEditor.edit(e => {
            e.insert(
                new vscode.Position(
                    symbolUnderCursor!.location.range.end.line,
                    symbolUnderCursor!.location.range.end.character),
                `    # => ${j.last_expr_result}`);
        });
    });

    let disposable = vscode.commands.registerCommand('shinkansen.evaluate', () => {
        currentEditor = vscode.window.activeTextEditor!;

        vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', currentEditor.document.uri)
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
                console.log(currentEditor.selection.active);
                console.log("symbols:");
                console.log(symbols);

                // TODO need to iterate through all symbols at the cursor to inspect nested
                //      symbols, i.e. methods in classes or constants in methods.
                symbolUnderCursor = symbols.filter(s => s.location.range.contains(currentEditor.selection.active))[0];
                if (symbolUnderCursor) {
                    console.log("found symbol at current cursor!");
                    console.log(symbolUnderCursor);

                    const source = currentEditor.document.getText(symbolUnderCursor.location.range);
                    console.log(source);
                    // currentEditor.setDecorations(currentExpressionDecoration, [symbolUnderCursor.location.range]);

                    interpreterClient.write(source + "\n" + "\n");
                }
            });
    });

    context.subscriptions.push(disposable);
};

export function deactivate() {}
