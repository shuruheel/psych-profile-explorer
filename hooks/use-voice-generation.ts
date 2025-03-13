"use client"

import { useState, useEffect, useRef } from "react"
import { Profile } from "@/types/profile"

type VoiceStatus = "loading" | "ready" | "error" | "idle"

interface UseVoiceGenerationReturn {
  voiceStatus: VoiceStatus
  voiceId: string | null
  startVoiceGeneration: () => void
  isGeneratingVoice: boolean
}

export function useVoiceGeneration(profile: Profile | null): UseVoiceGenerationReturn {
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle")
  const [voiceId, setVoiceId] = useState<string | null>(null)
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const errorCountRef = useRef<number>(0)

  // Check localStorage for existing voice when profile changes
  useEffect(() => {
    if (!profile) {
      setVoiceStatus("idle")
      setVoiceId(null)
      return
    }

    // Check if we already have voice data in localStorage
    const voiceData = localStorage.getItem(`voice_${profile.name}`)
    
    if (voiceData && voiceData !== 'loading') {
      try {
        const parsedData = JSON.parse(voiceData)
        if (parsedData && parsedData.voiceId) {
          // We have a valid voice ID
          console.log(`[useVoiceGeneration] Using cached voice ID: ${parsedData.voiceId}`)
          setVoiceId(parsedData.voiceId)
          setVoiceStatus("ready")
          return
        }
      } catch (e) {
        console.warn(`[useVoiceGeneration] Invalid voice data in localStorage:`, e)
        // Will start generation below
      }
    } 
    else if (voiceData === 'loading') {
      // Previous generation was interrupted - resume polling
      console.log(`[useVoiceGeneration] Found interrupted voice generation, resuming...`)
      setVoiceStatus("loading")
      setIsGeneratingVoice(true)
      startPolling(profile.name)
      return
    }
    
    // No valid voice found - set as idle so component can decide when to start generation
    setVoiceStatus("idle")
  }, [profile])

  // Start polling for voice status
  const startPolling = (name: string) => {
    // Clear any existing polling interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }
    
    // Start a new polling interval
    pollIntervalRef.current = setInterval(() => {
      checkVoiceStatus(name)
    }, 3000)
  }

  // Check voice generation status
  const checkVoiceStatus = async (name: string) => {
    try {
      console.log(`[useVoiceGeneration] Checking voice status for ${name}...`)
      const response = await fetch(`/api/voice-status?name=${encodeURIComponent(name)}`)
      
      if (!response.ok) {
        errorCountRef.current++
        console.error(`[useVoiceGeneration] Error checking voice status:`, response.statusText)
        
        // After several failures, give up
        if (errorCountRef.current > 3) {
          console.error(`[useVoiceGeneration] Too many errors checking voice status, giving up`)
          setVoiceStatus("error")
          setIsGeneratingVoice(false)
          localStorage.removeItem(`voice_${name}`)
          stopPolling()
        }
        return
      }
      
      // Reset error counter on successful response
      errorCountRef.current = 0
      
      const data = await response.json()
      console.log(`[useVoiceGeneration] Voice status response:`, data)
      
      if (data.status === 'ready' && data.voiceId) {
        console.log(`[useVoiceGeneration] Voice is ready with ID: ${data.voiceId}`)
        
        // Store the voice ID in localStorage
        const voiceInfo = JSON.stringify({
          voiceId: data.voiceId,
          timestamp: new Date().toISOString()
        })
        localStorage.setItem(`voice_${name}`, voiceInfo)
        
        // Update state
        setVoiceId(data.voiceId)
        setVoiceStatus("ready")
        setIsGeneratingVoice(false)
        
        // Stop polling
        stopPolling()
      } 
      else if (data.status === 'failed') {
        console.error(`[useVoiceGeneration] Voice generation failed for ${name}`)
        localStorage.removeItem(`voice_${name}`)
        setVoiceStatus("error")
        setIsGeneratingVoice(false)
        stopPolling()
      }
      // For 'processing' status, continue polling
    } catch (error) {
      console.error(`[useVoiceGeneration] Error checking voice status:`, error)
      errorCountRef.current++
      
      // After several failures, give up
      if (errorCountRef.current > 3) {
        console.error(`[useVoiceGeneration] Too many errors checking voice status, giving up`)
        setVoiceStatus("error")
        setIsGeneratingVoice(false)
        localStorage.removeItem(`voice_${name}`)
        stopPolling()
      }
    }
  }

  // Stop the polling interval
  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  // Start voice generation
  const startVoiceGeneration = async () => {
    if (!profile || voiceStatus === "loading" || voiceStatus === "ready") {
      return
    }
    
    console.log(`[useVoiceGeneration] Starting voice generation for ${profile.name}...`)
    setVoiceStatus("loading")
    setIsGeneratingVoice(true)
    localStorage.setItem(`voice_${profile.name}`, 'loading')
    
    try {
      const response = await fetch("/api/voice-design", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profile }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to start voice generation: ${response.status}`)
      }
      
      const data = await response.json()
      
      // If the voice was already cached on the server, update immediately
      if (data.cached && data.voiceId) {
        console.log(`[useVoiceGeneration] Voice was already cached on server: ${data.voiceId}`)
        setVoiceId(data.voiceId)
        setVoiceStatus("ready")
        setIsGeneratingVoice(false)
        
        // Store in localStorage
        const voiceInfo = JSON.stringify({
          voiceId: data.voiceId,
          timestamp: new Date().toISOString()
        })
        localStorage.setItem(`voice_${profile.name}`, voiceInfo)
      } else {
        // Start polling for status updates
        console.log(`[useVoiceGeneration] Voice generation initiated, starting polling...`)
        startPolling(profile.name)
      }
    } catch (error) {
      console.error(`[useVoiceGeneration] Error starting voice generation:`, error)
      setVoiceStatus("error")
      setIsGeneratingVoice(false)
      localStorage.removeItem(`voice_${profile.name}`)
    }
  }

  return {
    voiceStatus,
    voiceId,
    startVoiceGeneration,
    isGeneratingVoice
  }
} 