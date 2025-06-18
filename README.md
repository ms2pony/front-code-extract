
# Dependency Analyzer Demo

This repository contains:

1. **analyzer/** – a minimal static dependency analyzer capable of recursively
   collecting all static dependencies (Vue, JS/TS, CSS/Less, images, fonts …)
   starting from a single `.vue` entry file.
2. **sample-app/** – a tiny Vue 2 project that uses aliases, Less styles,
   images, and nested component imports.

## Quick Start

```bash
# 1) install analyzer deps
cd analyzer
npm install

# 2) run analysis on the sample page
node cli.js ../sample-app/src/views/Page.vue ../sample-app
```

The script prints an absolute‑path list of **all** static files pulled in
(`.vue`, `.js`, `.less`, `.png`, …) by `Page.vue`, following every
import/@import/url reference.

Feel free to point it at any other file inside `sample-app/src`.
