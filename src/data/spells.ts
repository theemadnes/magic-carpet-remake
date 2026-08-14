import { SpellDef, SpellId } from '../types/game';

export const SPELLS: Record<SpellId, SpellDef> = {
  FIREBALL: {
    id: 'FIREBALL',
    name: 'Fireball',
    icon: '🔥',
    manaCost: 4,
    cooldown: 0.25,
    description: 'Rapidly hurls searing spheres of flame that detonate upon impact with creatures or terrain.',
    category: 'ATTACK'
  },
  METEOR: {
    id: 'METEOR',
    name: 'Meteor Strike',
    icon: '☄️',
    manaCost: 25,
    cooldown: 2.0,
    description: 'Calls down a colossal blazing celestial meteor, gouging a deep crater into the landscape.',
    category: 'TERRAFORM'
  },
  LIGHTNING: {
    id: 'LIGHTNING',
    name: 'Lightning Bolt',
    icon: '⚡',
    manaCost: 15,
    cooldown: 0.8,
    description: 'Strikes targeted airborne or ground foes instantly with high-voltage electricity.',
    category: 'ATTACK'
  },
  POSSESS: {
    id: 'POSSESS',
    name: 'Possess Mana',
    icon: '✨',
    manaCost: 2,
    cooldown: 0.3,
    description: 'Channels an arcane beam to convert neutral or rival mana spheres to your player color.',
    category: 'STRUCTURE'
  },
  CASTLE: {
    id: 'CASTLE',
    name: 'Build / Upgrade Castle',
    icon: '🏰',
    manaCost: 50,
    cooldown: 4.0,
    description: 'Erects a fortified castle base or upgrades an existing castle to expand mana storage and defenses.',
    category: 'STRUCTURE'
  },
  HEAL: {
    id: 'HEAL',
    name: 'Restore Health',
    icon: '❤️',
    manaCost: 10,
    cooldown: 1.0,
    description: 'Infuses your life essence with pure mana, healing wounds and restoring carpet vitality.',
    category: 'DEFENSE'
  },
  SPEED: {
    id: 'SPEED',
    name: 'Afterburner Boost',
    icon: '💨',
    manaCost: 8,
    cooldown: 3.0,
    description: 'Doubles your flight velocity for 10 seconds with supersonic carpet thrust.',
    category: 'DEFENSE'
  },
  SHIELD: {
    id: 'SHIELD',
    name: 'Arcane Shield',
    icon: '🛡️',
    manaCost: 20,
    cooldown: 5.0,
    description: 'Creates a shimmering spherical forcefield deflecting all incoming enemy attacks for 8 seconds.',
    category: 'DEFENSE'
  },
  VOLCANO: {
    id: 'VOLCANO',
    name: 'Raise Volcano',
    icon: '🌋',
    manaCost: 60,
    cooldown: 8.0,
    description: 'Erupts a towering 3D volcanic mountain that continually spews molten magma and fiery boulders!',
    category: 'TERRAFORM'
  },
  CRATER: {
    id: 'CRATER',
    name: 'Crater Shockwave',
    icon: '💥',
    manaCost: 35,
    cooldown: 3.0,
    description: 'Blasts a massive seismic crater into the earth, exposing underground water or lava.',
    category: 'TERRAFORM'
  },
  EARTHQUAKE: {
    id: 'EARTHQUAKE',
    name: 'Earthquake',
    icon: '🌍',
    manaCost: 45,
    cooldown: 6.0,
    description: 'Rips jagged tectonic fissures across the terrain and destabilizes enemy structures.',
    category: 'TERRAFORM'
  },
  TELEPORT: {
    id: 'TELEPORT',
    name: 'Recall to Castle',
    icon: '🌀',
    manaCost: 15,
    cooldown: 10.0,
    description: 'Instantly dematerializes and teleports you back to the safety of your Castle Treasury.',
    category: 'DEFENSE'
  },
  SUMMON_WYRM: {
    id: 'SUMMON_WYRM',
    name: 'Summon Wyrm',
    icon: '🐉',
    manaCost: 40,
    cooldown: 7.0,
    description: 'Conjures an allied aquatic Sea Wyrm to hunt down rival wizards and hostile beasts.',
    category: 'SUMMON'
  }
};
