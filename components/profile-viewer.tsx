"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Brain, Heart, Users, Lightbulb, TimerIcon as Timeline, FileText, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useClickOutside, useEscapeKey } from "@/lib/hooks"

// Sample data - in a real app, this would come from an API
const sampleProfiles = [
  {
    name: "Marie Curie",
    nodeType: "Entity",
    subType: "Person",
    biography: "Polish-born physicist and chemist who conducted pioneering research on radioactivity.",
    aliases: ["Maria Skłodowska", "Madame Curie"],
    personalityTraits: [
      { trait: "Analytical", evidence: ["Methodical research approach", "Detailed laboratory notes"], confidence: 0.9 },
      { trait: "Determined", evidence: ["Continued research despite difficult conditions"], confidence: 0.95 },
    ],
    cognitiveStyle: {
      decisionMaking: "Data-driven",
      problemSolving: "Systematic",
      worldview: "Scientific realism",
      biases: ["Confirmation bias"],
    },
    emotionalProfile: {
      emotionalDisposition: "Reserved",
      emotionalTriggers: [
        {
          trigger: "Scientific dishonesty",
          reaction: "Strong disapproval",
          evidence: ["Criticized colleagues who misrepresented findings"],
        },
      ],
    },
    relationalDynamics: {
      interpersonalStyle: "Collaborative",
      powerDynamics: {
        authorityResponse: "Respectful but assertive",
        subordinateManagement: "Mentoring approach",
        negotiationTactics: ["Evidence-based argumentation", "Persistence"],
      },
      loyalties: [
        { target: "Scientific integrity", strength: 0.95, evidence: ["Refused to patent radium isolation process"] },
      ],
    },
    valueSystem: {
      coreValues: [
        { value: "Truth", importance: 0.95, consistency: 0.9 },
        { value: "Knowledge advancement", importance: 0.9, consistency: 0.9 },
      ],
      ethicalFramework: "Utilitarian with focus on scientific progress",
    },
    psychologicalDevelopment: [
      {
        period: "Early career",
        changes: "Developed scientific confidence",
        catalysts: ["Education in France", "Partnership with Pierre Curie"],
      },
    ],
    metaAttributes: {
      authorBias: 0.1,
      portrayalConsistency: 0.85,
      controversialAspects: ["Relationship with Paul Langevin"],
    },
    modelConfidence: 0.85,
    evidenceStrength: 0.8,
  },
  {
    name: "Albert Einstein",
    nodeType: "Entity",
    subType: "Person",
    biography:
      "Theoretical physicist who developed the theory of relativity and made significant contributions to quantum mechanics.",
    aliases: ["The Father of Modern Physics"],
    personalityTraits: [
      { trait: "Curious", evidence: ["Thought experiments", "Wide-ranging interests"], confidence: 0.95 },
      {
        trait: "Independent thinker",
        evidence: ["Challenged Newtonian physics", "Questioned authority"],
        confidence: 0.9,
      },
    ],
    cognitiveStyle: {
      decisionMaking: "Intuitive",
      problemSolving: "Conceptual",
      worldview: "Deterministic universe with probabilistic elements",
      biases: ["Aesthetic bias toward simplicity"],
    },
    emotionalProfile: {
      emotionalDisposition: "Contemplative",
      emotionalTriggers: [
        {
          trigger: "Nationalism",
          reaction: "Strong aversion",
          evidence: ["Renounced German citizenship", "Pacifist stance"],
        },
      ],
    },
    relationalDynamics: {
      interpersonalStyle: "Friendly but detached",
      powerDynamics: {
        authorityResponse: "Skeptical",
        subordinateManagement: "Encouraging autonomy",
        negotiationTactics: ["Logical persuasion", "Humor"],
      },
      loyalties: [
        { target: "Intellectual honesty", strength: 0.9, evidence: ["God does not play dice with the universe"] },
      ],
    },
    valueSystem: {
      coreValues: [
        { value: "Simplicity", importance: 0.9, consistency: 0.85 },
        { value: "Freedom", importance: 0.85, consistency: 0.8 },
      ],
      ethicalFramework: "Humanistic with cosmic perspective",
    },
    psychologicalDevelopment: [
      {
        period: "Patent office years",
        changes: "Developed independent thinking",
        catalysts: ["Professional isolation", "Self-directed study"],
      },
    ],
    metaAttributes: {
      authorBias: 0.2,
      portrayalConsistency: 0.75,
      controversialAspects: ["Relationship with first wife Mileva Marić"],
    },
    modelConfidence: 0.8,
    evidenceStrength: 0.75,
  },
]

// Define the Profile type based on our schema
interface PersonalityTrait {
  trait: string
  evidence: string[]
  confidence: number
}

interface EmotionalTrigger {
  trigger: string
  reaction: string
  evidence: string[]
}

interface Loyalty {
  target: string
  strength: number
  evidence: string[]
}

interface CoreValue {
  value: string
  importance: number
  consistency: number
}

interface DevelopmentPeriod {
  period: string
  changes: string
  catalysts: string[]
}

interface Profile {
  name: string
  nodeType: string
  subType: string
  biography: string
  aliases: string[]
  personalityTraits: PersonalityTrait[]
  cognitiveStyle: {
    decisionMaking: string
    problemSolving: string
    worldview: string
    biases: string[]
  }
  emotionalProfile: {
    emotionalDisposition: string
    emotionalTriggers: EmotionalTrigger[]
  }
  relationalDynamics: {
    interpersonalStyle: string
    powerDynamics: {
      authorityResponse: string
      subordinateManagement: string
      negotiationTactics: string[]
    }
    loyalties: Loyalty[]
  }
  valueSystem: {
    coreValues: CoreValue[]
    ethicalFramework: string
  }
  psychologicalDevelopment: DevelopmentPeriod[]
  metaAttributes: {
    authorBias: number
    portrayalConsistency: number
    controversialAspects: string[]
  }
  modelConfidence: number
  evidenceStrength: number
  // Additional fields from the database schema
  description?: string
  keyContributions?: string[]
  observations?: string[]
  emotionalValence?: number
  emotionalArousal?: number
  personalitySummary?: string
  decisionMaking?: string
  emotionalDisposition?: string
  interpersonalStyle?: string
  ethicalFramework?: string
  source?: string
  confidence?: number
}

// Helper function to safely access properties
const getSafe = {
  personalityTraits: (profile: Profile | null) => profile?.personalityTraits || [],
  aliases: (profile: Profile | null) => profile?.aliases || [],
  cognitiveStyle: (profile: Profile | null) => profile?.cognitiveStyle || { 
    decisionMaking: "", problemSolving: "", worldview: "", biases: [] 
  },
  emotionalProfile: (profile: Profile | null) => profile?.emotionalProfile || { 
    emotionalDisposition: "", emotionalTriggers: [] 
  },
  relationalDynamics: (profile: Profile | null) => profile?.relationalDynamics || { 
    interpersonalStyle: "", 
    powerDynamics: { 
      authorityResponse: "", 
      subordinateManagement: "", 
      negotiationTactics: [] 
    }, 
    loyalties: [] 
  },
  valueSystem: (profile: Profile | null) => profile?.valueSystem || { 
    coreValues: [], ethicalFramework: "" 
  },
  psychologicalDevelopment: (profile: Profile | null) => profile?.psychologicalDevelopment || [],
  metaAttributes: (profile: Profile | null) => profile?.metaAttributes || { 
    authorBias: 0, portrayalConsistency: 0, controversialAspects: [] 
  },
}

export default function ProfileViewer() {
  const [profileNames, setProfileNames] = useState<{name: string}[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const [profileLoading, setProfileLoading] = useState(false)
  
  // Filtered profile names based on search query
  const filteredProfileNames = profileNames.filter(profile => 
    profile.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Change the searchRef definition to be more explicit
  const searchRef = useRef<HTMLDivElement>(null)

  // Replace the custom click-outside handler with our hooks
  const closeDropdown = () => setDropdownOpen(false)
  useClickOutside(searchRef, closeDropdown)
  useEscapeKey(closeDropdown)

  // Fetch just the profile names on component mount
  useEffect(() => {
    const fetchProfileNames = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/profiles/names')
        
        if (!response.ok) {
          throw new Error(`Failed to fetch profile names: ${response.status}`)
        }
        
        const responseData = await response.json()
        
        // Check if the response contains names array (API returns {names: [], message: ""} on empty results)
        const profileNamesData = Array.isArray(responseData) ? responseData : 
                              (responseData.names && Array.isArray(responseData.names)) ? responseData.names : [];
        
        if (profileNamesData.length > 0) {
          setProfileNames(profileNamesData)
          
          // Fetch the first profile to display initially
          await fetchProfile(profileNamesData[0].name)
        } else {
          // If no profiles found, set error
          setError(responseData.message || 'No profiles found in the database')
          // Fallback to sample data if available
          if (sampleProfiles.length > 0) {
            setProfiles(sampleProfiles)
            setSelectedProfile(sampleProfiles[0])
            setError('Using sample data (no profiles found in database)')
          }
        }
      } catch (err) {
        console.error('Error fetching profile names:', err)
        setError('Failed to fetch profiles. Using sample data.')
        // Fallback to sample data
        setProfiles(sampleProfiles)
        setSelectedProfile(sampleProfiles[0])
      } finally {
        setLoading(false)
      }
    }

    fetchProfileNames()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Function to fetch a single profile by name
  const fetchProfile = async (name: string) => {
    // First check if it's already in our profiles array
    const existingProfile = profiles.find(p => p.name === name)
    
    if (existingProfile) {
      setSelectedProfile(existingProfile)
      return
    }
    
    // If not found locally, fetch from API
    try {
      setProfileLoading(true)
      const response = await fetch(`/api/profiles/${encodeURIComponent(name)}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`)
      }
      
      const profile = await response.json()
      setSelectedProfile(profile)
      
      // Add this profile to our cache
      setProfiles(prevProfiles => [...prevProfiles, profile])
    } catch (err) {
      console.error(`Error fetching profile ${name}:`, err)
      setError(`Failed to fetch profile: ${name}`)
    } finally {
      setProfileLoading(false)
    }
  }

  // Function to handle profile selection
  const handleProfileChange = (name: string) => {
    setSearchQuery('') // Clear search after selection
    setDropdownOpen(false) // Close dropdown
    fetchProfile(name)
  }

  // If loading, show a loading state
  if (loading && !selectedProfile) {
    return (
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <div className="h-7 w-2/5 bg-muted animate-pulse rounded-md mb-2"></div>
            <div className="h-5 w-3/5 bg-muted animate-pulse rounded-md opacity-70"></div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-3">
              <div className="h-10 bg-muted animate-pulse rounded-md"></div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted animate-pulse rounded-md"></div>
                <div className="h-4 w-4/5 bg-muted animate-pulse rounded-md"></div>
                <div className="h-4 w-2/3 bg-muted animate-pulse rounded-md"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If error and no profile, show error state
  if (error && !selectedProfile) {
    return (
      <div className="grid grid-cols-1 gap-6">
        <Card className="border-red-300 shadow-sm overflow-hidden">
          <div className="bg-red-50 px-4 py-2 border-b border-red-200">
            <CardTitle className="text-red-600 flex items-center text-lg">
              <AlertCircle className="h-5 w-5 mr-2" />
              Error
            </CardTitle>
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-muted-foreground border rounded-md p-3 bg-background">
              <span className="text-sm">Please check your database connection or try again later.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If no profile selected (but we have profiles), use the first one
  if (!selectedProfile && profiles.length > 0) {
    setSelectedProfile(profiles[0])
    return null // Will re-render with selected profile
  }

  // If no profiles at all, show error
  if (!selectedProfile) {
    return (
      <div className="grid grid-cols-1 gap-6">
        <Card className="border-amber-300 shadow-sm overflow-hidden">
          <div className="bg-amber-50 px-4 py-2 border-b border-amber-200">
            <CardTitle className="text-amber-700 flex items-center text-lg">
              <AlertCircle className="h-5 w-5 mr-2" />
              No Profiles Available
            </CardTitle>
          </div>
          <CardHeader>
            <CardDescription className="text-amber-800">No psychological profiles found in the database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-6 border rounded-md border-dashed text-muted-foreground">
              <Brain className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-center mb-1">Could not find any profiles in the database.</p>
              <p className="text-sm text-center">Please check your database connection or add some profiles.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Safely access nested properties with fallbacks
  const safeAccess = {
    // Personality traits section
    getPersonalityTraits: () => getSafe.personalityTraits(selectedProfile),
    
    // Cognitive style section
    getCognitiveStyle: () => getSafe.cognitiveStyle(selectedProfile),
    getCognitiveDecisionMaking: () => getSafe.cognitiveStyle(selectedProfile)?.decisionMaking || selectedProfile?.decisionMaking || 'Not specified',
    getCognitiveProblemSolving: () => getSafe.cognitiveStyle(selectedProfile)?.problemSolving || 'Not specified',
    getCognitiveWorldview: () => getSafe.cognitiveStyle(selectedProfile)?.worldview || 'Not specified',
    getCognitiveBiases: () => getSafe.cognitiveStyle(selectedProfile)?.biases || [],
    
    // Emotional profile section
    getEmotionalProfile: () => getSafe.emotionalProfile(selectedProfile),
    getEmotionalDisposition: () => getSafe.emotionalProfile(selectedProfile)?.emotionalDisposition || selectedProfile?.emotionalDisposition || 'Not specified',
    getEmotionalTriggers: () => getSafe.emotionalProfile(selectedProfile)?.emotionalTriggers || [],
    
    // Relational dynamics section
    getRelationalDynamics: () => getSafe.relationalDynamics(selectedProfile),
    getInterpersonalStyle: () => getSafe.relationalDynamics(selectedProfile)?.interpersonalStyle || selectedProfile?.interpersonalStyle || 'Not specified',
    getPowerDynamics: () => getSafe.relationalDynamics(selectedProfile)?.powerDynamics || {},
    getAuthorityResponse: () => getSafe.relationalDynamics(selectedProfile)?.powerDynamics?.authorityResponse || 'Not specified',
    getSubordinateManagement: () => getSafe.relationalDynamics(selectedProfile)?.powerDynamics?.subordinateManagement || 'Not specified',
    getNegotiationTactics: () => getSafe.relationalDynamics(selectedProfile)?.powerDynamics?.negotiationTactics || [],
    getLoyalties: () => getSafe.relationalDynamics(selectedProfile)?.loyalties || [],
    
    // Value system section
    getValueSystem: () => getSafe.valueSystem(selectedProfile),
    getCoreValues: () => getSafe.valueSystem(selectedProfile)?.coreValues || [],
    getEthicalFramework: () => getSafe.valueSystem(selectedProfile)?.ethicalFramework || selectedProfile?.ethicalFramework || 'Not specified',
    
    // Psychological development section
    getPsychologicalDevelopment: () => getSafe.psychologicalDevelopment(selectedProfile),
    
    // Meta attributes section
    getMetaAttributes: () => getSafe.metaAttributes(selectedProfile),
    getControversialAspects: () => getSafe.metaAttributes(selectedProfile)?.controversialAspects || [],
    getAuthorBias: () => getSafe.metaAttributes(selectedProfile)?.authorBias || 0,
    getPortrayalConsistency: () => getSafe.metaAttributes(selectedProfile)?.portrayalConsistency || 0,
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {error && (
        <Card className="border-amber-300 bg-amber-50 shadow-sm overflow-hidden">
          <CardContent className="py-3">
            <div className="flex items-center text-amber-700">
              <AlertCircle className="mr-2 h-4 w-4" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Select Historical Figure</CardTitle>
          <CardDescription>Whose mind do you want to explore?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative" ref={searchRef}>
            <div className={`flex items-center ${dropdownOpen ? '' : ''}`}>
              <div className="flex w-full items-center">
                <Input
                  className="flex w-full bg-transparent py-2 px-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Click to view suggestions or enter a name..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSearchQuery(e.target.value)
                    setDropdownOpen(true)
                    setActiveIndex(-1)
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  onKeyDown={(e) => {
                    if (!dropdownOpen) return;
                    
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      if (filteredProfileNames.length === 0) return;
                      setActiveIndex(prev => (prev + 1) % filteredProfileNames.length);
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      if (filteredProfileNames.length === 0) return;
                      setActiveIndex(prev => prev <= 0 ? filteredProfileNames.length - 1 : prev - 1);
                    } else if (e.key === 'Enter') {
                      e.preventDefault();
                      if (activeIndex >= 0 && activeIndex < filteredProfileNames.length) {
                        handleProfileChange(filteredProfileNames[activeIndex].name);
                      }
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      setDropdownOpen(false);
                    }
                  }}
                  disabled={loading}
                />
              </div>
            </div>
            
            {dropdownOpen && (
              <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-popover py-1 shadow-md border border-border">
                {filteredProfileNames.length > 0 ? (
                  filteredProfileNames.map((profile, index) => (
                    <div
                      key={profile.name}
                      className={`relative flex cursor-pointer select-none items-center px-3 py-2 text-sm transition-colors ${index === activeIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50 hover:text-accent-foreground'}`}
                      onClick={() => handleProfileChange(profile.name)}
                      onMouseEnter={() => setActiveIndex(index)}
                    >
                      {profile.name}
                    </div>
                  ))
                ) : (
                  <div className="relative flex cursor-default select-none flex-col items-center px-3 py-6 text-sm text-muted-foreground">
                    <Search className="h-5 w-5 mb-2 opacity-30" />
                    <p>No results found for &quot;{searchQuery}&quot;</p>
                    <p className="text-xs mt-1">Try a different search term</p>
                  </div>
                )}
                {filteredProfileNames.length > 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground border-t mt-1">
                    <div className="flex items-center justify-between">
                      <span>Press <kbd className="px-1.5 py-0.5 bg-muted rounded border">↵</kbd> to select</span>
                      <span>Press <kbd className="px-1.5 py-0.5 bg-muted rounded border">Esc</kbd> to close</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">{selectedProfile.name}</CardTitle>
              <CardDescription className="mt-1 text-base">
                {selectedProfile.biography || 
                  <span className="italic text-muted-foreground">No biography available</span>}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedProfile.aliases && selectedProfile.aliases.length > 0 ? (
                selectedProfile.aliases.map((alias) => (
                  <Badge key={alias} variant="outline" className="px-3 py-1 text-xs font-medium">
                    {alias}
                  </Badge>
                ))
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="flex items-center justify-between w-full mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm text-muted-foreground">
              <div className="flex-1 flex items-center p-2 bg-background rounded-md border">
                <span className="mr-2 font-medium whitespace-nowrap">Assesssment Confidence:</span>
                <Progress 
                  value={(selectedProfile?.modelConfidence || selectedProfile?.confidence || 0) * 100} 
                  className="w-24 h-2.5 mr-2" 
                />
                <span className="ml-1 font-medium text-xs">
                  {((selectedProfile?.modelConfidence || selectedProfile?.confidence || 0) * 100).toFixed(0)}%
                </span>
                <span className="ml-2 text-xs opacity-70">
                  {selectedProfile?.modelConfidence ? '' : '(default value)'}
                </span>
              </div>
              <div className="flex-1 flex items-center p-2 bg-background rounded-md border">
                <span className="mr-2 font-medium whitespace-nowrap">Evidence Strength:</span>
                <Progress 
                  value={(selectedProfile?.evidenceStrength || 0.5) * 100} 
                  className="w-24 h-2.5 mr-2" 
                />
                <span className="ml-1 font-medium text-xs">
                  {((selectedProfile?.evidenceStrength || 0.5) * 100).toFixed(0)}%
                </span>
                <span className="ml-2 text-xs opacity-70">
                  {selectedProfile?.evidenceStrength ? '' : '(default value)'}
                </span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground flex items-center">
              <span className="opacity-70">Last updated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {selectedProfile.source && (
            <div className="mt-2 text-xs text-muted-foreground flex items-center">
              <span className="font-medium mr-1">Source:</span> {selectedProfile.source}
            </div>
          )}

          <Tabs defaultValue="personality">
            <TabsList className="grid grid-cols-6 mb-3 md:gap-0 gap-1 w-full h-12">
              <TabsTrigger value="personality" className="flex items-center gap-1 h-10">
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">Personality</span>
              </TabsTrigger>
              <TabsTrigger value="cognitive" className="flex items-center gap-1 h-10">
                <Lightbulb className="h-4 w-4" />
                <span className="hidden sm:inline">Cognitive</span>
              </TabsTrigger>
              <TabsTrigger value="emotional" className="flex items-center gap-1 h-10">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Emotional</span>
              </TabsTrigger>
              <TabsTrigger value="relational" className="flex items-center gap-1 h-10">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Relational</span>
              </TabsTrigger>
              <TabsTrigger value="values" className="flex items-center gap-1 h-10">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Values</span>
              </TabsTrigger>
              <TabsTrigger value="development" className="flex items-center gap-1 h-10">
                <Timeline className="h-4 w-4" />
                <span className="hidden sm:inline">Development</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personality" className="space-y-4">
              <h3 className="text-lg font-medium">Personality Traits</h3>
              <div className="grid gap-4">
                {safeAccess.getPersonalityTraits().length > 0 ? (
                  safeAccess.getPersonalityTraits().map((trait) => (
                    <Card key={trait.trait} className="overflow-hidden transition-shadow hover:shadow-md">
                      <CardHeader className="py-1 bg-muted/30">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">{trait.trait}</CardTitle>
                          <div className="flex items-center">
                            <Progress value={(trait.confidence || 0) * 100} className="w-24 h-2 mr-2" />
                            <span className="text-sm font-medium">{((trait.confidence || 0) * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="py-3">
                        <h4 className="text-sm font-medium mb-2">Evidence:</h4>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          {(trait.evidence || []).map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="border-dashed border-2">
                    <CardContent className="py-6 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Brain className="h-8 w-8 mb-2 opacity-30" />
                        <p>No personality traits data available</p>
                        <p className="text-xs mt-1">Profile may be incomplete or still in development</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="cognitive" className="space-y-4">
              <h3 className="text-lg font-medium">Cognitive Style</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="overflow-hidden transition-shadow hover:shadow-md">
                  <CardHeader className="py-1 bg-muted/30">
                    <CardTitle className="text-base">Decision Making</CardTitle>
                  </CardHeader>
                  <CardContent className="py-3">
                    <p>{safeAccess.getCognitiveDecisionMaking()}</p>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden transition-shadow hover:shadow-md">
                  <CardHeader className="py-1 bg-muted/30">
                    <CardTitle className="text-base">Problem Solving</CardTitle>
                  </CardHeader>
                  <CardContent className="py-3">
                    <p>{safeAccess.getCognitiveProblemSolving()}</p>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden transition-shadow hover:shadow-md">
                  <CardHeader className="py-1 bg-muted/30">
                    <CardTitle className="text-base">Worldview</CardTitle>
                  </CardHeader>
                  <CardContent className="py-3">
                    <p>{safeAccess.getCognitiveWorldview()}</p>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden transition-shadow hover:shadow-md">
                  <CardHeader className="py-1 bg-muted/30">
                    <CardTitle className="text-base">Cognitive Biases</CardTitle>
                  </CardHeader>
                  <CardContent className="py-3">
                    <div className="flex flex-wrap gap-2">
                      {safeAccess.getCognitiveBiases().length > 0 ? (
                        safeAccess.getCognitiveBiases().map((bias) => (
                          <Badge key={bias} variant="secondary" className="px-3 py-1">
                            {bias}
                          </Badge>
                        ))
                      ) : (
                        <div className="flex items-center text-muted-foreground">
                          <AlertCircle className="h-3.5 w-3.5 mr-2 opacity-70" />
                          <span className="text-sm">No cognitive biases recorded</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="emotional" className="space-y-4">
              <h3 className="text-lg font-medium">Emotional Profile</h3>
              <Card className="overflow-hidden transition-shadow hover:shadow-md">
                <CardHeader className="py-1 bg-muted/30">
                  <CardTitle className="text-base">Emotional Disposition</CardTitle>
                </CardHeader>
                <CardContent className="py-3">
                  <p>{safeAccess.getEmotionalDisposition()}</p>
                </CardContent>
              </Card>

              <h3 className="text-lg font-medium">Emotional Triggers</h3>
              <div className="grid gap-4">
                {safeAccess.getEmotionalTriggers().length > 0 ? (
                  safeAccess.getEmotionalTriggers().map((trigger, i) => (
                    <Card key={i} className="overflow-hidden transition-shadow hover:shadow-md">
                      <CardHeader className="py-1 bg-muted/30">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">{trigger.trigger}</CardTitle>
                          <Badge className="px-2.5 py-0.5">{trigger.reaction}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="py-3">
                        <h4 className="text-sm font-medium mb-2">Evidence:</h4>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          {(trigger.evidence || []).map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="border-dashed border-2">
                    <CardContent className="py-6 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Heart className="h-8 w-8 mb-2 opacity-30" />
                        <p>No emotional triggers data available</p>
                        <p className="text-xs mt-1">Profile may be incomplete or still in development</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="relational" className="space-y-4">
              <h3 className="text-lg font-medium">Relational Dynamics</h3>
              <Card>
                <CardHeader className="py-1">
                  <CardTitle className="text-base">Interpersonal Style</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <p>{safeAccess.getInterpersonalStyle()}</p>
                </CardContent>
              </Card>

              <h3 className="text-lg font-medium">Power Dynamics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="py-1">
                    <CardTitle className="text-base">Authority Response</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p>{safeAccess.getAuthorityResponse()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-1">
                    <CardTitle className="text-base">Subordinate Management</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p>{safeAccess.getSubordinateManagement()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-1">
                    <CardTitle className="text-base">Negotiation Tactics</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <ul className="list-disc pl-5 text-sm">
                      {safeAccess.getNegotiationTactics().length > 0 ? (
                        safeAccess.getNegotiationTactics().map((tactic, i) => (
                          <li key={i}>{tactic}</li>
                        ))
                      ) : (
                        <li className="text-muted-foreground">No tactics specified</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <h3 className="text-lg font-medium">Loyalties</h3>
              <div className="grid gap-4">
                {safeAccess.getLoyalties().length > 0 ? (
                  safeAccess.getLoyalties().map((loyalty, i) => (
                    <Card key={i}>
                      <CardHeader className="py-1">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">{loyalty.target}</CardTitle>
                          <div className="flex items-center">
                            <Progress value={(loyalty.strength || 0) * 100} className="w-24 h-2 mr-2" />
                            <span className="text-sm">{((loyalty.strength || 0) * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="py-2">
                        <h4 className="text-sm font-medium mb-2">Evidence:</h4>
                        <ul className="list-disc pl-5 text-sm">
                          {(loyalty.evidence || []).map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="border-dashed border-2">
                    <CardContent className="py-6 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Users className="h-8 w-8 mb-2 opacity-30" />
                        <p>No loyalty data available</p>
                        <p className="text-xs mt-1">Profile may be incomplete or still in development</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="values" className="space-y-4">
              <h3 className="text-lg font-medium">Core Values</h3>
              <div className="grid gap-4">
                {safeAccess.getCoreValues().length > 0 ? (
                  safeAccess.getCoreValues().map((value) => (
                    <Card key={value.value}>
                      <CardHeader className="py-1">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">{value.value}</CardTitle>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center">
                              <span className="text-xs mr-2">Importance:</span>
                              <Progress value={(value.importance || 0) * 100} className="w-16 h-2 mr-1" />
                              <span className="text-xs">{((value.importance || 0) * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-xs mr-2">Consistency:</span>
                              <Progress value={(value.consistency || 0) * 100} className="w-16 h-2 mr-1" />
                              <span className="text-xs">{((value.consistency || 0) * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))
                ) : (
                  <Card className="border-dashed border-2">
                    <CardContent className="py-6 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <FileText className="h-8 w-8 mb-2 opacity-30" />
                        <p>No core values data available</p>
                        <p className="text-xs mt-1">Profile may be incomplete or still in development</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <h3 className="text-lg font-medium">Ethical Framework</h3>
              <Card>
                <CardContent className="py-4">
                  <p>{safeAccess.getEthicalFramework()}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="development" className="space-y-4">
              <h3 className="text-lg font-medium">Psychological Development</h3>
              <div className="grid gap-4">
                {safeAccess.getPsychologicalDevelopment().length > 0 ? (
                  safeAccess.getPsychologicalDevelopment().map((period, i) => (
                    <Card key={i}>
                      <CardHeader className="py-1">
                        <CardTitle className="text-base">{period.period}</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2 space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Changes:</h4>
                          <p className="text-sm">{period.changes}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-2">Catalysts:</h4>
                          <ul className="list-disc pl-5 text-sm">
                            {(period.catalysts || []).map((catalyst, i) => (
                              <li key={i}>{catalyst}</li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="border-dashed border-2">
                    <CardContent className="py-6 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Timeline className="h-8 w-8 mb-2 opacity-30" />
                        <p>No psychological development data available</p>
                        <p className="text-xs mt-1">Profile may be incomplete or still in development</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <h3 className="text-lg font-medium">Meta Attributes</h3>
              <Card className="overflow-hidden transition-shadow hover:shadow-md">
                <CardHeader className="py-1 bg-muted/30">
                  <CardTitle className="text-base">Meta Attributes</CardTitle>
                </CardHeader>
                <CardContent className="py-3 space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <h4 className="text-sm font-medium">Controversial Aspects:</h4>
                  </div>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {safeAccess.getControversialAspects().length > 0 ? (
                      safeAccess.getControversialAspects().map((aspect, i) => (
                        <li key={i}>{aspect}</li>
                      ))
                    ) : (
                      <li className="text-muted-foreground">No controversial aspects noted</li>
                    )}
                  </ul>
                  <div className="flex items-center">
                    <span className="text-sm mr-2">Author Bias:</span>
                    <Progress value={safeAccess.getAuthorBias() * 100} className="w-24 h-2.5 mr-2" />
                    <span className="text-sm font-medium">{(safeAccess.getAuthorBias() * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm mr-2">Portrayal Consistency:</span>
                    <Progress
                      value={safeAccess.getPortrayalConsistency() * 100}
                      className="w-24 h-2.5 mr-2"
                    />
                    <span className="text-sm font-medium">
                      {(safeAccess.getPortrayalConsistency() * 100).toFixed(0)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {profileLoading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      )}
    </div>
  )
}


