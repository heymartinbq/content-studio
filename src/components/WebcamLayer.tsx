/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from "react";

import type { RefObject } from "react";

interface WebcamLayerProps {
  active: boolean;
  webcamRef: RefObject<HTMLVideoElement | null>;
}

export default function WebcamLayer({ active, webcamRef }: WebcamLayerProps) {

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function setupWebcam() {
      if (active) {
        try {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error("Webcam access is not supported in this browser or context (requires HTTPS or localhost).");
            return;
          }
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (webcamRef.current) {
            webcamRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Error accessing webcam:", err);
        }
      } else {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        if (webcamRef.current) {
          webcamRef.current.srcObject = null;
        }
      }
    }

    setupWebcam();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [active, webcamRef]);

  if (!active) return null;

  return (
    <video
      ref={webcamRef}
      autoPlay
      playsInline
      muted
      onLoadedMetadata={() => webcamRef.current?.play().catch(e => console.warn(e))}
      className="absolute inset-0 w-full h-full object-cover z-[-1] opacity-0 pointer-events-none"
    />
  );
}
