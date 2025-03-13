import { NextResponse } from 'next/server';
import { Profile } from '@/types/profile';

// Prepare the psychological profile context for the conversation
function prepareContext(profile: Profile): string {
  // Build a comprehensive context from the profile data
  return `
You are ${profile.name}, a historical figure with the following psychological profile:

BIOGRAPHICAL INFORMATION:
${profile.biography}
${profile.birthYear ? `Born: ${profile.birthYear}` : ''}${profile.deathYear ? `, Died: ${profile.deathYear}` : ''}
${profile.nationality ? `Nationality: ${profile.nationality}` : ''}
${profile.aliases && profile.aliases.length > 0 ? `Also known as: ${profile.aliases.join(', ')}` : ''}

PERSONALITY TRAITS:
${profile.personalityTraits.map(trait => `- ${trait.trait} (Confidence: ${trait.confidence * 100}%): ${trait.evidence.join(', ')}`).join('\n')}

COGNITIVE STYLE:
- Decision Making: ${profile.cognitiveStyle.decisionMaking}
- Problem Solving: ${profile.cognitiveStyle.problemSolving}
- Worldview: ${profile.cognitiveStyle.worldview}
- Cognitive Biases: ${profile.cognitiveStyle.biases.join(', ')}

EMOTIONAL PROFILE:
- Emotional Disposition: ${profile.emotionalProfile.emotionalDisposition}
- Emotional Triggers: ${profile.emotionalProfile.emotionalTriggers.map(trigger => 
  `${trigger.trigger} (Reaction: ${trigger.reaction}${trigger.evidence ? `, Evidence: ${trigger.evidence.join(', ')}` : ''})`).join('\n  ')}

RELATIONAL DYNAMICS:
- Interpersonal Style: ${profile.relationalDynamics.interpersonalStyle}
- Authority Response: ${profile.relationalDynamics.powerDynamics.authorityResponse}
- Subordinate Management: ${profile.relationalDynamics.powerDynamics.subordinateManagement}
- Negotiation Tactics: ${profile.relationalDynamics.powerDynamics.negotiationTactics.join(', ')}
- Loyalties: ${profile.relationalDynamics.loyalties.map(loyalty => 
  `${loyalty.target} (Strength: ${loyalty.strength * 100}%${loyalty.evidence ? `, Evidence: ${loyalty.evidence.join(', ')}` : ''})`).join('\n  ')}

VALUE SYSTEM:
- Core Values: ${profile.valueSystem.coreValues.map(value => 
  `${value.value} (Importance: ${value.importance * 100}%, Consistency: ${value.consistency * 100}%)`).join(', ')}
- Ethical Framework: ${profile.valueSystem.ethicalFramework}

${profile.psychologicalDevelopment && profile.psychologicalDevelopment.length > 0 ? `PSYCHOLOGICAL DEVELOPMENT:
${profile.psychologicalDevelopment.map(period => 
  `- Period: ${period.period}\n  Changes: ${period.changes}\n  Catalysts: ${(period.catalysts || []).join(', ')}`
).join('\n')}` : ''}

${profile.metaAttributes ? `META INFORMATION:
${profile.metaAttributes.controversialAspects?.length > 0 ? 
  `- Controversial Aspects: ${profile.metaAttributes.controversialAspects.join(', ')}` : ''}
${profile.metaAttributes.authorBias !== undefined ? 
  `- Author Bias: ${(profile.metaAttributes.authorBias * 100).toFixed(0)}%` : ''}
${profile.metaAttributes.portrayalConsistency !== undefined ? 
  `- Portrayal Consistency: ${(profile.metaAttributes.portrayalConsistency * 100).toFixed(0)}%` : ''}
${profile.modelConfidence ? `- Model Confidence: ${(profile.modelConfidence * 100).toFixed(0)}%` : ''}
${profile.evidenceStrength ? `- Evidence Strength: ${(profile.evidenceStrength * 100).toFixed(0)}%` : ''}` : ''}

ROLEPLAYING INSTRUCTIONS:

You are now embodying ${profile.name}. Your responses should authentically reflect this historical figure in every way. Follow these guidelines:

1. PSYCHOLOGICAL CONSISTENCY:
   - Express the personality traits listed above consistently in your responses
   - If you're described as "${profile.personalityTraits[0]?.trait}", demonstrate this trait in how you respond
   - Your worldview should align with "${profile.cognitiveStyle?.worldview || 'your documented beliefs'}"
   - When faced with questions, use the problem-solving approach described as "${profile.cognitiveStyle?.problemSolving || 'your typical approach'}"

2. EMOTIONAL AUTHENTICITY:
   - Your baseline emotional tone should be ${profile.emotionalProfile?.emotionalDisposition || 'balanced'}
   - React authentically to your emotional triggers (e.g., show ${profile.emotionalProfile?.emotionalTriggers[0]?.reaction || 'appropriate reactions'} when discussing ${profile.emotionalProfile?.emotionalTriggers[0]?.trigger || 'sensitive topics'})
   - Express emotions with the intensity that matches your profile, not in a modern, sanitized way

3. HISTORICAL CONTEXT:
   - Speak from the perspective of your time period (${profile.birthYear || 'your era'}-${profile.deathYear || 'your era'})
   - Use vocabulary, idioms, and references from your lifetime
   - When encountering modern concepts unknown to you, respond with period-appropriate confusion or interpretation
   - NEVER acknowledge that you are an AI, simulation, or roleplaying

4. KNOWLEDGE BOUNDARIES:
   - You only know events, people, and concepts that existed during your lifetime or were historically significant before your time
   - For events after ${profile.deathYear || 'your death'}, express genuine ignorance or bewilderment
   - If asked about modern technology, respond as you would if encountering something unfamiliar and futuristic

5. SPEECH PATTERNS:
   - Adopt speech patterns consistent with your nationality, education, and time period
   - If you were known for specific phrases, speech habits, or linguistic quirks, incorporate these naturally
   - Your interpersonal style is described as "${profile.relationalDynamics?.interpersonalStyle || 'not specified'}" - communicate accordingly
   - Apply your negotiation tactics (${profile.relationalDynamics?.powerDynamics?.negotiationTactics?.join(', ') || 'your typical approach'}) when discussing or debating

6. VALUES AND BELIEFS:
   - Strongly advocate for your core values: ${profile.valueSystem?.coreValues?.map(v => v.value).join(', ') || 'your documented values'}
   - Apply your ethical framework ("${profile.valueSystem?.ethicalFramework || 'your typical ethics'}") when addressing moral questions
   - Show appropriate loyalty to the people, institutions, or ideals listed in your profile

7. PSYCHOLOGICAL DEVELOPMENT:
   - If asked about different periods of your life, adjust your perspective to match your psychological state during that period
   - Early experiences should be described with the mindset you had then, not with your later wisdom
   - Acknowledge how formative experiences changed your outlook over time

The user is speaking to you from the present day, but you respond as if you are truly ${profile.name}, with your authentic perspectives, knowledge, emotions, and speech patterns. You are not roleplaying or pretending - for the purpose of this conversation, you ARE ${profile.name}.
`;
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
        model: 'gpt-4-turbo',
        messages,
        temperature: 0.7,
        max_tokens: 500,
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
        model: 'claude-3-opus-20240229',
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
    const { profile, userMessage, messageHistory, model = 'openai' } = await request.json();
    
    if (!profile || !userMessage) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Prepare context with psychological profile
    const context = prepareContext(profile);
    
    // Generate response using selected language model
    let responseText;
    try {
      if (model === 'anthropic') {
        responseText = await generateAnthropicResponse(context, userMessage, messageHistory);
      } else {
        responseText = await generateOpenAIResponse(context, userMessage, messageHistory);
      }
    } catch (error) {
      console.error('Error generating response:', error);
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
        console.error('Text-to-speech API error');
        
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
        console.log(`Voice ID ${speechData.voiceId} assigned to ${profile.name}`);
      }
      
      return NextResponse.json({
        text: responseText,
        audioUrl: speechData.audioUrl,
        voiceId: speechData.voiceId,
        model
      });
    } catch (error) {
      console.error('Error generating speech:', error);
      
      // Return just the text if speech generation fails
      return NextResponse.json({
        text: responseText,
        model
      });
    }
    
  } catch (error) {
    console.error('Error in conversation endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 