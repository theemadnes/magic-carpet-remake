import React from 'react';
import { SpellId, PlayerState } from '../types/game';
import { SPELLS } from '../data/spells';

interface SpellSelectorProps {
  player: PlayerState;
  onSelectSpell: (spellId: SpellId) => void;
}

export const SpellSelector: React.FC<SpellSelectorProps> = ({
  player,
  onSelectSpell
}) => {
  const hotkeys: Record<SpellId, string> = {
    FIREBALL: '1',
    METEOR: '2',
    LIGHTNING: '3',
    POSSESS: '4',
    CASTLE: '5',
    HEAL: '6',
    SPEED: '7',
    SHIELD: '8',
    VOLCANO: '9',
    CRATER: '0',
    EARTHQUAKE: 'E',
    TELEPORT: 'T',
    SUMMON_WYRM: 'R'
  };

  const spellList = Object.values(SPELLS);

  return (
    <div className="flex items-center space-x-1.5 bg-black/75 border-2 border-[#d4af37] p-1.5 rounded-lg shadow-2xl backdrop-blur-sm select-none overflow-x-auto max-w-full">
      {spellList.map(spell => {
        const isSelected = player.selectedSpell === spell.id;
        const cooldown = player.spellCooldowns[spell.id] || 0;
        const isReady = cooldown === 0 && player.mana >= spell.manaCost;

        return (
          <button
            key={spell.id}
            onClick={() => onSelectSpell(spell.id)}
            title={`${spell.name} (${spell.manaCost} Mana) [Hotkey: ${hotkeys[spell.id]}]\n${spell.description}`}
            className={`relative flex flex-col items-center justify-center w-12 h-14 rounded transition-all border shrink-0 ${
              isSelected
                ? 'bg-gradient-to-t from-[#854d0e] to-[#ca8a04] border-[#fde047] shadow-[0_0_10px_#fde047] scale-105 font-bold'
                : isReady
                ? 'bg-[#1e1b18] hover:bg-[#382f25] border-[#785834] text-[#e2d5c3]'
                : 'bg-[#12100e] border-[#3f3529] opacity-50 cursor-not-allowed text-[#78716c]'
            }`}
          >
            {/* Hotkey Tag */}
            <span className="absolute top-0.5 left-1 text-[8px] font-mono text-[#fde047] font-bold">
              {hotkeys[spell.id]}
            </span>

            {/* Spell Icon */}
            <span className="text-xl mt-0.5">{spell.icon}</span>

            {/* Mana Cost Tag */}
            <span className="text-[9px] font-mono text-[#38bdf8] font-bold">
              {spell.manaCost} MP
            </span>

            {/* Cooldown Overlay */}
            {cooldown > 0 && (
              <div className="absolute inset-0 bg-black/80 rounded flex items-center justify-center text-[10px] font-mono text-[#ef4444] font-bold">
                {cooldown.toFixed(1)}s
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
