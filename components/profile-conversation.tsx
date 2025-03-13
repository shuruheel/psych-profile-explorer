"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, Loader2 } from "lucide-react"
import { Profile } from "@/types/profile"
import { ConversationDialog } from "@/components/conversation-dialog"
import { VoiceLoadingSpinner } from "@/components/voice-loading-spinner"
import { useVoiceGeneration } from "@/hooks/use-voice-generation"

interface ProfileConversationProps {
  profile: Profile
}

export function ProfileConversation({ profile }: ProfileConversationProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(false)
  const { voiceStatus, voiceId, startVoiceGeneration, isGeneratingVoice } = useVoiceGeneration(profile)
  
  // Start voice generation when profile is loaded
  useEffect(() => {
    // If we don't have a voice and we're not already generating one, start generation
    if (profile && voiceStatus === "idle") {
      console.log(`Starting voice generation for ${profile.name} on profile load`);
      startVoiceGeneration();
    }
  }, [profile, voiceStatus, startVoiceGeneration]);
  
  // Handle talk button click
  const handleTalkButtonClick = () => {
    if (voiceStatus === "ready" && voiceId) {
      // If voice is ready, open the dialog
      setDialogOpen(true);
    } else if (voiceStatus === "error") {
      // If there was an error, try again
      startVoiceGeneration();
      setShowLoadingSpinner(true);
    } else {
      // Voice is being generated or needs to be generated
      if (voiceStatus === "idle") {
        startVoiceGeneration();
      }
      setShowLoadingSpinner(true);
    }
  };
  
  // When voice becomes ready, open dialog if loading spinner is showing
  useEffect(() => {
    if (voiceStatus === "ready" && showLoadingSpinner) {
      setShowLoadingSpinner(false);
      setDialogOpen(true);
    }
  }, [voiceStatus, showLoadingSpinner]);
  
  // When dialog closes, hide loading spinner if it's showing
  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setShowLoadingSpinner(false);
    }
  };
  
  return (
    <>
      <Button 
        onClick={handleTalkButtonClick}
        className="flex items-center gap-2"
        disabled={isGeneratingVoice && !showLoadingSpinner}
      >
        {isGeneratingVoice && !showLoadingSpinner ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Preparing Voice...</span>
          </>
        ) : (
          <>
            <MessageCircle className="h-4 w-4" />
            <span>Talk</span>
          </>
        )}
      </Button>
      
      {/* Loading spinner dialog */}
      {showLoadingSpinner && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card border rounded-lg shadow-lg max-w-md w-full">
            <VoiceLoadingSpinner profile={profile} />
          </div>
        </div>
      )}
      
      {/* Main conversation dialog */}
      <ConversationDialog
        open={dialogOpen && voiceStatus === "ready"}
        onOpenChange={handleDialogOpenChange}
        profile={profile}
        voiceId={voiceId}
      />
    </>
  )
} 