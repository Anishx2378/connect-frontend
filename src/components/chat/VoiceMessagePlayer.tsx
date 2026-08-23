import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Play, Pause, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceMessagePlayerProps {
  url: string;
  id: string; // Used to seed the pseudo-random waveform so it stays consistent
}

export function VoiceMessagePlayer({ url, id }: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Generate a pseudo-random waveform based on the ID
  const waveform = useMemo(() => {
    // Simple hash function for the ID
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash |= 0;
    }
    
    // Generate 40 bars with values between 0.2 and 1.0
    const bars = [];
    let state = Math.abs(hash) || 1;
    for (let i = 0; i < 40; i++) {
      // Simple LCG pseudo-random
      state = (state * 9301 + 49297) % 233280;
      const val = state / 233280;
      bars.push(0.2 + (val * 0.8));
    }
    return bars;
  }, [id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);
    const onPause = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('play', onPlay);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('play', onPlay);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = percent * duration;
  };

  const toggleSpeed = () => {
    if (playbackRate === 1) setPlaybackRate(1.5);
    else if (playbackRate === 1.5) setPlaybackRate(2);
    else setPlaybackRate(1);
  };

  const formatTime = (time: number) => {
    if (!isFinite(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) : 0;

  return (
    <div className="flex items-center gap-3 p-2 pr-4 bg-white border border-[#d2d2d7]/50 rounded-full w-full max-w-sm shadow-sm select-none">
      <audio ref={audioRef} src={url} preload="metadata" />
      
      {/* Play/Pause Button */}
      <button 
        onClick={togglePlay}
        className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full transition-colors"
      >
        {isPlaying ? (
          <Pause size={18} className="fill-current" />
        ) : (
          <Play size={18} className="fill-current ml-1" />
        )}
      </button>

      {/* Waveform */}
      <div 
        className="flex-1 h-8 flex items-center gap-[2px] cursor-pointer"
        onClick={handleSeek}
      >
        {waveform.map((heightVal, i) => {
          const barPercent = i / waveform.length;
          const isActive = barPercent <= progressPercent;
          return (
            <div 
              key={i}
              className={`flex-1 rounded-full transition-colors duration-150 ${isActive ? 'bg-[#0071e3]' : 'bg-slate-300'}`}
              style={{ height: `${heightVal * 100}%` }}
            />
          );
        })}
      </div>

      {/* Time */}
      <div className="flex-shrink-0 text-sm font-semibold text-[#1d1d1f] font-mono w-10 text-right">
        {formatTime(currentTime > 0 ? currentTime : duration)}
      </div>

      {/* Transcript Toggle (Stub) */}
      <button 
        className="flex-shrink-0 text-[#86868b] hover:text-[#0071e3] transition-colors p-1"
        title="View Transcript"
      >
        <FileText size={18} />
      </button>

      {/* Speed Toggle */}
      <button 
        onClick={toggleSpeed}
        className="flex-shrink-0 text-xs font-semibold tracking-tight text-[#424245] hover:text-[#0071e3] w-6 text-center transition-colors"
      >
        {playbackRate}x
      </button>
    </div>
  );
}
