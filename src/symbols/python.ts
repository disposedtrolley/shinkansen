import { Symbol, SymbolProvider, SymbolExpression} from './symbol';
import * as vscode from 'vscode';

const commandExecuteDocumentSymbolProvider = "vscode.executeDocumentSymbolProvider";

export class PythonSymbol implements Symbol {
    private _identifier: string;
    private _containerIdentifier: string;
    private _range: vscode.Range;
    private _kind: vscode.SymbolKind; 
    private _document: vscode.TextDocument;

    constructor(identifier: string, containerIdentifier: string, kind: vscode.SymbolKind, range: vscode.Range, document: vscode.TextDocument) {
        this._identifier = identifier;
        this._containerIdentifier = containerIdentifier;
        this._kind = kind;
        this._range = range;
        this._document = document;
    }

    identifier(): string {
        return this._identifier;
    }
    kind(): vscode.SymbolKind {
        return this._kind;
    }
    range(): vscode.Range {
        return this._range;
    }
    expression(): SymbolExpression {
        let range: vscode.Range;

        // TODO use `kind` enum instead of checking the string.
        if (this._containerIdentifier === "") {
            let curLineText = this._document.lineAt(this.range().start);
            let lastCharPos = new vscode.Position(this.range().start.line, Math.max(curLineText.text.length-1, 0));

            range = new vscode.Range(
                new vscode.Position(this.range().start.line, 0),
                lastCharPos
            );
        } else {
            range = this.range();
        }

        return {
            range: range,
            body: this._document.getText(range)
        };
    }
}

export class PythonSymbolProvider implements SymbolProvider {
    public async symbolAtPoint(p: vscode.Position, document: vscode.TextDocument): Promise<PythonSymbol | null> {
        const res = await vscode.commands.executeCommand(commandExecuteDocumentSymbolProvider, document.uri);
        const symbols: PythonSymbol[] = (res as any[]).map(d => {
            const range = new vscode.Range(
                new vscode.Position(d.location.range.start.line, d.location.range.start.character),
                new vscode.Position(d.location.range.end.line, d.location.range.end.character)
            );
            
            return new PythonSymbol(d.name, d.containerName, d.kind, range, document);
        });

        console.log("active:");
        console.log(p);
        console.log("symbols:");
        console.log(symbols);

        // TODO cursor will be at the next empty char, which is outside the range of
        // the current single line expr.
        const symbolUnderCursor = symbols.filter(s => s.expression().range.contains(p))[0];
        if (!symbolUnderCursor) {
            return null;
        }

        console.log("found symbol at current cursor!");
        console.log(symbolUnderCursor);
        return symbolUnderCursor;
    }
}