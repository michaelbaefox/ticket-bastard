import React, { useState, useCallback, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Zap, FlipHorizontal, Edit3, Copy, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScanlineOverlay } from '@/components/ScanlineOverlay';
import { TicketLedgerEntry } from '@/types/ticketing';
import { verifyRoyaltyCompliance, verifyPolicySignature } from '@/lib/ticketing';

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

async function verifyTicket(payload: string): Promise<ScanResult> {
  await new Promise(resolve => setTimeout(resolve, 150));

  try {
    const ledgerRaw = window.localStorage.getItem('ticketBastardLedger');
    const ledger: TicketLedgerEntry[] = ledgerRaw ? JSON.parse(ledgerRaw) : [];
    const entry = ledger.find((record) => record.outpoint === payload);

    if (!entry) {
      return { state: "INVALID", message: "Ticket not recognized", ts: Date.now() };
    }

    const { policy, tx } = entry;
    const eventId = entry.eventId;

    if (policy.resaleAllowed === false && tx.type !== 'primary') {
      return {
        state: "INVALID",
        message: "Resale disabled by issuer policy",
        outpoint: payload,
        ts: Date.now()
      };
    }

    if (tx.type === 'resale' || tx.type === 'transfer') {
      const compliance = verifyRoyaltyCompliance(tx, policy);
      if (!compliance.compliant) {
        return {
          state: "INVALID",
          message: "Royalty outputs missing on last transfer",
          outpoint: payload,
          ts: Date.now()
        };
      }
    }

    if (entry.issuerSignature && eventId) {
      const signatureValid = verifyPolicySignature(eventId, entry.ticketId, entry.policyJson, entry.issuerSignature);
      if (!signatureValid) {
        return {
          state: "INVALID",
          message: "Policy signature mismatch",
          outpoint: payload,
          ts: Date.now()
        };
      }
    }

    return {
      state: "VALID",
      outpoint: payload,
      refTx: tx.txid,
      message: "Policy compliant",
      ts: Date.now()
    };
  } catch (error) {
    console.error('Verification error', error);
    return { state: "ERROR", message: "Verification error. Retry.", ts: Date.now() };
  }
}

const Venue = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<ScanResult | null>(null);
  const [auditLog, setAuditLog] = useState<ScanResult[]>([]);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [cameras, setCameras] = useState<QrScanner.Camera[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const lastScannedRef = useRef<{ payload: string; timestamp: number } | null>(null);

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

  // Initialize scanner and get cameras
  useEffect(() => {
    const initScanner = async () => {
      try {
        // Check if camera is supported
        const hasCamera = await QrScanner.hasCamera();
        if (!hasCamera) {
          console.error('No camera available');
          return;
        }

        // Get available cameras
        const cameraList = await QrScanner.listCameras(true);
        setCameras(cameraList);
        
        // Set preferred camera (back camera if available)
        const backCamera = cameraList.find(camera => 
          camera.label.toLowerCase().includes('back') || 
          camera.label.toLowerCase().includes('rear') ||
          camera.label.toLowerCase().includes('environment')
        );
        const preferredCamera = backCamera || cameraList[0];
        if (preferredCamera) {
          setSelectedCameraId(preferredCamera.id);
        }
      } catch (error) {
        console.error('Failed to initialize scanner:', error);
      }
    };

    initScanner();
  }, []);

  // Initialize QR Scanner when video element and camera are ready
  useEffect(() => {
    if (!videoRef.current || !selectedCameraId) return;

    const initQrScanner = () => {
      qrScannerRef.current = new QrScanner(
        videoRef.current!,
        (result) => handleScan(result.data),
        {
          onDecodeError: (error) => {
            // Silent - don't log decode errors as they're expected during scanning
          },
          highlightScanRegion: false,
          highlightCodeOutline: false,
          maxScansPerSecond: 5,
        }
      );
    };

    initQrScanner();

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }
    };
  }, [selectedCameraId]);

  // Start scanning
  const startScanning = useCallback(async () => {
    if (!qrScannerRef.current) return;
    
    try {
      await qrScannerRef.current.start();
      if (selectedCameraId) {
        await qrScannerRef.current.setCamera(selectedCameraId);
      }
      setIsScanning(true);
    } catch (error) {
      console.error('Failed to start scanner:', error);
    }
  }, [selectedCameraId]);

  // Stop scanning
  const stopScanning = useCallback(async () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
    }
    setIsScanning(false);
  }, []);

  // Auto-start scanning when camera is ready
  useEffect(() => {
    if (selectedCameraId && !isScanning && qrScannerRef.current) {
      startScanning();
    }
  }, [selectedCameraId, startScanning]);


  // Toggle torch
  const toggleTorch = useCallback(async () => {
    if (!qrScannerRef.current) return;
    
    try {
      if (isTorchOn) {
        await qrScannerRef.current.turnFlashOff();
      } else {
        await qrScannerRef.current.turnFlashOn();
      }
      setIsTorchOn(!isTorchOn);
    } catch (error) {
      console.error('Torch toggle failed:', error);
    }
  }, [isTorchOn]);

  // Flip camera
  const flipCamera = useCallback(async () => {
    if (cameras.length > 1 && qrScannerRef.current) {
      const currentIndex = cameras.findIndex(camera => camera.id === selectedCameraId);
      const nextIndex = (currentIndex + 1) % cameras.length;
      const nextCamera = cameras[nextIndex];
      
      try {
        await qrScannerRef.current.setCamera(nextCamera.id);
        setSelectedCameraId(nextCamera.id);
      } catch (error) {
        console.error('Camera flip failed:', error);
      }
    }
  }, [cameras, selectedCameraId]);

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
        return "bg-green-500 text-neo-contrast-inverse";
      case "ALREADY_USED":
        return "bg-amber-400 text-neo-contrast-inverse";
      case "INVALID":
      case "ERROR":
        return "bg-red-500 text-neo-contrast-inverse";
      default:
        return "bg-red-500 text-neo-contrast-inverse";
    }
  };

  const getStatusPillStyles = (state: ScanState) => {
    switch (state) {
      case "VALID":
        return "bg-green-500 text-neo-contrast-inverse";
      case "ALREADY_USED":
        return "bg-amber-400 text-neo-contrast-inverse";
      case "INVALID":
      case "ERROR":
        return "bg-red-500 text-neo-contrast";
      default:
        return "bg-red-500 text-neo-contrast";
    }
  };

  return (
    <div className="min-h-screen bg-neo-contrast-inverse text-neo-contrast">
      <ScanlineOverlay />
      {/* Scanner Stage */}
      <div className="relative flex flex-col items-center justify-center min-h-screen p-4">
        {/* Scanner Container */}
        <div className="relative w-full max-w-md aspect-square">
          {/* Controls Bar */}
          <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-4">
            <span className="text-xs font-mono text-neo-contrast/60 uppercase">SCANNER</span>
            <div className="flex gap-2">
              <Button
                variant="neo-outline"
                size="sm"
                onClick={toggleTorch}
                aria-label="Toggle torch"
                className="text-xs font-mono uppercase px-2 py-1"
                disabled={!qrScannerRef.current}
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
                disabled={cameras.length <= 1}
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
          <div className="relative w-full h-full border-2 border-neo-border rounded-md overflow-hidden">
            {/* Scan Frame Overlay */}
            <div className="absolute inset-4 border-2 border-neo-border/50 rounded-md z-10 pointer-events-none" />
            
            {/* Video Element */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />
            
            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-neo-contrast-inverse/50">
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
            <div className="absolute bottom-0 left-0 right-0 z-30 p-4 bg-neo-contrast/10 backdrop-blur">
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-neo-border border-t-transparent rounded-full animate-spin" />
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
              <div key={`${result.ts}-${index}`} className="flex items-center justify-between p-3 border border-neo-border/20 rounded-md">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm text-neo-contrast/60">
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
        <DialogContent className="bg-neo-contrast-inverse border-neo-border/20">
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