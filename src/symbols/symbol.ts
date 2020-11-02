import * as vscode from 'vscode';

export interface Symbol {
    identifier(): string
    kind(): vscode.SymbolKind
    expression(): SymbolExpression
    range(): vscode.Range
}

export interface SymbolProvider {
    symbolAtPoint(p: vscode.Position, document: vscode.TextDocument): Promise<Symbol | null>
}

export interface SymbolExpression {
    range: vscode.Range
    body: string
}