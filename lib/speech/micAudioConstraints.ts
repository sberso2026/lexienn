/** Preferred getUserMedia audio constraints for clearer speech capture. */
export const PREFERRED_MIC_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  channelCount: 1,
  sampleRate: 48_000,
  sampleSize: 16,
};

/**
 * Request a microphone stream with quality constraints, falling back to simpler
 * constraints when preferred settings are rejected.
 */
export async function getMicrophoneStreamWithQuality(): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone access is not supported in this browser.");
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: PREFERRED_MIC_CONSTRAINTS,
    });
  } catch {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
    } catch {
      return navigator.mediaDevices.getUserMedia({ audio: true });
    }
  }
}
