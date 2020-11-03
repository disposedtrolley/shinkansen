import * as vscode from 'vscode';

/**
 * A Symbol is a name which has been declared in the current program, e.g. a
 * variable name or function.
 */
export interface Symbol {
    identifier(): string
    kind(): vscode.SymbolKind
    expression(): SymbolExpression
    range(): vscode.Range
}

/**
 * SymbolProviders are tasked with returning the details of a Symbol at the
 * given position in a VSCode document.
 */
export interface SymbolProvider {
    symbolAtPoint(p: vscode.Position, document: vscode.TextDocument): Promise<Symbol | null>
}

/**
 * A SymbolExpression is the expression which created the symbol, e.g.
 * the variable `x` may have been created with the expression `x = 1`.
 */
export interface SymbolExpression {
    range: vscode.Range
    body: string
}