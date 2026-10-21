// Ajustes editables sin tocar las escenas.
export const CONFIG = {
  // Música original sintetizada (tools/compose_music.py).
  music: true,
  musicVolume: 0.9,
  // Poner en true cuando exista public/audio/voiceover.wav (locución por frase).
  voiceover: false,
  voiceoverVolume: 1,
  // Cuando la voz entra, la música baja a este volumen (ducking simple).
  musicVolumeUnderVoice: 0.45,
  grain: true,
};

export const COLORS = {
  ivory: '#F7F1E6',
  ivoryDeep: '#EEE3D0',
  cream: '#FBF7F0',
  champagne: '#D9BE86',
  gold: '#C3A062',
  goldDeep: '#8F6C33',
  goldLight: '#F1DFB4',
  blush: '#F2D9CF',
  softBlack: '#1A1613',
  ink: '#2B241D',
};

export const FONTS = {
  serif: '"Cormorant Garamond", "Times New Roman", serif',
  sans: '"Montserrat", "Helvetica Neue", Arial, sans-serif',
};
