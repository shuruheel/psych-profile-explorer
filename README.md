# Psychological Profiles Application

An interactive web application for exploring the psychological profiles of historical figures, with the ability to engage in voice conversations that are informed by their detailed psychological and emotional traits.

## Features

### Psychological Profile Exploration
- View detailed psychological profiles of historical figures stored in a Neo4j graph database
- Explore personality traits, cognitive styles, emotional profiles, relational dynamics, and value systems

### Interactive Conversations
- Talk to historical figures using AI-powered conversations
- Responses are deeply informed by the psychological profile data
- Experience realistic voice interactions that match the figure's personality
- Choose between OpenAI (GPT-4) or Anthropic (Claude) language models for different conversation experiences

### Dynamic Voice Generation
- Uses Eleven Labs AI voice design technology to automatically generate unique voices for each historical figure
- Voice characteristics are derived from the psychological profile and biographical data
- Voices reflect personality traits, emotional disposition, and speaking style 

## Technical Implementation

### Voice Design Technology

The application uses a scalable approach to generating unique voices for thousands of historical figures without manual selection:

1. **Dynamic Voice Generation**: Instead of manually selecting voices for each figure, we use Eleven Labs' voice design API to automatically generate voices based on psychological profiles.

2. **Profile-Based Prompt Engineering**: The system creates detailed prompts for voice generation that include:
   - Personality traits and emotional disposition
   - Speaking style based on interpersonal dynamics
   - Historical context and cultural background

3. **Intelligent Caching**: Generated voice IDs are cached to avoid regeneration in future conversations.

4. **Fallback Mechanism**: If voice generation fails, the system falls back to a default voice.

### Conversational AI Architecture

The application uses a layered approach to create authentic conversations with historical figures:

1. **Dual-Model Support**: Choose between OpenAI (GPT-4) and Anthropic (Claude) for response generation, allowing comparison between different AI models
   
2. **Separation of Content and Voice**: 
   - Language models (GPT-4/Claude) generate authentic responses based on psychological profiles
   - Eleven Labs handles voice synthesis separately for optimal quality
   
3. **Contextual Prompting**: Each model receives comprehensive context derived from the historical figure's psychological profile

### API Architecture

The application uses several API endpoints to facilitate conversations:

- `/api/conversation`: Processes conversations with the historical figure using OpenAI or Anthropic models with the psychological profile as context
- `/api/text-to-speech`: Converts text responses into speech using the figure's unique voice
- `/api/voice-design`: Generates unique voices based on psychological profiles

### Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Database**: Neo4j Graph Database
- **AI Models**: OpenAI GPT-4, Anthropic Claude
- **Voice Technology**: Eleven Labs API
- **Styling**: shadcn/ui components 

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with the following variables:
   ```
   # Neo4j Database Configuration
   NEO4J_URI=your_neo4j_uri
   NEO4J_USER=your_username
   NEO4J_PASSWORD=your_password
   
   # Eleven Labs API Configuration
   ELEVEN_LABS_API_KEY=your_eleven_labs_api_key
   DEFAULT_VOICE_ID=fallback_voice_id  # Optional default voice
   
   # AI Model API Keys
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ```
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Browse the list of historical figures
2. Select a figure to view their psychological profile
3. Click the "Talk to [Name]" button to start a conversation
4. Select your preferred language model (OpenAI GPT-4 or Anthropic Claude) from the dropdown
5. Type questions or comments and receive responses that reflect the figure's psychological traits
6. Listen to responses in a voice that matches the historical figure's persona

## Future Enhancements

- Voice recording for more natural conversation flow
- Emotional adaptation based on conversation context
- Multi-language support for global historical figures
- Improved voice design with more nuanced prompts
- Additional language model options as they become available

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
- OpenAI GPT-4
- Anthropic Claude

## License

[Your License Here]
