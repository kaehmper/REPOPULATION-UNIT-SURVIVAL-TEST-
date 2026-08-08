#!/usr/bin/env python3

import argparse
import subprocess
import sys
import time
import webbrowser

def run_asset_generation():
    print("Generating assets...")
    try:
        subprocess.run([sys.executable, "generate_assets.py"], check=True)
        print("Assets generated successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Failed to generate assets: {e}")
        sys.exit(1)
    except FileNotFoundError:
        print("Warning: generate_assets.py not found.")

def start_server(port):
    print(f"Starting server on port {port}...")
    # Set the PORT environment variable so the node script uses it
    import os
    import platform

    env = os.environ.copy()
    env["PORT"] = str(port)

    # On Windows, use shell=True and pass the command as a string or list
    is_windows = platform.system() == "Windows"

    command = "node server/index.js" if is_windows else ["node", "server/index.js"]

    try:
        server_process = subprocess.Popen(
            command,
            env=env,
            shell=is_windows
        )
        return server_process
    except FileNotFoundError:
        print("Error: 'node' executable not found. Please ensure Node.js is installed and in your system PATH.", file=sys.stderr)
        sys.exit(1)

def open_game(port):
    url = f"http://localhost:{port}"
    print(f"Opening game in browser at {url}...")
    webbrowser.open(url)

def main():
    parser = argparse.ArgumentParser(description="Launch the Game and/or Server.")
    parser.add_argument("--server", action="store_true", help="Launch only the server")
    parser.add_argument("--game", action="store_true", help="Launch only the game (open browser)")
    parser.add_argument("--no-assets", action="store_true", help="Skip asset generation")
    parser.add_argument("--port", type=int, default=3000, help="Port the server runs on (default: 3000)")

    args = parser.parse_args()

    # If neither --server nor --game is specified, run both (default)
    run_both = not args.server and not args.game

    if not args.no_assets and (args.server or run_both):
        run_asset_generation()

    server_process = None

    try:
        if args.server or run_both:
            server_process = start_server(args.port)
            # Wait a moment to let the server start before opening the browser
            time.sleep(2)

        if args.game or run_both:
            open_game(args.port)

        if server_process:
            print("Press Ctrl+C to stop the server.")
            server_process.wait()
        else:
            print("Finished.")

    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        if server_process:
            server_process.terminate()
            server_process.wait()
            print("Server stopped.")

if __name__ == "__main__":
    main()
