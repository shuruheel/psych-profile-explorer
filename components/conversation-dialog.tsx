"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Avatar } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mic, Send, Pause, Play, Volume2, VolumeX, Loader2 } from "lucide-react"
import { Profile } from "@/types/profile"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { VoiceLoadingSpinner } from "@/components/voice-loading-spinner"

interface Message {
  role: "user" | "assistant"
  content: string
  audioUrl?: string
}

interface ConversationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: Profile | null
  voiceId: string | null
  reasoningChains?: any[]
}

export function ConversationDialog({ 
  open, 
  onOpenChange, 
  profile,
  voiceId,
  reasoningChains = []
}: ConversationDialogProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [selectedModel, setSelectedModel] = useState("openai")
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<Profile | null>(null)
  
  // Initialize conversation with welcome message when dialog opens
  useEffect(() => {
    if (open && profile && messages.length === 0 && voiceId) {
      // Create welcome message
      const welcomeMessage: Message = { 
        role: "assistant", 
        content: `Hello, I am ${profile.name}. What would you like to discuss?` 
      };
      
      setMessages([welcomeMessage]);
      
      // Generate speech for welcome message
      generateSpeech(`Hello, I am ${profile.name}. What would you like to discuss?`, profile.name);
    }
  }, [open, profile, messages.length, voiceId])
  
  // Clear conversation when profile changes
  useEffect(() => {
    // Skip on initial render or if no profile is selected
    if (!profile) return;
    
    if (profileRef.current && profileRef.current.name !== profile.name) {
      console.log(`Profile changed from ${profileRef.current.name} to ${profile.name}, clearing conversation`);
      // Clear messages to trigger the welcome message flow
      setMessages([]);
    }
    
    // Update the reference
    profileRef.current = profile;
  }, [profile]);
  
  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])
  
  // Handle sending messages
  const handleSendMessage = async () => {
    if (!input.trim() || !profile) return
    
    const userMessage = input.trim()
    setInput("")
    
    // Add user message to conversation
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    
    setIsLoading(true)
    
    try {
      // Call API endpoint to interact with selected language model
      const response = await fetch("/api/conversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile: {
            ...profile,
            voiceId // Add voiceId to profile
          },
          reasoningChains, // Add reasoningChains to request
          userMessage,
          messageHistory: messages.map(m => ({ role: m.role, content: m.content })),
          model: selectedModel
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to get response")
      }
      
      const data = await response.json()
      
      // Add assistant response to conversation
      setMessages((prev) => [
        ...prev, 
        { 
          role: "assistant", 
          content: data.text, 
          audioUrl: data.audioUrl 
        }
      ])
      
      // Play audio if available and not muted
      if (data.audioUrl && !isMuted) {
        audioRef.current = new Audio(data.audioUrl)
        audioRef.current.onended = () => setIsPlaying(false)
        audioRef.current.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error("Error in conversation:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I apologize, but I'm having trouble responding right now. Please try again later."
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }
  
  // Generate speech for existing messages
  const generateSpeech = async (text: string, name: string) => {
    if (!voiceId) {
      console.warn("No voice ID available for speech generation");
      return;
    }
    
    try {
      // Prepare request body with voice ID
      const requestBody = {
        text,
        name,
        profile: profile ? {
          ...profile,
          voiceId
        } : undefined
      };

      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }
      
      const data = await response.json();
      
      // Update the last message with the audio URL
      setMessages((prev) => {
        const lastIndex = prev.length - 1;
        if (lastIndex >= 0 && prev[lastIndex].role === "assistant") {
          const updatedMessages = [...prev];
          updatedMessages[lastIndex] = {
            ...updatedMessages[lastIndex],
            audioUrl: data.audioUrl
          };
          return updatedMessages;
        }
        return prev;
      });
      
      // Play audio if not muted
      if (data.audioUrl && !isMuted) {
        audioRef.current = new Audio(data.audioUrl);
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error generating speech:", error);
    }
  };
  
  // Function to handle model change
  const handleModelChange = (value: string) => {
    setSelectedModel(value)
  }
  
  // Toggle audio playback
  const toggleAudio = () => {
    if (!audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    
    setIsPlaying(!isPlaying)
  }
  
  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
    }
  }
  
  // Toggle voice recording (placeholder for future implementation)
  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // Implement voice recording functionality
  }
  
  // Handle enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      handleSendMessage()
    }
  }
  
  // Clear conversation
  const clearConversation = () => {
    if (!profile) return;
    
    // Clear existing messages
    setMessages([]);
    
    // Create new welcome message with proper typing
    const welcomeMessage: Message = { 
      role: "assistant", 
      content: `Hello, I am ${profile.name}. What would you like to discuss?` 
    };
    
    setMessages([welcomeMessage]);
    
    // Generate speech for welcome message using existing voice ID
    if (voiceId) {
      generateSpeech(`Hello, I am ${profile.name}. What would you like to discuss?`, profile.name);
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10">
              <div 
                className="flex h-full w-full items-center justify-center text-xl font-semibold uppercase"
                style={{ backgroundColor: 'var(--color-muted)' }}
              >
                {profile?.name?.charAt(0) || "?"}
              </div>
            </Avatar>
            <DialogTitle>{profile?.name || "Conversation"}</DialogTitle>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={selectedModel} onValueChange={handleModelChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI (GPT-4)</SelectItem>
                <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon" onClick={toggleMute}>
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={clearConversation}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
            </Button>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="flex flex-col gap-4 p-4">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg px-4 py-2`}
                  style={{
                    backgroundColor: message.role === "user" 
                      ? 'var(--color-primary)' 
                      : 'var(--color-muted)',
                    color: message.role === "user" 
                      ? 'var(--color-primary-foreground)' 
                      : 'var(--color-foreground)'
                  }}
                >
                  <p className="text-sm">{message.content}</p>
                  
                  {message.role === "assistant" && message.audioUrl && (
                    <div className="mt-2 flex justify-end">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={toggleAudio}
                      >
                        {isPlaying ? (
                          <Pause className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <DialogFooter className="flex items-center gap-2 sm:justify-between">
          <div className="flex-1 flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={toggleRecording}
              className={isRecording ? "text-red-500" : ""}
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Input 
              placeholder={`Ask ${profile?.name || "the assistant"} something...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1"
            />
          </div>
          <Button 
            onClick={handleSendMessage} 
            disabled={isLoading || !input.trim()}
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-primary-foreground)'
            }}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="ml-2">Send</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 