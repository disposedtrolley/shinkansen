const net = require('net');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})

let promptNormal = ">>>"
let promptIncomplete = "..."
let buf = ""
let incomplete = false
let promptCurrent = promptNormal

const client = net.createConnection({ port: 1337 }, () => {
    console.log('connected!')
    promptExpr(client)
})

client.on('data', data => {
    j = JSON.parse(data.toString())
    incomplete = j.incomplete
    console.log(j)
    promptExpr(client)
})

client.on('end', () => {
    console.log('disconnected')
})

const promptExpr = (client) => {
    promptCurrent = incomplete ? promptIncomplete : promptNormal

    readline.question(`\n${promptCurrent} `, expr => {
        if (incomplete) {
            buf = `${buf}\n${expr}`
        } else {
            buf = expr
        }

        console.log(buf)
        client.write(buf)
    })
}
