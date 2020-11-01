from code import InteractiveInterpreter
from contextlib import redirect_stdout
import io
import json
import socket
import sys

ENCODING = 'utf-8'
PORT = 1337


class SocketInterpreter(InteractiveInterpreter):
    def __init__(self):
        InteractiveInterpreter.__init__(self)
        self._last_expr_result = None
        self._last_expr_error = None
        self._incomplete = False

    def write(self, data):
        """Overrides the InteractiveInterpreter's write() method to redirect
        syntax errors into _last_expr_error.
        """
        self._last_expr_error = data

    def runcode(self, code):
        """Overrides the InteractiveInterpreter's runcode() method to intercept
        the compiled `code` object, execute it, and attempt to extract the
        results of running the expression.
        """
        try:
            buf = io.StringIO()
            with redirect_stdout(buf):
                exec(code, self.locals)
            result = self._result_from_code(code)
            if result is None:
                result = self._result_from_stdout(buf)
            self._last_expr_result = result
        except SystemExit:
            raise
        except:
            self.showtraceback()

    def _reset_expr_state(self):
        """Resets the results of execution.
        """
        self._last_expr_result = None
        self._last_expr_error = None
        self._incomplete = False

    def _trimmed_locals(self):
        """Trims the locals dict to omit non-user created symbols.
        """
        return {k: v for k, v in self.locals.items() if k not in ["__builtins__", "__doc__", "__name__"]}

    def _serialisable_locals(self):
        """Returns a filtered dict of locals which are serialisable.
        Serialisable locals are those with translations into JSON (i.e. most
        primitives). Other symbols like class and function definitions are
        converted to their __str__ representation.
        """
        serialisable = {}
        for k, v in self._trimmed_locals().items():
            try:
                json.dumps(v)
            except (TypeError, OverflowError):
                v = v.__str__()  # try our best
            finally:
                serialisable[k] = v

        return serialisable

    def _result_from_code(self, code):
        """Attempts to return the value gained from executing the expression
        in `code`.
        """
        if len(code.co_names) == 0:
            return None

        # TODO function calls return the function name instead of the result
        key = code.co_names[-1]
        if key not in self._serialisable_locals():
            return None

        return self._serialisable_locals()[key]

    def _result_from_stdout(self, buf):
        """Returns anything captured from STDOUT during the execution of an
        expression.
        """
        return buf.getvalue().rstrip("\n")

    def _results(self):
        """Returns JSON serialised results of calling `evaluate().
        """
        return json.dumps({
            "locals": self._serialisable_locals(),
            "last_expr_result": self._last_expr_result,
            "last_expr_error": self._last_expr_error,
            "incomplete": self._incomplete
        })

    def evaluate(self, source):
        """Evaluates the expression in `source`.
        """
        self._reset_expr_state()
        ret = self.runsource(source)
        if ret is True:
            # runsource() returns True if the expression is incomplete, i.e.
            # `source` is a class or function signature and a body must be
            # supplied.
            self._incomplete = True
        return self._results()


if __name__ == '__main__':
    # Listen for client connections.
    serversocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    serversocket.bind((socket.gethostname(), PORT))
    serversocket.listen(5)  # 5 is arbitrary
    print("Server listening on", PORT)

    while True:
        try:
            # Accept a connection and create a new SocketInterpreter.
            (conn, addr) = serversocket.accept()
            print(addr, 'connected')
            interp = SocketInterpreter()
            while True:
                data = conn.recv(1024)
                if not data:
                    # We arrive here if the client has disconnected.
                    print(addr, 'disconnected')
                    conn.close()
                    break
                # Decode, evaluate, and return the results.
                expr = data.decode(ENCODING)
                results = interp.evaluate(expr)
                conn.sendall(results.encode(ENCODING))
        except KeyboardInterrupt:
            # Graceful shutdown.
            print('Qutting...')
            serversocket.close()
            sys.exit(0)
