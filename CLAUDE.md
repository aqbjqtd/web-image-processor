# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 Quick Start

### Core Commands

- **Start dev server**: `npm run dev` (runs on port 9000)
- **Build for production**: `npm run build`
- **Run tests**: `npm test`
- **Lint & Format**: `npm run lint` and `npm run format`

### Docker Commands

- **Build image**: `npm run docker:build`
- **Run container**: `npm run docker:run`
- **Compose up**: `npm run docker:compose` (for basic deployment)
- **Full stack compose**: `docker-compose --profile monitoring --profile traefik up -d`

## 🔒 Privacy First Architecture

The application is designed to be **100% client-side**. All file reading and image processing happens directly in the user's browser. **No data or images are ever uploaded to any server.** The core technologies enabling this are:

- **`FileReader` API**: Reads files from the user's local disk into the browser's memory.
- **Canvas API & WebAssembly**: Perform all image manipulation tasks on the client-side.
- **`URL.createObjectURL` / `canvas.toDataURL`**: Generate downloadable results without server interaction.

## 🛠️ Tech Stack & Architecture

- **Frontend**: Vue.js 3 (Composition API with `<script setup>`)
- **UI Framework**: Quasar Framework 2.14.2
- **Build Tool**: Vite
- **Core Logic**: TypeScript for type safety and modern JavaScript features.
- **State Management**: Pinia for centralized, type-safe state management.
- **High-Performance Computing**: WebAssembly (WASM) for CPU-intensive tasks, with a fallback to Canvas API.
- **Concurrency**: Web Workers (`imageWorker.js`) for non-blocking background processing.

### Key Architectural Components

1.  **`ImageProcessor.js` (`src/utils/`)**: A singleton class that orchestrates all image processing. It manages the processing pipeline, switching between WASM and Canvas, and handling batch operations. Features intelligent file size optimization using binary search algorithm.
2.  **`WasmManager.js` (`src/utils/`)**: Manages the lifecycle of WebAssembly modules, including lazy loading, preloading high-priority modules, and memory management.
3.  **`IndexPage.vue` (`src/pages/`)**: The main user interface. It is responsible for user interaction, managing the state of file uploads, displaying results, and providing file size limit configuration.
4.  **`MainLayout.vue` (`src/layouts/`)**: The main application layout, providing a consistent header and structure.

### Project Structure

```
src/
├── css/                 # Global styles
├── layouts/             # Main application layout
├── pages/               # Vue components for different routes (UI)
│   └── IndexPage.vue    # The primary page for the application
├── router/              # Vue Router configuration
├── utils/               # Core application logic
│   ├── ImageProcessor.js  # Main processing engine (singleton)
│   └── WasmManager.js     # WASM module management
└── workers/             # Web Worker scripts
    └── imageWorker.js   # Background processing logic
```

## 📝 Development Notes

- **UI Style**: The UI has been refactored to a modern, bright, and clean aesthetic. The main styles are located within the `<style scoped>` block of `IndexPage.vue`.
- **Exit Signals**: `quasar.config.js` has a robust exit signal handler to ensure the dev server process is properly terminated, preventing port conflicts, especially on Windows.
- **Singleton Pattern**: `ImageProcessor.js` is implemented as a singleton. Always import the instance directly (`import imageProcessor from '...'`) rather than creating a `new ImageProcessor()`.
- **WASM Modules**: WASM files are located in the `public/wasm` directory and are loaded on demand by `WasmManager.js`.
- **File Size Optimization**: The application includes an intelligent file size limiting feature that uses a binary search algorithm to find the optimal image quality that meets the specified file size requirement (default: 300KB, range: 50-5000KB).
