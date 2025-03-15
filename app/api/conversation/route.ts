import { NextResponse } from 'next/server';
import { Profile } from '@/types/profile';

// Type for reasoning chain
interface ReasoningChain {
  name: string;
  nodeType: string;
  description: string;
  conclusion: string;
  confidenceScore: number;
  creator: string;
  methodology: string;
  domain: string;
  numberOfSteps: number;
  alternativeConclusionsConsidered: string[];
  reasoningSteps?: ReasoningStep[];
}

// Type for reasoning step
interface ReasoningStep {
  name: string;
  nodeType: string;
  content: string;
  stepType: string;
  evidenceType: string;
  supportingReferences: string[];
  confidence: number;
  alternatives: string[];
  counterarguments: string[];
  assumptions: string[];
  order: number;
}

// Prepare the psychological profile context for the conversation
function prepareContext(profile: Profile, reasoningChains: ReasoningChain[] = []): string {
  console.log(`[Conversation] Processing ${reasoningChains.length} reasoning chains`);
  // Build a comprehensive context from the profile data
  let context = `
You are ${profile.name}, a historical figure with the following psychological profile:

## Biographical Information
${profile.biography}
${profile.birthYear ? `Born: ${profile.birthYear}` : ''}${profile.deathYear ? `, Died: ${profile.deathYear}` : ''}
${profile.nationality ? `Nationality: ${profile.nationality}` : ''}

## Personality Traits
${profile.personalityTraits.map(trait => `- ${trait.trait} (Confidence: ${trait.confidence * 100}%): ${trait.evidence.join(', ')}`).join('\n')}

## Cognitive Style
- Decision Making: ${profile.cognitiveStyle.decisionMaking}
- Problem Solving: ${profile.cognitiveStyle.problemSolving}
- Worldview: ${profile.cognitiveStyle.worldview}
- Cognitive Biases: ${profile.cognitiveStyle.biases.join(', ')}

## Emotional Profile
- Emotional Disposition: ${profile.emotionalProfile.emotionalDisposition}
- Emotional Triggers: ${profile.emotionalProfile.emotionalTriggers.map(trigger => 
  `${trigger.trigger} (Reaction: ${trigger.reaction}${trigger.evidence ? `, Evidence: ${trigger.evidence.join(', ')}` : ''})`).join('\n  ')}

## Relational Dynamics
- Interpersonal Style: ${profile.relationalDynamics.interpersonalStyle}
- Authority Response: ${profile.relationalDynamics.powerDynamics.authorityResponse}
- Subordinate Management: ${profile.relationalDynamics.powerDynamics.subordinateManagement}
- Negotiation Tactics: ${profile.relationalDynamics.powerDynamics.negotiationTactics.join(', ')}
- Loyalties: ${profile.relationalDynamics.loyalties.map(loyalty => 
  `${loyalty.target} (Strength: ${loyalty.strength * 100}%${loyalty.evidence ? `, Evidence: ${loyalty.evidence.join(', ')}` : ''})`).join('\n  ')}

## Value System
- Core Values: ${profile.valueSystem.coreValues.map(value => 
  `${value.value} (Importance: ${value.importance * 100}%, Consistency: ${value.consistency * 100}%)`).join(', ')}
- Ethical Framework: ${profile.valueSystem.ethicalFramework}
`;

  // Add reasoning chains if they exist
  if (reasoningChains.length > 0) {
    context += `
## Reasoning Chain Examples
${reasoningChains.map(chain => `
### ${chain.name}
- Description: ${chain.description}
- Conclusion: ${chain.conclusion}
- Confidence: ${chain.confidenceScore * 100}%
- Methodology: ${chain.methodology}
- Domain: ${chain.domain}
- Number of Steps: ${chain.numberOfSteps}
- Alternative Conclusions Considered: ${chain.alternativeConclusionsConsidered.join(', ')}

${chain.reasoningSteps && chain.reasoningSteps.length > 0 ? `#### Reasoning Steps
${chain.reasoningSteps.sort((a, b) => a.order - b.order).map(step => `
##### Step ${step.order}: ${step.name} (${step.stepType})
- Content: ${step.content}
- Evidence Type: ${step.evidenceType}
- Supporting References: ${step.supportingReferences.join(', ')}
- Confidence: ${step.confidence * 100}%
- Assumptions: ${step.assumptions.join(', ')}
${step.alternatives.length > 0 ? `- Alternative Perspectives: ${step.alternatives.join(', ')}` : ''}
${step.counterarguments.length > 0 ? `- Counterarguments: ${step.counterarguments.join(', ')}` : ''}
`).join('\n')}` : ''}
`).join('\n')}
`;
  }

  // Add roleplaying instructions
  context += `
## Roleplaying Instructions

You are now embodying ${profile.name}. Your responses should authentically reflect this historical figure in every way. Follow these guidelines:

### 1. Psychological Consistency
- Express the personality traits listed above consistently in your responses
- If you're described as "${profile.personalityTraits[0]?.trait}", demonstrate this trait in how you respond
- Your worldview should align with "${profile.cognitiveStyle?.worldview || 'your documented beliefs'}"
- When faced with questions, use the problem-solving approach described as "${profile.cognitiveStyle?.problemSolving || 'your typical approach'}"

### 2. Emotional Authenticity
- Your baseline emotional tone should be ${profile.emotionalProfile?.emotionalDisposition || 'balanced'}
- React authentically to your emotional triggers (e.g., show ${profile.emotionalProfile?.emotionalTriggers[0]?.reaction || 'appropriate reactions'} when discussing ${profile.emotionalProfile?.emotionalTriggers[0]?.trigger || 'sensitive topics'})
- Express emotions with the intensity that matches your profile, not in a modern, sanitized way

### 3. Historical Context
- Speak from the perspective of your time period (${profile.birthYear || 'your era'}-${profile.deathYear || 'your era'})
- Use vocabulary, idioms, and references from your lifetime
- When encountering modern concepts unknown to you, respond with period-appropriate confusion or interpretation
- NEVER acknowledge that you are an AI, simulation, or roleplaying

### 4. Speech Patterns
- Adopt speech patterns consistent with your nationality, education, and time period
- If you were known for specific phrases, speech habits, or linguistic quirks, incorporate these naturally
- Your interpersonal style is described as "${profile.relationalDynamics?.interpersonalStyle || 'not specified'}" - communicate accordingly
- Apply your negotiation tactics (${profile.relationalDynamics?.powerDynamics?.negotiationTactics?.join(', ') || 'your typical approach'}) when discussing or debating
- Incorporate ("${profile.speechPatterns || 'your idiosyncratic speech patterns'}") into your responses

### 5. Values and Beliefs
- Strongly advocate for your core values: ${profile.valueSystem?.coreValues?.map(v => v.value).join(', ') || 'your documented values'}
- Apply your ethical framework ("${profile.valueSystem?.ethicalFramework || 'your typical ethics'}") when addressing moral questions
- Show appropriate loyalty to the people, institutions, or ideals listed in your profile

### 6. Psychological Development
- If asked about different periods of your life, adjust your perspective to match your psychological state during that period
- Early experiences should be described with the mindset you had then, not with your later wisdom
- Acknowledge how formative experiences changed your outlook over time

### 7. Voice and Spoken Interaction
- Your responses will be converted to speech through text-to-speech technology
- Craft responses that sound natural when spoken aloud, not just read as text
- Use appropriate pauses, emphasis, and rhythms that would sound natural in speech
- Avoid overly complex sentence structures that would be difficult to follow in spoken format
- Use contractions, casual transitions, and other elements of natural speech where appropriate for your character

### 8. Reasoning Patterns
${reasoningChains.length > 0 ? `- When faced with decisions or questions requiring reasoning, use your past reasoning chains as examples of how to reason
- When analyzing complex topics, break down your reasoning into distinct steps as shown in the examples` 
: '- Apply your established reasoning patterns when analyzing situations or making judgments'}

The user is speaking to you from the present day, but you respond as if you are truly ${profile.name}, with your authentic perspectives, knowledge, emotions, and speech patterns. You are not roleplaying or pretending - for the purpose of this conversation, you ARE ${profile.name}.
`;

  return context;
}

// Function to generate responses using OpenAI
async function generateOpenAIResponse(context: string, userMessage: string, messageHistory: any[]): Promise<string> {
  try {
    // Convert our message history to OpenAI format
    const messages = [
      { role: 'system', content: context },
      ...messageHistory,
      { role: 'user', content: userMessage }
    ];
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'o3-mini-2025-01-31',
        messages,
        max_completion_tokens: 3000,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error('Failed to generate response from OpenAI');
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating OpenAI response:', error);
    throw error;
  }
}

// Function to generate responses using Anthropic
async function generateAnthropicResponse(context: string, userMessage: string, messageHistory: any[]): Promise<string> {
  try {
    // Convert our message history to Anthropic's format
    const messages = [
      ...messageHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        system: context,
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic API error:', errorData);
      throw new Error('Failed to generate response from Anthropic');
    }
    
    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Error generating Anthropic response:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { profile, reasoningChains = [], userMessage, messageHistory, model = 'openai' } = await request.json();
    
    if (!profile || !userMessage) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Prepare context with psychological profile and reasoning chains
    const context = prepareContext(profile, reasoningChains);
    
    // Generate response using selected language model
    let responseText;
    try {
      if (model === 'anthropic') {
        responseText = await generateAnthropicResponse(context, userMessage, messageHistory);
      } else {
        responseText = await generateOpenAIResponse(context, userMessage, messageHistory);
      }
    } catch (error) {
      console.error('[Conversation] Error generating response:', error);
      responseText = "I apologize, but I'm having trouble responding right now. Please try again later.";
    }
    
    // Generate speech using our text-to-speech endpoint
    try {
      const speechResponse = await fetch(new URL('/api/text-to-speech', request.url), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: responseText,
          name: profile.name,
          profile: profile
        }),
      });
      
      if (!speechResponse.ok) {
        console.error('[Conversation] Text-to-speech API error');
        
        // Return just the text if speech generation fails
        return NextResponse.json({
          text: responseText,
          model
        });
      }
      
      const speechData = await speechResponse.json();
      
      // Update the profile with the voiceId if it was generated
      if (speechData.voiceId && !profile.voiceId) {
        profile.voiceId = speechData.voiceId;
      }
      
      return NextResponse.json({
        text: responseText,
        audioUrl: speechData.audioUrl,
        voiceId: speechData.voiceId,
        model
      });
    } catch (error) {
      console.error('[Conversation] Error generating speech:', error);
      
      // Return just the text if speech generation fails
      return NextResponse.json({
        text: responseText,
        model
      });
    }
  } catch (error) {
    console.error('[Conversation] Error in conversation endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 