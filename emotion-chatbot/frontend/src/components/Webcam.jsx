import React, { useRef, useEffect, useState, useCallback } from 'react';

export default function Webcam({ isActive, onStream, onVideoReady, onRequestEnable, emotionColor = '#7c6af7' }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const startRequestIdRef = useRef(0);
  const [status, setStatus] = useState('idle'); // idle | requesting | active | denied | error
  const [errorMsg, setErrorMsg] = useState('');

  const startWebcam = useCallback(async () => {
    const requestId = ++startRequestIdRef.current;
    setStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });

      // If camera was turned off while permission prompt was open, stop immediately.
      if (!isActive || requestId !== startRequestIdRef.current) {
        stream.getTracks().forEach(t => t.stop());
        setStatus('idle');
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        const videoEl = videoRef.current;

        // Avoid "The play() request was interrupted by a new load request".
        videoEl.onloadedmetadata = () => {
          const p = videoEl.play();
          if (p && typeof p.catch === 'function') {
            p.catch(() => {
              // ignore aborted play()
            });
          }
        };

        videoEl.srcObject = stream;
      }
      setStatus('active');
      onStream && onStream(stream);
      onVideoReady && videoRef.current && onVideoReady(videoRef.current);
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setStatus('denied');
        setErrorMsg('Camera access denied. Please allow camera access in your browser settings.');
      } else {
        setStatus('error');
        setErrorMsg(`Camera error: ${err.message}`);
      }
    }
  }, [isActive, onStream, onVideoReady]);

  const stopWebcam = useCallback(() => {
    // Cancel any in-flight startWebcam.
    startRequestIdRef.current += 1;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch (_) {
        // no-op
      }
      videoRef.current.onloadedmetadata = null;
      videoRef.current.srcObject = null;
    }
    onVideoReady && onVideoReady(null);
    setStatus('idle');
  }, [onVideoReady]);

  useEffect(() => {
    if (isActive && status === 'idle') startWebcam();
    if (!isActive && (status === 'active' || status === 'requesting')) stopWebcam();
  }, [isActive, status, startWebcam, stopWebcam]);

  useEffect(() => () => stopWebcam(), [stopWebcam]);

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-surface border border-border"
      style={{
        boxShadow: `0 0 24px ${emotionColor}33`,
        borderColor: `${emotionColor}55`,
        transition: 'box-shadow 1s ease, border-color 1s ease',
      }}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={`w-full h-full object-cover transition-opacity duration-500 ${status === 'active' ? 'opacity-100' : 'opacity-0'}`}
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* Overlay states */}
      {status !== 'active' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface">
          {status === 'idle' && (
            <>
              <div className="text-4xl mb-1">📷</div>
              <p className="text-sm text-gray-400 font-body">
                {isActive ? 'Camera not started' : 'Camera is off'}
              </p>
              <button
                onClick={() => {
                  if (!isActive) {
                    onRequestEnable && onRequestEnable();
                    return;
                  }
                  startWebcam();
                }}
                className="px-4 py-2 rounded-xl text-sm font-display font-semibold text-white transition-all"
                style={{ background: `${emotionColor}cc` }}
              >
                {isActive ? 'Enable Camera' : 'Start Camera'}
              </button>
            </>
          )}
          {status === 'requesting' && (
            <>
              <div className="w-8 h-8 border-2 border-accent rounded-full border-t-transparent animate-spin" />
              <p className="text-sm text-gray-400">Requesting camera…</p>
            </>
          )}
          {(status === 'denied' || status === 'error') && (
            <>
              <div className="text-4xl">🚫</div>
              <p className="text-xs text-center text-gray-400 px-4 leading-relaxed">{errorMsg}</p>
              <button
                onClick={startWebcam}
                className="px-4 py-2 rounded-xl text-xs font-display font-semibold text-white bg-red-500/70 hover:bg-red-500 transition-all"
              >
                Retry
              </button>
            </>
          )}
        </div>
      )}

      {/* Active indicator */}
      {status === 'active' && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-300 font-mono">LIVE</span>
        </div>
      )}

      {/* Emotion color corner accents */}
      <div className="absolute top-0 right-0 w-12 h-12 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top right, ${emotionColor}30, transparent 70%)`,
          transition: 'background 1s ease',
        }}
      />
      <div className="absolute bottom-0 left-0 w-12 h-12 pointer-events-none"
        style={{
          background: `radial-gradient(circle at bottom left, ${emotionColor}20, transparent 70%)`,
          transition: 'background 1s ease',
        }}
      />
    </div>
  );
}
