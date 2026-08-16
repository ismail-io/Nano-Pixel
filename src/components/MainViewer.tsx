import React, { useState, useRef, useEffect } from 'react';
import { WaferSample, CandidateMatch, SemDisplaySettings, SemDisplayMode } from '../types';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Sliders, 
  Sparkles, 
  Info,
  Compass,
  Contrast,
  SunMedium,
  Eye,
  Layers,
  Activity
} from 'lucide-react';

interface MainViewerProps {
  sample: WaferSample;
  isRunningPipeline: boolean;
  displaySettings: SemDisplaySettings;
  onUpdateDisplaySettings: React.Dispatch<React.SetStateAction<SemDisplaySettings>>;
}

export const MainViewer: React.FC<MainViewerProps> = ({ 
  sample, 
  isRunningPipeline,
  displaySettings,
  onUpdateDisplaySettings 
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [showRejectedCandidates, setShowRejectedCandidates] = useState<boolean>(true);
  const [showGroundTruth, setShowGroundTruth] = useState<boolean>(true);
  const [showPrediction, setShowPrediction] = useState<boolean>(true);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [showDriftPriorEllipse, setShowDriftPriorEllipse] = useState<boolean>(false);
  const [showErrorVector, setShowErrorVector] = useState<boolean>(true);
  const [hoveredCandidate, setHoveredCandidate] = useState<CandidateMatch | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [refZoom, setRefZoom] = useState<number>(6); // High zoom for 10x small template
  const [showShaderControl, setShowShaderControl] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Handle mouse move for stage coordinate HUD
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / zoomLevel);
    const y = Math.round((e.clientY - rect.top) / zoomLevel);
    if (x >= 0 && x <= sample.searchWidth && y >= 0 && y <= sample.searchHeight) {
      setMousePos({ x, y });
    }
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  // Reset zoom on sample change
  useEffect(() => {
    setZoomLevel(1.0);
    setHoveredCandidate(null);
  }, [sample.id]);

  const targetBoxWidth = sample.refWidth * sample.shrinkFactor; // Scaled to search domain
  const targetBoxHeight = sample.refHeight * sample.shrinkFactor;

  // Compute CSS filter string based on black and white display settings
  const getImageFilterStyle = () => {
    const baseGrayscale = 'grayscale(100%)';
    const contrastVal = `contrast(${Math.round(displaySettings.contrast * 100)}%)`;
    const brightnessVal = `brightness(${Math.round(displaySettings.brightness * 100)}%)`;
    const invertVal = displaySettings.inverted ? 'invert(100%)' : '';
    const sharpenVal = displaySettings.sharpen ? 'drop-shadow(0 0 1px #fff)' : '';

    if (displaySettings.mode === 'binary_bw') {
      return `${baseGrayscale} contrast(450%) brightness(85%) ${invertVal}`;
    }
    if (displaySettings.mode === 'high_pass_bw') {
      return `${baseGrayscale} contrast(240%) brightness(95%) ${invertVal}`;
    }
    if (displaySettings.mode === 'phosphor_bw') {
      return `${baseGrayscale} contrast(160%) brightness(130%) drop-shadow(0 0 2px rgba(255,255,255,0.45)) ${invertVal}`;
    }

    return `${baseGrayscale} ${contrastVal} ${brightnessVal} ${invertVal} ${sharpenVal}`.trim();
  };

  return (
    <div id="main-viewer-section" className="flex-1 flex flex-col bg-black overflow-hidden">
      {/* Top Viewer Control Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-zinc-950 border-b border-zinc-800 text-xs">
        {/* Sample Title & Semiconductor Metadata */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="font-mono font-bold text-white text-sm">
              {sample.sampleId}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200">
              {sample.node}
            </span>
          </div>
          <span className="text-zinc-600 hidden sm:inline">|</span>
          <span className="text-zinc-400 font-sans hidden sm:inline font-medium">
            {sample.name}
          </span>
        </div>

        {/* Viewport Action Controls */}
        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          {/* Zoom Control Group */}
          <div className="flex items-center rounded-md bg-zinc-900 border border-zinc-800 p-0.5">
            <button
              id="btn-zoom-out"
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-zinc-200">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              id="btn-zoom-in"
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-zoom-reset"
              onClick={() => setZoomLevel(1.0)}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* B&W Shader Filters Popover Toggle */}
          <button
            id="toggle-shader-panel"
            onClick={() => setShowShaderControl(!showShaderControl)}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md border text-[11px] font-mono transition cursor-pointer ${
              showShaderControl
                ? 'bg-white text-black border-zinc-300 font-bold shadow'
                : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white hover:bg-zinc-800'
            }`}
            title="Toggle Black and White Contrast & SEM Beam Shader Controls"
          >
            <Sliders className="w-3 h-3" />
            <span>B&W Adjust</span>
          </button>

          {/* Overlays toggle buttons */}
          <div className="flex items-center space-x-1 bg-zinc-900 border border-zinc-800 rounded-md p-1">
            <button
              id="toggle-heatmap"
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-2 py-1 rounded text-[11px] font-mono transition cursor-pointer ${
                showHeatmap
                  ? 'bg-zinc-200 text-black font-bold border border-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Toggle 2D Phase Correlation Surface Heatmap"
            >
              Heatmap
            </button>

            <button
              id="toggle-drift-prior"
              onClick={() => setShowDriftPriorEllipse(!showDriftPriorEllipse)}
              className={`px-2 py-1 rounded text-[11px] font-mono transition cursor-pointer ${
                showDriftPriorEllipse
                  ? 'bg-zinc-200 text-black font-bold border border-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Toggle Gaussian Stage Drift Prior 2σ Ellipse"
            >
              Prior (2σ)
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Black & White Shader Control Bar (Collapsible) */}
      {showShaderControl && (
        <div className="px-4 py-3 bg-zinc-900/95 border-b border-zinc-800 text-xs flex flex-wrap items-center justify-between gap-4 transition-all">
          <div className="flex items-center space-x-4 flex-wrap gap-y-2">
            <div className="flex items-center space-x-2 font-mono text-zinc-300">
              <Contrast className="w-3.5 h-3.5 text-zinc-400" />
              <span>B&W Contrast:</span>
              <input
                type="range"
                min="0.8"
                max="2.5"
                step="0.05"
                value={displaySettings.contrast}
                onChange={(e) =>
                  onUpdateDisplaySettings((prev) => ({
                    ...prev,
                    contrast: parseFloat(e.target.value),
                  }))
                }
                className="w-24 accent-white cursor-pointer"
              />
              <span className="text-white font-bold w-10">{Math.round(displaySettings.contrast * 100)}%</span>
            </div>

            <div className="flex items-center space-x-2 font-mono text-zinc-300">
              <SunMedium className="w-3.5 h-3.5 text-zinc-400" />
              <span>E-Beam Brightness:</span>
              <input
                type="range"
                min="0.6"
                max="1.8"
                step="0.05"
                value={displaySettings.brightness}
                onChange={(e) =>
                  onUpdateDisplaySettings((prev) => ({
                    ...prev,
                    brightness: parseFloat(e.target.value),
                  }))
                }
                className="w-24 accent-white cursor-pointer"
              />
              <span className="text-white font-bold w-10">{Math.round(displaySettings.brightness * 100)}%</span>
            </div>

            {/* Quick Invert Toggle */}
            <label className="flex items-center space-x-2 cursor-pointer font-mono text-zinc-300 select-none">
              <input
                type="checkbox"
                checked={displaySettings.inverted}
                onChange={(e) =>
                  onUpdateDisplaySettings((prev) => ({
                    ...prev,
                    inverted: e.target.checked,
                  }))
                }
                className="accent-white cursor-pointer"
              />
              <span>Invert (Negative SEM)</span>
            </label>

            {/* Scanline CRT Toggle */}
            <label className="flex items-center space-x-2 cursor-pointer font-mono text-zinc-300 select-none">
              <input
                type="checkbox"
                checked={displaySettings.scanlines}
                onChange={(e) =>
                  onUpdateDisplaySettings((prev) => ({
                    ...prev,
                    scanlines: e.target.checked,
                  }))
                }
                className="accent-white cursor-pointer"
              />
              <span>CRT Scanlines</span>
            </label>
          </div>

          <button
            onClick={() =>
              onUpdateDisplaySettings({
                mode: 'standard_bw',
                contrast: 1.35,
                brightness: 1.05,
                inverted: false,
                scanlines: true,
                sharpen: false,
                highContrastBw: true,
              })
            }
            className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 hover:text-white text-[11px] font-mono border border-zinc-700 transition"
          >
            Reset B&W Defaults
          </button>
        </div>
      )}

      {/* Dual Viewer Grid: Left Reference, Right Search with Overlays */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-auto">
        {/* LEFT: Reference Image Card (10x Shrunk Pattern) */}
        <div className="lg:col-span-4 bg-zinc-950 border-b lg:border-b-0 lg:border-r border-zinc-800 p-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header of Ref Card */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-200">
                    Reference Image
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 font-bold">
                    10x SHRUNK CAD
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Design GDSII / Optical template clip
                </p>
              </div>

              <span className="text-[11px] font-mono text-zinc-400">
                {sample.refWidth} × {sample.refHeight} px
              </span>
            </div>

            {/* Visualizer Frame for 10x Reference Target */}
            <div className="relative rounded-lg border border-zinc-800 bg-black p-4 flex flex-col items-center justify-center min-h-[220px] wafer-grid-bw overflow-hidden">
              {/* Scan reticle corners */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-white/60" />
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-white/60" />
              <div className="absolute bottom-2 left-2 w-3 h-2 border-b-2 border-l-2 border-white/60" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-white/60" />

              {/* Pixel Preview Container */}
              <div
                className="relative border-2 border-white rounded shadow-lg shadow-black/80 overflow-hidden bg-black"
                style={{
                  width: sample.refWidth * refZoom,
                  height: sample.refHeight * refZoom,
                }}
              >
                <img
                  src={sample.referenceImage}
                  alt="Reference Pattern 10x Shrunk"
                  className="w-full h-full object-contain"
                  style={{ 
                    imageRendering: 'pixelated',
                    filter: getImageFilterStyle(),
                  }}
                />
                
                {/* Center crosshair */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
                  <div className="w-full h-px bg-white" />
                  <div className="h-full w-px bg-white absolute" />
                </div>
              </div>

              {/* Magnification slider */}
              <div className="flex items-center space-x-2 mt-4 text-[11px] font-mono text-zinc-400">
                <span>View Zoom:</span>
                <input
                  id="range-ref-zoom"
                  type="range"
                  min="2"
                  max="10"
                  value={refZoom}
                  onChange={(e) => setRefZoom(Number(e.target.value))}
                  className="w-24 accent-white cursor-pointer"
                />
                <span className="text-white font-bold">{refZoom}x</span>
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="bg-black/90 rounded-lg p-3 border border-zinc-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>Shrink Ratio:</span>
                <span className="text-zinc-200 font-semibold">10:1 (Downscaled)</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Normalized Template:</span>
                <span className="text-white font-bold">{sample.refWidth * sample.shrinkFactor} × {sample.refHeight * sample.shrinkFactor} px</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>CAD Origin Node:</span>
                <span className="text-zinc-300">{sample.node}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Expected Drift σ:</span>
                <span className="text-zinc-200">±{sample.driftPriorSigma} px (±{Math.round(sample.driftPriorSigma * sample.semParams.pixelSize_nm)} nm)</span>
              </div>
            </div>
          </div>

          {/* Reference Footnote */}
          <div className="text-[11px] text-zinc-400 bg-zinc-900/60 p-2.5 rounded border border-zinc-800 mt-4">
            <p className="flex items-start gap-1.5">
              <Info className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <span>
                Stage 1 normalizes this 10x template with bicubic interpolation and intensity alignment to match the SEM search image.
              </span>
            </p>
          </div>
        </div>

        {/* RIGHT: Search Image with Full Interactive AI Matching Overlay */}
        <div className="lg:col-span-8 bg-black p-4 flex flex-col justify-between overflow-auto relative">
          <div className="space-y-3">
            {/* Header of Search View */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-200">
                    Search Image (SEM Inspection Field)
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200">
                    {sample.searchWidth} × {sample.searchHeight} px
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    Mag: {sample.semParams.magnification}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  High-magnification SEM scan with periodic circuit structures and navigation drift
                </p>
              </div>

              {/* Dynamic Coordinate HUD */}
              <div className="flex items-center space-x-2 text-[11px] font-mono bg-zinc-900 border border-zinc-800 px-3 py-1 rounded">
                <Compass className="w-3.5 h-3.5 text-white" />
                <span className="text-zinc-400">Cursor:</span>
                <span className="text-white font-semibold">
                  {mousePos ? `X: ${mousePos.x} | Y: ${mousePos.y}` : 'Hovering Viewport'}
                </span>
              </div>
            </div>

            {/* Main Stage Search Viewer with SVG/Canvas Overlays */}
            <div className="relative rounded-lg border border-zinc-800 bg-black overflow-hidden flex items-center justify-center p-1">
              <div
                ref={containerRef}
                id="search-stage-viewport"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="relative overflow-hidden cursor-crosshair select-none transition-transform"
                style={{
                  width: sample.searchWidth * zoomLevel,
                  height: sample.searchHeight * zoomLevel,
                }}
              >
                {/* 1. Base SEM Search Image with Black and White Shader Filters */}
                <img
                  src={sample.searchImage}
                  alt="Search SEM Field"
                  className="w-full h-full object-cover block"
                  style={{ 
                    imageRendering: 'pixelated',
                    filter: getImageFilterStyle(),
                  }}
                />

                {/* CRT Scanline and E-Beam Overlay */}
                {displaySettings.scanlines && (
                  <div className="absolute inset-0 pointer-events-none sem-crt-overlay opacity-60">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-20 w-full animate-scanline pointer-events-none" />
                  </div>
                )}

                {/* 2. Monochromatic 2D Correlation Heatmap Overlay */}
                {showHeatmap && (
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-screen opacity-80"
                    style={{
                      background: `radial-gradient(circle at ${(sample.predicted.x / sample.searchWidth) * 100}% ${(sample.predicted.y / sample.searchHeight) * 100}%, rgba(255, 255, 255, 0.95) 0%, rgba(180, 180, 180, 0.6) 25%, rgba(90, 90, 90, 0.25) 50%, transparent 80%)`,
                    }}
                  />
                )}

                {/* 3. SVG Overlay for Reticle, Bounding Boxes, Candidate Markers, Ground Truth, and Error Vectors */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-auto"
                  viewBox={`0 0 ${sample.searchWidth} ${sample.searchHeight}`}
                >
                  {/* Gaussian Drift Prior 2-Sigma Ellipse (Monochromatic) */}
                  {showDriftPriorEllipse && (
                    <ellipse
                      cx={sample.searchWidth / 2}
                      cy={sample.searchHeight / 2}
                      rx={sample.driftPriorSigma * 2}
                      ry={sample.driftPriorSigma * 2}
                      fill="rgba(255, 255, 255, 0.05)"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      className="transition-all"
                    />
                  )}

                  {/* Nominal Stage Center (0 Drift reference point) */}
                  <g>
                    <line
                      x1={sample.searchWidth / 2 - 8}
                      y1={sample.searchHeight / 2}
                      x2={sample.searchWidth / 2 + 8}
                      y2={sample.searchHeight / 2}
                      stroke="#71717a"
                      strokeWidth="1"
                    />
                    <line
                      x1={sample.searchWidth / 2}
                      y1={sample.searchHeight / 2 - 8}
                      x2={sample.searchWidth / 2}
                      y2={sample.searchHeight / 2 + 8}
                      stroke="#71717a"
                      strokeWidth="1"
                    />
                    <circle
                      cx={sample.searchWidth / 2}
                      cy={sample.searchHeight / 2}
                      r="12"
                      fill="none"
                      stroke="#71717a"
                      strokeWidth="0.8"
                      strokeDasharray="2 2"
                    />
                    <text
                      x={sample.searchWidth / 2 + 15}
                      y={sample.searchHeight / 2 - 6}
                      fill="#a1a1aa"
                      fontSize="9"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      Stage Nominal (0,0)
                    </text>
                  </g>

                  {/* Error Vector Line (from Ground Truth to Prediction) */}
                  {showErrorVector && sample.groundTruth && (
                    <g>
                      <line
                        x1={sample.groundTruth.x}
                        y1={sample.groundTruth.y}
                        x2={sample.predicted.x}
                        y2={sample.predicted.y}
                        stroke="#f43f5e"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                      />
                    </g>
                  )}

                  {/* Rejected Periodic Candidates (High-Contrast Dotted Markers) */}
                  {showRejectedCandidates &&
                    sample.candidates
                      .filter((c) => !c.isWinner)
                      .map((cand) => (
                        <g
                          key={cand.id}
                          className="cursor-pointer transition-transform hover:scale-110"
                          onMouseEnter={() => setHoveredCandidate(cand)}
                          onMouseLeave={() => setHoveredCandidate(null)}
                        >
                          {/* Outer Dashed Ring */}
                          <circle
                            cx={cand.x}
                            cy={cand.y}
                            r="9"
                            fill="rgba(245, 158, 11, 0.15)"
                            stroke="#f59e0b"
                            strokeWidth="1.5"
                            strokeDasharray="3 2"
                          />
                          {/* Center Dot */}
                          <circle
                            cx={cand.x}
                            cy={cand.y}
                            r="2.5"
                            fill="#f59e0b"
                          />
                          {/* Candidate Score Tag */}
                          <text
                            x={cand.x + 11}
                            y={cand.y + 3}
                            fill="#fbbf24"
                            fontSize="8"
                            fontFamily="JetBrains Mono, monospace"
                            fontWeight="600"
                          >
                            {(cand.rawScore).toFixed(2)}
                          </text>
                        </g>
                      ))}

                  {/* Ground Truth Location (Emerald Marker & Crosshair) */}
                  {showGroundTruth && sample.groundTruth && (
                    <g>
                      {/* Pulsing Ring */}
                      <circle
                        cx={sample.groundTruth.x}
                        cy={sample.groundTruth.y}
                        r="14"
                        fill="rgba(16, 185, 129, 0.18)"
                        stroke="#10b981"
                        strokeWidth="2"
                      />
                      <circle
                        cx={sample.groundTruth.x}
                        cy={sample.groundTruth.y}
                        r="3"
                        fill="#10b981"
                      />
                      {/* Precise Crosshair */}
                      <line
                        x1={sample.groundTruth.x - 18}
                        y1={sample.groundTruth.y}
                        x2={sample.groundTruth.x + 18}
                        y2={sample.groundTruth.y}
                        stroke="#10b981"
                        strokeWidth="1"
                      />
                      <line
                        x1={sample.groundTruth.x}
                        y1={sample.groundTruth.y - 18}
                        x2={sample.groundTruth.x}
                        y2={sample.groundTruth.y + 18}
                        stroke="#10b981"
                        strokeWidth="1"
                      />
                      <text
                        x={sample.groundTruth.x + 16}
                        y={sample.groundTruth.y - 8}
                        fill="#34d399"
                        fontSize="9"
                        fontFamily="JetBrains Mono, monospace"
                        fontWeight="bold"
                      >
                        Ground Truth ({sample.groundTruth.x}, {sample.groundTruth.y})
                      </text>
                    </g>
                  )}

                  {/* AI Predicted Location (High-Contrast White Reticle & Target Diamond) */}
                  {showPrediction && (
                    <g>
                      {/* Bounding Box matching normalized target template */}
                      <rect
                        x={sample.predicted.x - (targetBoxWidth / 2)}
                        y={sample.predicted.y - (targetBoxHeight / 2)}
                        width={targetBoxWidth}
                        height={targetBoxHeight}
                        fill="rgba(255, 255, 255, 0.08)"
                        stroke="#ffffff"
                        strokeWidth="1.8"
                        rx="2"
                        strokeDasharray="4 2"
                      />

                      {/* White Target Reticle Ring */}
                      <circle
                        cx={sample.predicted.x}
                        cy={sample.predicted.y}
                        r="16"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                      <circle
                        cx={sample.predicted.x}
                        cy={sample.predicted.y}
                        r="3"
                        fill="#ffffff"
                      />
                      {/* Corner brackets */}
                      <path
                        d={`M ${sample.predicted.x - 10} ${sample.predicted.y - 14} L ${sample.predicted.x - 14} ${sample.predicted.y - 14} L ${sample.predicted.x - 14} ${sample.predicted.y - 10}`}
                        stroke="#ffffff"
                        strokeWidth="2"
                        fill="none"
                      />
                      <path
                        d={`M ${sample.predicted.x + 10} ${sample.predicted.y - 14} L ${sample.predicted.x + 14} ${sample.predicted.y - 14} L ${sample.predicted.x + 14} ${sample.predicted.y - 10}`}
                        stroke="#ffffff"
                        strokeWidth="2"
                        fill="none"
                      />
                      <path
                        d={`M ${sample.predicted.x - 10} ${sample.predicted.y + 14} L ${sample.predicted.x - 14} ${sample.predicted.y + 14} L ${sample.predicted.x - 14} ${sample.predicted.y + 10}`}
                        stroke="#ffffff"
                        strokeWidth="2"
                        fill="none"
                      />
                      <path
                        d={`M ${sample.predicted.x + 10} ${sample.predicted.y + 14} L ${sample.predicted.x + 14} ${sample.predicted.y + 14} L ${sample.predicted.x + 14} ${sample.predicted.y + 10}`}
                        stroke="#ffffff"
                        strokeWidth="2"
                        fill="none"
                      />

                      {/* AI Prediction Coordinate Tag */}
                      <rect
                        x={sample.predicted.x - 65}
                        y={sample.predicted.y + 22}
                        width="130"
                        height="18"
                        fill="#ffffff"
                        rx="3"
                      />
                      <text
                        x={sample.predicted.x}
                        y={sample.predicted.y + 34}
                        fill="#000000"
                        fontSize="9"
                        fontFamily="JetBrains Mono, monospace"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        AI: ({sample.predicted.x.toFixed(2)}, {sample.predicted.y.toFixed(2)})
                      </text>
                    </g>
                  )}
                </svg>

                {/* Candidate Hover Tooltip */}
                {hoveredCandidate && (
                  <div
                    className="absolute z-20 pointer-events-none p-2.5 rounded bg-zinc-950/95 border border-zinc-700 shadow-2xl text-[11px] font-mono space-y-1 w-56 backdrop-blur-md"
                    style={{
                      left: Math.min(sample.searchWidth - 230, hoveredCandidate.x + 16),
                      top: Math.min(sample.searchHeight - 110, hoveredCandidate.y - 20),
                    }}
                  >
                    <div className="flex justify-between items-center text-white font-bold border-b border-zinc-800 pb-1">
                      <span>{hoveredCandidate.id.toUpperCase()}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
                        REJECTED ALIAS
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Coords:</span>
                      <span className="text-zinc-200">({hoveredCandidate.x}, {hoveredCandidate.y})</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Raw Correlation:</span>
                      <span className="text-white font-semibold">{hoveredCandidate.rawScore.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Prior Score:</span>
                      <span className="text-zinc-300">{hoveredCandidate.priorScore.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Reason:</span>
                      <span className="text-zinc-200 text-[10px]">{hoveredCandidate.rejectionReason}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* COLOR & MONOCHROME LEGEND BAR */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-xs font-mono">
              <div className="flex items-center space-x-5 flex-wrap gap-y-2">
                {/* 1. White AI Prediction */}
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showPrediction}
                    onChange={(e) => setShowPrediction(e.target.checked)}
                    className="accent-white cursor-pointer"
                  />
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white bg-white/20 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <span className="text-white font-medium">AI Predicted Location</span>
                </label>

                {/* 2. Green Ground Truth */}
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showGroundTruth}
                    onChange={(e) => setShowGroundTruth(e.target.checked)}
                    className="accent-emerald-400 cursor-pointer"
                  />
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500 bg-emerald-500/20 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-emerald-300 font-medium">Ground Truth Target</span>
                </label>

                {/* 3. Amber Rejected Candidates */}
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showRejectedCandidates}
                    onChange={(e) => setShowRejectedCandidates(e.target.checked)}
                    className="accent-amber-400 cursor-pointer"
                  />
                  <div className="w-3.5 h-3.5 rounded-full border border-dashed border-amber-400 bg-amber-500/20 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  </div>
                  <span className="text-amber-300 font-medium">
                    Rejected Periodic Look-alikes ({sample.candidates.length - 1})
                  </span>
                </label>
              </div>

              {/* Error Vector toggle */}
              <label className="flex items-center space-x-2 cursor-pointer text-zinc-400 hover:text-zinc-200 select-none">
                <input
                  type="checkbox"
                  checked={showErrorVector}
                  onChange={(e) => setShowErrorVector(e.target.checked)}
                  className="accent-rose-400 cursor-pointer"
                />
                <span className="text-rose-300 text-[11px]">Show Error Vector (Δ)</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
