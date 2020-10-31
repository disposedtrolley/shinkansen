import socket
import json
from code import InteractiveInterpreter

class SocketInterpreter(InteractiveInterpreter):
    KEY_LAST_EXPR_RESULT = "_LAST_EXPR_RESULT"

    def __init__(self, encoding):
        InteractiveInterpreter.__init__(self, {})
        self.encoding = encoding
        self.last_expr_result = None

    def write(self, data):
        print("overloaded")
        print(data)

    def evaluate(self, source):
        ret = self.runsource(f"{SocketInterpreter.KEY_LAST_EXPR_RESULT} = {source}")
        self.last_expr_result = self.locals["_LAST_EXPR_RESULT"]
        return ret

    def trimmed_locals(self):
        return {k: v for k, v in self.locals.items() if k not in ["__builtins__", SocketInterpreter.KEY_LAST_EXPR_RESULT]}
    
    def serialised_locals(self):
        return json.dumps(self.trimmed_locals()).encode(self.encoding)

    def get_last_expr_result(self):
        return self.last_expr_result

def process_request(sock, interp):
    (conn, addr) = sock.accept()
    with conn:
        print('Connected from ', addr)
        while True:
            data = conn.recv(1024)
            if not data:
                sock.close()
                break
            expr = data.decode(ENCODING)
            interp.evaluate(expr)
            conn.sendall(interp.serialised_locals())
            print(interp.get_last_expr_result())


if __name__ == '__main__':
    ENCODING = 'utf-8'
    PORT = 1337

    interp = SocketInterpreter(ENCODING)

    serversocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    serversocket.bind((socket.gethostname(), PORT))
    serversocket.listen(5)

    while True:
        process_request(serversocket, interp)