import { useEffect, useEffectEvent, useRef, useState } from 'react'
import type { SpeechRecognitionLike } from '../types/speech'

interface UseSpeechRecognitionOptions {
  onFinalSegment: (text: string) => void
  lang?: string
}

function getSpeechRecognitionCtor() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

export function useSpeechRecognition({
  onFinalSegment,
  lang = 'en-US',
}: UseSpeechRecognitionOptions) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const [supported] = useState(() => Boolean(getSpeechRecognitionCtor()))
  const [listening, setListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const handleFinalSegment = useEffectEvent(onFinalSegment)

  useEffect(() => {
    if (!supported) {
      return
    }

    const SpeechRecognitionCtor = getSpeechRecognitionCtor()
    if (!SpeechRecognitionCtor) {
      return
    }

    const recognition = new SpeechRecognitionCtor()
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onstart = () => {
      setListening(true)
      setError(null)
    }

    recognition.onresult = (event) => {
      let interim = ''
      let finalText = ''

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const chunk = event.results[i]
        const transcript = chunk[0]?.transcript?.trim() ?? ''

        if (chunk.isFinal && transcript) {
          finalText += `${transcript} `
        } else {
          interim += transcript
        }
      }

      if (finalText.trim()) {
        handleFinalSegment(finalText.trim())
      }
      setInterimTranscript(interim.trim())
    }

    recognition.onerror = (event) => {
      setListening(false)
      setInterimTranscript('')
      const isPermissionError =
        event.error === 'not-allowed' || event.error === 'service-not-allowed'

      if (isPermissionError) {
        setPermissionDenied(true)
        setError('Microphone permission was denied. You can still type your transcript manually.')
        return
      }

      if (event.error === 'no-speech') {
        setError('No speech was detected. Try again or type in the transcript box.')
        return
      }

      if (event.error === 'network') {
        setError('Speech recognition had a network issue. You can continue with manual input.')
        return
      }

      setError('Speech recognition stopped unexpectedly. Try one more time or use manual input.')
    }

    recognition.onend = () => {
      setListening(false)
      setInterimTranscript('')
    }

    recognitionRef.current = recognition

    return () => {
      recognition.abort()
      recognitionRef.current = null
    }
  }, [lang, supported])

  function start() {
    if (!supported || !recognitionRef.current) {
      return
    }
    setPermissionDenied(false)
    setError(null)
    recognitionRef.current.start()
  }

  function stop() {
    recognitionRef.current?.stop()
  }

  function resetState() {
    setError(null)
    setInterimTranscript('')
    setPermissionDenied(false)
  }

  return {
    supported,
    listening,
    interimTranscript,
    error,
    permissionDenied,
    start,
    stop,
    resetState,
  }
}
