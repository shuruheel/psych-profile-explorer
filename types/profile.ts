export interface PersonalityTrait {
  trait: string;
  evidence: string[];
  confidence: number;
}

export interface EmotionalTrigger {
  trigger: string;
  reaction: string;
  evidence: string[];
}

export interface Loyalty {
  target: string;
  strength: number;
  evidence: string[];
}

export interface CoreValue {
  value: string;
  importance: number;
  consistency: number;
}

export interface DevelopmentPeriod {
  period: string;
  changes: string;
  catalysts: string[];
}

export interface Profile {
  name: string;
  nodeType: string;
  subType: string;
  biography: string;
  aliases: string[];
  personalityTraits: PersonalityTrait[];
  cognitiveStyle: {
    decisionMaking: string;
    problemSolving: string;
    worldview: string;
    biases: string[];
  };
  emotionalProfile: {
    emotionalDisposition: string;
    emotionalTriggers: EmotionalTrigger[];
  };
  relationalDynamics: {
    interpersonalStyle: string;
    powerDynamics: {
      authorityResponse: string;
      subordinateManagement: string;
      negotiationTactics: string[];
    };
    loyalties: Loyalty[];
  };
  valueSystem: {
    coreValues: CoreValue[];
    ethicalFramework: string;
  };
  psychologicalDevelopment: DevelopmentPeriod[];
  metaAttributes: {
    authorBias: number;
    portrayalConsistency: number;
    controversialAspects: string[];
  };
  modelConfidence: number;
  evidenceStrength: number;
  // Additional fields that might be in the database
  description?: string;
  keyContributions?: string[];
  observations?: string[];
  emotionalValence?: number;
  emotionalArousal?: number;
  personalitySummary?: string;
  decisionMaking?: string;
  emotionalDisposition?: string;
  interpersonalStyle?: string;
  ethicalFramework?: string;
  source?: string;
  confidence?: number;
  voiceId?: string; // For Eleven Labs voice
  
  // Fields for voice design
  gender?: string;
  age?: string | number;
  era?: string;
  birthYear?: number;
  deathYear?: number;
  nationality?: string;
  occupation?: string;
  educationLevel?: string;
  languagesSpoken?: string[];
  socialClass?: string;
} 