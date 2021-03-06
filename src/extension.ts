import * as vscode from 'vscode';
import { SymbolProvider, Symbol } from './symbols/symbol';
import { PythonSymbolProvider } from './symbols/python';
import { InterpreterProvider, InterpreterResult } from './interpreters/interpreters';
import { PythonInterpreterProvider } from './interpreters/python';

/**
 * All of the mutable state currently used. @TODO will make it easier to refactor
 * this to take a more functional approach.
 */
interface State {
    currentEditor?: vscode.TextEditor;
    symbolProvider?: SymbolProvider;
    interpreterProvider?: InterpreterProvider;
    expressionBuffer: string;
    lastExpression: string;
    isIncomplete: boolean;
}

let state: State = {
    currentEditor: undefined,
    symbolProvider: undefined,
    interpreterProvider: undefined,
    expressionBuffer: "",
    lastExpression: "",
    isIncomplete: false
};

const onInterpreterReceive = (data: InterpreterResult) => {
    state.isIncomplete = data.incomplete;

    state.currentEditor?.edit(e => {
        e.insert(
            new vscode.Position(
                state.currentEditor!.selection.active.line,
                state.currentEditor!.selection.active.character + 2),
            `    # => ${data.lastExprResult}`);
    });
};

const onInterpreterConnect = () => {
    console.log('connected!');
    vscode.window.showInformationMessage('[Shinkansen] Connected to a remote REPL and is ready!');
};

const onInterpreterDisconnect = () => {
    console.log('disconnected!');
    vscode.window.showErrorMessage('[Shinkansen] The remote REPL has been disconnected. Reload VSCode to connect again.');
};

const onInterpreterError = (e: Error) => {
    console.error(e);
    vscode.window.showWarningMessage(`[Shinkansen] Error from remote REPL: ${e.message}`);
};

export function activate(context: vscode.ExtensionContext) {
    console.log('"shinkansen" is now active!');

    state.symbolProvider = new PythonSymbolProvider();

    const pythonServerPath = context.asAbsolutePath("./resources/python/server.py");
    state.interpreterProvider = new PythonInterpreterProvider(pythonServerPath, 1337, onInterpreterReceive, onInterpreterError, onInterpreterDisconnect);
    state.interpreterProvider.connect()
        .then(onInterpreterConnect);
    
    let disposable = vscode.commands.registerCommand('shinkansen.evaluate', () => {
        state.currentEditor = vscode.window.activeTextEditor!;
        state.symbolProvider!.symbolAtPoint(state.currentEditor.selection.active, state.currentEditor.document)
            .then((symbol: Symbol | null) => {
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

                state.interpreterProvider!.send(state.expressionBuffer);
                state.lastExpression = expr;
            });

    });

    context.subscriptions.push(disposable);
};

export function deactivate() {
    state.interpreterProvider?.disconnect();
}