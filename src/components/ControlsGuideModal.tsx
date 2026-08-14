import React from 'react';
import { SPELLS } from '../data/spells';

interface ControlsGuideModalProps {
  onClose: () => void;
}

export const ControlsGuideModal: React.FC<ControlsGuideModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none font-serif text-[#e2d5c3]">
      <div className="relative bg-[#1a140d] border-4 border-[#d4af37] rounded-lg shadow-2xl p-4 max-w-2xl w-full max-h-[85vh] overflow-y-auto flex flex-col space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#854d0e] pb-2">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🧞‍♂️</span>
            <div>
              <h2 className="text-lg font-bold text-[#fde047] uppercase tracking-wider">
                Magic Carpet: Flight & Spell Guide
              </h2>
              <p className="text-xs text-[#a8824f] italic">Master the Arcane Arts of Flight, Terraforming & Mana</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-[#a8824f] hover:text-[#ef4444] px-2 py-1 border border-[#523312] rounded font-bold"
          >
            ✕ Close
          </button>
        </div>

        {/* Flight Controls */}
        <div className="bg-[#241a10] border border-[#523312] rounded p-2.5 space-y-1.5 text-xs">
          <div className="text-xs font-bold text-[#fde047] uppercase border-b border-[#3b240c] pb-1">
            ✈️ Flight & Movement Controls
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>• <b>W / S</b>: Accelerate Throttle / Decelerate</div>
            <div>• <b>A / D</b>: Turn Left / Right (Bank Roll)</div>
            <div>• <b>Space / Shift (or C)</b>: Ascend Climb / Descend Dive</div>
            <div>• <b>Arrow Up / Down</b>: Pitch Look Up / Down</div>
            <div>• <b>Left Click (or Enter)</b>: Cast Selected Spell</div>
            <div>• <b>1 - 9, 0, E, T, R</b>: Quick Select Spells</div>
          </div>
        </div>

        {/* The Core Mana & Castle Loop */}
        <div className="bg-[#241a10] border border-[#523312] rounded p-2.5 space-y-1.5 text-xs">
          <div className="text-xs font-bold text-[#fde047] uppercase border-b border-[#3b240c] pb-1">
            🏰 The Mana Ecosystem & Castle Defense
          </div>
          <p className="text-[11px] text-[#cbd5e1] leading-relaxed">
            1. <b>Slay Creatures & Rivals</b>: Slain beasts erupt into bouncing golden Mana Spheres.<br/>
            2. <b>Cast POSSESS [4]</b>: Tag neutral/enemy mana spheres with your blue arcane aura.<br/>
            3. <b>Build a CASTLE [5]</b>: Erect your citadel. A Mana Balloon automatically launches to gather your claimed spheres and deposit them in your Castle.<br/>
            4. <b>Castle Levels (1 → 5)</b>: As mana accumulates, your castle expands into a grand fortress equipped with automated defensive lightning turrets!
          </p>
        </div>

        {/* Spellbook Reference */}
        <div className="bg-[#241a10] border border-[#523312] rounded p-2.5 space-y-1.5 text-xs">
          <div className="text-xs font-bold text-[#fde047] uppercase border-b border-[#3b240c] pb-1">
            📖 Spellbook & Cataclysms
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {Object.values(SPELLS).map(spell => (
              <div key={spell.id} className="p-1.5 bg-[#171008] border border-[#3b240c] rounded text-[10px]">
                <div className="flex justify-between font-bold text-[#fde047] mb-0.5">
                  <span>{spell.icon} {spell.name}</span>
                  <span className="text-[#38bdf8]">{spell.manaCost} MP</span>
                </div>
                <div className="text-[#a8a29e] italic leading-tight">{spell.description}</div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-1.5 bg-[#854d0e] hover:bg-[#ca8a04] text-[#fde047] font-bold text-xs rounded border border-[#fde047] cursor-pointer"
        >
          Embark Upon the Carpet!
        </button>
      </div>
    </div>
  );
};
