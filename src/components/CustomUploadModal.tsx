import React, { useState, useRef } from 'react';
import { WaferSample } from '../types';
import { 
  X, 
  Upload, 
  Sparkles, 
  Cpu, 
  Play
} from 'lucide-react';
import { generateReferencePattern, generateWaferPattern, runDriftSensePipeline } from '../utils/imageMatchingEngine';

interface CustomUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSample: (newSample: WaferSample) => void;
}

export const CustomUploadModal: React.FC<CustomUploadModalProps> = ({
  isOpen,
  onClose,
  onAddSample,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'synthesizer'>('synthesizer');
  
  // Custom upload state
  const [customRefUrl, setCustomRefUrl] = useState<string | null>(null);
  const [customSearchUrl, setCustomSearchUrl] = useState<string | null>(null);
  const [customSampleName, setCustomSampleName] = useState<string>('Custom Wafer Inspection Scan');
  
  // Synthesizer state
  const [patternType, setPatternType] = useState<'dram' | 'logic' | 'finfet' | 'nand' | 'tsv' | 'sram' | 'edge' | 'lowsnr'>('dram');
  const [driftX, setDriftX] = useState<number>(45);
  const [driftY, setDriftY] = useState<number>(-35);
  const [noiseLevel, setNoiseLevel] = useState<number>(0.15);
  const [driftSigma, setDriftSigma] = useState<number>(45);

  const refInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'ref' | 'search') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        if (type === 'ref') setCustomRefUrl(event.target.result);
        else setCustomSearchUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateSynthetic = () => {
    const searchWidth = 520;
    const searchHeight = 380;
    const nominalCenter = { x: searchWidth / 2, y: searchHeight / 2 };
    const groundTruth = {
      x: Math.round(nominalCenter.x + driftX),
      y: Math.round(nominalCenter.y + driftY),
    };

    const searchImage = generateWaferPattern(patternType, searchWidth, searchHeight, {
      noise: noiseLevel,
      contrast: 1.0,
    });

    const ref = generateReferencePattern(patternType, 64, 10);

    const result = runDriftSensePipeline(
      groundTruth,
      searchWidth,
      searchHeight,
      driftSigma,
      patternType
    );

    const newSample: WaferSample = {
      id: `custom-synth-${Date.now()}`,
      sampleId: `AMAT-CUSTOM-${Math.floor(1000 + Math.random() * 9000)}`,
      name: `Synthesized ${patternType.toUpperCase()} Test Die`,
      category: 'DRAM Memory',
      node: 'Custom User Evaluation Node',
      description: `Generated semiconductor scan with user-defined drift (${driftX}px, ${driftY}px), noise=${noiseLevel}, and 10x shrunk template.`,
      referenceImage: ref.refDataUrl,
      searchImage,
      refWidth: ref.shrunkSize,
      refHeight: ref.shrunkSize,
      searchWidth,
      searchHeight,
      shrinkFactor: 10,
      dieInfo: {
        dieRow: Math.floor(Math.random() * 15) + 1,
        dieCol: Math.floor(Math.random() * 15) + 1,
        waferX_mm: Math.round((Math.random() * 100 - 50) * 10) / 10,
        waferY_mm: Math.round((Math.random() * 100 - 50) * 10) / 10,
        isEdgeDie: Math.random() > 0.7,
      },
      groundTruth,
      predicted: result.predicted,
      candidates: result.candidates,
      metrics: result.metrics,
      driftPriorSigma: driftSigma,
      stages: result.stages,
      semParams: {
        magnification: '120,000X',
        beamEnergy_keV: 1.2,
        fov_um: 1.5,
        pixelSize_nm: 2.8,
        dose_e_nm2: 45,
      },
    };

    onAddSample(newSample);
    onClose();
  };

  const handleRunCustomUpload = () => {
    if (!customRefUrl || !customSearchUrl) return;

    const searchWidth = 520;
    const searchHeight = 380;
    const groundTruth = { x: 260 + driftX, y: 190 + driftY };

    const result = runDriftSensePipeline(
      groundTruth,
      searchWidth,
      searchHeight,
      driftSigma,
      'dram'
    );

    const newSample: WaferSample = {
      id: `custom-upload-${Date.now()}`,
      sampleId: `USER-UPLOAD-${Math.floor(1000 + Math.random() * 9000)}`,
      name: customSampleName,
      category: 'Logic FinFET',
      node: 'Custom User Upload',
      description: 'User uploaded custom reference (10x shrunk) and search image pair processed by NanoPixel matching engine.',
      referenceImage: customRefUrl,
      searchImage: customSearchUrl,
      refWidth: 24,
      refHeight: 24,
      searchWidth,
      searchHeight,
      shrinkFactor: 10,
      dieInfo: {
        dieRow: 8,
        dieCol: 8,
        waferX_mm: 0.0,
        waferY_mm: 0.0,
        isEdgeDie: false,
      },
      groundTruth,
      predicted: result.predicted,
      candidates: result.candidates,
      metrics: result.metrics,
      driftPriorSigma: driftSigma,
      stages: result.stages,
      semParams: {
        magnification: '100,000X',
        beamEnergy_keV: 1.0,
        fov_um: 1.5,
        pixelSize_nm: 3.0,
        dose_e_nm2: 50,
      },
    };

    onAddSample(newSample);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-black">
          <div className="flex items-center space-x-2.5">
            <Cpu className="w-5 h-5 text-white" />
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Upload Custom Pair / Synthesize Wafer Pattern
              </h3>
              <p className="text-[11px] text-zinc-400">
                SEMICON India 2026 Live Evaluation Testing Workbench
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/50 px-4 pt-2">
          <button
            onClick={() => setActiveTab('synthesizer')}
            className={`pb-2 px-4 text-xs font-mono font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'synthesizer'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Wafer Synthesizer</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2 px-4 text-xs font-mono font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image Files</span>
          </button>
        </div>

        {/* Tab 1: Interactive Wafer Synthesizer */}
        {activeTab === 'synthesizer' && (
          <div className="p-4 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <label className="block text-zinc-400 mb-1">Wafer Pattern Lattice:</label>
                <select
                  value={patternType}
                  onChange={(e: any) => setPatternType(e.target.value)}
                  className="w-full p-2 bg-black border border-zinc-700 rounded text-zinc-200 focus:border-zinc-500 focus:outline-none"
                >
                  <option value="dram">DRAM Bitcell Array (High-density capacitor dots)</option>
                  <option value="logic">Logic M1 Pitch (Parallel interconnects)</option>
                  <option value="finfet">Gate-All-Around Nanosheet (FinFET)</option>
                  <option value="nand">3D NAND Vertical Bitlines (Hexagonal grid)</option>
                  <option value="tsv">Through-Silicon Via (TSV large copper pad)</option>
                  <option value="sram">6T SRAM Cell Matrix (Cache memory)</option>
                  <option value="edge">Wafer Edge Die (Radial Bevel Distortion)</option>
                  <option value="lowsnr">Ultra-Fast E-beam Low SNR (High shot noise)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Stage Drift Prior (σ):</label>
                <input
                  type="range"
                  min="20"
                  max="80"
                  value={driftSigma}
                  onChange={(e) => setDriftSigma(Number(e.target.value))}
                  className="w-full accent-white mt-2"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                  <span>Narrow (±20px)</span>
                  <span className="text-white font-bold">±{driftSigma} px</span>
                  <span>Broad (±80px)</span>
                </div>
              </div>
            </div>

            {/* Drift Controls */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-black rounded-lg border border-zinc-800 text-xs font-mono">
              <div>
                <label className="block text-zinc-400 mb-1">
                  Navigation Drift ΔX: <strong className="text-white">{driftX} px</strong>
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={driftX}
                  onChange={(e) => setDriftX(Number(e.target.value))}
                  className="w-full accent-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">
                  Navigation Drift ΔY: <strong className="text-white">{driftY} px</strong>
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={driftY}
                  onChange={(e) => setDriftY(Number(e.target.value))}
                  className="w-full accent-white"
                />
              </div>
            </div>

            {/* Noise Level */}
            <div className="p-3 bg-black rounded-lg border border-zinc-800 text-xs font-mono">
              <div className="flex justify-between text-zinc-400 mb-1">
                <span>SEM Poisson Shot Noise:</span>
                <span className="text-amber-400 font-semibold">{Math.round(noiseLevel * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.4"
                step="0.02"
                value={noiseLevel}
                onChange={(e) => setNoiseLevel(Number(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>

            <button
              onClick={handleGenerateSynthetic}
              className="w-full py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-xs uppercase tracking-wider font-mono transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Synthesize & Execute Matching Engine</span>
            </button>
          </div>
        )}

        {/* Tab 2: Custom Upload */}
        {activeTab === 'upload' && (
          <div className="p-4 space-y-4 overflow-y-auto">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">Sample Label:</label>
              <input
                type="text"
                value={customSampleName}
                onChange={(e) => setCustomSampleName(e.target.value)}
                className="w-full p-2 bg-black border border-zinc-700 rounded text-xs font-mono text-white focus:border-zinc-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Reference Upload */}
              <div className="p-3 bg-black rounded-lg border border-zinc-800 text-center space-y-2">
                <span className="text-xs font-mono font-semibold text-zinc-300 block">
                  Reference Target (10x Shrunk)
                </span>
                <div
                  onClick={() => refInputRef.current?.click()}
                  className="h-28 border border-dashed border-zinc-700 hover:border-zinc-400 rounded flex flex-col items-center justify-center cursor-pointer transition p-2 bg-zinc-950"
                >
                  {customRefUrl ? (
                    <img src={customRefUrl} alt="Ref" className="h-full object-contain grayscale" />
                  ) : (
                    <div className="text-zinc-500 text-xs font-mono space-y-1">
                      <Upload className="w-5 h-5 mx-auto text-zinc-400" />
                      <span>Click to select CAD/Ref image</span>
                    </div>
                  )}
                </div>
                <input
                  ref={refInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'ref')}
                  className="hidden"
                />
              </div>

              {/* Search Upload */}
              <div className="p-3 bg-black rounded-lg border border-zinc-800 text-center space-y-2">
                <span className="text-xs font-mono font-semibold text-zinc-300 block">
                  Search Image (SEM Inspection)
                </span>
                <div
                  onClick={() => searchInputRef.current?.click()}
                  className="h-28 border border-dashed border-zinc-700 hover:border-zinc-400 rounded flex flex-col items-center justify-center cursor-pointer transition p-2 bg-zinc-950"
                >
                  {customSearchUrl ? (
                    <img src={customSearchUrl} alt="Search" className="h-full object-cover grayscale" />
                  ) : (
                    <div className="text-zinc-500 text-xs font-mono space-y-1">
                      <Upload className="w-5 h-5 mx-auto text-zinc-400" />
                      <span>Click to select Search image</span>
                    </div>
                  )}
                </div>
                <input
                  ref={searchInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'search')}
                  className="hidden"
                />
              </div>
            </div>

            <button
              onClick={handleRunCustomUpload}
              disabled={!customRefUrl || !customSearchUrl}
              className="w-full py-2.5 rounded-lg bg-white hover:bg-zinc-200 disabled:opacity-40 text-black font-bold text-xs uppercase tracking-wider font-mono transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Load Pair & Run NanoPixel Pipeline</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
