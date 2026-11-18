# SmartRoute AI — Cambodia Trip Planner

A frontend-only React + Vite application for inter-provincial route planning, vehicle range estimation, refuelling / charging discovery and trip-cost comparison in Cambodia.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Production build:

```bash
npm run build
npm run preview
```

## Stack

- React 18 + Vite
- Tailwind CSS
- Leaflet + React Leaflet
- OpenStreetMap raster tiles
- OSRM public driving route API
- Lucide React icons

No API keys or backend are required.

## Included features

- Welcome screen, vehicle configuration and interactive trip planner
- Stock vehicle presets for EV, hybrid, gasoline, diesel and motorbike
- Modified vehicle configuration and adjustable current energy level
- Cambodia province/city endpoints and custom map-click pins
- OSRM route geometry with straight-line × 1.22 fallback
- Embedded station dataset and category filters
- Rule-based range alerts, pit-stop suggestions and itinerary
- Editable fuel, charging and FX rates
- KHR and USD trip cost comparison

## Data notes — please read

- Fuel defaults: 4,350 KHR/L gasoline and 5,300 KHR/L diesel reflect the Ministry of Commerce retail price schedule effective **11–21 November 2026**.
- EV DC fast-charge default: 1,350 KHR/kWh, the EAC tariff reported effective **1 October 2025** for DC fast charging up to 250 kW.
- FX default: 4,050 KHR/USD is a configurable estimate, not a live FX feed.
- Vehicle efficiency, battery range, and fuel tank sizes are planning estimates. Actual consumption varies by trim, model year, load, speed and conditions.
- Station dataset combines public EV map records (including coordinates/hours/connectors listed by EVizee) and illustrative fuel-hub pins to provide an immediately usable demo map. The app does **not** have live station status or confirm that every named brand location has the listed service. Verify location, operating hours, connector compatibility, pump availability and current pricing with the operator before departure.
- OSRM is a public community routing service. It may rate-limit or be unavailable. The fallback is not a navigable road route.

## Sources

- Ministry of Commerce fuel schedule reported for 11–21 Nov 2026: https://data.opendevelopmentcambodia.net/en/laws_record/notification-no-4001-on-the-retail-price-of-gasoline-at-the-gasoline-station
- Cambodian EV charging stations dataset: https://data.mef.gov.kh/datasets/pd_67b6d073cb47dc00012464a6
- EVizee Cambodia public charger map: https://evizee.co/maps/
- EAC DC fast charging tariff reference: https://cyprusconsulatecambodia.com/electricity-authority-of-cambodia-issues-charging-prices-for-electric-vehicle-charging-stations-in-cambodia/
- OSM tiles: https://www.openstreetmap.org/
- OSRM demo routing: https://project-osrm.org/

## Known limitations

This is a frontend-only trip planning prototype, not a navigation or emergency-rescue service. It does not provide live traffic, charger occupancy, live fuel prices, guaranteed station services, or turn-by-turn voice guidance. Use current operator information and a dedicated navigation app for the actual drive.
