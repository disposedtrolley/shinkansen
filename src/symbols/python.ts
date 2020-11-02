import { Symbol, SymbolProvider, SymbolExpression} from './symbol';
import * as vscode from 'vscode';

const commandExecuteDocumentSymbolProvider = "vscode.executeDocumentSymbolProvider";

export class PythonSymbol implements Symbol {
    private _symbol: vscode.SymbolInformation;
    private _document: vscode.TextDocument;

    constructor(symbolInformation: vscode.SymbolInformation, document: vscode.TextDocument) {
        this._symbol = symbolInformation ;
        this._document = document;
    }

    identifier(): string {
        return this._symbol.name; 
    }
    kind(): vscode.SymbolKind {
        return this._symbol.kind;
    }
    body(): string {
        return "foo body";
    }
    range(): vscode.Range {
        return this._symbol.location.range;
    }
    expression(): SymbolExpression {
        return {
            range: this.range(), // TODO fake so linter doesn't complain
            body: ""
        };
    }
}

export class PythonSymbolProvider implements SymbolProvider {
    public async symbolAtPoint(p: vscode.Position, document: vscode.TextDocument): Promise<PythonSymbol | null> {
        const res = await vscode.commands.executeCommand(commandExecuteDocumentSymbolProvider, document.uri);
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

        const pySymbol = new PythonSymbol(symbolUnderCursor, document);
        console.log("found symbol at current cursor!");
        console.log(pySymbol);
        return pySymbol;
    }
}