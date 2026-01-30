"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";

interface VideoCallProps {
  appointmentId: string;
  isDoctor: boolean;
  onCallEnd?: () => void;
}

export function VideoCall({ appointmentId, isDoctor, onCallEnd }: VideoCallProps) {
  const router = useRouter();
  const callRef = useRef<DailyCall | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);

  const initializeCall = useCallback(async () => {
    try {
      // Get room (creates if doesn't exist)
      const roomResponse = await fetch("/api/daily/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });

      if (!roomResponse.ok) {
        throw new Error("Failed to get room");
      }

      const { roomUrl } = await roomResponse.json();

      // Get token
      const tokenResponse = await fetch("/api/daily/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to get token");
      }

      const { token } = await tokenResponse.json();

      // Create Daily call
      const call = DailyIframe.createCallObject({
        showLeaveButton: false,
        showFullscreenButton: true,
        iframeStyle: {
          width: "100%",
          height: "100%",
          border: "0",
          borderRadius: "12px",
        },
      });

      callRef.current = call;

      // Event handlers
      call.on("joined-meeting", () => {
        setJoined(true);
        setLoading(false);
      });

      call.on("left-meeting", () => {
        setJoined(false);
        onCallEnd?.();
      });

      call.on("error", (event) => {
        console.error("Daily error:", event);
        setError("Call error occurred");
      });

      // Join the call
      await call.join({
        url: roomUrl,
        token,
      });
    } catch (err) {
      console.error("Call initialization error:", err);
      setError(err instanceof Error ? err.message : "Failed to join call");
      setLoading(false);
    }
  }, [appointmentId, onCallEnd]);

  useEffect(() => {
    initializeCall();

    return () => {
      if (callRef.current) {
        callRef.current.leave();
        callRef.current.destroy();
      }
    };
  }, [initializeCall]);

  const toggleAudio = () => {
    if (callRef.current) {
      callRef.current.setLocalAudio(!audioOn);
      setAudioOn(!audioOn);
    }
  };

  const toggleVideo = () => {
    if (callRef.current) {
      callRef.current.setLocalVideo(!videoOn);
      setVideoOn(!videoOn);
    }
  };

  const leaveCall = async () => {
    if (callRef.current) {
      await callRef.current.leave();
    }
    router.push(isDoctor ? "/doctor" : "/patient");
  };

  if (error) {
    return (
      <Card className="max-w-md mx-auto mt-12">
        <CardContent className="py-8 text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={() => router.back()}>Go Back</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Video container */}
      <div
        ref={containerRef}
        className="flex-1 bg-gray-900 rounded-lg overflow-hidden relative"
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Connecting to call...</p>
            </div>
          </div>
        )}

        {/* Daily.co will inject the video iframe here when we use their prebuilt UI */}
        {joined && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <p>Video call in progress</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <Button
          variant={audioOn ? "secondary" : "destructive"}
          size="lg"
          onClick={toggleAudio}
          className="rounded-full h-14 w-14"
        >
          {audioOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
        </Button>

        <Button
          variant={videoOn ? "secondary" : "destructive"}
          size="lg"
          onClick={toggleVideo}
          className="rounded-full h-14 w-14"
        >
          {videoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
        </Button>

        <Button
          variant="destructive"
          size="lg"
          onClick={leaveCall}
          className="rounded-full h-14 w-14"
        >
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
