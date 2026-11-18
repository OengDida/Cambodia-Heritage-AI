# SmartRoute AI

SmartRoute AI is a Cambodia-focused route and trip-planning web application. It helps drivers estimate whether a vehicle can complete a journey, understand the likely travel cost, and identify useful fuel or EV charging stops along the way.

**Live demo:** https://smartroute-dev.vercel.app/

## Features

- **Route planning:** Choose an origin and destination, or place route endpoints directly on the map.
- **Multiple vehicle types:** Select an electric vehicle, hybrid, gasoline vehicle, diesel vehicle, or motorbike.
- **Custom vehicle settings:** Adjust vehicle range and energy or fuel efficiency to better match your vehicle.
- **Route visualization:** View the planned route on an interactive Leaflet map using OpenStreetMap data.
- **Range checks:** Compare the planned journey with the selected vehicle's estimated range and highlight potential range gaps.
- **Stop suggestions:** See nearby fuel or charging locations along the route.
- **Station filtering:** Filter the displayed station locations by relevant station or vehicle categories.
- **Trip-cost estimates:** Estimate fuel or electricity use and trip cost, with support for KHR and USD.
- **Editable rates:** Adjust the rates used for cost calculations.
- **Co-Pilot guidance:** Get rule-based planning tips and suggestions based on the selected trip and vehicle.

## How it works

1. Select a vehicle preset or configure a custom vehicle.
2. Choose your starting point and destination using the location controls or map.
3. Review the calculated route and estimated distance.
4. Check the vehicle's estimated range against the trip distance.
5. Review suggested stops and estimated trip costs.
6. Adjust vehicle efficiency or energy/fuel rates to explore different scenarios.

## Tech stack

| Technology | Purpose |
| --- | --- |
| React 18 | User interface |
| Vite 6 | Development server and build tooling |
| Tailwind CSS 3 | Styling |
| Leaflet | Interactive maps |
| React Leaflet | React components for Leaflet |
| OpenStreetMap | Map tiles and geographic data |
| OSRM | Driving-route calculation |
| lucide-react | Interface icons |

## Getting started

### Requirements

- Node.js (a current LTS release is recommended)
- npm

### Installation

Clone the repository and install its dependencies:

```bash
git clone https://github.com/OengDida/SmartRoute-AI.git
cd SmartRoute-AI
npm install
```

### Run locally

Start the Vite development server:

```bash
npm run dev
```

Open the local URL printed in your terminal (typically `http://localhost:5173`).

### Production build

Create an optimized production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Project structure

The main application code is organized as follows:

```text
SmartRoute-AI/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── index.css
    ├── components/
    │   └── MapView.jsx
    ├── data/
    │   ├── places.js
    │   ├── rates.js
    │   └── vehicles.js
    └── utils.js
```

- `src/App.jsx` — Main application interface and trip-planning logic.
- `src/components/MapView.jsx` — Interactive map and route display.
- `src/data/vehicles.js` — Vehicle presets and related configuration.
- `src/data/places.js` — Place and station-location data used by the application.
- `src/data/rates.js` — Default fuel and electricity rates.
- `src/utils.js` — Shared calculation and utility functions.
- `src/main.jsx` — React application entry point.
- `src/index.css` — Global styles.

## Data and estimation notes

SmartRoute AI is intended as a planning aid. Its results should be treated as estimates, not guaranteed real-world measurements.

- **Vehicle range and efficiency:** Preset values are illustrative defaults. Actual consumption and range vary with vehicle condition, load, speed, terrain, traffic, weather, and driving style.
- **Station locations:** The station data is a curated application dataset. It includes locations based on public EV-map references as well as illustrative fuel-hub points; some positions may be approximate. It is not a live directory.
- **Station availability:** The app does not confirm that a station is currently open, operational, or has fuel or charging capacity available. Verify before relying on a suggested stop.
- **Routing:** Driving routes use the public OSRM routing service. If routing is unavailable, the app can fall back to an approximate straight-line distance calculation with an adjustment factor. A fallback distance is not a road-route distance.
- **Trip costs:** Cost estimates depend on the selected vehicle efficiency and the configured rates. Confirm current local prices and your vehicle's actual consumption before travelling.
- **Co-Pilot:** Co-Pilot guidance is generated from application rules and templates; it is not a live AI assistant or a source of real-time road conditions.
- **External services:** Map tiles and routing depend on third-party services and their availability and usage policies.

## Contributing

Contributions, bug reports, and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Make and test your changes.
4. Run `npm run build` to check the production build.
5. Commit your changes and push the branch.
6. Open a pull request describing the change.

For bug reports, include steps to reproduce the issue, expected behavior, actual behavior, and relevant screenshots or console output where possible.

## License

No license file was present in the repository when this README was prepared. Unless the repository owner adds a license, the source code remains subject to the default copyright rules; users should not assume they have permission to reuse, distribute, or modify it.
