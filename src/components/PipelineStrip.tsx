import React from 'react';
import { PipelineStageInfo } from '../types';
import { ChevronRight, CheckCircle2 } from 'lucide-react';

interface PipelineStripProps {
  stages: PipelineStageInfo[];
  activeStageIndex: number | null;
  onSelectStage: (index: number) => void;
  isRunning: boolean;
  currentStep: number;
}

export const PipelineStrip: React.FC<PipelineStripProps> = ({
  stages,
  activeStageIndex,
  onSelectStage,
  isRunning,
  currentStep,
}) => {
  return (
    <div id="pipeline-strip-container" className="bg-zinc-950 border-b border-zinc-800 px-4 py-3.5">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <h2 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
              <span>5-Stage AI Navigation Recovery Pipeline</span>
              <span className="text-zinc-500 font-normal text-[11px]">(Click stage to inspect intermediate maps)</span>
            </h2>
          </div>

          <div className="flex items-center space-x-3 text-[11px] font-mono text-zinc-400">
            <span className="text-zinc-400">Total Latency: <strong className="text-white font-semibold">{stages.reduce((acc, s) => acc + s.durationMs, 0).toFixed(1)} ms</strong></span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-200 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-white" />
              <span>Sub-Pixel Precision Active</span>
            </span>
          </div>
        </div>

        {/* 5 Stages Grid / Chain */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
          {stages.map((stage, idx) => {
            const isCurrentActive = isRunning && currentStep === idx + 1;
            const isCompleted = !isRunning || currentStep > idx + 1;
            const isSelected = activeStageIndex === idx;

            return (
              <button
                key={stage.id}
                id={`stage-card-${stage.id}`}
                onClick={() => onSelectStage(idx)}
                className={`relative group text-left p-3 rounded-lg border transition-all cursor-pointer overflow-hidden ${
                  isSelected
                    ? 'bg-zinc-900 border-white shadow-lg ring-1 ring-white/50'
                    : isCurrentActive
                    ? 'bg-zinc-900 border-zinc-400 shadow-md'
                    : 'bg-black hover:bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Active scanline effect if running */}
                {isCurrentActive && (
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent animate-scanline pointer-events-none" />
                )}

                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-900 text-white border border-zinc-700">
                    STAGE 0{stage.stepNumber}
                  </span>

                  <span className="text-[10px] font-mono text-zinc-400">
                    {stage.durationMs.toFixed(1)} ms
                  </span>
                </div>

                <div className="text-xs font-semibold text-zinc-200 tracking-tight flex items-center justify-between group-hover:text-white">
                  <span className="truncate">{stage.shortTitle}</span>
                  <ChevronRight className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${isSelected ? 'rotate-90 text-white' : 'group-hover:translate-x-0.5'}`} />
                </div>

                <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">
                  {stage.outputSummary}
                </p>

                {/* Bottom status accent */}
                <div
                  className={`h-0.5 mt-2.5 rounded-full transition-all ${
                    isSelected
                      ? 'bg-white w-full'
                      : isCurrentActive
                      ? 'bg-zinc-300 w-full animate-pulse'
                      : 'bg-zinc-800 w-3/4 group-hover:bg-zinc-700'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
