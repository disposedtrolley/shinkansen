import { createConnection } from 'net';
import { createInterface } from 'readline';

const readline = createInterface({
    input: process.stdin,
    output: process.stdout
});

const promptNormal = ">>>";
const promptIncomplete = "...";

let buf = "";
let incomplete = false;
let promptCurrent = promptNormal;

const client = createConnection({ port: 1337 }, () => {
    console.log('connected!');
    promptExpr(client);
});

client.on('data', data => {
    j = JSON.parse(data.toString());
    incomplete = j.incomplete;
    console.log(j);
    promptExpr(client);
});

client.on('end', () => {
    console.log('disconnected');
});

const promptExpr = (client) => {
    promptCurrent = incomplete ? promptIncomplete : promptNormal;

    readline.question(`\n${promptCurrent} `, expr => {
        if (incomplete) {
            buf = `${buf}\n${expr}`;
        } else {
            buf = expr;
        }

        console.log(buf);
        client.write(buf);
    });
};
