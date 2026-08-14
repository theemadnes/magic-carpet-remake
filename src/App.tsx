import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { GameEngine } from './engine/GameEngine';
import {
  PlayerState,
  ManaSphere,
  Castle,
  Creature,
  ManaBalloon,
  SpellId,
  LogMessage
} from './types/game';
import { soundManager } from './audio/SoundManager';
import { SPELLS } from './data/spells';

// Components
import { RadarMap } from './components/RadarMap';
import { SpellSelector } from './components/SpellSelector';
import { MessageChronicle } from './components/MessageChronicle';
import { ControlsGuideModal } from './components/ControlsGuideModal';

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Reactive UI State
  const [player, setPlayer] = useState<PlayerState>({
    name: 'Archmage of the Sun',
    health: 100,
    maxHealth: 100,
    mana: 100,
    maxMana: 100,
    carriedMana: 0,
    maxCarriedMana: 150,
    speed: 0,
    maxSpeed: 32,
    position: { x: 0, y: 16, z: 45 },
    velocity: { x: 0, y: 0, z: 0 },
    pitch: 0,
    yaw: Math.PI,
    roll: 0,
    activeShieldTimer: 0,
    activeSpeedTimer: 0,
    selectedSpell: 'FIREBALL',
    spellCooldowns: {
      FIREBALL: 0,
      METEOR: 0,
      LIGHTNING: 0,
      POSSESS: 0,
      CASTLE: 0,
      HEAL: 0,
      SPEED: 0,
      SHIELD: 0,
      VOLCANO: 0,
      CRATER: 0,
      EARTHQUAKE: 0,
      TELEPORT: 0,
      SUMMON_WYRM: 0
    },
    castleLevel: 0,
    hasCastle: false,
    score: 0,
    restorationPercentage: 0
  });

  const [manaSpheres, setManaSpheres] = useState<ManaSphere[]>([]);
  const [castles, setCastles] = useState<Castle[]>([]);
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [balloons, setBalloons] = useState<ManaBalloon[]>([]);
  const [audioMuted, setAudioMuted] = useState(false);
  const [isVoxelMode, setIsVoxelMode] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  const [messages, setMessages] = useState<LogMessage[]>([
    {
      id: 'msg_init_1',
      text: 'Welcome to the Realm of Shamir! Pilot thy Magic Carpet across the shattered lands.',
      type: 'info',
      timestamp: Date.now()
    },
    {
      id: 'msg_init_2',
      text: 'Cast Castle [5] to build thy citadel. Slay monsters and POSSESS [4] mana to restore the realm!',
      type: 'castle',
      timestamp: Date.now() + 1
    }
  ]);

  const addLogMessage = useCallback((text: string, type: LogMessage['type'] = 'info') => {
    setMessages(prev => [
      ...prev.slice(-20),
      {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        text,
        type,
        timestamp: Date.now()
      }
    ]);
  }, []);

  // Initialize Game Engine
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current, {
      onLogMessage: (text, type) => addLogMessage(text, type),
      onPlayerDamage: (dmg) => {
        if (engineRef.current) {
          engineRef.current.player.health = Math.max(0, engineRef.current.player.health - dmg);
          if (engineRef.current.player.health <= 0) {
            addLogMessage('Thy carpet dissolved! Respawning at Castle...', 'combat');
            soundManager.playExplosion(1.5);
            setTimeout(() => {
              if (engineRef.current) {
                const c = engineRef.current.castles.find(cObj => cObj.owner === 'PLAYER');
                engineRef.current.player.position = c ? { x: c.x, y: c.y + 12, z: c.z } : { x: 0, y: 16, z: 45 };
                engineRef.current.player.health = engineRef.current.player.maxHealth;
                engineRef.current.player.speed = 0;
              }
            }, 1000);
          }
        }
      },
      onManaDeposit: (_amt, _faction) => {},
      onCastleDestroyed: (castle) => {
        addLogMessage(`${castle.owner === 'PLAYER' ? 'Your' : "The Rival's"} Castle has fallen!`, 'combat');
      },
      onVictoryCheck: (restoration) => {
        if (restoration >= 100 && !hasWon) {
          setHasWon(true);
          soundManager.playCastleLevelUp();
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
          addLogMessage('VICTORY! The Realm of Shamir has been fully restored and purified!', 'castle');
        }
      }
    });

    engineRef.current = engine;

    const handleResize = () => {
      if (canvasRef.current && engineRef.current) {
        engineRef.current.resize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const syncInterval = setInterval(() => {
      if (engineRef.current) {
        setPlayer({ ...engineRef.current.player });
        setManaSpheres([...engineRef.current.manaSpheres]);
        setCastles([...engineRef.current.castles]);
        setCreatures([...engineRef.current.creatures]);
        setBalloons([...engineRef.current.balloons]);
      }
    }, 50);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(syncInterval);
      engine.stopLoop();
    };
  }, [addLogMessage, hasWon]);

  // Global Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      soundManager.unlockAudio();

      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      if (engineRef.current) {
        engineRef.current.keysDown.add(e.code);
      }

      // Hotkey Spell Quick-Selection
      if (e.key === '1') selectSpell('FIREBALL');
      if (e.key === '2') selectSpell('METEOR');
      if (e.key === '3') selectSpell('LIGHTNING');
      if (e.key === '4') selectSpell('POSSESS');
      if (e.key === '5') selectSpell('CASTLE');
      if (e.key === '6') selectSpell('HEAL');
      if (e.key === '7') selectSpell('SPEED');
      if (e.key === '8') selectSpell('SHIELD');
      if (e.key === '9') selectSpell('VOLCANO');
      if (e.key === '0') selectSpell('CRATER');
      if (e.key.toLowerCase() === 'e') selectSpell('EARTHQUAKE');
      if (e.key.toLowerCase() === 't') selectSpell('TELEPORT');
      if (e.key.toLowerCase() === 'r') selectSpell('SUMMON_WYRM');
      if (e.key.toLowerCase() === 'v') toggleVoxel();
      if (e.key.toLowerCase() === 'm') toggleAudio();
      if (e.key === 'Enter') {
        if (engineRef.current) engineRef.current.castSpell(engineRef.current.player.selectedSpell);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (engineRef.current) {
        engineRef.current.keysDown.delete(e.code);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const selectSpell = (spellId: SpellId) => {
    if (engineRef.current) {
      engineRef.current.player.selectedSpell = spellId;
      setPlayer(prev => ({ ...prev, selectedSpell: spellId }));
    }
  };

  const handleCanvasClick = () => {
    soundManager.unlockAudio();
    if (engineRef.current) {
      engineRef.current.castSpell(engineRef.current.player.selectedSpell);
    }
  };

  const toggleAudio = () => {
    const muted = soundManager.toggleMute();
    setAudioMuted(muted);
  };

  const toggleVoxel = () => {
    if (engineRef.current) {
      const mode = engineRef.current.terrain.toggleVoxelMode();
      setIsVoxelMode(mode);
      addLogMessage(`Terrain Mode: ${mode ? 'Authentic 1994 Stepped Voxel Terracing' : 'Smooth Fractal Heightfield'}`, 'info');
    }
  };

  const playerCastle = castles.find(c => c.owner === 'PLAYER');

  return (
    <div className="relative w-screen h-screen bg-[#050811] flex flex-col overflow-hidden font-serif select-none">
      {/* 3D WebGL Canvas Viewport */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full block cursor-crosshair"
      />

      {/* ================= HUD COCKPIT OVERLAY ================= */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3">
        
        {/* Top Status & Realm Restoration Bar */}
        <div className="flex items-center justify-between w-full">
          {/* Battle & Realm Chronicle */}
          <div className="pointer-events-auto">
            <MessageChronicle messages={messages} />
          </div>

          {/* Center Realm Restoration Goal Meter */}
          <div className="flex flex-col items-center bg-black/80 border-2 border-[#d4af37] px-4 py-1.5 rounded-lg shadow-2xl backdrop-blur-sm pointer-events-auto">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#ffd700]">
              <span>🌍 Realm Restoration:</span>
              <span className="font-mono text-sm">{player.restorationPercentage}%</span>
            </div>
            <div className="w-56 h-2.5 bg-[#1e293b] rounded-full border border-[#d4af37]/60 overflow-hidden mt-1">
              <div
                className="h-full bg-gradient-to-r from-[#eab308] via-[#22c55e] to-[#06b6d4] transition-all duration-300"
                style={{ width: `${player.restorationPercentage}%` }}
              />
            </div>
            <div className="text-[10px] text-[#94a3b8] mt-0.5">
              Target: 500 Mana in Castle Treasury
            </div>
          </div>

          {/* Top Right Controls & Radar */}
          <div className="flex items-start space-x-3 pointer-events-auto">
            {/* Quick Action Buttons */}
            <div className="flex flex-col space-y-1.5">
              <button
                onClick={toggleAudio}
                title="Toggle Audio [M]"
                className="p-2 bg-black/80 hover:bg-[#334155] border border-[#d4af37] rounded-lg text-[#ffd700] text-sm"
              >
                {audioMuted ? '🔇' : '🔊'}
              </button>
              <button
                onClick={toggleVoxel}
                title="Toggle Voxel Mode [V]"
                className={`p-2 bg-black/80 hover:bg-[#334155] border border-[#d4af37] rounded-lg text-xs font-bold ${
                  isVoxelMode ? 'text-[#38bdf8] border-[#38bdf8]' : 'text-[#ffd700]'
                }`}
              >
                🧱 {isVoxelMode ? 'Voxel' : 'Smooth'}
              </button>
              <button
                onClick={() => setGuideOpen(true)}
                title="Controls & Spells Guide"
                className="p-2 bg-black/80 hover:bg-[#334155] border border-[#d4af37] rounded-lg text-[#ffd700] text-xs font-bold"
              >
                ❓ Guide
              </button>
            </div>

            {/* 3D Flight Radar */}
            <RadarMap
              player={player}
              manaSpheres={manaSpheres}
              castles={castles}
              creatures={creatures}
              balloons={balloons}
            />
          </div>
        </div>

        {/* Center Aiming Reticle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-[#fde047] rounded-full shadow-[0_0_8px_#fde047]" />
            <div className="absolute inset-0 border border-[#fde047]/60 rounded-full animate-ping" />
            <div className="absolute -top-2 w-0.5 h-2 bg-[#fde047]" />
            <div className="absolute -bottom-2 w-0.5 h-2 bg-[#fde047]" />
            <div className="absolute -left-2 w-2 h-0.5 bg-[#fde047]" />
            <div className="absolute -right-2 w-2 h-0.5 bg-[#fde047]" />
          </div>
        </div>

        {/* Bottom Cockpit Bar: Health/Mana Gauges & Spell Selector */}
        <div className="flex items-end justify-between w-full pointer-events-auto">
          
          {/* Left: Health & Mana Vitality Gauges */}
          <div className="flex space-x-3 bg-black/80 border-2 border-[#d4af37] p-2.5 rounded-lg shadow-2xl backdrop-blur-sm">
            {/* Health Column */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-[#f87171] uppercase mb-1">Health</span>
              <div className="relative w-6 h-28 bg-[#1f2937] border border-[#ef4444] rounded overflow-hidden flex flex-col justify-end p-0.5">
                <div
                  className="w-full bg-gradient-to-t from-[#991b1b] to-[#ef4444] rounded transition-all duration-200"
                  style={{ height: `${Math.max(0, Math.min(100, player.health))}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-[#f87171] mt-1">
                {Math.round(player.health)}
              </span>
            </div>

            {/* Player Mana Column */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-[#38bdf8] uppercase mb-1">Mana</span>
              <div className="relative w-6 h-28 bg-[#1f2937] border border-[#0ea5e9] rounded overflow-hidden flex flex-col justify-end p-0.5">
                <div
                  className="w-full bg-gradient-to-t from-[#0369a1] to-[#38bdf8] rounded transition-all duration-200"
                  style={{ height: `${Math.max(0, Math.min(100, player.mana))}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-[#38bdf8] mt-1">
                {Math.round(player.mana)}
              </span>
            </div>

            {/* Castle Treasury Status */}
            <div className="flex flex-col justify-between pl-2 border-l border-[#334155] text-xs">
              <div>
                <div className="text-[10px] text-[#ca8a04] font-bold uppercase">Castle Citadel</div>
                <div className="font-bold text-[#ffd700] text-sm">
                  {player.hasCastle ? `Level ${player.castleLevel}` : 'No Castle'}
                </div>
              </div>
              <div className="text-[11px] text-[#94a3b8] space-y-0.5">
                <div>🏰 Treasury: <span className="font-mono text-[#38bdf8] font-bold">{playerCastle?.storedMana || 0}</span> MP</div>
                <div>🎈 Balloon: <span className="font-mono text-[#a855f7] font-bold">{balloons.find(b => b.owner === 'PLAYER')?.state || 'OFFLINE'}</span></div>
                <div>🛡️ Shield: <span className="font-mono text-[#4ade80]">{player.activeShieldTimer > 0 ? `${player.activeShieldTimer.toFixed(0)}s` : 'OFF'}</span></div>
              </div>
            </div>
          </div>

          {/* Center Bottom: Spellbook Drawer */}
          <div className="flex-1 max-w-2xl mx-3">
            <SpellSelector
              player={player}
              onSelectSpell={selectSpell}
            />
          </div>

          {/* Right Bottom: Selected Spell Action Box */}
          <div className="flex flex-col items-center bg-black/80 border-2 border-[#d4af37] p-2 rounded-lg shadow-2xl backdrop-blur-sm min-w-[140px]">
            <div className="text-[10px] text-[#ca8a04] uppercase font-bold">Active Spell</div>
            <div className="flex items-center space-x-1.5 my-1 text-sm font-bold text-[#fde047]">
              <span>{SPELLS[player.selectedSpell]?.icon}</span>
              <span>{SPELLS[player.selectedSpell]?.name}</span>
            </div>
            <button
              onClick={handleCanvasClick}
              className="w-full py-1 bg-gradient-to-r from-[#ca8a04] to-[#eab308] hover:scale-105 text-black font-bold text-xs rounded border border-[#fde047] shadow-lg cursor-pointer transition-transform"
            >
              ⚡ Cast [Enter]
            </button>
          </div>
        </div>
      </div>

      {/* Victory Banner Overlay */}
      {hasWon && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
          <div className="bg-[#1e1b18] border-4 border-[#ffd700] rounded-xl shadow-2xl p-6 max-w-lg text-center text-[#e2d5c3] space-y-3 animate-pulseGlow">
            <span className="text-5xl">👑✨</span>
            <h1 className="text-2xl font-bold text-[#ffd700] tracking-wider uppercase">
              Realm Restored to Glory!
            </h1>
            <p className="text-sm text-[#cbd5e1] leading-relaxed">
              Thou hast conquered the rival sorcerers, tamed the sea wyrms, and restored the mystical equilibrium of Shamir!
            </p>
            <div className="text-base font-mono text-[#38bdf8] font-bold">
              Final Score: {player.score + 5000} Points
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-[#854d0e] hover:bg-[#ca8a04] text-[#fde047] font-bold text-sm rounded border border-[#ffd700] cursor-pointer"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Guide & Controls Modal */}
      {guideOpen && <ControlsGuideModal onClose={() => setGuideOpen(false)} />}
    </div>
  );
};

export default App;
