import * as vscode from 'vscode';
import { createConnection } from 'net';
import { PythonSymbol, PythonSymbolProvider } from './symbols/python';

let currentEditor: vscode.TextEditor;
let symbolUnderCursor: vscode.SymbolInformation | undefined;
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

        symbolProvider.symbolAtPoint(currentEditor.selection.active, currentEditor.document.uri)
            .then((symbol: PythonSymbol | null) => {
                if (!symbol) {
                    return;
                }

                console.log("pythonSymbol:");
                console.log(symbol);
            });

    });

    context.subscriptions.push(disposable);
};

export function deactivate() {}
