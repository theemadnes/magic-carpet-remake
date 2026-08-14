export type Faction = 'PLAYER' | 'RIVAL' | 'NEUTRAL';

export type SpellId =
  | 'FIREBALL'
  | 'METEOR'
  | 'LIGHTNING'
  | 'POSSESS'
  | 'CASTLE'
  | 'HEAL'
  | 'SPEED'
  | 'SHIELD'
  | 'VOLCANO'
  | 'CRATER'
  | 'EARTHQUAKE'
  | 'TELEPORT'
  | 'SUMMON_WYRM';

export interface SpellDef {
  id: SpellId;
  name: string;
  icon: string;
  manaCost: number;
  cooldown: number; // in seconds
  description: string;
  category: 'ATTACK' | 'DEFENSE' | 'TERRAFORM' | 'STRUCTURE' | 'SUMMON';
}

export interface PlayerState {
  name: string;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  carriedMana: number;
  maxCarriedMana: number;
  speed: number;
  maxSpeed: number;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  pitch: number; // look up/down in radians
  yaw: number;   // heading in radians
  roll: number;  // banking angle in radians
  activeShieldTimer: number;
  activeSpeedTimer: number;
  selectedSpell: SpellId;
  spellCooldowns: Record<SpellId, number>;
  castleLevel: number;
  hasCastle: boolean;
  score: number;
  restorationPercentage: number;
}

export interface ManaSphere {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  value: number;
  owner: Faction;
  claimedByBalloon?: string;
  age: number;
}

export interface ManaBalloon {
  id: string;
  owner: Faction;
  castleId: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  health: number;
  maxHealth: number;
  capacity: number;
  cargo: number;
  state: 'IDLE' | 'SEEKING' | 'HARVESTING' | 'RETURNING' | 'DUMPING';
  targetManaId: string | null;
  harvestProgress: number;
}

export interface Castle {
  id: string;
  owner: Faction;
  x: number;
  y: number;
  z: number;
  level: number; // 1 to 5
  health: number;
  maxHealth: number;
  storedMana: number;
  capacity: number;
  turretCooldown: number;
  lastTurretFire: number;
}

export interface Creature {
  id: string;
  name: string;
  type: 'WYRM' | 'GRIFFIN' | 'SKELETON' | 'TROLL' | 'RIVAL_WIZARD';
  faction: Faction;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  pitch: number;
  yaw: number;
  health: number;
  maxHealth: number;
  manaReward: number;
  state: 'IDLE' | 'PATROL' | 'ATTACK' | 'FLEE' | 'DEAD';
  targetPos?: { x: number; y: number; z: number };
  attackCooldown: number;
  lastAttackTime: number;
  animTimer: number;
}

export interface Projectile {
  id: string;
  type: 'FIREBALL' | 'METEOR' | 'LIGHTNING' | 'POSSESS_BEAM' | 'WYRM_VENOM' | 'VOLCANO_ROCK' | 'TURRET_BOLT';
  caster: Faction;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  damage: number;
  radius: number;
  lifetime: number;
  maxLifetime: number;
}

export interface ActiveVolcano {
  id: string;
  x: number;
  z: number;
  peakY: number;
  radius: number;
  height: number;
  duration: number;
  nextEruptTime: number;
}

export interface LogMessage {
  id: string;
  text: string;
  type: 'info' | 'combat' | 'mana' | 'castle' | 'cataclysm' | 'rival';
  timestamp: number;
}
