"use client"

import { Loader2 } from "lucide-react"
import { Profile } from "@/types/profile"

interface VoiceLoadingSpinnerProps {
  profile: Profile
}

export function VoiceLoadingSpinner({ profile }: VoiceLoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-6">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <div className="text-center">
        <h3 className="font-medium text-lg">Preparing voice model</h3>
        <p className="text-muted-foreground">
          Creating a unique voice for {profile.name}...
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          This may take a moment. The conversation will open automatically when ready.
        </p>
      </div>
    </div>
  )
} 