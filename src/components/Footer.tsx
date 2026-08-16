import React from 'react';
import { Cpu, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer id="footer-root" className="bg-black border-t border-zinc-800 py-6 px-4 text-xs font-mono text-zinc-400">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-zinc-200">
              <Cpu className="w-4 h-4 text-white" />
              <span className="font-bold tracking-wider uppercase text-white">
                NanoPixel Navigation Error Recovery System
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 text-white border border-zinc-700">
                SEMICON 2026
              </span>
            </div>
            <p className="text-zinc-400 text-[11px] font-sans max-w-2xl">
              Engineered for the <strong>SEMICON India Hackathon 2026 (Applied Materials Track)</strong>. High-contrast monochromatic SEM viewing modes, resolving micro-scale stage drift, 10x template shrink ratio, and periodic circuit ambiguity across advanced nodes (Sub-2nm A16, 3D NAND, 3nm DRAM).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-white flex items-center gap-1.5 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Live In-Browser SEM Computation</span>
            </span>
            <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px]">
              B&W SEM Shader Engine Active
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-zinc-400 gap-2">
          <div>
            <span>Dataset Generation: Real-time synthetic SEM & CAD physics generator with GDSII downsampling, Poisson shot noise, and stage drift.</span>
          </div>
          <div className="text-zinc-400">
            <span>Applied Materials • KLA • IESA Semiconductor Evaluation Platform</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
