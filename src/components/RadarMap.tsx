import React, { useRef, useEffect } from 'react';
import { PlayerState, ManaSphere, Castle, Creature, ManaBalloon } from '../types/game';

interface RadarMapProps {
  player: PlayerState;
  manaSpheres: ManaSphere[];
  castles: Castle[];
  creatures: Creature[];
  balloons: ManaBalloon[];
}

export const RadarMap: React.FC<RadarMapProps> = ({
  player,
  manaSpheres,
  castles,
  creatures,
  balloons
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radarRange = 120; // units

    // Clear
    ctx.clearRect(0, 0, size, size);

    // Radar Globe Background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.arc(center, center, center - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Concentric Range Rings
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.25)';
    ctx.lineWidth = 1;
    [0.33, 0.66, 1.0].forEach(r => {
      ctx.beginPath();
      ctx.arc(center, center, (center - 4) * r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Helper: World to Radar coordinates relative to player yaw
    const worldToRadar = (wx: number, wz: number) => {
      const dx = wx - player.position.x;
      const dz = wz - player.position.z;

      // Rotate with player heading
      const angle = -player.yaw;
      const rx = dx * Math.cos(angle) - dz * Math.sin(angle);
      const rz = dx * Math.sin(angle) + dz * Math.cos(angle);

      const scale = (center - 6) / radarRange;
      return {
        x: center + rx * scale,
        y: center + rz * scale,
        inRange: Math.hypot(dx, dz) <= radarRange
      };
    };

    // 1. Draw Castles
    castles.forEach(c => {
      const pos = worldToRadar(c.x, c.z);
      if (pos.inRange) {
        ctx.fillStyle = c.owner === 'PLAYER' ? '#00e5ff' : '#ff1744';
        ctx.fillRect(pos.x - 4, pos.y - 4, 8, 8);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(pos.x - 4, pos.y - 4, 8, 8);
      }
    });

    // 2. Draw Mana Balloons
    balloons.forEach(b => {
      const pos = worldToRadar(b.x, b.z);
      if (pos.inRange) {
        ctx.fillStyle = b.owner === 'PLAYER' ? '#e040fb' : '#ff5252';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 3. Draw Mana Spheres
    manaSpheres.forEach(s => {
      const pos = worldToRadar(s.x, s.z);
      if (pos.inRange) {
        ctx.fillStyle = s.owner === 'PLAYER' ? '#00e5ff' : s.owner === 'RIVAL' ? '#ff3d00' : '#ffd700';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 4. Draw Creatures & Rival Wizards
    creatures.forEach(cr => {
      const pos = worldToRadar(cr.x, cr.z);
      if (pos.inRange) {
        ctx.fillStyle = cr.faction === 'PLAYER' ? '#00e676' : '#ff1744';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, cr.type === 'WYRM' ? 3.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 5. Center Player Marker (Cyan Arrow facing Up)
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(center, center - 6);
    ctx.lineTo(center + 4, center + 4);
    ctx.lineTo(center - 4, center + 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [player, manaSpheres, castles, creatures, balloons]);

  return (
    <div className="flex flex-col items-center select-none">
      <div className="relative w-36 h-36 rounded-full border-2 border-[#d4af37] shadow-[0_0_12px_rgba(212,175,55,0.4)] overflow-hidden bg-black/70">
        <canvas ref={canvasRef} width={144} height={144} className="w-full h-full block" />
        <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-mono text-[#38bdf8] font-bold">
          N
        </div>
      </div>
      <div className="mt-1 text-[10px] font-mono text-[#ffd700] text-center">
        Alt: {Math.round(player.position.y)}m | Spd: {Math.round(player.speed * 2)}kts
      </div>
    </div>
  );
};
