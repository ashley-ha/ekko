// ElevenLabs Voice Management
export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category?: 'premade' | 'cloned' | 'generated';
  description?: string;
  preview_url?: string;
  available_for_tiers?: string[];
  settings?: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

// Available voices configuration
export const VOICE_CONFIGS = {
  // Default Korean voice (current one)
  'Hyun Bin': {
    voice_id: 's07IwTCOrCDCaETjUVjx',
    name: 'Hyun Bin',
    settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true,
    },
  },
  'Anna Kim': {
    voice_id: 'uyVNoMrnUku1dZyVEXwD',
    name: 'Anna Kim',
    settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
    },
  },
  'Yohan Ku': {
    voice_id: '4JJwo477JUAx3HV0T7n7',
    name: 'Yohan Ku',
    settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
    },
  },
};

// Function to get all available voices from ElevenLabs API
export async function getAvailableVoices(
  apiKey: string
): Promise<ElevenLabsVoice[]> {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.statusText}`);
    }

    const data = await response.json();
    return data.voices || [];
  } catch (error) {
    console.error('Error fetching ElevenLabs voices:', error);
    throw error;
  }
}

// Function to get voice configuration by ID
export function getVoiceConfig(voiceId: string) {
  const voiceKey = Object.keys(VOICE_CONFIGS).find(
    (key) =>
      VOICE_CONFIGS[key as keyof typeof VOICE_CONFIGS].voice_id === voiceId
  );

  if (voiceKey) {
    return VOICE_CONFIGS[voiceKey as keyof typeof VOICE_CONFIGS];
  }

  // Return default if not found
  return VOICE_CONFIGS['Anna Kim'];
}

// Function to get voice by name/key
export function getVoiceById(key: keyof typeof VOICE_CONFIGS) {
  return VOICE_CONFIGS[key];
}

// Voice selection options for UI
export const VOICE_OPTIONS = [
  {
    key: 'korean-default',
    label: 'Korean Default',
    description: 'Standard Korean voice',
  },
  // Add your custom voices here for UI selection
  // { key: 'korean-female-1', label: 'Korean Female 1', description: 'Your custom female Korean voice' },
  // { key: 'korean-male-1', label: 'Korean Male 1', description: 'Your custom male Korean voice' },
];
