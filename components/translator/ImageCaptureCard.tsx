"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { CompactCard } from "@/components/ui/CompactCard";
import { PrivacyShieldButton } from "@/components/ui/PrivacyShieldButton";
import { CAMERA_PRIVACY_NOTE } from "@/lib/ui/developerLabels";

interface ImageCaptureCardProps {
  previewUrl: string | null;
  isBusy?: boolean;
  onImageSelected: (file: File) => void;
  onClear: () => void;
}

function isCameraCaptureSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

export function ImageCaptureCard({
  previewUrl,
  isBusy = false,
  onImageSelected,
  onClear,
}: ImageCaptureCardProps) {
  const cameraFallbackInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);

  const stopCameraStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const closeCamera = useCallback(() => {
    stopCameraStream();
    setCameraOpen(false);
    setIsStartingCamera(false);
  }, [stopCameraStream]);

  useEffect(() => {
    setCameraSupported(isCameraCaptureSupported());
  }, []);

  useEffect(() => {
    return () => stopCameraStream();
  }, [stopCameraStream]);

  useEffect(() => {
    if (!cameraOpen || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    void videoRef.current.play().catch(() => {
      setCameraError("Could not start the camera preview.");
      closeCamera();
    });
  }, [cameraOpen, closeCamera]);

  function handleUploadFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onImageSelected(file);
    event.target.value = "";
  }

  function handleCameraFallbackChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onImageSelected(file);
    event.target.value = "";
  }

  async function openCamera() {
    setCameraError(null);
    void import("@/lib/analytics/appEvents").then(({ trackAppEvent }) => {
      trackAppEvent("lens_scan_started");
    });

    if (!isCameraCaptureSupported()) {
      cameraFallbackInputRef.current?.click();
      return;
    }

    setIsStartingCamera(true);

    try {
      stopCameraStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1600 },
          height: { ideal: 1200 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      setCameraError("Camera unavailable. Try Upload Image.");
      cameraFallbackInputRef.current?.click();
    } finally {
      setIsStartingCamera(false);
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError("Camera not ready. Try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1600 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));

    const context = canvas.getContext("2d");
    if (!context) {
      setCameraError("Could not capture photo.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Could not capture photo.");
          return;
        }
        const file = new File([blob], `camera-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        onImageSelected(file);
        closeCamera();
      },
      "image/jpeg",
      0.88,
    );
  }

  return (
    <CompactCard padding="sm" className="enterprise-card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Camera scanner</p>
          <p className="mt-0.5 text-xs text-[var(--muted)]">Capture signs, labels, or documents</p>
        </div>
        <PrivacyShieldButton note={CAMERA_PRIVACY_NOTE} />
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-[#0f1d2b]">
        {cameraOpen ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-64 w-full bg-black object-cover sm:h-80"
          />
        ) : previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Captured image preview"
            className="h-64 w-full object-contain sm:h-80"
          />
        ) : (
          <div className="flex h-64 items-center justify-center px-8 text-center text-sm text-white/65 sm:h-80">
            Open the camera or import an image to begin.
          </div>
        )}

        {!previewUrl && (
          <div className="pointer-events-none absolute inset-7 rounded-xl border-2 border-white/80">
            <span className="absolute -left-0.5 -top-0.5 h-5 w-5 border-l-4 border-t-4 border-[#5ca8ed]" />
            <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 border-b-4 border-r-4 border-[#5ca8ed]" />
          </div>
        )}

        {!previewUrl && (
          <p className="pointer-events-none absolute inset-x-0 bottom-5 text-center text-xs font-medium text-white">
            Align text in the frame
          </p>
        )}
      </div>

      {!cameraSupported && (
        <p className="mt-3 text-sm text-[var(--muted)]" role="status">
          Import an image or type the text manually.
        </p>
      )}
      {cameraError && (
        <p className="mt-3 text-sm text-amber-800" role="status">
          {cameraError} Import an image or type the text manually.
        </p>
      )}

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <ActionButton
          variant="secondary"
          disabled={isBusy || cameraOpen}
          onClick={() => uploadInputRef.current?.click()}
          aria-label="Import image from gallery"
        >
          Import
        </ActionButton>

        {cameraOpen ? (
          <button
            type="button"
            onClick={capturePhoto}
            disabled={isBusy}
            aria-label="Capture image"
            className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-[var(--accent)] bg-white disabled:opacity-50"
          >
            <span className="h-10 w-10 rounded-full bg-[var(--accent)]" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void openCamera()}
            disabled={isBusy || isStartingCamera || Boolean(previewUrl)}
            aria-label="Open camera"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-white disabled:opacity-50"
          >
            <svg aria-hidden className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h3l1.5-2h7L17 7h3v12H4V7z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
        )}

        {cameraOpen ? (
          <ActionButton variant="secondary" disabled={isBusy} onClick={closeCamera}>
            Cancel
          </ActionButton>
        ) : previewUrl ? (
          <ActionButton variant="ghost" disabled={isBusy} onClick={onClear}>
            Remove
          </ActionButton>
        ) : (
          <button
            type="button"
            disabled
            aria-label="Flash control unavailable"
            className="min-h-11 rounded-xl border border-[var(--card-border)] text-xs font-semibold text-[var(--muted)] opacity-60"
          >
            Flash
          </button>
        )}
      </div>

      <input
        ref={cameraFallbackInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handleCameraFallbackChange}
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleUploadFileChange}
      />

    </CompactCard>
  );
}
