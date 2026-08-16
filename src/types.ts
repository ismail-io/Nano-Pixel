export interface Point {
  x: number;
  y: number;
}

export type SemDisplayMode = 'standard_bw' | 'inverted_bw' | 'high_pass_bw' | 'phosphor_bw' | 'binary_bw';

export interface SemDisplaySettings {
  mode: SemDisplayMode;
  contrast: number; // 0.8 - 2.5
  brightness: number; // 0.7 - 1.6
  inverted: boolean;
  scanlines: boolean;
  sharpen: boolean;
  highContrastBw: boolean;
}

export interface CandidateMatch {
  id: string;
  x: number;
  y: number;
  rawScore: number;          // Correlation score [0, 1]
  priorScore: number;        // Gaussian drift prior [0, 1]
  combinedScore: number;     // Final weighted score [0, 1]
  isWinner: boolean;
  rejectionReason?: 'Periodic Alias / Side-lobe' | 'Drift Prior Outlier' | 'Sub-threshold Feature Match' | 'Low Contrast Gradient';
  distanceToGroundTruth?: number;
}

export interface WaferDieInfo {
  dieRow: number;
  dieCol: number;
  waferX_mm: number;
  waferY_mm: number;
  isEdgeDie: boolean;
}

export interface InspectionMetrics {
  pixelError: number;              // Euclidean error to ground truth (px)
  subPixelAccuracy_nm: number;     // Real-world nanometer error
  ambiguousCandidatesCount: number;// Number of rejected periodic look-alikes
  predictedX: number;              // Sub-pixel X coordinate
  predictedY: number;              // Sub-pixel Y coordinate
  groundTruthX?: number;
  groundTruthY?: number;
  driftMagnitude_px: number;       // Stage navigation drift distance (px)
  driftVector: { dx: number; dy: number };
  psr: number;                     // Peak-to-Sidelobe Ratio
  correlationPeak: number;         // Max normalized cross-correlation
  priorConfidence: number;         // Prior probability at peak
  latency_ms: number;              // Pipeline execution time
  subPixelDx: number;              // Sub-pixel parabolic delta x
  subPixelDy: number;              // Sub-pixel parabolic delta y
}

export interface PipelineStageInfo {
  id: 'scale_norm' | 'fft_corr' | 'multi_peak' | 'prior_weight' | 'subpixel_refine';
  title: string;
  shortTitle: string;
  stepNumber: number;
  description: string;
  mathFormula: string;
  status: 'completed' | 'processing' | 'idle';
  durationMs: number;
  outputSummary: string;
}

export interface WaferSample {
  id: string;
  sampleId: string;
  name: string;
  category: 'DRAM Memory' | 'Logic FinFET' | '3D NAND' | 'SRAM 6T' | 'Packaging TSV' | 'Edge Die' | 'E-Beam Low SNR';
  node: string;
  description: string;
  referenceImage: string;          // Data URL or procedural generator ID
  searchImage: string;             // Data URL or procedural generator ID
  refWidth: number;
  refHeight: number;
  searchWidth: number;
  searchHeight: number;
  shrinkFactor: number;            // Usually 10 (10x smaller reference)
  dieInfo: WaferDieInfo;
  groundTruth: Point;
  predicted: Point;
  candidates: CandidateMatch[];
  metrics: InspectionMetrics;
  driftPriorSigma: number;         // Standard deviation of expected drift in pixels
  stages: PipelineStageInfo[];
  semParams: {
    magnification: string;
    beamEnergy_keV: number;
    fov_um: number;
    pixelSize_nm: number;
    dose_e_nm2: number;
  };
}
