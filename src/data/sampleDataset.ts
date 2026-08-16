import { WaferSample } from '../types';
import { generateReferencePattern, generateWaferPattern, runDriftSensePipeline } from '../utils/imageMatchingEngine';

export function createInitialDataset(): WaferSample[] {
  const samplesConfig: Array<{
    id: string;
    sampleId: string;
    name: string;
    category: WaferSample['category'];
    node: string;
    description: string;
    patternType: 'dram' | 'logic' | 'finfet' | 'nand' | 'tsv' | 'sram' | 'edge' | 'lowsnr';
    searchSize: { w: number; h: number };
    refSize: number;
    shrinkFactor: number;
    gtOffset: { x: number; y: number };
    dieInfo: WaferSample['dieInfo'];
    driftSigma: number;
    semParams: WaferSample['semParams'];
  }> = [
    {
      id: 'dram-bitcell-01',
      sampleId: 'AMAT-N3-DRAM-01',
      name: 'DRAM Capacitor & Wordline Array',
      category: 'DRAM Memory',
      node: '3nm 1b-DRAM',
      description: 'High-density periodic memory bitcell matrix. 10x shrunk CAD layout reference matched against high-magnification SEM review station.',
      patternType: 'dram',
      searchSize: { w: 520, h: 380 },
      refSize: 20, // 10x smaller
      shrinkFactor: 10,
      gtOffset: { x: 314, y: 196 },
      dieInfo: { dieRow: 8, dieCol: 9, waferX_mm: 12.4, waferY_mm: 8.6, isEdgeDie: false },
      driftSigma: 42,
      semParams: {
        magnification: '120,000X',
        beamEnergy_keV: 1.2,
        fov_um: 1.45,
        pixelSize_nm: 2.8,
        dose_e_nm2: 45,
      },
    },
    {
      id: 'logic-m1-02',
      sampleId: 'AMAT-A16-LOGIC-02',
      name: 'Sub-2nm Logic M1 Pitch Interconnects',
      category: 'Logic FinFET',
      node: 'Applied A16 Angstrom',
      description: 'Dense parallel metal tracks with orthogonal jump vias. High directional ambiguity requiring prior-weighted drift recovery.',
      patternType: 'logic',
      searchSize: { w: 520, h: 380 },
      refSize: 22,
      shrinkFactor: 10,
      gtOffset: { x: 236, y: 228 },
      dieInfo: { dieRow: 6, dieCol: 5, waferX_mm: -18.2, waferY_mm: 22.4, isEdgeDie: false },
      driftSigma: 38,
      semParams: {
        magnification: '150,000X',
        beamEnergy_keV: 0.8,
        fov_um: 1.15,
        pixelSize_nm: 2.2,
        dose_e_nm2: 60,
      },
    },
    {
      id: 'gaa-nanosheet-03',
      sampleId: 'AMAT-GAA-FINFET-03',
      name: 'Gate-All-Around (GAA) Nanosheet Array',
      category: 'Logic FinFET',
      node: '2nm GAAFET',
      description: 'Horizontal nanosheet channels crossed by High-k metal gates. Multiple identical channel pitches generate strong periodic phase side-lobes.',
      patternType: 'finfet',
      searchSize: { w: 520, h: 380 },
      refSize: 22,
      shrinkFactor: 10,
      gtOffset: { x: 278, y: 154 },
      dieInfo: { dieRow: 10, dieCol: 11, waferX_mm: 28.5, waferY_mm: -14.1, isEdgeDie: false },
      driftSigma: 46,
      semParams: {
        magnification: '180,000X',
        beamEnergy_keV: 1.5,
        fov_um: 0.95,
        pixelSize_nm: 1.8,
        dose_e_nm2: 55,
      },
    },
    {
      id: '3d-nand-04',
      sampleId: 'AMAT-3D-NAND-04',
      name: '128-Layer 3D NAND Channel Hole Matrix',
      category: '3D NAND',
      node: 'BiCS 3D Flash',
      description: 'Hexagonal close-packed vertical memory holes. High aspect-ratio etching causes subtle intensity gradients across candidate holes.',
      patternType: 'nand',
      searchSize: { w: 520, h: 380 },
      refSize: 18,
      shrinkFactor: 10,
      gtOffset: { x: 342, y: 246 },
      dieInfo: { dieRow: 7, dieCol: 8, waferX_mm: 0.0, waferY_mm: 4.2, isEdgeDie: false },
      driftSigma: 35,
      semParams: {
        magnification: '90,000X',
        beamEnergy_keV: 2.0,
        fov_um: 2.1,
        pixelSize_nm: 4.0,
        dose_e_nm2: 38,
      },
    },
    {
      id: 'tsv-package-05',
      sampleId: 'AMAT-TSV-INTER-05',
      name: '3D Packaging Through-Silicon Via (TSV) Grid',
      category: 'Packaging TSV',
      node: 'CoWoS / Hybrid Bond',
      description: 'Copper pillar landing pads for high-density 2.5D/3D chiplet interconnect. Large macro navigation error due to stage acceleration.',
      patternType: 'tsv',
      searchSize: { w: 520, h: 380 },
      refSize: 24,
      shrinkFactor: 10,
      gtOffset: { x: 384, y: 168 },
      dieInfo: { dieRow: 14, dieCol: 13, waferX_mm: 64.0, waferY_mm: -58.2, isEdgeDie: true },
      driftSigma: 55,
      semParams: {
        magnification: '45,000X',
        beamEnergy_keV: 3.0,
        fov_um: 5.8,
        pixelSize_nm: 11.2,
        dose_e_nm2: 25,
      },
    },
    {
      id: 'sram-6t-06',
      sampleId: 'AMAT-SRAM-6T-06',
      name: 'High-Density 6T SRAM Cell Matrix',
      category: 'SRAM 6T',
      node: 'N3E Ultra-Dense SRAM',
      description: 'Standard 6-transistor cache layout with cross-coupled inverters. High structural symmetry challenges standard cross-correlation.',
      patternType: 'sram',
      searchSize: { w: 520, h: 380 },
      refSize: 20,
      shrinkFactor: 10,
      gtOffset: { x: 224, y: 212 },
      dieInfo: { dieRow: 5, dieCol: 12, waferX_mm: 36.8, waferY_mm: 42.1, isEdgeDie: false },
      driftSigma: 40,
      semParams: {
        magnification: '140,000X',
        beamEnergy_keV: 1.0,
        fov_um: 1.25,
        pixelSize_nm: 2.4,
        dose_e_nm2: 50,
      },
    },
    {
      id: 'edge-die-07',
      sampleId: 'AMAT-EDGE-DIE-07',
      name: 'Wafer Bevel Edge Die with Lens Distortion',
      category: 'Edge Die',
      node: '4nm Edge Review',
      description: 'Perimeter wafer die suffering from electrostatic clamp field distortion and asymmetric optical tilt near the wafer bevel.',
      patternType: 'edge',
      searchSize: { w: 520, h: 380 },
      refSize: 22,
      shrinkFactor: 10,
      gtOffset: { x: 198, y: 268 },
      dieInfo: { dieRow: 2, dieCol: 9, waferX_mm: 8.5, waferY_mm: 128.4, isEdgeDie: true },
      driftSigma: 60,
      semParams: {
        magnification: '110,000X',
        beamEnergy_keV: 1.2,
        fov_um: 1.6,
        pixelSize_nm: 3.1,
        dose_e_nm2: 40,
      },
    },
    {
      id: 'ebeam-lowsnr-08',
      sampleId: 'AMAT-EBEAM-LOWSNR-08',
      name: 'Low-Dose Ultra-Fast E-Beam Inspection',
      category: 'E-Beam Low SNR',
      node: 'High-Throughput SEM',
      description: 'High-speed wafer scanning with minimal beam dwell time. High Poisson shot noise and low signal-to-noise ratio.',
      patternType: 'lowsnr',
      searchSize: { w: 520, h: 380 },
      refSize: 20,
      shrinkFactor: 10,
      gtOffset: { x: 292, y: 178 },
      dieInfo: { dieRow: 9, dieCol: 4, waferX_mm: -42.1, waferY_mm: -8.0, isEdgeDie: false },
      driftSigma: 44,
      semParams: {
        magnification: '100,000X',
        beamEnergy_keV: 0.6,
        fov_um: 1.8,
        pixelSize_nm: 3.5,
        dose_e_nm2: 12,
      },
    },
  ];

  return samplesConfig.map((cfg) => {
    // Generate procedural images
    const searchImage = generateWaferPattern(
      cfg.patternType,
      cfg.searchSize.w,
      cfg.searchSize.h,
      {
        noise: cfg.patternType === 'lowsnr' ? 0.35 : 0.12,
        contrast: 1.0,
      }
    );

    const ref = generateReferencePattern(cfg.patternType, 64, cfg.shrinkFactor);

    // Run AI matching pipeline to generate ground truth, candidates, predicted points, and telemetry
    const result = runDriftSensePipeline(
      cfg.gtOffset,
      cfg.searchSize.w,
      cfg.searchSize.h,
      cfg.driftSigma,
      cfg.patternType
    );

    return {
      id: cfg.id,
      sampleId: cfg.sampleId,
      name: cfg.name,
      category: cfg.category,
      node: cfg.node,
      description: cfg.description,
      referenceImage: ref.refDataUrl,
      searchImage,
      refWidth: ref.shrunkSize,
      refHeight: ref.shrunkSize,
      searchWidth: cfg.searchSize.w,
      searchHeight: cfg.searchSize.h,
      shrinkFactor: cfg.shrinkFactor,
      dieInfo: cfg.dieInfo,
      groundTruth: cfg.gtOffset,
      predicted: result.predicted,
      candidates: result.candidates,
      metrics: result.metrics,
      driftPriorSigma: cfg.driftSigma,
      stages: result.stages,
      semParams: cfg.semParams,
    };
  });
}
