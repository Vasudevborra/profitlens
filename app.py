import http.server
import socketserver
import webbrowser
import os
import threading
import generate_data

PORT = 8050
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def main():
    print("==================================================================")
    print("  CREATIVE CAPACITY INTELLIGENCE")
    print("  AI-Powered Workload & Productivity Optimization")
    print("==================================================================")
    print("Step 1: Ensuring historical dataset CSV & JS bundle are built...")
    generate_data.generate_dataset()
    
    url = f"http://localhost:{PORT}/index.html"
    print(f"Step 2: Starting local server at {url}")
    threading.Timer(1.0, lambda: webbrowser.open(url)).start()
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving Creative Capacity Intelligence at {url} (Press Ctrl+C to stop)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")

if __name__ == "__main__":
    main()
