import socket
import json
from code import InteractiveInterpreter

class SocketInterpreter(InteractiveInterpreter):
    def __init__(self, encoding):
        InteractiveInterpreter.__init__(self, {})
        self.encoding = encoding

    def write(self, data):
        print("overloaded")
        print(data)

    def trimmed_locals(self):
        return {k: v for k, v in self.locals.items() if k != "__builtins__"}
    
    def serialised_locals(self):
        return json.dumps(self.trimmed_locals()).encode(self.encoding)

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
            interp.runsource(expr)
            conn.sendall(interp.serialised_locals())


if __name__ == '__main__':
    ENCODING = 'utf-8'
    PORT = 1337

    interp = SocketInterpreter(ENCODING)

    serversocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    serversocket.bind((socket.gethostname(), PORT))
    serversocket.listen(5)

    while True:
        process_request(serversocket, interp)