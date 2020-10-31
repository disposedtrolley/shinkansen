from code import InteractiveInterpreter
import json
from threading import Thread
import signal
import socket
import sys

ENCODING = 'utf-8'
PORT = 1337

class SocketInterpreter(InteractiveInterpreter):
    def __init__(self, encoding):
        InteractiveInterpreter.__init__(self, {})
        self.encoding = encoding
        self.last_code = None

    def write(self, data):
        print("overloaded")
        print(data)

    def runcode(self, code):
        """Override
        """
        try:
            exec(code, self.locals)
            self.last_code = code
        except SystemExit:
            raise
        except:
            self.showtraceback()

    def evaluate(self, source):
        ret = self.runsource(source)
        return ret

    def trimmed_locals(self):
        return {k: v for k, v in self.locals.items() if k not in ["__builtins__"]}

    def serialisable_locals(self):
        serialisable = {}
        for k, v in self.locals.items():
            try:
                json.dumps(v)
                serialisable[k] = v
            except (TypeError, OverflowError):
                continue
        return serialisable

    def serialised_locals(self):
        return json.dumps(self.serialisable_locals())

    def get_last_expr_result(self):
        l = self.serialisable_locals()
        n = self.last_code.co_names[-1]
        return l[n] if n in l else None

    def response(self):
        return json.dumps({
            "locals": self.serialised_locals(),
            "last_expr_result": self.get_last_expr_result()
        }).encode(self.encoding)

class ConnectionHandler(Thread):
    def __init__(self, conn, addr):
        Thread.__init__(self)
        self.conn = conn
        self.addr = addr
    
    def run(self):
        interp = SocketInterpreter(ENCODING)
        print('Connected from ', self.addr)
        while True:
            data = self.conn.recv(1024)
            if not data:
                self.conn.close()
                break
            expr = data.decode(ENCODING)
            interp.evaluate(expr)
            self.conn.sendall(interp.response())


if __name__ == '__main__':
    serversocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    serversocket.bind((socket.gethostname(), PORT))
    serversocket.listen(5)

    while True:
        try:
            (conn, addr) = serversocket.accept()
            handler = ConnectionHandler(conn, addr)
            handler.start()
        except KeyboardInterrupt:
            print('Qutting...')
            serversocket.close()
            sys.exit(0)