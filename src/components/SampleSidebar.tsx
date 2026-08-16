import React, { useState } from 'react';
import { WaferSample } from '../types';
import { Upload, Search, Microchip, Filter } from 'lucide-react';

interface SampleSidebarProps {
  samples: WaferSample[];
  selectedSampleId: string;
  onSelectSample: (sample: WaferSample) => void;
  onOpenUploadModal: () => void;
}

export const SampleSidebar: React.FC<SampleSidebarProps> = ({
  samples,
  selectedSampleId,
  onSelectSample,
  onOpenUploadModal,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const categories = ['All', 'DRAM Memory', 'Logic FinFET', '3D NAND', 'Packaging TSV', 'Edge Die'];

  const filteredSamples = samples.filter((s) => {
    const matchesCat = filterCategory === 'All' || s.category === filterCategory;
    const matchesSearch =
      s.sampleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.node.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <aside id="sample-selector-sidebar" className="w-full lg:w-80 flex flex-col bg-zinc-950 border-r border-zinc-800 h-full">
      {/* Sidebar Header & Search */}
      <div className="p-3.5 border-b border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Microchip className="w-4 h-4 text-white" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
              Inspection Samples
            </h3>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-200 border border-zinc-700">
            {samples.length} Scans
          </span>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
          <input
            id="input-search-samples"
            type="text"
            placeholder="Search sample ID, node, or pattern..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-black border border-zinc-800 rounded-md text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-sans"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              id={`filter-cat-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setFilterCategory(cat)}
              className={`text-[11px] px-2.5 py-1 rounded whitespace-nowrap transition-colors font-mono cursor-pointer ${
                filterCategory === cat
                  ? 'bg-white text-black font-bold shadow'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Samples List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {filteredSamples.map((sample) => {
          const isSelected = sample.id === selectedSampleId;
          const isSubPixel = sample.metrics.pixelError < 0.5;

          return (
            <button
              key={sample.id}
              id={`sample-item-${sample.id}`}
              onClick={() => onSelectSample(sample)}
              className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer flex gap-3 group relative ${
                isSelected
                  ? 'bg-zinc-900 border-white shadow-lg ring-1 ring-white/50'
                  : 'bg-black hover:bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {/* Thumbnail preview */}
              <div className="relative w-14 h-14 rounded-md overflow-hidden bg-black border border-zinc-800 shrink-0">
                <img
                  src={sample.searchImage}
                  alt={sample.name}
                  className="w-full h-full object-cover grayscale contrast-125 group-hover:scale-105 transition-transform"
                />
                {/* 10x Ref miniature badge */}
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-black border-t border-l border-zinc-700 rounded-tl overflow-hidden">
                  <img
                    src={sample.referenceImage}
                    alt="Ref"
                    className="w-full h-full object-contain grayscale"
                  />
                </div>
              </div>

              {/* Sample Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-xs font-mono font-bold text-white truncate group-hover:text-zinc-200">
                    {sample.sampleId}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold shrink-0 ${
                      isSubPixel
                        ? 'bg-zinc-800 text-white border-zinc-600'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-700'
                    }`}
                  >
                    Δ {sample.metrics.pixelError.toFixed(2)} px
                  </span>
                </div>

                <div className="text-[11px] font-medium text-zinc-300 truncate mb-1">
                  {sample.name}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span className="truncate">{sample.node}</span>
                  <span className="text-zinc-500">
                    Die [{sample.dieInfo.dieRow},{sample.dieInfo.dieCol}]
                  </span>
                </div>
              </div>
            </button>
          );
        })}

        {filteredSamples.length === 0 && (
          <div className="p-6 text-center text-zinc-500 text-xs font-mono">
            No samples match the selected filter.
          </div>
        )}
      </div>

      {/* Bottom Upload & Custom Pair Action */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950 space-y-2">
        <button
          id="btn-open-custom-upload"
          onClick={onOpenUploadModal}
          className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 hover:border-zinc-500 text-xs font-mono font-bold transition-all shadow-sm cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-white" />
          <span>Upload Custom Ref / Search</span>
        </button>

        <div className="text-[10px] text-center text-zinc-500 font-mono">
          <span>Target downscaled 10x • Monochromatic Engine</span>
        </div>
      </div>
    </aside>
  );
};
