# Magic Carpet (1994) — Browser Remake

A complete, faithful browser-based 3D replica of Bullfrog Productions' ground-breaking 1994 first-person flying fantasy shooter and terraforming god-game **Magic Carpet**, created with modern WebGL (Three.js), React 19, TypeScript, Vite 8, Tailwind CSS, and the Web Audio API.

---

## 🌟 Key Features

### ✈️ 1. 6DOF Magic Carpet Flight Physics
- **Fluid Flight Controller**: Accelerate with forward throttle, climb to the heavens, dive over dunes, and bank/roll realistically into turns.
- **Dynamic 3D Woven Persian Rug**: Ornate carpet cockpit visible in the first-person viewport that pitches, rolls, and sways with flight velocity.
- **Speed Boost**: Activate afterburner mode with rushing wind particles and expanded field-of-view.

### 🌋 2. Real-Time Deformable Voxel/Heightmap Terrain
- **Living 3D Landscape**: Dynamic multi-octave desert dunes, lush oases, and turquoise ocean bays.
- **Cataclysmic Terraforming**:
  - **Crater**: Blast deep craters into the terrain with explosive shockwaves that expose underlying water or lava!
  - **Raise Volcano**: Erupt towering 3D volcanic mountains that spew molten boulders and incendiary projectiles!
  - **Earthquake**: Tear jagged tectonic fissures across the earth!

### 💎 3. The Classic Mana & Castle Economy
- **Bouncing Mana Spheres**: Slain beasts and enemy wizards explode into glowing golden Mana Spheres.
- **Possess Spell**: Tag neutral or rival mana spheres with your azure player aura.
- **Automated Mana Balloons**: Your Castle spawns hot air balloons that fly out across the realm, lock on with tractor beams, gather possessed mana, and return it to your Castle Treasury.
- **Castle Fortress Evolution (Levels 1 → 5)**:
  - Level 1: Nomad's Bedouin Tent
  - Level 2: Wooden Outpost & Palisade
  - Level 3: Stone Keep & Watchtowers
  - Level 4: Moated Citadel with Archer Turrets
  - Level 5: Grand Arcane Fortress with Auto-Firing Lightning Towers!

### 🧙‍♂️ 4. Full 13-Spell Arcane Arsenal
1. **Fireball**: Rapid-fire incandescent projectiles with explosive splash damage.
2. **Meteor Strike**: Colossal celestial boulder gouging massive craters into the earth.
3. **Lightning Bolt**: Instant high-voltage arc frying airborne and ground targets.
4. **Possess**: Arcane tractor beam to claim mana spheres.
5. **Castle**: Found a citadel or upgrade an existing base.
6. **Heal**: Restores player vitality and carpet hull integrity.
7. **Speed Boost**: Doubles flight velocity for 10 seconds.
8. **Arcane Shield**: Invulnerability bubble deflecting all incoming attacks.
9. **Raise Volcano**: Erupts an active volcanic cone.
10. **Crater**: Detonates seismic ground-cleaving shockwaves.
11. **Earthquake**: Destabilizes terrain along fault lines.
12. **Teleport**: Instant retreat recalling you to your Castle Treasury.
13. **Summon Wyrm**: Conjures an allied aquatic Sea Wyrm to hunt your foes.

### 🐉 5. Monster Ecosystem & Rival Wizard AI
- **Sea Wyrms (Leviathans)**: Giant serpentine aquatic dragons leaping from ocean depths and spitting venom.
- **Griffins / Rocs**: Winged raptors soaring through mountain skies and swooping down in claw dives.
- **Skeletons & Raiders**: Undead ground troops roaming the dunes.
- **Rival Wizard (Vhole the Warlock)**: Autonomous AI wizard flying on a rival crimson carpet, building enemy castles, launching rival balloons, and dueling you in aerial wizard battles!

### 📡 6. 3D Flight Radar & Retro Cockpit HUD
- **Circular Radar Globe**: Real-time tracking of player heading, altitude, mana spheres, monsters, castles, and balloons.
- **Health & Mana Gauges**: Dual vitality and mana columns with active treasury stats.
- **Spellbook Selector Drawer**: 13 spell runes with cooldown timers and hotkey assignments (`1 - 9`, `0`, `E`, `T`, `R`).
- **Realm Restoration Progress Bar**: Win condition tracking the accumulation of mana needed to purify the realm.

### 🎵 7. Web Audio API Procedural Sound & Music
- Doppler wind rushing modulated by flight speed.
- Fiery explosions, meteor whistles, lightning snaps, volcano rumbles, balloon burners, and mana chimes.
- Procedural Arabian / Mystical fantasy MIDI/FM exploration soundtrack and driving battle music.

---

## 🎮 Flight Controls

| Action | Primary Key | Alternate |
|---|---|---|
| **Throttle Accelerate / Brake** | `W` / `S` | — |
| **Turn Left / Right (Bank Roll)** | `A` / `D` | `Left` / `Right` Arrow |
| **Climb Ascend / Dive Descend** | `Space` / `Shift` | `C` (Dive) |
| **Pitch Look Up / Down** | `Arrow Up` / `Arrow Down` | — |
| **Cast Selected Spell** | `Left Click` (on screen) | `Enter` |
| **Quick Select Spells** | `1 - 9`, `0`, `E`, `T`, `R` | Click Spell Icon |
| **Toggle Sound / Mute** | `M` | HUD Button |
| **Controls & Spell Guide** | `H` / `?` | HUD Button |

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript + Vite 8
- **3D Graphics**: Three.js (WebGL 2)
- **Styling**: Tailwind CSS v4
- **Audio Engine**: Web Audio API Procedural Synthesizer
- **Typography**: Google Fonts (*Cinzel*, *MedievalSharp*)

---

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```

3. **Build for Production**:
   ```bash
   npm run build
   ```

4. **Preview Production Server**:
   ```bash
   npm run preview
   ```
