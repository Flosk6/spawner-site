"""
Records a terminal session as an asciicast v2 file, the format of asciinema:
a real bash in a pseudo-terminal, commands typed into it key by key, and
everything it prints, with its timing and its colors.

Usage: python3 scripts/record-terminal.py <session.json> <out.cast>

session.json:
  {
    "cols": 92, "rows": 30,
    "cwd": "/path/to/a/worktree",
    "env": {"PATH": "...", "SPAWNER_URL": "...", "SPAWNER_TOKEN": "..."},
    "steps": [
      {"type": "spawner init", "wait": false},
      {"expect": "[Y/n]", "send": "y"},
      {"prompt": true},
      {"type": "spawner up --wait"},
      {"sleep": 1.5}
    ]
  }

"type" types a command, presses Enter and waits for the prompt to come back
("wait": false to go on at once, for a command that asks a question);
"expect" waits for some text, then types an answer and presses Enter;
"prompt" waits for the prompt. The environment is not typed, so tokens
never appear in the recording.
"""

import codecs
import fcntl
import json
import os
import pty
import random
import select
import struct
import sys
import termios
import time

PROMPT = "$ "


class Session:
    """A bash in a pseudo-terminal whose output is kept with its timing."""

    def __init__(self, cols, rows, cwd, env):
        self.events = []
        self.output = ""
        self.decoder = codecs.getincrementaldecoder("utf-8")(errors="replace")
        pid, fd = pty.fork()
        if pid == 0:
            os.chdir(cwd)
            os.execve("/bin/bash", ["bash", "--noprofile", "--norc", "-i"], env)
        self.pid = pid
        self.fd = fd
        fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", rows, cols, 0, 0))
        self.start = time.monotonic()

    def read(self, timeout):
        """Reads what the terminal printed within `timeout` seconds."""
        ready, _, _ = select.select([self.fd], [], [], timeout)
        if not ready:
            return
        try:
            data = os.read(self.fd, 65536)
        except OSError:
            return
        text = self.decoder.decode(data)
        if text:
            self.events.append([round(time.monotonic() - self.start, 3), "o", text])
            self.output += text

    def wait_for(self, predicate, timeout=900):
        """Reads until `predicate(output)` holds."""
        deadline = time.monotonic() + timeout
        while not predicate(self.output):
            if time.monotonic() > deadline:
                raise TimeoutError(f"gave up waiting; the terminal shows: {self.output[-300:]!r}")
            self.read(0.1)

    def drain(self, seconds):
        """Keeps reading for a while, for the output that comes after a step."""
        deadline = time.monotonic() + seconds
        while time.monotonic() < deadline:
            self.read(0.05)

    def keys(self, text):
        """Types `text` like a person, then presses Enter."""
        for char in text:
            os.write(self.fd, char.encode())
            self.drain(random.uniform(0.04, 0.09))
        self.drain(0.35)
        os.write(self.fd, b"\r")


def at_prompt(mark):
    """True once the prompt is back, after what the terminal printed past `mark`."""
    return lambda output: len(output) > mark and output.endswith(PROMPT)


def main():
    session_file, out_file = sys.argv[1], sys.argv[2]
    config = json.load(open(session_file))
    env = {
        "TERM": "xterm-256color",
        "PS1": PROMPT,
        "BASH_SILENCE_DEPRECATION_WARNING": "1",
        "LANG": "en_US.UTF-8",
        **config.get("env", {}),
    }
    session = Session(config.get("cols", 92), config.get("rows", 30), config["cwd"], env)
    session.wait_for(lambda output: output.endswith(PROMPT), timeout=10)
    session.events.clear()
    session.start = time.monotonic()
    session.output = PROMPT
    session.events.append([0.0, "o", PROMPT])
    session.drain(0.8)

    for step in config["steps"]:
        mark = len(session.output)
        if "type" in step:
            session.keys(step["type"])
            if step.get("wait", True):
                session.wait_for(at_prompt(mark + len(step["type"]) + 1))
                session.drain(0.6)
        elif "expect" in step:
            session.wait_for(lambda output, text=step["expect"], start=mark: text in output[start:])
            session.drain(0.5)
            session.keys(step["send"])
        elif "prompt" in step:
            session.wait_for(at_prompt(mark))
            session.drain(0.6)
        elif "sleep" in step:
            session.drain(step["sleep"])

    os.write(session.fd, b"exit\r")
    header = {
        "version": 2,
        "width": config.get("cols", 92),
        "height": config.get("rows", 30),
        "timestamp": int(time.time()),
        "env": {"SHELL": "/bin/bash", "TERM": "xterm-256color"},
    }
    with open(out_file, "w") as out:
        out.write(json.dumps(header) + "\n")
        for event in session.events:
            out.write(json.dumps(event) + "\n")
    print(f"{out_file}: {len(session.events)} events, {session.events[-1][0]:.1f} s")


if __name__ == "__main__":
    main()
