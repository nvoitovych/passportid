# PassportID

Online service for creating professional document photos. 100% offline, private, and secure.

## Features

- Create photos for passports, ID cards, visas, and driver's licenses
- Automatic cropping according to document requirements
- Background removal and replacement
- Photo editing (brightness, contrast, exposure)
- 100% offline processing - all data stays on your device
- PWA support for mobile installation
- Support for 50+ countries and 70+ document types

## Tech Stack

- **SvelteKit** - SSG + SPA hybrid
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Canvas API** - Image processing
- **TensorFlow.js** - Local AI for background removal
- **Three.js** - Interactive 3D globe visualization
- **Workbox** - PWA service worker

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/nvoitovych/passportid.git
cd passportid

# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
npm run preview
```

### Type Checking

```bash
npm run check
```

## Project Structure

```
passportid/
├── src/
│   ├── lib/
│   │   ├── components/     # Reusable Svelte components
│   │   ├── canvas/         # Image processing utilities
│   │   ├── data/           # Document requirements configuration
│   │   ├── stores/         # Svelte stores for state management
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   └── routes/             # SvelteKit routes
├── static/                 # Static assets
├── docs/                   # Documentation
└── scripts/                # Build scripts
```

## Deployment

The app is configured for static hosting (Vercel, Netlify, Cloudflare Pages).

```bash
npm run build
```

The `build` directory contains the static files ready for deployment.

## Privacy & Security

- All image processing happens locally in your browser
- No data is sent to any server
- No tracking or analytics
- Works completely offline after initial load

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- TensorFlow.js for local AI capabilities
- Three.js for 3D visualization
