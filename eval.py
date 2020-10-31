import socket
import base64
import dill
import json
from code import compile_command

ENCODING = 'utf-8'
PORT = 1337

_globals = {}
_locals = {}

def serialise_locals():
    return json.dumps(
        dict(
            map(
                lambda kv: (
                    kv[0],
                    base64.b64encode(dill.dumps(kv[1])).decode(ENCODING)),
                _locals.items())))

def evlauate(expr):
    try:
        obj = compile_command(expr)
        if obj is None:
            print("Incomplete expression")
            return
        exec(obj, _globals, _locals)
    except (SyntaxError, ValueError, OverflowError) as e:
        print(e)

def process_request(sock):
    (conn, addr) = sock.accept()
    with conn:
        print('Connected from ', addr)
        while True:
            data = conn.recv(1024)
            if not data:
                sock.close()
                break
            expr = data.decode(ENCODING)
            result = evlauate(expr)
            conn.sendall(serialise_locals().encode(ENCODING))


if __name__ == '__main__':
    serversocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    serversocket.bind((socket.gethostname(), PORT))
    serversocket.listen(5)

    while True:
        process_request(serversocket)