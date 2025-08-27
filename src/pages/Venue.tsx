import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Zap, FlipHorizontal, Edit3, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type ScanState = "VALID" | "ALREADY_USED" | "INVALID" | "ERROR";
type ScanResult = { 
  state: ScanState; 
  outpoint?: string; 
  refTx?: string; 
  message?: string; 
  ts: number 
};

function truncateMiddle(s: string, head = 6, tail = 4) {
  return s.length <= head + tail + 1 ? s : `${s.slice(0, head)}…${s.slice(-tail)}`;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// Mock verification function - replace with actual implementation
async function verifyTicket(payload: string): Promise<ScanResult> {
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
  
  const mockResults: ScanResult[] = [
    { state: "VALID", outpoint: `${payload}:0`, ts: Date.now() },
    { state: "ALREADY_USED", outpoint: `${payload}:0`, refTx: "abc123def456", ts: Date.now() },
    { state: "INVALID", message: "Ticket not found", ts: Date.now() }
  ];
  
  return mockResults[Math.floor(Math.random() * mockResults.length)];
}

const Venue = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [currentBanner, setCurrentBanner] = useState<ScanResult | null>(null);
  const [auditLog, setAuditLog] = useState<ScanResult[]>([]);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const lastScannedRef = useRef<{ payload: string; timestamp: number } | null>(null);

  // Initialize camera and scanner
  useEffect(() => {
    const initScanner = async () => {
      try {
        // Get available devices
        const videoDevices = await navigator.mediaDevices.enumerateDevices();
        const cameras = videoDevices.filter(device => device.kind === 'videoinput');
        setDevices(cameras);
        
        if (cameras.length > 0) {
          const preferredCamera = cameras.find(camera => 
            camera.label.toLowerCase().includes('back') || 
            camera.label.toLowerCase().includes('rear')
          ) || cameras[0];
          setCurrentDeviceId(preferredCamera.deviceId);
        }

        // Initialize code reader
        codeReaderRef.current = new BrowserMultiFormatReader();
      } catch (error) {
        console.error('Failed to initialize scanner:', error);
      }
    };

    initScanner();

    return () => {
      // Cleanup
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Start scanning
  const startScanning = useCallback(async () => {
    if (!codeReaderRef.current || !videoRef.current) return;

    try {
      const deviceId = currentDeviceId || undefined;
      
      await codeReaderRef.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            handleScan(result.getText());
          }
        }
      );
      
      setIsScanning(true);
      
      // Get the stream for torch control
      const constraints = {
        video: { deviceId: deviceId ? { exact: deviceId } : undefined }
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
    } catch (error) {
      console.error('Failed to start scanning:', error);
    }
  }, [currentDeviceId]);

  // Stop scanning
  const stopScanning = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  }, [stream]);

  // Toggle scanning
  useEffect(() => {
    if (isScanning) {
      startScanning();
    } else {
      stopScanning();
    }
  }, [isScanning, startScanning, stopScanning]);

  // Auto-start scanning
  useEffect(() => {
    if (currentDeviceId && !isScanning) {
      setIsScanning(true);
    }
  }, [currentDeviceId]);

  const handleScan = useCallback(async (result: string) => {
    // Debounce duplicate scans
    const now = Date.now();
    if (lastScannedRef.current && 
        lastScannedRef.current.payload === result && 
        now - lastScannedRef.current.timestamp < 1200) {
      return;
    }
    
    lastScannedRef.current = { payload: result, timestamp: now };
    setIsVerifying(true);
    
    try {
      const scanResult = await verifyTicket(result);
      setCurrentBanner(scanResult);
      setAuditLog(prev => [scanResult, ...prev.slice(0, 5)]);
      
      // Auto-hide banner after 2s
      setTimeout(() => setCurrentBanner(null), 2000);
    } catch (error) {
      const errorResult: ScanResult = {
        state: "ERROR",
        message: "Verification error. Retry.",
        ts: Date.now()
      };
      setCurrentBanner(errorResult);
      setTimeout(() => setCurrentBanner(null), 2000);
    } finally {
      setIsVerifying(false);
    }
  }, []);

  // Toggle torch
  const toggleTorch = useCallback(async () => {
    if (!stream) return;
    
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    
    try {
      const capabilities = track.getCapabilities();
      if ('torch' in capabilities) {
        await track.applyConstraints({
          advanced: [{ torch: !isTorchOn } as any]
        });
        setIsTorchOn(!isTorchOn);
      }
    } catch (error) {
      console.error('Torch toggle failed:', error);
    }
  }, [stream, isTorchOn]);

  // Flip camera
  const flipCamera = useCallback(() => {
    if (devices.length > 1) {
      const currentIndex = devices.findIndex(device => device.deviceId === currentDeviceId);
      const nextIndex = (currentIndex + 1) % devices.length;
      setCurrentDeviceId(devices[nextIndex].deviceId);
      
      // Restart scanning with new device
      if (isScanning) {
        setIsScanning(false);
        setTimeout(() => setIsScanning(true), 100);
      }
    }
  }, [devices, currentDeviceId, isScanning]);

  const handleManualVerify = async () => {
    if (!manualInput.trim()) return;
    
    setIsVerifying(true);
    try {
      const scanResult = await verifyTicket(manualInput);
      setCurrentBanner(scanResult);
      setAuditLog(prev => [scanResult, ...prev.slice(0, 5)]);
      setShowManualEntry(false);
      setManualInput('');
      
      setTimeout(() => setCurrentBanner(null), 2000);
    } catch (error) {
      const errorResult: ScanResult = {
        state: "ERROR",
        message: "Verification error. Retry.",
        ts: Date.now()
      };
      setCurrentBanner(errorResult);
    } finally {
      setIsVerifying(false);
    }
  };

  const copyOutpoint = (outpoint: string) => {
    navigator.clipboard.writeText(outpoint);
    toast({
      description: "Outpoint copied"
    });
  };

  const getBannerStyles = (state: ScanState) => {
    switch (state) {
      case "VALID":
        return "bg-green-500 text-black";
      case "ALREADY_USED":
        return "bg-amber-400 text-black";
      case "INVALID":
      case "ERROR":
        return "bg-red-500 text-black";
      default:
        return "bg-red-500 text-black";
    }
  };

  const getStatusPillStyles = (state: ScanState) => {
    switch (state) {
      case "VALID":
        return "bg-green-500 text-black";
      case "ALREADY_USED":
        return "bg-amber-400 text-black";
      case "INVALID":
      case "ERROR":
        return "bg-red-500 text-white";
      default:
        return "bg-red-500 text-white";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Scanner Stage */}
      <div className="relative flex flex-col items-center justify-center min-h-screen p-4">
        {/* Scanner Container */}
        <div className="relative w-full max-w-md aspect-square">
          {/* Controls Bar */}
          <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-4">
            <span className="text-xs font-mono text-white/60 uppercase">SCANNER</span>
            <div className="flex gap-2">
              <Button
                variant="neo-outline"
                size="sm"
                onClick={toggleTorch}
                aria-label="Toggle torch"
                className="text-xs font-mono uppercase px-2 py-1"
                disabled={!stream}
              >
                <Zap className="w-3 h-3" />
                TORCH
              </Button>
              <Button
                variant="neo-outline"
                size="sm"
                onClick={flipCamera}
                aria-label="Flip camera"
                className="text-xs font-mono uppercase px-2 py-1"
                disabled={devices.length <= 1}
              >
                <FlipHorizontal className="w-3 h-3" />
                FLIP
              </Button>
              <Button
                variant="neo-outline"
                size="sm"
                onClick={() => setShowManualEntry(true)}
                aria-label="Open manual entry"
                className="text-xs font-mono uppercase px-2 py-1"
              >
                <Edit3 className="w-3 h-3" />
                MANUAL
              </Button>
            </div>
          </div>

          {/* QR Scanner */}
          <div className="relative w-full h-full border-2 border-white rounded-md overflow-hidden">
            {/* Scan Frame Overlay */}
            <div className="absolute inset-4 border-2 border-white/50 rounded-md z-10 pointer-events-none" />
            
            {/* Video Element */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />
            
            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Button
                  variant="neo"
                  onClick={() => setIsScanning(true)}
                  className="text-xs font-mono uppercase"
                >
                  [ START SCANNING ]
                </Button>
              </div>
            )}
          </div>

          {/* Status Banner */}
          {currentBanner && (
            <div 
              className={`absolute bottom-0 left-0 right-0 z-30 p-4 font-mono text-sm ${getBannerStyles(currentBanner.state)}`}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center justify-between">
                <span className="uppercase font-bold">
                  {currentBanner.state === "ALREADY_USED" ? "ALREADY USED" : currentBanner.state}
                </span>
                <div className="flex items-center gap-2 text-xs">
                  {currentBanner.outpoint && (
                    <span>{truncateMiddle(currentBanner.outpoint)}</span>
                  )}
                  <span>{formatTime(currentBanner.ts)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isVerifying && (
            <div className="absolute bottom-0 left-0 right-0 z-30 p-4 bg-white/10 backdrop-blur">
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="ml-2 font-mono text-sm">VERIFYING...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audit Log */}
      {auditLog.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 pb-8">
          <h2 className="text-lg font-bold mb-4 uppercase">RECENT SCANS</h2>
          <div className="space-y-2">
            {auditLog.map((result, index) => (
              <div key={`${result.ts}-${index}`} className="flex items-center justify-between p-3 border border-white/20 rounded-md">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm text-white/60">
                    [{formatTime(result.ts)}]
                  </span>
                  {result.outpoint && (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{truncateMiddle(result.outpoint)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyOutpoint(result.outpoint!)}
                        className="p-1 h-auto"
                        aria-label="Copy outpoint"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-mono uppercase ${getStatusPillStyles(result.state)}`}>
                  {result.state === "ALREADY_USED" ? "USED" : result.state}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      <Dialog open={showManualEntry} onOpenChange={setShowManualEntry}>
        <DialogContent className="bg-black border-white/20">
          <DialogHeader>
            <DialogTitle className="font-mono uppercase">MANUAL ENTRY</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Enter outpoint (txid:vout) or ticket ID"
              className="font-mono"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleManualVerify();
                }
              }}
            />
            <div className="flex gap-2">
              <Button
                variant="neo"
                onClick={handleManualVerify}
                disabled={!manualInput.trim() || isVerifying}
                className="flex-1"
              >
                [ VERIFY ]
              </Button>
              <Button
                variant="neo-outline"
                onClick={() => setShowManualEntry(false)}
                className="flex-1"
              >
                [ CANCEL ]
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Venue;