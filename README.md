# Psychological Profiles Viewer

A Next.js application for viewing and exploring psychological profiles of historical figures stored in a Neo4j graph database.

## Features

- View psychological profiles of historical figures
- Detailed personality traits, cognitive styles, emotional profiles, and more
- Interactive UI for exploring different aspects of each profile
- Connected to Neo4j AuraDB for data storage and retrieval

## Prerequisites

- Node.js 18.x or higher
- A Neo4j AuraDB instance with your psychological profiles data

## Getting Started

1. Clone the repository

```bash
git clone <repository-url>
cd psychological-profiles
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables
   
Create a `.env` file in the root directory with your Neo4j AuraDB credentials:

```env
NEO4J_URI=bolt://your-neo4j-uri.databases.neo4j.io:7687
NEO4J_USERNAME=your-username
NEO4J_PASSWORD=your-password
```

4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Neo4j Database Structure

The application expects Neo4j nodes with the following structure:

- Node label: `Person`
- Node properties:
  - `name`: Name of the historical figure
  - `nodeType`: "Entity"
  - `subType`: "Person"
  - `biography`: Brief biographical summary
  - `aliases`: Array of alternative names
  - `personalityTraits`: Array of personality traits with evidence and confidence
  - `cognitiveStyle`: Object containing decision-making style, problem-solving approach, etc.
  - `emotionalProfile`: Object containing emotional disposition and triggers
  - `relationalDynamics`: Object containing interpersonal style and power dynamics
  - `valueSystem`: Object containing core values and ethical framework
  - `psychologicalDevelopment`: Array of developmental periods with changes and catalysts
  - Various other fields as specified in the profile schema

## Data Schema

See the JSON schema in the codebase for the full structure of each profile.

## Technologies Used

- Next.js 15.x
- React 19.x
- Neo4j Database
- Tailwind CSS
- Radix UI Components
- Recharts for data visualization

## License

[Your License Here]
