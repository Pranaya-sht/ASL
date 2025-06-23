import socket
import json
import time

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
IP = "127.0.0.1"
PORT = 5005

with open("simplified/-1SxWYSJKac.json") as f:
    frames = json.load(f)

print(f"🚀 Sending {len(frames)} frames in a loop to {IP}:{PORT}")

while True:
    for frame in frames:
        data = json.dumps(frame).encode()
        sock.sendto(data, (IP, PORT))
        time.sleep(1/30)  # Send at ~30 FPS
