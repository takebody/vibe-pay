import React from "react";

interface FilterBottleProps {
  number: "1" | "2";
  className?: string;
}

export const FilterBottle: React.FC<FilterBottleProps> = ({ number, className = "" }) => {
  const isOne = number === "1";

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* Top nozzle & cap */}
      <div className="w-2.5 h-3 bg-gray-200 rounded-t-sm border-t border-x border-gray-300 shadow-sm" />
      <div className="w-4 h-1.5 bg-gray-300 rounded-sm" />

      {/* Main Filter Bottle Cylinder */}
      <div className="w-12 h-28 bg-gradient-to-r from-gray-100 via-white to-gray-200 rounded-t-md rounded-b-sm border border-gray-300/80 shadow-md relative overflow-hidden flex flex-col items-center">
        {/* Subtle cylindrical gloss reflections */}
        <div className="absolute inset-y-0 left-1 w-1.5 bg-white/70 blur-[0.5px]" />
        <div className="absolute inset-y-0 right-1 w-1 bg-black/5" />

        {/* Top neck line */}
        <div className="w-full h-1 bg-gray-200/90 mt-1 border-y border-gray-300/60" />

        {/* Brand label wrap */}
        <div
          className={`w-full h-12 mt-5 flex flex-col items-center justify-center relative shadow-sm ${
            isOne
              ? "bg-gradient-to-r from-indigo-700 via-purple-600 to-indigo-800 text-white"
              : "bg-gradient-to-r from-orange-600 via-red-500 to-amber-600 text-white"
          }`}
        >
          {/* Top/bottom label border */}
          <div className="absolute top-0 inset-x-0 h-0.5 bg-white/40" />
          <div className="absolute bottom-0 inset-x-0 h-0.5 bg-white/40" />

          {/* Number */}
          <span className="font-black text-2xl tracking-tighter leading-none drop-shadow-sm font-sans">
            {number}
          </span>
          <span className="text-[7px] tracking-widest uppercase font-semibold text-white/90">
            {isOne ? "HEAVY METAL" : "BACTERIA"}
          </span>
        </div>

        {/* Technical barcode & spec lines */}
        <div className="mt-2 space-y-1 w-8 flex flex-col items-center opacity-60">
          <div className="w-6 h-0.5 bg-gray-400" />
          <div className="w-4 h-0.5 bg-gray-300" />
          <div className="w-7 h-1 bg-gray-400" />
        </div>

        {/* Bottom base indent */}
        <div className="mt-auto w-full h-1.5 bg-gray-200 border-t border-gray-300" />
      </div>
    </div>
  );
};
