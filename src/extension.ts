import * as vscode from 'vscode';
import { createConnection } from 'net';
import { PythonSymbol, PythonSymbolProvider } from './symbols/python';

let currentEditor: vscode.TextEditor;
let symbolProvider: PythonSymbolProvider;

export function activate(context: vscode.ExtensionContext) {
    console.log('"shinkansen" is now active!');

    symbolProvider = new PythonSymbolProvider();

    const interpreterClient = createConnection({ port: 1337 }, () => {
        console.log('connected!');
    });

    interpreterClient.on('end', () => {
        console.log('disconnected');
    });

    interpreterClient.on('data', (data: string) => {
        const j = JSON.parse(data.toString());
        console.log(j);

        // TODO handle incomplete expressions.

        currentEditor.edit(e => {
            e.insert(
                new vscode.Position(
                    currentEditor.selection.active.line,
                    currentEditor.selection.active.character + 2),
                `    # => ${j.last_expr_result}`);
        });
    });

    let disposable = vscode.commands.registerCommand('shinkansen.evaluate', () => {
        currentEditor = vscode.window.activeTextEditor!;

        symbolProvider.symbolAtPoint(currentEditor.selection.active, currentEditor.document)
            .then((symbol: PythonSymbol | null) => {
                if (!symbol) {
                    // TODO we get here when no new symbols are in the active selection.
                    interpreterClient.write(currentEditor.document.lineAt(currentEditor.selection.active.line).text);
                    return;
                }

                console.log("pythonSymbol:");
                console.log(symbol);
                interpreterClient.write(symbol.expression().body);
            });

    });

    context.subscriptions.push(disposable);
};

export function deactivate() {}
