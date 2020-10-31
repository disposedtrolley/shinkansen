const net = require('net');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})

const client = net.createConnection({ port: 1337 }, () => {
    console.log('connected!')
    // promptExpr(client)
    client.write(`
def add(num):
    return num + 1
`)
})

client.on('data', data => {
    console.log(data.toString())
    promptExpr(client)
})

client.on('end', () => {
    console.log('disconnected')
})

const promptExpr = (client) => {
    readline.question('\n>>> ', expr => {
        console.log(expr)
        client.write(expr)
    })
}
