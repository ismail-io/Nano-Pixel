import React from 'react';
import { Cpu, Activity, RefreshCw, Eye, Sliders, Contrast, SunMedium, Sparkles } from 'lucide-react';
import { SemDisplayMode, SemDisplaySettings } from '../types';

interface HeaderProps {
  isRunningLive: boolean;
  onRerun: () => void;
  selectedCategory: string;
  totalSamples: number;
  displaySettings: SemDisplaySettings;
  onDisplayModeChange: (mode: SemDisplayMode) => void;
  onToggleScanlines: () => void;
  onToggleInverted: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isRunningLive,
  onRerun,
  selectedCategory,
  totalSamples,
  displaySettings,
  onDisplayModeChange,
  onToggleScanlines,
  onToggleInverted,
}) => {
  return (
    <header id="header-root" className="border-b border-zinc-800 bg-black/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Monochromatic Logo & Cleanroom Identity */}
          <div className="flex items-center space-x-3.5">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-700 text-white sem-monochrome-glow">
              <Cpu className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full animate-ping opacity-75" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full border border-black" />
            </div>

            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  <span>NanoPixel</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 font-semibold tracking-wider">
                    B&W SEM Engine
                  </span>
                </h1>
              </div>
              <p className="text-xs text-zinc-400 font-normal">
                Sub-Pixel Wafer Navigation Error Recovery • <span className="text-zinc-200 font-medium">Applied Materials Track</span>
              </p>
            </div>
          </div>

          {/* B&W SEM Mode Selector in Header */}
          <div className="hidden lg:flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 bg-zinc-900/90 border border-zinc-800 rounded-lg p-1">
              <span className="text-[10px] font-mono text-zinc-400 px-2 uppercase tracking-wider flex items-center gap-1">
                <Contrast className="w-3 h-3 text-zinc-300" /> Mode:
              </span>
              <button
                id="mode-std-bw"
                onClick={() => onDisplayModeChange('standard_bw')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition cursor-pointer ${
                  displaySettings.mode === 'standard_bw'
                    ? 'bg-white text-black font-bold shadow'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
                title="Pure High-Contrast Black & White SEM Micrograph"
              >
                Standard B&W
              </button>
              <button
                id="mode-inverted-bw"
                onClick={() => onDisplayModeChange('inverted_bw')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition cursor-pointer ${
                  displaySettings.mode === 'inverted_bw'
                    ? 'bg-white text-black font-bold shadow'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
                title="Inverted Negative Electron Beam Contrast"
              >
                Negative / Invert
              </button>
              <button
                id="mode-highpass-bw"
                onClick={() => onDisplayModeChange('high_pass_bw')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition cursor-pointer ${
                  displaySettings.mode === 'high_pass_bw'
                    ? 'bg-white text-black font-bold shadow'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
                title="High-Pass Sharpened B&W SEM Edge View"
              >
                High-Pass Edge
              </button>
              <button
                id="mode-phosphor-bw"
                onClick={() => onDisplayModeChange('phosphor_bw')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition cursor-pointer ${
                  displaySettings.mode === 'phosphor_bw'
                    ? 'bg-white text-black font-bold shadow'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
                title="Monochrome Phosphor Beam Scan"
              >
                Phosphor CRT
              </button>
            </div>

            {/* Quick CRT Scanline Toggle */}
            <button
              id="btn-quick-scanlines"
              onClick={onToggleScanlines}
              className={`p-2 rounded-lg border text-xs transition cursor-pointer ${
                displaySettings.scanlines
                  ? 'bg-zinc-800 border-zinc-600 text-white'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
              title="Toggle Electron Beam Scanline Effect"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action Tools */}
          <div className="flex items-center space-x-3">
            <button
              id="btn-rerun-pipeline"
              onClick={onRerun}
              disabled={isRunningLive}
              className="flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 border border-zinc-300 text-xs font-bold tracking-wide transition-all shadow active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Re-execute the 5-Stage Matching Engine on current sample"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunningLive ? 'animate-spin text-black' : ''}`} />
              <span>{isRunningLive ? 'Processing...' : 'Run Pipeline'}</span>
            </button>

            <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800">
              <Activity className="w-3.5 h-3.5 text-white" />
              <span className="text-[11px] font-mono text-zinc-200 font-semibold tracking-wider">SEM LIVE</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
