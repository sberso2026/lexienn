const DEFAULT_RECORD_MS = 8_000;

export async function requestMicrophoneStream(): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone access is not supported in this browser.");
  }

  return navigator.mediaDevices.getUserMedia({ audio: true });
}

export async function recordAudioBlob(options?: {
  maxDurationMs?: number;
  signal?: AbortSignal;
}): Promise<Blob> {
  const maxDurationMs = options?.maxDurationMs ?? DEFAULT_RECORD_MS;
  const stream = await requestMicrophoneStream();

  return new Promise<Blob>((resolve, reject) => {
    const mimeCandidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
    ];
    const mimeType =
      mimeCandidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ??
      "audio/webm";

    const chunks: BlobPart[] = [];
    let recorder: MediaRecorder;

    try {
      recorder = new MediaRecorder(stream, { mimeType });
    } catch {
      recorder = new MediaRecorder(stream);
    }

    const cleanup = () => {
      stream.getTracks().forEach((track) => track.stop());
      options?.signal?.removeEventListener("abort", onAbort);
    };

    const onAbort = () => {
      try {
        if (recorder.state !== "inactive") recorder.stop();
      } catch {
        cleanup();
        reject(new Error("Recording was cancelled."));
      }
    };

    if (options?.signal?.aborted) {
      cleanup();
      reject(new Error("Recording was cancelled."));
      return;
    }
    options?.signal?.addEventListener("abort", onAbort);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    recorder.onerror = () => {
      cleanup();
      reject(new Error("Audio recording failed."));
    };

    recorder.onstop = () => {
      cleanup();
      if (chunks.length === 0) {
        reject(new Error("No audio was captured."));
        return;
      }
      resolve(new Blob(chunks, { type: recorder.mimeType || mimeType }));
    };

    recorder.start();
    window.setTimeout(() => {
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
    }, maxDurationMs);
  });
}
