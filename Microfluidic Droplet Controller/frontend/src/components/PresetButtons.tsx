"use client";

import { useSimulationStore } from "@/store/simulationStore";

export default function PresetButtons() {
  const { presets, activePreset, loadPreset } = useSimulationStore();

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {presets.map((preset) => (
        <button
          key={preset.id}
          onClick={() => loadPreset(preset.id)}
          className={`preset-btn flex-shrink-0 px-4 py-3 rounded-xl text-left min-w-[180px] ${
            activePreset === preset.id
              ? "border-blue-500 bg-blue-50 shadow-md"
              : "border-gray-200 bg-white hover:border-blue-300"
          }`}
        >
          <div className="text-2xl mb-1">{preset.icon}</div>
          <div className="font-semibold text-gray-800 text-sm">{preset.name}</div>
          <div className="text-xs text-gray-500 mt-1">{preset.description}</div>
        </button>
      ))}
    </div>
  );
}
