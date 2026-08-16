import React from 'react';
import { InspectionMetrics, WaferSample } from '../types';
import { 
  Target, 
  AlertCircle, 
  Crosshair, 
  Activity, 
  Gauge, 
  Layers
} from 'lucide-react';

interface MetricsPanelProps {
  metrics: InspectionMetrics;
  sample: WaferSample;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics, sample }) => {
  const isSubPixel = metrics.pixelError < 0.5;
  const isHighPSR = metrics.psr >= 6.0;

  return (
    <div id="metrics-stat-panel" className="bg-zinc-950 border-t border-zinc-800 p-4">
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-white" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
              Inspection Recovery Metrics & Telemetry
            </h3>
          </div>

          <div className="flex items-center space-x-2 text-[11px] font-mono">
            <span className="text-zinc-400">Wafer Die:</span>
            <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-white border border-zinc-700">
              [{sample.dieInfo.dieRow}, {sample.dieInfo.dieCol}] ({sample.dieInfo.waferX_mm.toFixed(1)}mm, {sample.dieInfo.waferY_mm.toFixed(1)}mm)
            </span>
          </div>
        </div>

        {/* 3 Core Primary Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* STAT CARD 1: Pixel Error */}
          <div className="p-3.5 rounded-lg bg-black border border-zinc-800 relative overflow-hidden group hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-zinc-300" />
                <span>Pixel Error (Localization)</span>
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  isSubPixel
                    ? 'bg-zinc-800 text-white border-zinc-600'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-700'
                }`}
              >
                {isSubPixel ? 'SUB-PIXEL OPTIMAL' : 'ACCEPTABLE'}
              </span>
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-white tracking-tight">
                {metrics.pixelError.toFixed(2)}
              </span>
              <span className="text-xs font-mono text-zinc-400">px</span>
              <span className="text-xs font-mono text-zinc-300 font-semibold ml-auto">
                ≈ {metrics.subPixelAccuracy_nm.toFixed(1)} nm
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mt-2 pt-2 border-t border-zinc-800">
              <span>Ground Truth:</span>
              <span className="text-zinc-200 font-medium">
                ({metrics.groundTruthX}, {metrics.groundTruthY})
              </span>
            </div>
          </div>

          {/* STAT CARD 2: Number of Ambiguous Candidates Found */}
          <div className="p-3.5 rounded-lg bg-black border border-zinc-800 relative overflow-hidden group hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Ambiguous Candidates Found</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-900 text-amber-300 border border-zinc-700">
                PERIODIC REJECTION
              </span>
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-amber-400 tracking-tight">
                {metrics.ambiguousCandidatesCount}
              </span>
              <span className="text-xs font-mono text-zinc-400">look-alikes</span>
              <span className="text-xs font-mono text-zinc-500 ml-auto">
                Filtered via Gaussian Prior
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mt-2 pt-2 border-t border-zinc-800">
              <span>Peak-to-Sidelobe (PSR):</span>
              <span className={`font-semibold ${isHighPSR ? 'text-white' : 'text-amber-400'}`}>
                {metrics.psr.toFixed(2)} dB
              </span>
            </div>
          </div>

          {/* STAT CARD 3: Predicted Coordinates */}
          <div className="p-3.5 rounded-lg bg-black border border-zinc-800 relative overflow-hidden group hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-white" />
                <span>Predicted (X, Y) Coordinates</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white text-black border border-white">
                STAGE 5 REFINED
              </span>
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold font-mono text-white tracking-tight">
                X: {metrics.predictedX.toFixed(2)}, Y: {metrics.predictedY.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mt-2 pt-2 border-t border-zinc-800">
              <span>Sub-Pixel Offset:</span>
              <span className="text-zinc-200">
                (δx: {metrics.subPixelDx.toFixed(3)}, δy: {metrics.subPixelDy.toFixed(3)})
              </span>
            </div>
          </div>
        </div>

        {/* Secondary Detailed Engineering Diagnostics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="px-3 py-2 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">Drift Offset (Norm):</span>
            <span className="text-zinc-200 font-semibold">{metrics.driftMagnitude_px.toFixed(1)} px (±{Math.round(metrics.driftMagnitude_px * sample.semParams.pixelSize_nm)} nm)</span>
          </div>

          <div className="px-3 py-2 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">Cross-Corr Peak:</span>
            <span className="text-white font-semibold">{metrics.correlationPeak.toFixed(3)}</span>
          </div>

          <div className="px-3 py-2 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">Prior Confidence:</span>
            <span className="text-zinc-200 font-semibold">{metrics.priorConfidence.toFixed(3)}</span>
          </div>

          <div className="px-3 py-2 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">Inference Latency:</span>
            <span className="text-white font-semibold">{metrics.latency_ms.toFixed(1)} ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};
