from code import compile_command

_globals = {}
_locals = {}

while True:
  try:
    obj = compile_command(input(">>> "))
    if obj is None:
      print("Incomplete expression")
    exec(obj, _globals, _locals)
  except (SyntaxError, ValueError, OverflowError) as e:
    print(e)