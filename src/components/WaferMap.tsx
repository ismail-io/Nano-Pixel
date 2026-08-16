import React from 'react';
import { WaferSample } from '../types';
import { Layers } from 'lucide-react';

interface WaferMapProps {
  samples: WaferSample[];
  currentSample: WaferSample;
  onSelectSample: (sample: WaferSample) => void;
}

export const WaferMap: React.FC<WaferMapProps> = ({
  samples,
  currentSample,
  onSelectSample,
}) => {
  // Generate a standard 300mm wafer die grid
  const gridSize = 17;
  const radius = gridSize / 2;
  const dies: Array<{ row: number; col: number; inWafer: boolean; sampleMatch?: WaferSample }> = [];

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const dist = Math.hypot(r - radius + 0.5, c - radius + 0.5);
      const inWafer = dist <= radius - 0.4;
      
      // Match sample if dieRow / dieCol match
      const sampleMatch = samples.find(
        (s) => s.dieInfo.dieRow === r && s.dieInfo.dieCol === c
      );

      dies.push({ row: r, col: c, inWafer, sampleMatch });
    }
  }

  return (
    <div id="wafer-map-card" className="bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-white" />
          <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
            300mm Silicon Wafer Stage Map
          </h4>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
          SEMI M1-0302 Std
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Wafer SVG Graphic */}
        <div className="relative w-44 h-44 rounded-full bg-black border-2 border-zinc-700 shadow-inner flex items-center justify-center p-2">
          {/* Wafer Notch at 6 o'clock */}
          <div className="absolute bottom-0 w-3 h-1.5 bg-zinc-800 border-t border-zinc-600 rounded-t-sm" />

          {/* Wafer Center Crosshair */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
            <div className="w-full h-px bg-white" />
            <div className="h-full w-px bg-white absolute" />
          </div>

          {/* Die Grid */}
          <div
            className="grid gap-[2px]"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
              width: '136px',
              height: '136px',
            }}
          >
            {dies.map((die, idx) => {
              if (!die.inWafer) {
                return <div key={idx} className="opacity-0" />;
              }

              const isCurrent =
                currentSample.dieInfo.dieRow === die.row &&
                currentSample.dieInfo.dieCol === die.col;

              const hasSample = !!die.sampleMatch;

              return (
                <button
                  key={idx}
                  onClick={() => die.sampleMatch && onSelectSample(die.sampleMatch)}
                  disabled={!hasSample}
                  title={`Die [${die.row}, ${die.col}] ${die.sampleMatch ? `- ${die.sampleMatch.sampleId}` : ''}`}
                  className={`w-full h-full rounded-[1px] transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-white ring-2 ring-white scale-125 z-10 shadow-md shadow-white/50'
                      : hasSample
                      ? 'bg-zinc-400 hover:bg-white hover:scale-110'
                      : 'bg-zinc-900 hover:bg-zinc-800 cursor-default'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Selected Die Telemetry */}
        <div className="flex-1 space-y-2 text-xs font-mono w-full">
          <div className="flex justify-between items-center bg-black p-2 rounded border border-zinc-800">
            <span className="text-zinc-400">Inspected Die:</span>
            <span className="text-white font-bold">
              [{currentSample.dieInfo.dieRow}, {currentSample.dieInfo.dieCol}]
            </span>
          </div>

          <div className="flex justify-between items-center bg-black p-2 rounded border border-zinc-800">
            <span className="text-zinc-400">Stage (X, Y):</span>
            <span className="text-zinc-200">
              {currentSample.dieInfo.waferX_mm.toFixed(2)} mm, {currentSample.dieInfo.waferY_mm.toFixed(2)} mm
            </span>
          </div>

          <div className="flex justify-between items-center bg-black p-2 rounded border border-zinc-800">
            <span className="text-zinc-400">Die Classification:</span>
            <span
              className={`font-semibold ${
                currentSample.dieInfo.isEdgeDie
                  ? 'text-amber-400'
                  : 'text-zinc-200'
              }`}
            >
              {currentSample.dieInfo.isEdgeDie ? 'Edge Bevel Die' : 'Center Product Die'}
            </span>
          </div>

          <div className="flex justify-between items-center bg-black p-2 rounded border border-zinc-800">
            <span className="text-zinc-400">Drift Vector:</span>
            <span className="text-rose-400 font-semibold">
              Δx: {currentSample.metrics.driftVector.dx}px, Δy: {currentSample.metrics.driftVector.dy}px
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
