"use client";

type ToneKind = "alert" | "success" | "error";

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  if (!audioContext) {
    const AudioCtor =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioCtor) return null;
    audioContext = new AudioCtor();
  }

  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }

  return audioContext;
}

/**
 * Tiny Web Audio beep generator. No audio assets, no network, works offline.
 */
export function playKitchenTone(kind: ToneKind = "alert"): void {
  const context = getAudioContext();
  if (!context) return;

  const patterns: Record<ToneKind, number[]> = {
    alert: [880, 1175],
    success: [523, 659, 784],
    error: [320, 240],
  };

  const now = context.currentTime;
  const notes = patterns[kind];

  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = now + index * 0.15;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.16, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.17);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.2);
  });
}
