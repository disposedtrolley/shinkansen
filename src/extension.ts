import * as vscode from 'vscode';
import { createConnection } from 'net';
import { PythonSymbol, PythonSymbolProvider } from './symbols/python';

interface State {
    currentEditor?: vscode.TextEditor;
    symbolProvider?: PythonSymbolProvider;
    expressionBuffer: string;
    lastExpression: string;
    isIncomplete: boolean;
}

let state: State = {
    currentEditor: undefined,
    symbolProvider: undefined,
    expressionBuffer: "",
    lastExpression: "",
    isIncomplete: false
};

export function activate(context: vscode.ExtensionContext) {
    console.log('"shinkansen" is now active!');

    state.symbolProvider = new PythonSymbolProvider();

    const interpreterClient = createConnection({ port: 1337 }, () => {
        console.log('connected!');
    });

    interpreterClient.on('end', () => {
        console.log('disconnected');
    });

    interpreterClient.on('data', (data: string) => {
        const j = JSON.parse(data.toString());
        console.log(j);
        state.isIncomplete = j.incomplete;

        state.currentEditor?.edit(e => {
            e.insert(
                new vscode.Position(
                    state.currentEditor!.selection.active.line,
                    state.currentEditor!.selection.active.character + 2),
                `    # => ${j.last_expr_result}`);
        });
    });

    let disposable = vscode.commands.registerCommand('shinkansen.evaluate', () => {
        state.currentEditor = vscode.window.activeTextEditor!;

        state.symbolProvider!.symbolAtPoint(state.currentEditor.selection.active, state.currentEditor.document)
            .then((symbol: PythonSymbol | null) => {
                let expr;
                if (symbol) {
                    console.log("pythonSymbol:");
                    console.log(symbol);
                    expr = symbol.expression().body;
                } else {
                    expr = state.currentEditor!.document.lineAt(state.currentEditor!.selection.active.line).text;
                }

                // If the last expression was incomplete, this one needs to be
                // appended to the buffer.
                if (state.isIncomplete) {
                    // We can end an incomplete expression by evaluating the exact same
                    // line again.
                    // `startsWith()` because the expression now contains the result of
                    // evaluation.
                    state.expressionBuffer =
                        expr.startsWith(state.lastExpression) ?
                            `${state.expressionBuffer}\n\n` : `${state.expressionBuffer}\n${expr}`;
                } else {
                    // Reset
                    state.expressionBuffer = expr;
                }

                state.lastExpression = expr;
                interpreterClient.write(state.expressionBuffer);
            });

    });

    context.subscriptions.push(disposable);
};

export function deactivate() { }
