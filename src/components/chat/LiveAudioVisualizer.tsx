import React, { useEffect, useRef } from 'react';

interface LiveAudioVisualizerProps {
  stream: MediaStream | null;
  className?: string;
}

export function LiveAudioVisualizer({ stream, className = '' }: LiveAudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!stream || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioCtx = audioContextRef.current;

    // Try to resume if suspended
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.6; // Make it smoother
    analyserRef.current = analyser;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!ctx || !canvasRef.current) return;
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.clearRect(0, 0, width, height);

      // We only want a subset of the frequencies since the higher ones are often quiet
      const renderCount = 40; 
      const barWidth = (width / renderCount) - 2;
      let x = 0;

      for (let i = 0; i < renderCount; i++) {
        const barHeight = (dataArray[i] / 255) * height;

        ctx.fillStyle = '#ef4444'; // red-500 matching the banner theme
        
        // Give some base height to look nice
        const finalHeight = Math.max(4, barHeight);
        
        // Draw centered vertically
        const y = (height - finalHeight) / 2;

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, finalHeight, barWidth / 2);
        ctx.fill();

        x += barWidth + 2;
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      source.disconnect();
    };
  }, [stream]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`w-full h-8 ${className}`} 
      style={{ display: 'block' }} 
    />
  );
}
