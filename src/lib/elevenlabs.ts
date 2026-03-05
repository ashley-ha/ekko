// ElevenLabs API integration
// Note: This should be used server-side only to protect API keys

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export interface ElevenLabsConfig {
  apiKey: string;
  voiceId: string;
  modelId?: string;
}

export const defaultVoiceSettings: VoiceSettings = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.0,
  use_speaker_boost: true,
};

// This function should be called from a server-side API route
export const generateSpeech = async (
  text: string,
  config: ElevenLabsConfig,
  voiceSettings: VoiceSettings = defaultVoiceSettings
): Promise<ArrayBuffer> => {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': config.apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: config.modelId || 'eleven_monolingual_v1',
      voice_settings: voiceSettings,
    }),
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.statusText}`);
  }

  return await response.arrayBuffer();
};

// Client-side function to request speech generation from our API
export const requestSpeechGeneration = async (
  text: string,
  voiceId: string = 'default'
): Promise<Blob> => {
  const response = await fetch('/api/generate-speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      voiceId,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate speech');
  }

  return await response.blob();
};
