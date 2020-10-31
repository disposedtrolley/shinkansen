import socket
import json
from code import compile_command

ENCODING = 'utf-8'
PORT = 1337

_globals = {}
_locals = {}

def serialised_locals():
    return json.dumps(_locals).encode(ENCODING)
        
def evlauate(expr):
    try:
        code_obj = compile_command(f"_LAST_EXPR_RESULT = {expr}")
        if code_obj is None:
            print("Incomplete expression")
            return
        exec(code_obj, _globals, _locals)
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
            conn.sendall(serialised_locals())


if __name__ == '__main__':
    serversocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    serversocket.bind((socket.gethostname(), PORT))
    serversocket.listen(5)

    while True:
        process_request(serversocket)