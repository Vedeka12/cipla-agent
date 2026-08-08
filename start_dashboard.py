import http.server
import socketserver
import webbrowser
import threading
import time
import os
import sys

PORT = 8080
DIRECTORY = "."

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    # Avoid port collision
    port = PORT
    while port < PORT + 100:
        try:
            with socketserver.TCPServer(("", port), Handler) as httpd:
                print(f"\n========================================================")
                print(f"  CIPLA Cardiac Opportunity Prioritization Agent dashboard")
                print(f"========================================================")
                print(f"  Dashboard is running locally at: http://localhost:{port}/index.html")
                print(f"  To stop the dashboard server, press Ctrl+C in this terminal.\n")
                
                # Open browser after a split second
                def open_browser():
                    time.sleep(0.5)
                    webbrowser.open(f"http://localhost:{port}/index.html")
                
                threading.Thread(target=open_browser, daemon=True).start()
                httpd.serve_forever()
                break
        except OSError:
            # Port already in use, try next one
            port += 1

if __name__ == "__main__":
    try:
        start_server()
    except KeyboardInterrupt:
        print("\nStopping dashboard server...")
        sys.exit(0)
