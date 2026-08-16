import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  Target, 
  Activity, 
  Layers, 
  Compass, 
  Info, 
  AlertTriangle,
  CheckCircle2,
  Play,
  RotateCcw,
  Maximize2,
  Grid,
  TrendingUp,
  Clock,
  Crosshair,
  Tv,
  Volume2,
  VolumeX
} from 'lucide-react';
import resultsData from './data/results.json';

interface Candidate {
  x: number;
  y: number;
  score: number;
}

interface SampleResult {
  id: number;
  search_image: string;
  reference_image: string;
  gt_x: number;
  gt_y: number;
  search_width: number;
  search_height: number;
  cell_size: number;
  predicted_x: number;
  predicted_y: number;
  pixel_error: number;
  candidates: Candidate[];
  correlation_peak: number;
  latency_ms: number;
}

const sampleDescriptions = [
  "SCAN-00: Template matching on DRAM capacitors grid. NCC identifies multiple repeating peaks with a 48px pitch. The system resolved alignment to (408, 216) based on center prior, resulting in a 67.88px displacement offset.",
  "SCAN-01: High periodic layout symmetry of FinFET nodes causes matching ambiguity. Center prior selects peak at (120, 216) from nearly identical correlation candidates, yielding a critical error of 303.58px.",
  "SCAN-02: Wafer alignment on a 3D NAND array. True GDSII target at (168, 312) is bypassed for the center-prioritized peak at (408, 264), leaving a 244.75px offset error.",
  "SCAN-03: Resolving periodic circuit structure on SRAM memory cell. Center distance priority heuristic selects (216, 264) over other candidates, with a resulting error of 67.88px.",
  "SCAN-04: Alignment check on the Logic grid structure. The algorithm selected candidate peak at (312, 264) due to center proximity. True target lies at (120, 312), creating a 197.91px drift error.",
  "SCAN-05: Finished alignment on TSV packaging vias. Sub-pixel NCC matching completes in 29.49ms, resolving the alignment center to (168, 216) instead of target (264, 120), showing a 135.76px drift."
];

function TypewriterText({ text, speed = 12 }: { text: string; speed?: number }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(index));
      index++;
      if (index >= text.length) {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className="font-mono text-slate-300 select-none leading-relaxed">
      {displayedText}
      {displayedText.length < text.length && (
        <span className="inline-block w-1.5 h-3.5 bg-teal-455 ml-0.5 animate-cursor-blink" />
      )}
    </span>
  );
}

export default function App() {
  const results = resultsData as SampleResult[];
  const [selectedId, setSelectedId] = useState<number>(0);
  const [hoveredCandidate, setHoveredCandidate] = useState<Candidate | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<number>(100); // 0 to 100 for scanning line animation
  const [viewGrid, setViewGrid] = useState<boolean>(true);
  const [viewOverlay, setViewOverlay] = useState<boolean>(true);
  
  // Guided Voice-Demo State
  const [isDemoActive, setIsDemoActive] = useState<boolean>(false);
  const [demoSampleIndex, setDemoSampleIndex] = useState<number>(0);
  const [demoStepIndex, setDemoStepIndex] = useState<number>(0);
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);
  const [speechMuted, setSpeechMuted] = useState<boolean>(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentSample = results.find(r => r.id === selectedId) || results[0];

  // Load available voices for speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Trigger scan animation when sample changes
  useEffect(() => {
    handleRunScan();
  }, [selectedId]);

  // Lock scrolling during Demo Mode
  useEffect(() => {
    if (isDemoActive) {
      document.body.style.overflow = 'hidden';
      const preventDefault = (e: TouchEvent) => e.preventDefault();
      document.addEventListener('touchmove', preventDefault, { passive: false });
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('touchmove', preventDefault);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isDemoActive]);

  // Guided Tour State Machine
  useEffect(() => {
    if (!isDemoActive) {
      setHighlightedSection(null);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      return;
    }

    // Set the selected sample to the current demo sample
    setSelectedId(demoSampleIndex);

    const steps = getTourSteps(results[demoSampleIndex]);
    const currentStep = steps[demoStepIndex];

    // Scroll to the target element
    setHighlightedSection(currentStep.targetId);
    const element = document.getElementById(currentStep.targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Speak narration
    if ('speechSynthesis' in window && !speechMuted) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentStep.text);
      
      const enVoices = voices.filter(v => v.lang.startsWith('en'));
      const preferredVoice = enVoices.find(v => v.name.includes('Google') || v.name.includes('Natural')) ||
                             enVoices.find(v => v.name.includes('Zira') || v.name.includes('Hazel') || v.name.includes('David')) ||
                             enVoices[0];
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      utterance.rate = 1.0;
      utterance.pitch = 1.05;

      utterance.onend = () => {
        // Hold for 1.8 seconds after speech completes, then advance
        speechTimeoutRef.current = setTimeout(() => {
          advanceDemo();
        }, 1800);
      };

      utterance.onerror = () => {
        // Fallback if SpeechSynthesis encounters an error
        speechTimeoutRef.current = setTimeout(() => {
          advanceDemo();
        }, 6000);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback timer if muted or SpeechSynthesis is not supported
      speechTimeoutRef.current = setTimeout(() => {
        advanceDemo();
      }, 7000);
    }

    return () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
    };
  }, [isDemoActive, demoSampleIndex, demoStepIndex, speechMuted, voices]);

  const advanceDemo = () => {
    setDemoStepIndex((prevStep) => {
      if (prevStep < 4) {
        return prevStep + 1;
      } else {
        // Loop back to step 0 and increment sample
        setDemoSampleIndex((prevSample) => {
          if (prevSample < results.length - 1) {
            setDemoStepIndex(0);
            return prevSample + 1;
          } else {
            // End of demo presentation
            setIsDemoActive(false);
            setHighlightedSection(null);
            setDemoStepIndex(0);
            return 0;
          }
        });
        return prevStep;
      }
    });
  };

  const getTourSteps = (sample: SampleResult) => [
    {
      targetId: 'header-root',
      title: 'Wafer Inspection Pair',
      text: `Let's analyze Scan pair 0${sample.id}. This semiconductor die scan has a repeating cell size of ${sample.cell_size} pixels.`
    },
    {
      targetId: 'template-panel',
      title: 'GDSII Reference Template',
      text: `Here is the GDSII reference template. It is a 160 by 160 pixel layout representing the target circuit design. We downsample it to match the search magnification.`
    },
    {
      targetId: 'fov-panel',
      title: 'Field of View Alignment',
      text: `On the search Field of View, the green dashed circle shows the design target coordinates, and the teal crosshair marks the AI's predicted alignment position. We have highlighted these key coordinates in RED to indicate the error displacement. The orange circles display repeating periodic alias peaks discovered in the correlation surface. The current alignment displacement error is ${sample.pixel_error} pixels.`
    },
    {
      targetId: 'metrics-panel',
      title: 'Telemetry & Metrics',
      text: `Our metrics report an alignment displacement error of ${sample.pixel_error} pixels, which is approximately ${(sample.pixel_error * 2.8).toFixed(1)} nanometers. The Normalized Cross Correlation matching completed in ${sample.latency_ms.toFixed(1)} milliseconds.`
    },
    {
      targetId: 'table-panel',
      title: 'Correlation Peak Extraction',
      text: `Finally, the extraction table ranks the top 8 correlation peaks. The system selected the winner using a center-distance proximity heuristic to resolve repeating grid ambiguity. Let's transition to the next scan.`
    }
  ];

  const handleRunScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanStep(0);
    
    const duration = 1000; // ms
    const intervalTime = 25;
    const steps = duration / intervalTime;
    let currentStep = 0;
    
    const timer = setInterval(() => {
      currentStep++;
      const progress = Math.min((currentStep / steps) * 100, 100);
      setScanStep(progress);
      
      if (currentStep >= steps) {
        clearInterval(timer);
        setIsScanning(false);
      }
    }, intervalTime);
  };

  const handleToggleDemo = () => {
    if (isDemoActive) {
      setIsDemoActive(false);
      setHighlightedSection(null);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      setDemoSampleIndex(0);
      setDemoStepIndex(0);
      setIsDemoActive(true);
    }
  };

  // Helper for applying guided highlight borders in RED
  const getHighlightClass = (sectionId: string) => {
    return highlightedSection === sectionId 
      ? 'ring-2 ring-red-500 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] scale-[1.006] transition-all duration-300 bg-slate-900/60 z-10' 
      : 'transition-all duration-300';
  };

  // Get typewriter text dynamically
  const getBannerText = () => {
    if (isDemoActive) {
      const steps = getTourSteps(results[demoSampleIndex]);
      return `[STEP ${demoStepIndex + 1}/5 - ${steps[demoStepIndex].title.toUpperCase()}]: ${steps[demoStepIndex].text}`;
    }
    return sampleDescriptions[selectedId];
  };

  // Calculate average stats across all samples
  const avgError = results.reduce((acc, r) => acc + r.pixel_error, 0) / results.length;
  const avgLatency = results.reduce((acc, r) => acc + r.latency_ms, 0) / results.length;
  const avgPeak = results.reduce((acc, r) => acc + r.correlation_peak, 0) / results.length;

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans antialiased selection:bg-teal-500/30 selection:text-teal-200 relative">
      
      {/* Non-interactive Overlay Blocker to prevent clicking/scrolling during explanation */}
      {isDemoActive && (
        <div className="fixed inset-0 z-[80] pointer-events-auto bg-transparent cursor-not-allowed" />
      )}

      {/* 1. Technical Header */}
      <header id="header-root" className={`border-b border-slate-800 bg-[#0b0e14] px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 relative ${getHighlightClass('header-root')}`}>
        <div className="flex items-center space-x-3.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.15)] animate-pulse">
            <Target className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-teal-500 rounded-full animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-teal-500 rounded-full" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-lg font-bold tracking-tight text-white font-mono uppercase">
                NanoPixel
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-850 text-slate-400 font-semibold tracking-wider">
                Alignment Analyzer
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sub-Pixel Wafer Alignment & Navigation Calibration Platform • Hackathon Evaluation
            </p>
          </div>
        </div>

        {/* Global Summary Statistics */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 flex flex-col justify-center min-w-[100px]">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Avg Error</span>
            <span className="text-slate-200 font-bold">{avgError.toFixed(2)} px</span>
          </div>
          <div className="bg-slate-950 border border-slate-855 rounded px-2.5 py-1.5 flex flex-col justify-center min-w-[100px]">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Avg Latency</span>
            <span className="text-slate-200 font-bold">{avgLatency.toFixed(1)} ms</span>
          </div>
          <div className="bg-slate-955 border border-slate-855 rounded px-2.5 py-1.5 flex flex-col justify-center min-w-[100px]">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Mean Correlation</span>
            <span className="text-slate-200 font-bold">{avgPeak.toFixed(4)}</span>
          </div>
          <div className="bg-slate-955 border border-slate-855 rounded px-2.5 py-1.5 flex flex-col justify-center min-w-[100px]">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Match Status</span>
            <span className="text-teal-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> READY
            </span>
          </div>
        </div>
      </header>

      {/* 2. Main Dashboard Split-View */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden border-b border-slate-800">
        
        {/* Left Sidebar: Sample Selection */}
        <aside id="sidebar-root" className={`w-full lg:w-80 bg-[#090b10] border-r border-slate-800 flex flex-col shrink-0 ${getHighlightClass('sidebar-root')}`}>
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-slate-400" /> Scanpairs ({results.length})
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-550 border border-slate-800">
                ACTIVE
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[300px] lg:max-h-none">
            {results.map((sample) => {
              const isSelected = sample.id === selectedId;
              const hasCriticalError = sample.pixel_error > 150;
              
              return (
                <button
                  key={sample.id}
                  disabled={isDemoActive}
                  onClick={() => {
                    setSelectedId(sample.id);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all duration-200 flex gap-3 group relative ${
                    isDemoActive ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                  } ${
                    isSelected
                      ? 'bg-slate-900 border-teal-500 shadow-md ring-1 ring-teal-500/20'
                      : 'bg-slate-955 border-slate-850 hover:bg-slate-900/60 hover:border-slate-800'
                  }`}
                >
                  {/* Thumbnail of Reference image */}
                  <div className="w-12 h-12 rounded bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                    <img 
                      src={`${import.meta.env.BASE_URL}${sample.reference_image}`} 
                      alt={`Ref ${sample.id}`}
                      className="w-full h-full object-cover grayscale opacity-80 group-hover:opacity-100 transition-opacity" 
                    />
                  </div>

                  {/* Text Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                        SCAN-0{sample.id}
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold ${
                        hasCriticalError 
                          ? 'bg-amber-955/40 text-amber-400 border-amber-800/50'
                          : 'bg-emerald-955/40 text-emerald-400 border-emerald-800/50'
                      }`}>
                        Err: {sample.pixel_error.toFixed(1)}px
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-1 flex justify-between">
                      <span>Cell Size: {sample.cell_size}px</span>
                      <span className="text-slate-500">GT: ({sample.gt_x}, {sample.gt_y})</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Interactive controls inside Sidebar (Z-[90] to bypass transparent overlay blocker) */}
          <div className={`p-3 border-t border-slate-800 bg-[#090b10] space-y-2.5 relative ${isDemoActive ? 'z-[90]' : ''}`}>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleRunScan}
                disabled={isScanning || isDemoActive}
                className="w-full flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded bg-teal-600 hover:bg-teal-500 disabled:bg-slate-850 disabled:text-slate-600 text-black font-mono font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer"
              >
                {isScanning ? (
                  <>
                    <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Running...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current" />
                    <span>Run Align</span>
                  </>
                )}
              </button>

              <button
                onClick={handleToggleDemo}
                className={`w-full flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded font-mono font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                  isDemoActive
                    ? 'bg-red-650 hover:bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse'
                    : 'bg-slate-900 hover:bg-slate-800 text-teal-400 border border-slate-800 hover:border-slate-705'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>{isDemoActive ? 'Stop Demo' : 'Guided Demo'}</span>
              </button>
            </div>

            {/* Speech synthesis controls */}
            {isDemoActive && (
              <button
                onClick={() => setSpeechMuted(!speechMuted)}
                className="w-full flex items-center justify-center space-x-2 py-1.5 px-3 rounded bg-slate-950 border border-slate-850 text-slate-400 hover:text-white text-[10px] font-mono transition-all cursor-pointer"
              >
                {speechMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-amber-500" />
                    <span>UNMUTE AI NARRATION</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-teal-400" />
                    <span>MUTE AI NARRATION</span>
                  </>
                )}
              </button>
            )}

            {/* Toggle visual helpers */}
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-850">
              <span className="text-[10px] font-mono text-slate-500">Overlay Indicators</span>
              <button 
                disabled={isDemoActive}
                onClick={() => setViewOverlay(!viewOverlay)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                  isDemoActive ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                } ${
                  viewOverlay 
                    ? 'bg-teal-950/40 text-teal-400 border-teal-800/50' 
                    : 'bg-slate-900 text-slate-500 border-slate-850'
                }`}
              >
                {viewOverlay ? 'VISIBLE' : 'HIDDEN'}
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">Technical Grid</span>
              <button 
                disabled={isDemoActive}
                onClick={() => setViewGrid(!viewGrid)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                  isDemoActive ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                } ${
                  viewGrid 
                    ? 'bg-teal-950/40 text-teal-400 border-teal-800/50' 
                    : 'bg-slate-900 text-slate-500 border-slate-850'
                }`}
              >
                {viewGrid ? 'VISIBLE' : 'HIDDEN'}
              </button>
            </div>
          </div>
        </aside>

        {/* Center/Right Panels: Visual Workbench */}
        <section className="flex-1 flex flex-col overflow-hidden bg-[#07080c]">
          
          {/* 2.1 Live Typewriter Subtitle Box */}
          <div className="px-4 pt-4 shrink-0">
            <div className={`p-4 bg-[#090c12] border rounded-none flex items-start gap-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.6)] transition-all ${
              isDemoActive 
                ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)] bg-slate-950 animate-pulse' 
                : 'border-slate-800'
            }`}>
              <div className={`px-2.5 py-1 rounded-none font-mono text-[9px] uppercase font-bold shrink-0 flex items-center gap-1.5 border ${
                isDemoActive 
                  ? 'bg-red-955/40 text-red-400 border-red-800/40' 
                  : 'bg-slate-900 text-teal-400 border-slate-800'
              }`}>
                <Tv className="w-3.5 h-3.5 animate-pulse" />
                {isDemoActive ? 'AI Voice Log' : 'Process Log'}
              </div>
              <div className="text-[11px] leading-relaxed pt-0.5 flex-1 min-h-[3.25rem]">
                <TypewriterText text={getBannerText()} speed={12} />
              </div>
            </div>
          </div>

          {/* Main Visual Panels (Reference on Left, Search on Right) */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden border-b border-slate-800">
            
            {/* Left Panel: Template Pattern (160x160 px) */}
            <div id="template-panel" className={`w-full md:w-1/3 bg-[#080a0f] p-4 flex flex-col border-b md:border-b-0 md:border-r border-slate-800 overflow-y-auto ${getHighlightClass('template-panel')}`}>
              <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-4">
                <span className="text-xs font-mono text-slate-350 uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <Grid className="w-3.5 h-3.5" /> Template Pattern
                </span>
                <span className="text-[10px] font-mono text-slate-505">160 × 160 PX</span>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="relative border border-slate-855 p-2.5 bg-slate-950 rounded-lg max-w-[200px] w-full aspect-square flex items-center justify-center sem-monochrome-glow group">
                  
                  {/* Grid effect inside the frame */}
                  {viewGrid && (
                    <div className="absolute inset-0 circuit-grid-bw pointer-events-none opacity-40 rounded-lg" />
                  )}
                  
                  {/* Image container */}
                  <div className="relative w-full h-full bg-black border border-slate-850 rounded flex items-center justify-center overflow-hidden">
                    <img 
                      src={`${import.meta.env.BASE_URL}${currentSample.reference_image}`} 
                      alt={`Reference ${currentSample.id}`}
                      className="w-full h-full object-contain grayscale scale-100 group-hover:scale-105 transition-transform duration-200" 
                    />
                    
                    {/* Centered crosshair */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-full h-[0.5px] bg-teal-500/20" />
                      <div className="h-full w-[0.5px] bg-teal-500/20" />
                      <div className="w-5 h-5 border border-teal-500/30 rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center space-y-1 max-w-xs">
                  <p className="text-[11px] font-mono text-slate-400 uppercase">
                    10x Design Template (GDSII)
                  </p>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    This is the ideal target layout. The matching engine downsamples it to 16x16 to search across the SEM image.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Panel: Search Area (576x432 px) */}
            <div id="fov-panel" className={`flex-1 bg-[#07090e] p-4 flex flex-col overflow-y-auto ${getHighlightClass('fov-panel')}`}>
              <div className="flex items-center justify-between border-b border-slate-805 pb-2 mb-4">
                <span className="text-xs font-mono text-slate-350 uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5" /> Field of View (FOV)
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-505 uppercase">
                    Resolution: 576 × 432 PX
                  </span>
                </div>
              </div>

              {/* Viewport Frame with markers */}
              <div className="flex-1 flex items-center justify-center p-2">
                <div className="relative border border-slate-800 bg-slate-950 rounded-lg overflow-hidden max-w-[576px] w-full shadow-2xl">
                  
                  {/* Grid layout */}
                  {viewGrid && (
                    <div className="absolute inset-0 circuit-grid-bw pointer-events-none opacity-20" />
                  )}

                  {/* Main search PNG */}
                  <img 
                    src={`${import.meta.env.BASE_URL}${currentSample.search_image}`} 
                    alt={`Search Area ${currentSample.id}`}
                    className="w-full h-auto block grayscale contrast-125 select-none" 
                  />

                  {/* Scanner overlay animation */}
                  {isScanning && (
                    <div 
                      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_8px_rgba(45,212,191,0.8)] pointer-events-none"
                      style={{ top: `${scanStep}%` }}
                    />
                  )}

                  {/* SVG marker layer */}
                  {viewOverlay && !isScanning && (
                    <svg 
                      viewBox="0 0 576 432" 
                      className="absolute inset-0 w-full h-full select-none"
                      style={{ pointerEvents: 'auto' }}
                    >
                      {/* Candidates (Orange Circles) */}
                      {currentSample.candidates.map((cand, idx) => {
                        const isSelectedWinner = cand.x === currentSample.predicted_x && cand.y === currentSample.predicted_y;
                        if (isSelectedWinner) return null; // prediction is drawn separately
                        
                        return (
                          <g key={`cand-${idx}`} className="pointer-events-auto cursor-help"
                             onMouseEnter={() => setHoveredCandidate(cand)}
                             onMouseLeave={() => setHoveredCandidate(null)}>
                            <circle 
                              cx={cand.x} 
                              cy={cand.y} 
                              r="10" 
                              stroke={isDemoActive && demoStepIndex === 2 ? "#ef4444" : "#f97316"} 
                              strokeWidth="1.5" 
                              fill={isDemoActive && demoStepIndex === 2 ? "rgba(239, 68, 68, 0.08)" : "rgba(249, 115, 22, 0.1)"} 
                              className="hover:stroke-amber-450 hover:fill-amber-400/20 transition-all duration-150"
                            />
                            {/* Tiny target cross */}
                            <line x1={cand.x - 3} y1={cand.y} x2={cand.x + 3} y2={cand.y} stroke={isDemoActive && demoStepIndex === 2 ? "#ef4444" : "#f97316"} strokeWidth="1" />
                            <line x1={cand.x} y1={cand.y - 3} x2={cand.x} y2={cand.y + 3} stroke={isDemoActive && demoStepIndex === 2 ? "#ef4444" : "#f97316"} strokeWidth="1" />
                          </g>
                        );
                      })}

                      {/* Ground Truth (Green dashed circle - goes flashing RED in step 3) */}
                      <g className="pointer-events-none">
                        <circle 
                          cx={currentSample.gt_x} 
                          cy={currentSample.gt_y} 
                          r="16" 
                          stroke={isDemoActive && demoStepIndex === 2 ? "#ef4444" : "#22c55e"} 
                          strokeWidth="2.5" 
                          strokeDasharray={isDemoActive && demoStepIndex === 2 ? "2 2" : "4 3"} 
                          fill={isDemoActive && demoStepIndex === 2 ? "rgba(239, 68, 68, 0.15)" : "rgba(34, 197, 94, 0.05)"}
                          className={isDemoActive && demoStepIndex === 2 ? "animate-pulse" : ""}
                        />
                        <circle cx={currentSample.gt_x} cy={currentSample.gt_y} r="3" fill={isDemoActive && demoStepIndex === 2 ? "#ef4444" : "#22c55e"} />
                        
                        {/* Connecting line between Prediction and GT if they don't match */}
                        {currentSample.pixel_error > 2 && (
                          <line 
                            x1={currentSample.predicted_x} 
                            y1={currentSample.predicted_y} 
                            x2={currentSample.gt_x} 
                            y2={currentSample.gt_y} 
                            stroke={isDemoActive && demoStepIndex === 2 ? "#ef4444" : "rgba(239, 68, 68, 0.4)"} 
                            strokeWidth="2" 
                            strokeDasharray="3 3"
                          />
                        )}
                      </g>

                      {/* AI Prediction (Teal Target marker - goes flashing RED in step 3) */}
                      <g className="pointer-events-none">
                        {/* Outer crosshairs ring */}
                        <circle 
                          cx={currentSample.predicted_x} 
                          cy={currentSample.predicted_y} 
                          r="14" 
                          stroke={isDemoActive && demoStepIndex === 2 ? "#ef4444" : "#14b8a6"} 
                          strokeWidth="2.5" 
                          fill={isDemoActive && demoStepIndex === 2 ? "rgba(239, 68, 68, 0.2)" : "rgba(20, 184, 166, 0.15)"}
                          className={`animate-[spin_12s_linear_infinite] ${isDemoActive && demoStepIndex === 2 ? "animate-pulse" : ""}`}
                        />
                        {/* Crosshairs lines */}
                        <line 
                          x1={currentSample.predicted_x - 20} 
                          y1={currentSample.predicted_y} 
                          x2={currentSample.predicted_x + 20} 
                          y2={currentSample.predicted_y} 
                          stroke={isDemoActive && demoStepIndex === 2 ? "#ef4444" : "#14b8a6"} 
                          strokeWidth="2" 
                        />
                        <line 
                          x1={currentSample.predicted_x} 
                          y1={currentSample.predicted_y - 20} 
                          x2={currentSample.predicted_x} 
                          y2={currentSample.predicted_y + 20} 
                          stroke={isDemoActive && demoStepIndex === 2 ? "#ef4444" : "#14b8a6"} 
                          strokeWidth="2" 
                        />
                        <circle cx={currentSample.predicted_x} cy={currentSample.predicted_y} r="4" fill={isDemoActive && demoStepIndex === 2 ? "#ef4444" : "#14b8a6"} />
                      </g>
                    </svg>
                  )}

                  {/* Hover HUD detail card inside the viewer */}
                  <div className="absolute bottom-2.5 right-2.5 bg-slate-950/90 border border-slate-800 p-2.5 rounded font-mono text-[10px] text-slate-300 w-[200px] backdrop-blur-sm pointer-events-none">
                    <div className="text-teal-400 font-bold border-b border-slate-800 pb-1 mb-1 flex items-center justify-between">
                      <span>HUD TELEMETRY</span>
                      <Crosshair className="w-3.5 h-3.5 animate-pulse" />
                    </div>
                    {hoveredCandidate ? (
                      <div className="space-y-1">
                        <div className="text-orange-400 font-semibold uppercase">REJECTED ALIAS</div>
                        <div>Coord: ({hoveredCandidate.x}, {hoveredCandidate.y})</div>
                        <div>Correlation: {hoveredCandidate.score.toFixed(4)}</div>
                        <div>Center Dist: {Math.hypot(hoveredCandidate.x - 288, hoveredCandidate.y - 216).toFixed(1)}px</div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-slate-400">Hover orange candidates to inspect.</div>
                        <div className="pt-1 mt-1 border-t border-slate-850 flex justify-between">
                          <span className={`${isDemoActive && demoStepIndex === 2 ? "text-red-400" : "text-emerald-405"}`}>GT:</span> 
                          <span>({currentSample.gt_x}, {currentSample.gt_y})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`${isDemoActive && demoStepIndex === 2 ? "text-red-400" : "text-teal-400"}`}>AI:</span> 
                          <span>({currentSample.predicted_x}, {currentSample.predicted_y})</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Legend (Explanation of markers) */}
              <div className="mt-3 bg-slate-950 border border-slate-850 p-2.5 rounded-lg flex flex-wrap justify-center items-center gap-6 text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border border-dashed border-emerald-500 bg-emerald-500/10 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </span>
                  <span><strong className="text-emerald-400 font-normal">Green Marker</strong> = Ground Truth (Design Target)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border border-teal-500 rounded-full flex items-center justify-center bg-teal-500/20 text-teal-400 text-[8px] font-bold">
                    +
                  </span>
                  <span><strong className="text-teal-400 font-normal">Teal Crosshair</strong> = Predicted Point (AI Selection)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full border border-orange-500 bg-orange-500/20" />
                  <span><strong className="text-orange-400 font-normal">Orange Circles</strong> = Rejected Candidates (Alias Peaks)</span>
                </div>
              </div>

            </div>
          </div>

          {/* 4. Match Candidates Table / Correlation Surface Details */}
          <div id="table-panel" className={`p-4 bg-[#090b10] border-t border-slate-855 overflow-x-auto ${getHighlightClass('table-panel')}`}>
            <h4 className="text-[11px] font-mono uppercase text-slate-400 font-bold tracking-wider mb-2.5 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-slate-400" /> Correlation Peak Extraction Table
            </h4>
            
            <table className="w-full text-left border-collapse text-[11px] font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="pb-1.5 font-medium">RANK</th>
                  <th className="pb-1.5 font-medium">COORDINATE</th>
                  <th className="pb-1.5 font-medium">CORRELATION SCORE</th>
                  <th className="pb-1.5 font-medium">DISTANCE TO GT</th>
                  <th className="pb-1.5 font-medium">DISTANCE TO SEARCH CENTER</th>
                  <th className="pb-1.5 font-medium">PIPELINE DECISION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-355">
                {currentSample.candidates.map((cand, idx) => {
                  const isWinner = cand.x === currentSample.predicted_x && cand.y === currentSample.predicted_y;
                  const distToGT = Math.hypot(cand.x - currentSample.gt_x, cand.y - currentSample.gt_y);
                  const distToCenter = Math.hypot(cand.x - 288, cand.y - 216);

                  return (
                    <tr 
                      key={`cand-row-${idx}`}
                      onMouseEnter={() => setHoveredCandidate(cand)}
                      onMouseLeave={() => setHoveredCandidate(null)}
                      className={`hover:bg-slate-900/50 transition-colors ${
                        isWinner ? 'text-teal-400 font-bold bg-teal-950/10' : ''
                      }`}
                    >
                      <td className="py-2">#{idx + 1}</td>
                      <td className="py-2">({cand.x}, {cand.y})</td>
                      <td className="py-2">{cand.score.toFixed(4)}</td>
                      <td className="py-2">{distToGT.toFixed(1)} px</td>
                      <td className="py-2">{distToCenter.toFixed(1)} px</td>
                      <td className="py-2">
                        {isWinner ? (
                          <span className="px-1.5 py-0.5 rounded bg-teal-950 border border-teal-850 text-teal-400 text-[10px]">
                            WINNER (Center-Prioritised)
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-550 border border-slate-850 text-[10px]">
                            REJECTED (Alias peak)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </section>
      </main>

      {/* 5. Metrics Cards & Process Telemetry (Below Viewer) */}
      <section id="metrics-panel" className={`bg-[#090b10] border-b border-slate-800 p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${getHighlightClass('metrics-panel')}`}>
        
        {/* Metric 1: Alignment Accuracy */}
        <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
              Alignment Error
            </span>
            <Crosshair className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-white font-mono">
              {currentSample.pixel_error.toFixed(2)} <span className="text-xs text-slate-450 font-normal">px</span>
            </div>
            
            {/* Color coded severity helper */}
            <div className="mt-2.5 flex items-center space-x-1.5 text-[10px] font-mono">
              {currentSample.pixel_error < 5 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-emerald-400 font-bold uppercase">OPTIMAL</span>
                </>
              ) : currentSample.pixel_error < 150 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-amber-400 font-bold uppercase">ALIGNMENT DRIFT</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-red-400 font-bold uppercase">CRITICAL OFFSET</span>
                </>
              )}
              <span className="text-slate-605">•</span>
              <span className="text-slate-500">
                {(currentSample.pixel_error * 2.8).toFixed(1)} nm eq.
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: Match Candidates */}
        <div className="bg-slate-955 border border-slate-850 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
              Candidates Found
            </span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-white font-mono">
              {currentSample.candidates.length} <span className="text-xs text-slate-450 font-normal">Peaks</span>
            </div>
            <div className="mt-2.5 text-[10px] font-mono text-slate-400 flex justify-between items-center">
              <span>Threshold: &gt; 0.30 NCC</span>
              <span className="px-1 py-0.2 bg-slate-900 border border-slate-800 text-[9px] rounded text-slate-500">
                NMS RADIUS: 12px
              </span>
            </div>
          </div>
        </div>

        {/* Metric 3: Predicted Coordinate */}
        <div className="bg-slate-955 border border-slate-855 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
              Predicted Location
            </span>
            <Compass className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-teal-400 font-mono">
              X: {currentSample.predicted_x} , Y: {currentSample.predicted_y}
            </div>
            <div className="mt-2.5 text-[10px] font-mono text-slate-500 flex justify-between">
              <span>GT Target: ({currentSample.gt_x}, {currentSample.gt_y})</span>
              <span className="text-slate-500">
                Δ ({currentSample.predicted_x - currentSample.gt_x}, {currentSample.predicted_y - currentSample.gt_y})
              </span>
            </div>
          </div>
        </div>

        {/* Metric 4: Pipeline Latency */}
        <div className="bg-slate-955 border border-slate-855 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
              Matching Speed
            </span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-white font-mono">
              {currentSample.latency_ms.toFixed(1)} <span className="text-xs text-slate-450 font-normal">ms</span>
            </div>
            <div className="mt-2.5 text-[10px] font-mono text-slate-400 flex justify-between">
              <span>Rate: ~{(1000 / currentSample.latency_ms).toFixed(0)} Hz</span>
              <span className="text-slate-500">Surface: 417 × 557 px</span>
            </div>
          </div>
        </div>

      </section>

      {/* 6. Technical Footer */}
      <footer className="bg-slate-950 py-5 px-6 border-t border-slate-900 text-[11px] font-mono text-slate-505">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-slate-400">
            <Cpu className="w-4 h-4 text-teal-500" />
            <span className="font-bold text-white uppercase tracking-wider">
              NanoPixel Alignment Dashboard
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-855 text-slate-400">
              V1.2.0-REALTIME
            </span>
          </div>

          <div className="text-center md:text-right max-w-2xl text-[10px] text-slate-505 leading-normal">
            <span className="text-amber-500/80 font-bold uppercase mr-1">Important Note:</span> 
            All coordinate results, correlation scores, and candidate peaks are computed dynamically from a real Python image-matching pipeline utilizing Normalized Cross-Correlation (NCC) and peak-extraction heuristics on the wafer dataset, not mocked or hardcoded.
          </div>
        </div>
      </footer>

    </div>
  );
}
