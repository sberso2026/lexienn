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
    <CompactCard padding="sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Scan</p>
        <PrivacyShieldButton note={CAMERA_PRIVACY_NOTE} />
      </div>

      <div className="flex flex-wrap gap-2">
        <ActionButton
          variant="primary"
          disabled={isBusy || isStartingCamera || cameraOpen}
          onClick={() => void openCamera()}
        >
          {isStartingCamera ? "Opening…" : "Open Camera"}
        </ActionButton>
        <ActionButton
          variant="secondary"
          disabled={isBusy || cameraOpen}
          onClick={() => uploadInputRef.current?.click()}
        >
          Upload Image
        </ActionButton>
        {previewUrl && (
          <ActionButton variant="ghost" disabled={isBusy || cameraOpen} onClick={onClear}>
            Remove
          </ActionButton>
        )}
      </div>

      {cameraError && (
        <p className="mt-2 text-xs text-amber-800 dark:text-amber-200" role="status">
          {cameraError}
        </p>
      )}

      {cameraOpen && (
        <div className="mt-3 space-y-2 rounded-xl border border-[var(--card-border)] bg-[var(--background)] p-2">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="max-h-64 w-full rounded-lg bg-black object-contain"
          />
          <div className="flex flex-wrap gap-2">
            <ActionButton variant="primary" disabled={isBusy} onClick={capturePhoto}>
              Capture
            </ActionButton>
            <ActionButton variant="secondary" disabled={isBusy} onClick={closeCamera}>
              Cancel
            </ActionButton>
          </div>
        </div>
      )}

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

      {previewUrl && !cameraOpen && (
        <div className="mt-3 overflow-hidden rounded-xl border border-[var(--card-border)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Captured image preview"
            className="max-h-56 w-full object-contain bg-[var(--background)]"
          />
        </div>
      )}
    </CompactCard>
  );
}
