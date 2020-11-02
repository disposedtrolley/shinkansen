import * as vscode from 'vscode';
import { createConnection } from 'net';
import { PythonSymbol, PythonSymbolProvider } from './symbols/python';

let currentEditor: vscode.TextEditor;
let symbolProvider: PythonSymbolProvider;
let expressionBuffer: string;
let lastExpression: string;
let isIncomplete: boolean = false;

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

        isIncomplete = j.incomplete;

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
                let expr;
                if (symbol) {
                    console.log("pythonSymbol:");
                    console.log(symbol);
                    expr = symbol.expression().body;
                } else {
                    expr = currentEditor.document.lineAt(currentEditor.selection.active.line).text;
                }

                // If the last expression was incomplete, this one needs to be
                // appended to the buffer.
                if (isIncomplete) {
                    // We can end an incomplete expression by evaluating the exact same
                    // line again.
                    // `startsWith()` because the expression now contains the result of
                    // evaluation.
                    expressionBuffer =
                        expr.startsWith(lastExpression) ? 
                        `${expressionBuffer}\n\n` : `${expressionBuffer}\n${expr}`;
                } else {
                    // Reset
                    expressionBuffer = expr;
                }

                lastExpression = expr;
                interpreterClient.write(expressionBuffer);
            });

    });

    context.subscriptions.push(disposable);
};

export function deactivate() { }
