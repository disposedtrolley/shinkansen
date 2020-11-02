import { Symbol, SymbolProvider } from './symbol';
import * as vscode from 'vscode';

const commandExecuteDocumentSymbolProvider = "vscode.executeDocumentSymbolProvider";

export class PythonSymbol implements Symbol {
    _identifier: string;
    _kind: vscode.SymbolKind;
    _body: string;
    _range: vscode.Range;

    constructor(symbolInformation: vscode.SymbolInformation) {
        this._identifier = symbolInformation.name;
        this._kind = symbolInformation.kind;
        this._body = "foo";
        this._range = symbolInformation.location.range;
    }

    identifier(): string {
        throw new Error('Method not implemented.');
    }
    kind(): vscode.SymbolKind {
        throw new Error('Method not implemented.');
    }
    body(): string {
        throw new Error('Method not implemented.');
    }
    range(): vscode.Range {
        throw new Error('Method not implemented.');
    }
}

export class PythonSymbolProvider implements SymbolProvider {
    public async symbolAtPoint(p: vscode.Position, document: vscode.Uri): Promise<PythonSymbol | null> {
        const res = await vscode.commands.executeCommand(commandExecuteDocumentSymbolProvider, document);
        const symbols: vscode.SymbolInformation[] = (res as any[]).map(d => {
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
        console.log(p);
        console.log("symbols:");
        console.log(symbols);

        const symbolUnderCursor = symbols.filter(s => s.location.range.contains(p))[0];
        if (!symbolUnderCursor) {
            return null;
        }

        const pySymbol = new PythonSymbol(symbolUnderCursor);
        console.log("found symbol at current cursor!");
        console.log(pySymbol);
        return pySymbol;
    }
}