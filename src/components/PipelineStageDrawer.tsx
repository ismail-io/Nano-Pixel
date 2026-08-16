import React from 'react';
import { PipelineStageInfo, WaferSample } from '../types';
import { 
  X, 
  Cpu, 
  ArrowRight
} from 'lucide-react';

interface PipelineStageDrawerProps {
  stages: PipelineStageInfo[];
  activeStageIndex: number;
  onClose: () => void;
  sample: WaferSample;
}

export const PipelineStageDrawer: React.FC<PipelineStageDrawerProps> = ({
  stages,
  activeStageIndex,
  onClose,
  sample,
}) => {
  const currentStage = stages[activeStageIndex];
  if (!currentStage) return null;

  return (
    <div id="pipeline-stage-drawer" className="bg-zinc-950 border-t border-zinc-800 p-4 relative animate-in fade-in slide-in-from-bottom duration-200">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-zinc-900 text-white border border-zinc-700">
              STAGE 0{currentStage.stepNumber} INSPECTOR
            </span>
            <h3 className="text-sm font-bold text-white font-mono">
              {currentStage.title}
            </h3>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono text-zinc-400">
              Compute Time: <strong className="text-white">{currentStage.durationMs.toFixed(1)} ms</strong>
            </span>
            <button
              id="btn-close-stage-drawer"
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body based on Stage */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs font-mono">
          {/* Left: Mathematical Formulation & Explanation */}
          <div className="md:col-span-5 bg-black p-3.5 rounded-lg border border-zinc-800 space-y-3">
            <div className="text-zinc-200 font-semibold text-xs flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-white" />
              <span>Algorithm Specification</span>
            </div>

            <p className="text-zinc-400 text-xs font-sans leading-relaxed">
              {currentStage.description}
            </p>

            <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase block mb-1">
                Mathematical Operator:
              </span>
              <code className="text-zinc-200 text-xs font-mono block overflow-x-auto py-1">
                {currentStage.mathFormula}
              </code>
            </div>

            <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800 text-zinc-300">
              <span className="text-[10px] text-zinc-500 uppercase block mb-0.5">
                Output Telemetry:
              </span>
              <p className="text-zinc-300 text-xs">
                {currentStage.outputSummary}
              </p>
            </div>
          </div>

          {/* Right: Stage-Specific Interactive Visual Diagnostics */}
          <div className="md:col-span-7 bg-black p-3.5 rounded-lg border border-zinc-800 flex flex-col justify-center">
            {/* Stage 1: Scale Normalize View */}
            {currentStage.id === 'scale_norm' && (
              <div className="space-y-3">
                <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                  <span>10x Upscaling & Bilinear Alignment Matrix</span>
                </span>
                <div className="flex items-center justify-around gap-3 p-3 bg-zinc-950 rounded border border-zinc-800">
                  <div className="text-center space-y-1">
                    <div className="w-16 h-16 mx-auto bg-black rounded border border-zinc-700 flex items-center justify-center overflow-hidden">
                      <img src={sample.referenceImage} alt="Ref" className="w-full h-full object-contain pixelated grayscale" />
                    </div>
                    <span className="text-[10px] text-zinc-400">10x Shrunk CAD ({sample.refWidth}x{sample.refHeight})</span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-zinc-600 shrink-0" />

                  <div className="text-center space-y-1">
                    <div className="w-24 h-24 mx-auto bg-black rounded border-2 border-white flex items-center justify-center overflow-hidden">
                      <img src={sample.referenceImage} alt="Ref Upscaled" className="w-full h-full object-cover grayscale" />
                    </div>
                    <span className="text-[10px] text-white font-bold">10x Super-Res Template ({sample.refWidth * 10}x{sample.refHeight * 10})</span>
                  </div>
                </div>
              </div>
            )}

            {/* Stage 2: FFT Correlation Surface */}
            {currentStage.id === 'fft_corr' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-zinc-300">
                  <span>2D Frequency Domain Correlation Peak Profile</span>
                  <span className="text-white font-bold">PSR: {sample.metrics.psr} dB</span>
                </div>
                <div className="h-28 bg-zinc-950 rounded border border-zinc-800 relative flex items-end justify-around px-4 pb-2">
                  <div className="absolute inset-0 wafer-grid opacity-30" />
                  {/* Stylized correlation peak spectrum */}
                  {[0.12, 0.22, 0.38, 0.65, 0.95, 0.42, 0.28, 0.18, 0.88, 0.24, 0.15].map((val, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 z-10">
                      <div
                        className={`w-4 rounded-t ${
                          val > 0.9
                            ? 'bg-white shadow-md shadow-white/50'
                            : val > 0.7
                            ? 'bg-amber-400'
                            : 'bg-zinc-700'
                        }`}
                        style={{ height: `${val * 85}px` }}
                      />
                      <span className="text-[9px] text-zinc-500 font-mono">f{i}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-zinc-400 flex justify-between">
                  <span>Side-lobe noise baseline: 0.18</span>
                  <span className="text-white font-bold">Dominant Peak: {sample.metrics.correlationPeak}</span>
                </div>
              </div>
            )}

            {/* Stage 3: Multi-Peak Extraction (NMS) */}
            {currentStage.id === 'multi_peak' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-zinc-300">
                  <span>Top-K Periodic Candidate Peaks Isolated (r=14px)</span>
                  <span className="text-amber-400">{sample.candidates.length} Detected</span>
                </div>
                <div className="max-h-28 overflow-y-auto space-y-1 bg-zinc-950 p-2 rounded border border-zinc-800">
                  {sample.candidates.slice(0, 4).map((c) => (
                    <div key={c.id} className="flex justify-between items-center text-[11px] p-1 bg-zinc-900 rounded">
                      <span className={c.isWinner ? 'text-white font-bold' : 'text-amber-400'}>
                        {c.id.toUpperCase()} ({c.x}, {c.y})
                      </span>
                      <span className="text-zinc-400">Raw: {c.rawScore.toFixed(3)}</span>
                      <span className={c.isWinner ? 'text-white' : 'text-zinc-500'}>
                        {c.isWinner ? 'PRIMARY WINNER' : 'PERIODIC ALIAS'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stage 4: Prior-Weighted Selection */}
            {currentStage.id === 'prior_weight' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-zinc-300">
                  <span>Gaussian Navigation Drift Prior Weighting (σ = ±{sample.driftPriorSigma}px)</span>
                  <span className="text-white font-bold">P(Winner) = {sample.metrics.priorConfidence}</span>
                </div>
                <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 space-y-1.5">
                  <div className="flex justify-between text-zinc-400 text-[11px]">
                    <span>Stage Nominal Center:</span>
                    <span className="text-zinc-200 font-mono">({sample.searchWidth / 2}, {sample.searchHeight / 2})</span>
                  </div>
                  <div className="flex justify-between text-zinc-400 text-[11px]">
                    <span>True Drift Vector (Δ):</span>
                    <span className="text-rose-400 font-mono">({sample.metrics.driftVector.dx}px, {sample.metrics.driftVector.dy}px)</span>
                  </div>
                  <div className="flex justify-between text-zinc-400 text-[11px]">
                    <span>Outliers Suppressed:</span>
                    <span className="text-amber-400 font-mono">{sample.candidates.length - 1} Candidates</span>
                  </div>
                </div>
              </div>
            )}

            {/* Stage 5: Sub-Pixel Refinement */}
            {currentStage.id === 'subpixel_refine' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-zinc-300">
                  <span>2D 2nd-Order Taylor Parabolic Interpolation</span>
                  <span className="text-white font-bold">Δ = {sample.metrics.pixelError.toFixed(2)} px ({sample.metrics.subPixelAccuracy_nm.toFixed(1)} nm)</span>
                </div>
                <div className="grid grid-cols-3 gap-2 bg-zinc-950 p-2.5 rounded border border-zinc-800 text-center">
                  <div className="p-1.5 bg-zinc-900 rounded border border-zinc-800 text-zinc-400">
                    <span className="text-[10px] block text-zinc-500">Integer Peak</span>
                    <span className="text-zinc-200">({Math.round(sample.predicted.x)}, {Math.round(sample.predicted.y)})</span>
                  </div>
                  <div className="p-1.5 bg-white text-black font-bold rounded border border-white">
                    <span className="text-[10px] block text-zinc-800 font-semibold">Parabolic Sub-Px</span>
                    <span>({sample.predicted.x.toFixed(2)}, {sample.predicted.y.toFixed(2)})</span>
                  </div>
                  <div className="p-1.5 bg-zinc-900 rounded border border-zinc-800 text-zinc-200 font-semibold">
                    <span className="text-[10px] block text-zinc-500">Physical Error</span>
                    <span>{sample.metrics.subPixelAccuracy_nm.toFixed(1)} nm</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
