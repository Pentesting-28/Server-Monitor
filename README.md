# Server Monitor

A lightweight, zero-dependency (at runtime) server monitoring dashboard built with Rust and React.

Server Monitor is designed to provide real-time visibility into your Linux server's health, metrics, and core services. It compiles into a single, standalone monolithic executable. This means you can deploy the entire backend API and the React frontend by simply copying one binary file to your server—no Node.js, PHP, or external web servers required.

## Key Features

- **Single Binary Deployment:** The React frontend is seamlessly embedded into the Rust backend during the build process.
- **Real-Time Metrics:** Live monitoring of CPU load, Uptime, Temperatures, Network interfaces, and Storage partitions.
- **Service Supervision:** Instantly view the status of core server daemon processes (e.g., `ssh`, `docker`, `nginx`).
- **Persistent Event Logs:** Service state changes and system events are automatically logged to a local SQLite database (`monitor.db`).

## Technical Stack

- **Backend:** Rust, Axum (Web Framework), SQLx (SQLite), Tokio (Async Runtime), Sysinfo
- **Frontend:** React, Vite, Recharts, Lucide Icons
- **Database:** SQLite (Embedded, creates `monitor.db` automatically)

## Prerequisites for Building

To compile the project from source, you need to have the following installed on your development machine:

1. [Rust & Cargo](https://rustup.rs/) (v1.75+ recommended)
2. [Node.js & npm](https://nodejs.org/) (v18+ recommended)

*Note: These prerequisites are **only** required for compiling the source code. The final executable requires no dependencies other than a standard Linux environment.*

## Installation & Execution

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/Server-Monitor.git
cd Server-Monitor
```

### 2. Development Mode (Running locally)

If you want to run the project in development mode with hot-reloading:

First, install the frontend dependencies and build the UI:
```bash
cd ui
npm install
npm run build
cd ..
```

Then, run the Rust backend:
```bash
cargo run
```
The application will be accessible at `http://localhost:8080`.

### 3. Generating the Production Executable

To generate the standalone executable that you can share or deploy to production servers, run the release build command from the root of the project:

```bash
cargo build --release
```

This command will:
1. Compile the Rust backend with maximum optimizations.
2. Automatically embed the production-ready React assets (from `ui/dist`) directly into the binary.

### 4. Deployment

Once the build is complete, your standalone executable is ready:

```bash
target/release/Server-Monitor
```

You can copy this single `Server-Monitor` file to any compatible Linux server. 

To run it on your production server:
```bash
chmod +x Server-Monitor
./Server-Monitor
```

Navigate to `http://<YOUR_SERVER_IP>:8080` in your browser to view your monitoring dashboard.

## Architecture & Design

The application follows a modular architecture:
- **Collector:** Asynchronous Rust background tasks that sample system metrics and check service states in parallel for maximum performance.
- **Database Layer:** A lightweight SQLite instance is used to persist historical metrics and event logs. Space is automatically pruned to prevent database bloat.
- **Web Server:** Axum serves both the REST API (`/api/metrics`, `/api/logs`) and the embedded static SPA (Single Page Application) files.

## License

This project is licensed under the MIT License.
