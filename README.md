# 🚗 SmartRoute AI
### Intelligent Route Planning & Fuel Consumption Estimation

**SmartRoute AI** is an intelligent route planning application that helps drivers make smarter travel decisions by estimating fuel consumption, fuel costs, and travel efficiency across different routes.

Unlike traditional navigation applications that focus primarily on distance and travel time, SmartRoute AI considers vehicle-specific fuel efficiency and road conditions to identify routes that can help drivers save fuel and money.

---

## 🌍 Project Overview

Have you ever wondered how much fuel your vehicle will consume before starting a long journey?

For example, if you drive a **BYD SEAL 05 DM-i**, which has an estimated fuel consumption of 4.8 L/100 km, over a 200 km journey:

```text
Distance: 200 km
Fuel Consumption: 4.8 L/100 km

Estimated Fuel = (200 × 4.8) / 100
               = 9.6 Liters
```

SmartRoute AI takes this concept further by comparing multiple routes between two destinations and estimating fuel consumption based on:

- Vehicle fuel efficiency
- Route distance
- Road types and conditions
- Elevation changes
- Traffic congestion
- Average driving speed

Our goal is to help drivers choose not just the fastest route, but also the most fuel-efficient route.

## ✨ Key Features

### 1. Smart Route Comparison
- Select a starting point and destination.
- Generate multiple alternative driving routes.
- Compare route distances and estimated travel times.
- Identify the most fuel-efficient route.

### 2. Vehicle-Specific Fuel Estimation
- Select a vehicle from the vehicle database.
- Support gasoline, diesel, hybrid, and plug-in hybrid vehicles.
- Estimate fuel consumption based on vehicle specifications.
- Calculate estimated fuel costs.

### 3. AI-Powered Route Analysis
- Analyze road characteristics and route conditions.
- Consider elevation changes and traffic conditions.
- Predict fuel consumption using machine learning models.
- Recommend routes based on fuel efficiency.

### 4. Cost & Environmental Insights
- Estimate total fuel expenses.
- Compare fuel costs across alternative routes.
- Estimate CO₂ emissions from fuel consumption.
- Help users make more environmentally conscious travel decisions.

## 🧠 How It Works

SmartRoute AI combines vehicle specifications, geographic information, and route data to estimate fuel consumption.

**Basic Fuel Consumption Formula:**

```text
Estimated Fuel (L) =
    (Distance (km) × Fuel Consumption (L/100km)) / 100
```

**Advanced Estimation:**

The system can improve the basic calculation by considering additional route characteristics:

```text
Estimated Fuel =
    Base Fuel Consumption × Route Adjustment Factor
```

The adjustment factor will be calibrated using real-world driving data and may incorporate:

- Road type
- Average speed
- Traffic congestion
- Elevation gain and loss
- Driving conditions

For plug-in hybrid vehicles, battery state of charge and electric energy consumption must also be considered to estimate actual fuel usage more accurately.

## 🗺️ Data Sources

SmartRoute AI uses open geographic datasets and vehicle efficiency information.

| Data Source | Purpose |
|---|---|
| [OpenStreetMap](https://www.openstreetmap.org/) | Road networks and geographic information |
| [Geofabrik](https://download.geofabrik.de/) | Downloadable regional road network datasets |
| [OpenRouteService](https://openrouteservice.org/) | Route calculation and alternative routes |
| [FuelEconomy.gov](https://www.fueleconomy.gov/) | Vehicle fuel economy specifications |
| [Natural Resources Canada](https://natural-resources.canada.ca/) | Vehicle fuel consumption datasets |
| [Open-Meteo](https://open-meteo.com/) | Weather information |

*Vehicle specifications from international datasets may need validation against local-market vehicle configurations.*

## 🏗️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js |
| Backend | Python / FastAPI |
| Database | PostgreSQL |
| Geospatial Database | PostGIS |
| Map Visualization | Leaflet / OpenStreetMap |
| Routing Engine | OpenRouteService |
| Data Processing | Pandas / NumPy |
| Machine Learning | Scikit-learn |
| API Integration | REST API |

## 🏛️ System Architecture

```mermaid
flowchart TD
    A[User] --> B[React Frontend]
    B --> C[Backend API - FastAPI]
    C --> D[Route Engine]
    C --> E[Vehicle Database]
    D --> F[OpenStreetMap]
    D --> G[Route Information]
    G --> H[Fuel Estimation Engine]
    E --> H
    H --> I[AI Prediction Model]
    I --> J[Route Comparison]
    J --> B
```

## 📊 Example Use Case

**Scenario: Phnom Penh → Siem Reap**

A driver wants to travel approximately 200 km from Phnom Penh to Siem Reap.

Selected vehicle: BYD SEAL 05 DM-i

| Parameter | Value |
|---|---|
| Starting Point | Phnom Penh |
| Destination | Siem Reap |
| Vehicle | BYD SEAL 05 DM-i |
| Fuel Efficiency | 4.8 L/100 km |
| Distance | 200 km |
| Estimated Fuel | 9.6 L |

The application can compare alternative routes and display their estimated fuel consumption, travel time, and fuel cost.

*Example values are illustrative and are not actual route measurements.*

## 📁 Project Structure

```text
SmartRoute-AI/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── services/
│   │   ├── algorithms/
│   │   └── main.py
│   └── requirements.txt
│
├── datasets/
│   ├── vehicles/
│   ├── road_networks/
│   └── traffic/
│
├── machine-learning/
│   ├── notebooks/
│   ├── training/
│   └── models/
│
├── docs/
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js
- Python 3.10+
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/SmartRoute-AI.git

cd SmartRoute-AI
```

### 2. Start the Backend

```bash
cd backend

python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate

# macOS / Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Start the development server:

```bash
uvicorn app.main:app --reload
```

### 3. Start the Frontend

```bash
cd frontend

npm install

npm run dev
```

### 4. Configure Environment Variables

Create a `.env` file in the backend directory:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/smartroute

OPENROUTESERVICE_API_KEY=your_api_key
```

## 🛣️ Roadmap

- [x] Define project concept and fuel estimation methodology.
- [x] Identify potential vehicle and geographic data sources.
- [ ] Develop vehicle database.
- [ ] Integrate map visualization.
- [ ] Implement route calculation.
- [ ] Build basic fuel consumption calculator.
- [ ] Develop alternative route comparison.
- [ ] Integrate traffic and elevation data.
- [ ] Train machine learning fuel prediction model.
- [ ] Implement fuel cost and CO₂ estimation.
- [ ] Optimize route recommendations.

## 🎯 Project Goals

SmartRoute AI aims to make everyday driving more economical and environmentally conscious.

We envision a navigation system where drivers can understand the real cost of their journeys before they start driving.

**Don't just find the way. Find the smarter way.**

---

## 🤝 Contributing

Contributions, ideas, and suggestions are welcome!

If you would like to contribute:

1. Fork the repository.
2. Create a new feature branch.
3. Commit your changes.
4. Open a Pull Request.

## 📄 License

This project is currently under development. A license will be added when the project is ready for public distribution.

---

**Built with ❤️ for smarter and more sustainable mobility.**

#SmartRouteAI #ArtificialIntelligence #SmartNavigation #FuelEfficiency #SustainableMobility
