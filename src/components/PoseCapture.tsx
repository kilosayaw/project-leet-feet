import { useEffect, useRef, useState } from 'react';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { Button } from './ui/button';
import { Video, VideoOff, FlipHorizontal } from 'lucide-react';
import { PoseLandmark } from '../types/sequencer';

interface PoseCaptureProps {
  isActive: boolean;
  mirrorVideo: boolean;
  onToggleMirror: () => void;
  onSnapshot: (imageData: string, landmarks: PoseLandmark[]) => void;
  captureNow?: boolean;
}

export const PoseCapture = ({ 
  isActive, 
  mirrorVideo, 
  onToggleMirror,
  onSnapshot,
  captureNow 
}: PoseCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseRef = useRef<Pose | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const [landmarks, setLandmarks] = useState<PoseLandmark[]>([]);

  useEffect(() => {
    if (!isActive || !videoRef.current || !canvasRef.current) return;

    // Initialize MediaPipe Pose
    const pose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    pose.onResults((results) => {
      if (!canvasRef.current) return;
      
      const canvasCtx = canvasRef.current.getContext('2d');
      if (!canvasCtx) return;

      // Clear canvas
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // Mirror if needed
      if (mirrorVideo) {
        canvasCtx.scale(-1, 1);
        canvasCtx.translate(-canvasRef.current.width, 0);
      }

      // Draw video frame
      canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

      // Draw pose skeleton
      if (results.poseLandmarks) {
        setLandmarks(results.poseLandmarks);
        drawSkeleton(canvasCtx, results.poseLandmarks, canvasRef.current.width, canvasRef.current.height);
      }

      canvasCtx.restore();
    });

    // Start camera
    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) {
          await pose.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480
    });

    camera.start();

    poseRef.current = pose;
    cameraRef.current = camera;

    return () => {
      camera.stop();
      pose.close();
    };
  }, [isActive, mirrorVideo]);

  // Capture snapshot when triggered
  useEffect(() => {
    if (captureNow && canvasRef.current) {
      const imageData = canvasRef.current.toDataURL('image/jpeg', 0.8);
      onSnapshot(imageData, landmarks);
    }
  }, [captureNow, landmarks, onSnapshot]);

  const drawSkeleton = (ctx: CanvasRenderingContext2D, landmarks: PoseLandmark[], width: number, height: number) => {
    const connections = [
      [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // Arms
      [11, 23], [12, 24], [23, 24], // Torso
      [23, 25], [25, 27], [27, 29], [29, 31], // Left leg
      [24, 26], [26, 28], [28, 30], [30, 32], // Right leg
    ];

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#ffffff';

    // Draw connections
    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];
      
      if (startPoint && endPoint) {
        ctx.beginPath();
        ctx.moveTo(startPoint.x * width, startPoint.y * height);
        ctx.lineTo(endPoint.x * width, endPoint.y * height);
        ctx.stroke();
      }
    });

    // Draw joints
    landmarks.forEach((landmark) => {
      ctx.beginPath();
      ctx.arc(landmark.x * width, landmark.y * height, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto p-6 bg-gray-900 rounded-lg border border-green-500/30">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm text-green-500">Live Pose Capture</h3>
          <Button
            onClick={onToggleMirror}
            variant="outline"
            size="sm"
            className="h-8"
          >
            <FlipHorizontal className="w-4 h-4 mr-2" />
            {mirrorVideo ? 'Mirrored' : 'Normal'}
          </Button>
        </div>

        <div className="relative aspect-video bg-black rounded overflow-hidden">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ display: 'none' }}
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="w-full h-full object-contain"
          />
        </div>

        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center">
              <VideoOff className="w-12 h-12 mx-auto mb-2 text-gray-500" />
              <p className="text-gray-400">Camera Inactive</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};