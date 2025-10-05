import React, { useState, useRef, useEffect, useCallback } from 'react';
import { detectColorFromImage } from './services/geminiService';
import { CameraIcon, PowerIcon, SwitchCameraIcon } from './components/icons';

type Status = 'Ready' | 'Initializing' | 'Detecting' | 'Error' | 'Stopped';
type FacingMode = 'user' | 'environment';

const App: React.FC = () => {
  const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  const [status, setStatus] = useState<Status>('Ready');
  const [detectedColor, setDetectedColor] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [colorUpdateKey, setColorUpdateKey] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const speak = useCallback((text: string) => {
    if (!text) return;
    // Use Google's reliable, unlisted Translate TTS endpoint for maximum compatibility.
    // This provides a high-quality AI voice that works consistently across platforms,
    // solving common browser security issues with other TTS methods.
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(text)}`;
    setAudioUrl(url);
  }, []);
  
  // Effect to play audio when the audioUrl state changes
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.load(); // Important: load new audio source
      audioRef.current.play().catch(e => console.error("Error playing audio:", e));
    }
  }, [audioUrl]);

  useEffect(() => {
    if (detectedColor) {
      speak(detectedColor);
      setColorUpdateKey(prevKey => prevKey + 1); // Trigger animation
    }
  }, [detectedColor, speak]);


  const stopCameraStream = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  }, []);
  
  const captureAndDetect = useCallback(async () => {
    if (isLoading || !videoRef.current || !canvasRef.current) return;

    setIsLoading(true);
    setStatus('Detecting');
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];
      
      try {
        const color = await detectColorFromImage(base64Image);
        if(color && color.toLowerCase() !== detectedColor.toLowerCase()) {
          setDetectedColor(color);
        }
        setError(null);
      } catch (err) {
        console.error("Gemini API error:", err);
        setError('Could not detect color. Please try again.');
        setStatus('Error');
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [isLoading, detectedColor]);

  const startCamera = useCallback(async () => {
    stopCameraStream();
    setStatus('Initializing');
    setError(null);

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setStatus('Detecting');
          detectionIntervalRef.current = window.setInterval(captureAndDetect, 3000);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError('Camera access denied. Please allow camera permissions in your browser settings.');
        setStatus('Error');
        setIsCameraOn(false);
      }
    } else {
      setError('Camera not supported by this browser.');
      setStatus('Error');
      setIsCameraOn(false);
    }
  }, [facingMode, stopCameraStream, captureAndDetect]);
  
  useEffect(() => {
    if (isCameraOn) {
      startCamera();
    } else {
      stopCameraStream();
      setStatus('Stopped');
    }

    return () => {
      stopCameraStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraOn, facingMode]); // Rerun effect if facingMode changes
  
  const handleToggleCamera = () => {
    setIsCameraOn(prev => !prev);
    setDetectedColor('');
  };

  const handleSwitchCamera = () => {
    if (isCameraOn) {
      setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
        <header className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            AI Color Detector
          </h1>
          <p className="text-gray-400 mt-2">Point your camera at an object to identify and announce its color.</p>
        </header>

        <div className="relative w-full aspect-video bg-black rounded-lg shadow-2xl overflow-hidden border-2 border-gray-700">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          {!isCameraOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
              <CameraIcon className="w-24 h-24 text-gray-600" />
            </div>
          )}
          <div className={`absolute top-4 left-4 px-3 py-1 text-sm font-semibold rounded-full transition-colors ${
            status === 'Detecting' ? 'bg-green-500/20 text-green-300' : 
            status === 'Ready' || status === 'Stopped' ? 'bg-blue-500/20 text-blue-300' :
            status === 'Initializing' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'
          }`}>
            Status: {status}
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden"></canvas>
        <audio ref={audioRef} src={audioUrl} className="hidden" />


        {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
        
        {isCameraOn && (
          <div className="mt-6 text-center h-16 flex items-center justify-center">
            {isLoading && status === 'Detecting' ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                <span className="text-lg text-gray-400">Analyzing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <span className="text-2xl text-gray-300">Detected Color:</span>
                <span 
                  key={colorUpdateKey}
                  className="text-4xl font-bold transition-colors animate-pulse-once"
                  style={{color: detectedColor.toLowerCase() || 'white'}}
                >
                  {detectedColor || '...'}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex space-x-4 mt-6">
          <button 
            onClick={handleToggleCamera} 
            className={`flex items-center space-x-2 px-6 py-3 rounded-full text-lg font-semibold transition-all duration-300 shadow-lg focus:outline-none focus:ring-4 ${
              isCameraOn 
              ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500/50' 
              : 'bg-green-600 hover:bg-green-700 focus:ring-green-500/50'
            }`}
            aria-live="polite"
          >
            <PowerIcon className="w-6 h-6"/>
            <span>{isCameraOn ? 'Turn Off' : 'Turn On'} Camera</span>
          </button>
          
          <button 
            onClick={handleSwitchCamera} 
            disabled={!isCameraOn} 
            className="flex items-center space-x-2 px-6 py-3 rounded-full text-lg font-semibold bg-gray-700 hover:bg-gray-600 transition-colors duration-300 shadow-lg focus:outline-none focus:ring-4 focus:ring-gray-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-live="polite"
          >
            <SwitchCameraIcon className="w-6 h-6"/>
            <span>Switch to {facingMode === 'user' ? 'Back' : 'Front'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;