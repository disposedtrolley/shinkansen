import { NetworkInterfaceBase } from 'os';
import * as vscode from 'vscode';

export interface Symbol {
    identifier(): string
    kind(): vscode.SymbolKind
    body(): string
    range(): vscode.Range
}

export interface SymbolProvider {
    symbolAtPoint(p: vscode.Position, document: vscode.Uri): Promise<Symbol | null>
}
