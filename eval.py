from code import InteractiveInterpreter
from contextlib import redirect_stdout
import io
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
        self.last_expr_result = None
        self.last_expr_error = None

    def reset_expr_state(self):
        self.last_expr_result = None
        self.last_expr_error = None

    def write(self, data):
        self.last_expr_error = data

    def runcode(self, code):
        """Override
        """
        try:
            buf = io.StringIO()
            with redirect_stdout(buf):
                exec(code, self.locals)
            result = self.result_from_code(code)
            if result is None:
                result = self.result_from_stdout(buf)
            self.last_expr_result = result
        except SystemExit:
            raise
        except:
            self.showtraceback()
    
    def result_from_code(self, code):
        if len(code.co_names) == 0:
            return None

        key = code.co_names[-1]
        if key not in self.locals:
            raise
        
        return self.locals[key]
    
    def result_from_stdout(self, buf):
        return buf.getvalue().rstrip("\n")

    def evaluate(self, source):
        self.reset_expr_state()

        return self.runsource(source)

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

    def results(self):
        return json.dumps({
            "locals": self.serialised_locals(),
            "last_expr_result": self.last_expr_result,
            "last_expr_error": self.last_expr_error
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
            self.conn.sendall(interp.results())


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