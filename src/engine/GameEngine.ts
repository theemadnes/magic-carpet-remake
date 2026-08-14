import * as THREE from 'three';
import { TerrainEngine } from './TerrainEngine';
import { VoxelModelGenerator } from './VoxelModelGenerator';
import {
  PlayerState,
  ManaSphere,
  ManaBalloon,
  Castle,
  Creature,
  Projectile,
  ActiveVolcano,
  SpellId,
  Faction
} from '../types/game';
import { SPELLS } from '../data/spells';
import { soundManager } from '../audio/SoundManager';

export interface GameEngineCallbacks {
  onLogMessage: (text: string, type?: 'info' | 'combat' | 'mana' | 'castle' | 'cataclysm' | 'rival') => void;
  onPlayerDamage: (damage: number) => void;
  onManaDeposit: (amount: number, faction: Faction) => void;
  onCastleDestroyed: (castle: Castle) => void;
  onVictoryCheck: (restoration: number) => void;
}

export class GameEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public terrain: TerrainEngine;

  // Flight & Player State
  public player: PlayerState;
  public keysDown: Set<string> = new Set();
  public isMouseLocked: boolean = false;
  public screenShake: number = 0;

  // World Entities
  public manaSpheres: ManaSphere[] = [];
  public balloons: ManaBalloon[] = [];
  public castles: Castle[] = [];
  public creatures: Creature[] = [];
  public projectiles: Projectile[] = [];
  public activeVolcanoes: ActiveVolcano[] = [];

  // 3D Meshes & Groups
  private waterMesh!: THREE.Mesh;
  private carpetCockpitMesh!: THREE.Group;
  private sphereMeshes: Map<string, THREE.Mesh> = new Map();
  private balloonMeshes: Map<string, THREE.Group> = new Map();
  private castleMeshes: Map<string, THREE.Group> = new Map();
  private creatureMeshes: Map<string, THREE.Sprite> = new Map();
  private projectileMeshes: Map<string, THREE.Mesh> = new Map();
  private particleGroup: THREE.Group = new THREE.Group();

  private callbacks: GameEngineCallbacks;
  private animFrameId: number | null = null;
  private lastTime: number = performance.now();
  private totalRealmTargetMana: number = 500;

  constructor(canvas: HTMLCanvasElement, callbacks: GameEngineCallbacks) {
    this.callbacks = callbacks;

    // Scene & Retro Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Azure sky
    this.scene.fog = new THREE.FogExp2(0xcde1f3, 0.006);

    // 6DOF Flight Camera
    this.camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 900);

    // Renderer (Pixelated Retro Filter Mode)
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    this.renderer.shadowMap.enabled = true;

    // Stepped Voxel Terrain
    this.terrain = new TerrainEngine();
    this.scene.add(this.terrain.mesh);

    // Initialize Subsystems
    this.initLightingAndSky();
    this.initWater();
    this.initCarpetCockpit();
    this.scene.add(this.particleGroup);

    // Initial Player State
    this.player = {
      name: 'Archmage of the Sun',
      health: 100,
      maxHealth: 100,
      mana: 100,
      maxMana: 100,
      carriedMana: 0,
      maxCarriedMana: 150,
      speed: 0,
      maxSpeed: 30,
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
    };

    this.spawnInitialWorldEntities();
    this.startLoop();
  }

  // ==========================================
  // LIGHTING & SKY
  // ==========================================

  private initLightingAndSky() {
    const ambient = new THREE.AmbientLight(0xfff5e6, 0.9);
    this.scene.add(ambient);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.5);
    sunLight.position.set(80, 160, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 500;
    this.scene.add(sunLight);

    // Sky Dome
    const skyGeo = new THREE.SphereGeometry(700, 32, 15);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x4fa3e0,
      side: THREE.BackSide
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);
  }

  private initWater() {
    const waterGeo = new THREE.PlaneGeometry(700, 700, 32, 32);
    waterGeo.rotateX(-Math.PI / 2);

    const waterMat = new THREE.MeshLambertMaterial({
      color: 0x0077be,
      transparent: true,
      opacity: 0.8,
      flatShading: true
    });

    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.position.y = 0.0;
    this.scene.add(this.waterMesh);
  }

  private initCarpetCockpit() {
    this.carpetCockpitMesh = new THREE.Group();

    // Persian Pixel Carpet Canvas Texture
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Rich Crimson & Gold Persian Rug Pattern
    ctx.fillStyle = '#8b0000';
    ctx.fillRect(0, 0, 128, 128);

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, 116, 116);

    // Medallion
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.moveTo(64, 20);
    ctx.lineTo(105, 64);
    ctx.lineTo(64, 108);
    ctx.lineTo(23, 64);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1a365d';
    ctx.beginPath();
    ctx.arc(64, 64, 22, 0, Math.PI * 2);
    ctx.fill();

    // Fringe tassels
    ctx.fillStyle = '#fff8dc';
    for (let x = 8; x < 120; x += 6) {
      ctx.fillRect(x, 0, 2, 6);
      ctx.fillRect(x, 122, 2, 6);
    }

    const carpetTex = new THREE.CanvasTexture(canvas);
    carpetTex.magFilter = THREE.NearestFilter;
    carpetTex.minFilter = THREE.NearestFilter;

    const carpetGeo = new THREE.PlaneGeometry(2.4, 3.2, 8, 8);
    carpetGeo.rotateX(-Math.PI / 2);

    const carpetMat = new THREE.MeshLambertMaterial({
      map: carpetTex,
      side: THREE.DoubleSide
    });

    const rug = new THREE.Mesh(carpetGeo, carpetMat);
    rug.position.set(0, -0.65, -1.2);
    this.carpetCockpitMesh.add(rug);

    this.scene.add(this.carpetCockpitMesh);
  }

  // ==========================================
  // SPAWN INITIAL WORLD ENTITIES
  // ==========================================

  private spawnInitialWorldEntities() {
    // 1. Initial Mana Spheres scattered across the desert
    for (let i = 0; i < 28; i++) {
      const x = (Math.random() - 0.5) * 200;
      const z = (Math.random() - 0.5) * 200;
      const groundY = this.terrain.getHeightAt(x, z);
      this.spawnManaSphere(x, Math.max(1.2, groundY + 1.8), z, 10, 'NEUTRAL');
    }

    // 2. Sea Wyrms in ocean waters
    this.spawnCreature('WYRM', 'Sea Wyrm Leviathan', -65, 0, -55, 'NEUTRAL', 90, 40);
    this.spawnCreature('WYRM', 'Abyssal Serpent', 80, 0, -65, 'NEUTRAL', 90, 40);

    // 3. Griffins in mountain skies
    this.spawnCreature('GRIFFIN', 'Sky Roc Griffin', -45, 26, 65, 'NEUTRAL', 60, 30);
    this.spawnCreature('GRIFFIN', 'Golden Griffin', 55, 32, 45, 'NEUTRAL', 60, 30);

    // 4. Skeletons roaming the dunes
    this.spawnCreature('SKELETON', 'Undead Raider', -25, 8, -15, 'NEUTRAL', 35, 15);
    this.spawnCreature('SKELETON', 'Bone Warrior', 35, 7, 25, 'NEUTRAL', 35, 15);

    // 5. Rival Wizard (Vhole the Warlock) & Rival Castle
    this.spawnCreature('RIVAL_WIZARD', 'Vhole the Warlock', 65, 18, -50, 'RIVAL', 160, 100);
    this.buildCastle(65, -50, 'RIVAL');
  }

  // ==========================================
  // GAME LOOP & FLIGHT PHYSICS
  // ==========================================

  private startLoop() {
    const loop = (time: number) => {
      const dt = Math.min((time - this.lastTime) / 1000, 0.1);
      this.lastTime = time;

      this.update(dt);
      this.render();

      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  public stopLoop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private update(dt: number) {
    this.updatePlayerFlight(dt);
    this.updateCooldowns(dt);
    this.updateManaSpheres(dt);
    this.updateBalloons(dt);
    this.updateCastles(dt);
    this.updateCreatures(dt);
    this.updateProjectiles(dt);
    this.updateVolcanoes(dt);
    this.updateWaterWaves();
  }

  private updatePlayerFlight(dt: number) {
    const isBoosted = this.player.activeSpeedTimer > 0;
    const accel = isBoosted ? 38.0 : 22.0;
    const maxSpd = isBoosted ? 48.0 : this.player.maxSpeed;
    const turnRate = 2.4;

    // Pitch & Yaw turning
    if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) {
      this.player.yaw += turnRate * dt;
      this.player.roll = THREE.MathUtils.lerp(this.player.roll, 0.45, dt * 5.0);
    } else if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) {
      this.player.yaw -= turnRate * dt;
      this.player.roll = THREE.MathUtils.lerp(this.player.roll, -0.45, dt * 5.0);
    } else {
      this.player.roll = THREE.MathUtils.lerp(this.player.roll, 0, dt * 6.0);
    }

    // Pitch (look up / down)
    if (this.keysDown.has('ArrowUp')) {
      this.player.pitch = Math.min(1.1, this.player.pitch + turnRate * 0.8 * dt);
    }
    if (this.keysDown.has('ArrowDown')) {
      this.player.pitch = Math.max(-1.1, this.player.pitch - turnRate * 0.8 * dt);
    }

    // Forward Acceleration & Throttle
    if (this.keysDown.has('KeyW')) {
      this.player.speed = Math.min(maxSpd, this.player.speed + accel * dt);
    } else if (this.keysDown.has('KeyS')) {
      this.player.speed = Math.max(0, this.player.speed - accel * 1.5 * dt);
    } else {
      this.player.speed = Math.max(0, this.player.speed - 4.0 * dt);
    }

    // Velocity Vectors
    const forwardX = -Math.sin(this.player.yaw) * Math.cos(this.player.pitch);
    const forwardY = Math.sin(this.player.pitch);
    const forwardZ = -Math.cos(this.player.yaw) * Math.cos(this.player.pitch);

    this.player.velocity.x = forwardX * this.player.speed;
    this.player.velocity.y = forwardY * this.player.speed;
    this.player.velocity.z = forwardZ * this.player.speed;

    // Altitude climb / dive keys
    if (this.keysDown.has('Space')) {
      this.player.velocity.y += 14.0;
    }
    if (this.keysDown.has('ShiftLeft') || this.keysDown.has('KeyC')) {
      this.player.velocity.y -= 14.0;
    }

    // Apply translation
    this.player.position.x += this.player.velocity.x * dt;
    this.player.position.y += this.player.velocity.y * dt;
    this.player.position.z += this.player.velocity.z * dt;

    // Bound to world
    const half = this.terrain.size / 2 - 8;
    this.player.position.x = Math.max(-half, Math.min(half, this.player.position.x));
    this.player.position.z = Math.max(-half, Math.min(half, this.player.position.z));

    // Stepped Voxel Ground Collision
    const groundH = this.terrain.getHeightAt(this.player.position.x, this.player.position.z);
    const minAlt = Math.max(0.6, groundH + 1.4);
    if (this.player.position.y < minAlt) {
      this.player.position.y = minAlt;
      this.player.velocity.y = Math.max(0, this.player.velocity.y);
    }
    if (this.player.position.y > 100) {
      this.player.position.y = 100;
    }

    // Update Camera & Cockpit Rug position
    this.camera.position.set(this.player.position.x, this.player.position.y, this.player.position.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.player.yaw;
    this.camera.rotation.x = this.player.pitch;
    this.camera.rotation.z = this.player.roll;

    this.carpetCockpitMesh.position.copy(this.camera.position);
    this.carpetCockpitMesh.rotation.copy(this.camera.rotation);

    // Audio Wind Rush modulation
    soundManager.updateFlightSpeed(this.player.speed / this.player.maxSpeed);

    // Natural Mana Regeneration near Player Castle
    const playerCastle = this.castles.find(c => c.owner === 'PLAYER');
    if (playerCastle) {
      const dToCastle = Math.hypot(playerCastle.x - this.player.position.x, playerCastle.z - this.player.position.z);
      if (dToCastle < 28) {
        this.player.mana = Math.min(this.player.maxMana, this.player.mana + 15 * dt);
        this.player.health = Math.min(this.player.maxHealth, this.player.health + 8 * dt);
      }
    }
  }

  private updateCooldowns(dt: number) {
    if (this.player.activeShieldTimer > 0) {
      this.player.activeShieldTimer = Math.max(0, this.player.activeShieldTimer - dt);
    }
    if (this.player.activeSpeedTimer > 0) {
      this.player.activeSpeedTimer = Math.max(0, this.player.activeSpeedTimer - dt);
    }

    for (const k in this.player.spellCooldowns) {
      const spellKey = k as SpellId;
      if (this.player.spellCooldowns[spellKey] > 0) {
        this.player.spellCooldowns[spellKey] = Math.max(0, this.player.spellCooldowns[spellKey] - dt);
      }
    }
  }

  // ==========================================
  // FACETED VOXEL MANA SPHERES
  // ==========================================

  public spawnManaSphere(x: number, y: number, z: number, value: number, owner: Faction = 'NEUTRAL') {
    const id = `mana_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const sphere: ManaSphere = {
      id,
      x,
      y,
      z,
      vx: (Math.random() - 0.5) * 4,
      vy: 4.5 + Math.random() * 3,
      vz: (Math.random() - 0.5) * 4,
      value,
      owner,
      age: 0
    };
    this.manaSpheres.push(sphere);

    // 12-sided Faceted Voxel Mana Orb
    const sphereGeo = new THREE.DodecahedronGeometry(0.7, 0);
    const col = owner === 'PLAYER' ? 0x00ffff : owner === 'RIVAL' ? 0xff2222 : 0xffd700;
    const sphereMat = new THREE.MeshLambertMaterial({ color: col, flatShading: true });
    const mesh = new THREE.Mesh(sphereGeo, sphereMat);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
    this.sphereMeshes.set(id, mesh);
  }

  private updateManaSpheres(dt: number) {
    for (let i = this.manaSpheres.length - 1; i >= 0; i--) {
      const s = this.manaSpheres[i];
      s.age += dt;

      // Physics: Gravity & ground bounce
      s.vy -= 9.8 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.z += s.vz * dt;

      const groundY = Math.max(0, this.terrain.getHeightAt(s.x, s.z));
      if (s.y <= groundY + 0.7) {
        s.y = groundY + 0.7;
        s.vy = Math.abs(s.vy) * 0.65;
        s.vx *= 0.85;
        s.vz *= 0.85;
      }

      const mesh = this.sphereMeshes.get(s.id);
      if (mesh) {
        mesh.position.set(s.x, s.y, s.z);
        mesh.rotation.y += 1.5 * dt;
        mesh.rotation.x += 1.0 * dt;
        const col = s.owner === 'PLAYER' ? 0x00e5ff : s.owner === 'RIVAL' ? 0xff3333 : 0xffd700;
        (mesh.material as THREE.MeshLambertMaterial).color.setHex(col);
      }
    }
  }

  // ==========================================
  // VOXEL MANA BALLOONS
  // ==========================================

  public spawnBalloon(castle: Castle) {
    const id = `balloon_${castle.id}`;
    const balloon: ManaBalloon = {
      id,
      owner: castle.owner,
      castleId: castle.id,
      x: castle.x,
      y: castle.y + 10,
      z: castle.z,
      vx: 0,
      vy: 0,
      vz: 0,
      health: 100,
      maxHealth: 100,
      capacity: 100,
      cargo: 0,
      state: 'IDLE',
      targetManaId: null,
      harvestProgress: 0
    };
    this.balloons.push(balloon);

    // Stepped Voxel Balloon
    const group = VoxelModelGenerator.createVoxelBalloon(castle.owner as 'PLAYER' | 'RIVAL');
    group.position.set(balloon.x, balloon.y, balloon.z);
    this.scene.add(group);
    this.balloonMeshes.set(id, group);
  }

  private updateBalloons(dt: number) {
    this.balloons.forEach(b => {
      const castle = this.castles.find(c => c.id === b.castleId);
      if (!castle) return;

      const group = this.balloonMeshes.get(b.id);
      if (group) group.position.set(b.x, b.y, b.z);

      if (b.cargo >= b.capacity || (!b.targetManaId && b.cargo > 0)) {
        b.state = 'RETURNING';
      }

      if (b.state === 'RETURNING') {
        const dx = castle.x - b.x;
        const dz = castle.z - b.z;
        const dist = Math.hypot(dx, dz);

        if (dist < 4.5) {
          castle.storedMana += b.cargo;
          this.callbacks.onManaDeposit(b.cargo, b.owner);
          if (b.owner === 'PLAYER') {
            soundManager.playManaClaim();
            this.callbacks.onLogMessage(`Your Voxel Balloon deposited +${b.cargo} Mana into Castle Treasury!`, 'mana');
            this.player.score += b.cargo * 10;
          }
          b.cargo = 0;
          b.state = 'IDLE';
        } else {
          b.x += (dx / dist) * 15 * dt;
          b.z += (dz / dist) * 15 * dt;
          b.y = THREE.MathUtils.lerp(b.y, castle.y + 12, dt * 2.0);
        }
        return;
      }

      if (!b.targetManaId || !this.manaSpheres.some(s => s.id === b.targetManaId)) {
        const availableMana = this.manaSpheres.filter(s => s.owner === b.owner && (!s.claimedByBalloon || s.claimedByBalloon === b.id));
        if (availableMana.length > 0) {
          availableMana.sort((a, bSphere) => Math.hypot(a.x - b.x, a.z - b.z) - Math.hypot(bSphere.x - b.x, bSphere.z - b.z));
          b.targetManaId = availableMana[0].id;
          availableMana[0].claimedByBalloon = b.id;
          b.state = 'SEEKING';
        } else {
          b.state = b.cargo > 0 ? 'RETURNING' : 'IDLE';
        }
      }

      if (b.targetManaId) {
        const target = this.manaSpheres.find(s => s.id === b.targetManaId);
        if (target) {
          const dx = target.x - b.x;
          const dz = target.z - b.z;
          const dist = Math.hypot(dx, dz);

          if (dist < 3.2) {
            b.cargo += target.value;
            this.removeManaSphere(target.id);
            b.targetManaId = null;
            if (b.cargo >= b.capacity) {
              b.state = 'RETURNING';
            }
          } else {
            b.x += (dx / dist) * 15 * dt;
            b.z += (dz / dist) * 15 * dt;
            b.y = THREE.MathUtils.lerp(b.y, Math.max(8, target.y + 4.0), dt * 3.0);
          }
        }
      }
    });
  }

  private removeManaSphere(id: string) {
    const idx = this.manaSpheres.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.manaSpheres.splice(idx, 1);
      const mesh = this.sphereMeshes.get(id);
      if (mesh) {
        this.scene.remove(mesh);
        this.sphereMeshes.delete(id);
      }
    }
  }

  // ==========================================
  // VOXEL CASTLES & TURRETS
  // ==========================================

  public buildCastle(x: number, z: number, owner: Faction) {
    const groundY = Math.max(0, this.terrain.getHeightAt(x, z));
    const castleId = `castle_${owner.toLowerCase()}_${Date.now()}`;

    const castle: Castle = {
      id: castleId,
      owner,
      x,
      y: groundY,
      z,
      level: 1,
      health: 300,
      maxHealth: 300,
      storedMana: 0,
      capacity: 250,
      turretCooldown: 2.0,
      lastTurretFire: 0
    };
    this.castles.push(castle);

    // Stepped Voxel Castle Keep
    const group = VoxelModelGenerator.createVoxelCastle(1, owner as 'PLAYER' | 'RIVAL');
    group.position.set(x, groundY, z);
    this.scene.add(group);
    this.castleMeshes.set(castleId, group);

    this.spawnBalloon(castle);

    if (owner === 'PLAYER') {
      this.player.hasCastle = true;
      this.player.castleLevel = 1;
      soundManager.playCastleLevelUp();
      this.callbacks.onLogMessage('Your Voxel Citadel has been founded! A Mana Balloon launched to claim spheres.', 'castle');
    }
  }

  private updateCastles(dt: number) {
    const now = performance.now() / 1000;

    this.castles.forEach(c => {
      // Check Castle Auto-Upgrade
      if (c.level < 5 && c.storedMana >= c.level * 100) {
        c.level++;
        c.maxHealth += 200;
        c.health = c.maxHealth;
        c.capacity += 200;

        // Rebuild Voxel Model for upgraded level
        const oldGroup = this.castleMeshes.get(c.id);
        if (oldGroup) this.scene.remove(oldGroup);

        const newGroup = VoxelModelGenerator.createVoxelCastle(c.level, c.owner as 'PLAYER' | 'RIVAL');
        newGroup.position.set(c.x, c.y, c.z);
        this.scene.add(newGroup);
        this.castleMeshes.set(c.id, newGroup);

        if (c.owner === 'PLAYER') {
          this.player.castleLevel = c.level;
          soundManager.playCastleLevelUp();
          this.callbacks.onLogMessage(`Castle upgraded to Level ${c.level}! Voxel battlements and defenses expanded!`, 'castle');
        }
      }

      // Castle Defensive Turrets
      if (now - c.lastTurretFire > c.turretCooldown) {
        c.lastTurretFire = now;

        let targetPos: { x: number; y: number; z: number } | null = null;
        if (c.owner === 'PLAYER') {
          const enemy = this.creatures.find(cr => cr.faction !== 'PLAYER' && Math.hypot(cr.x - c.x, cr.z - c.z) < 45);
          if (enemy) targetPos = { x: enemy.x, y: enemy.y, z: enemy.z };
        } else {
          if (Math.hypot(this.player.position.x - c.x, this.player.position.z - c.z) < 45) {
            targetPos = this.player.position;
          }
        }

        if (targetPos) {
          const dx = targetPos.x - c.x;
          const dy = targetPos.y - (c.y + 6.0);
          const dz = targetPos.z - c.z;
          const dist = Math.hypot(dx, dy, dz);

          this.spawnProjectile({
            id: `turret_${Date.now()}`,
            type: 'TURRET_BOLT',
            caster: c.owner,
            x: c.x,
            y: c.y + 7.0,
            z: c.z,
            vx: (dx / dist) * 36.0,
            vy: (dy / dist) * 36.0,
            vz: (dz / dist) * 36.0,
            damage: 15 + c.level * 5,
            radius: 0.45,
            lifetime: 2.0,
            maxLifetime: 2.0
          });
          soundManager.playLightning();
        }
      }
    });

    // Check Victory
    const playerCastle = this.castles.find(c => c.owner === 'PLAYER');
    if (playerCastle) {
      const ratio = Math.min(100, Math.round((playerCastle.storedMana / this.totalRealmTargetMana) * 100));
      this.player.restorationPercentage = ratio;
      this.callbacks.onVictoryCheck(ratio);
    }
  }

  // ==========================================
  // CREATURES & RIVAL WIZARD AI
  // ==========================================

  public spawnCreature(
    type: Creature['type'],
    name: string,
    x: number,
    y: number,
    z: number,
    faction: Faction = 'NEUTRAL',
    health: number = 50,
    manaReward: number = 25
  ) {
    const id = `creature_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const creature: Creature = {
      id,
      name,
      type,
      faction,
      x,
      y,
      z,
      vx: 0,
      vy: 0,
      vz: 0,
      pitch: 0,
      yaw: 0,
      health,
      maxHealth: health,
      manaReward,
      state: 'PATROL',
      attackCooldown: type === 'WYRM' ? 2.5 : type === 'GRIFFIN' ? 2.0 : 1.5,
      lastAttackTime: 0,
      animTimer: 0
    };
    this.creatures.push(creature);

    // Retro 2.5D Billboard Sprite
    const sprite = VoxelModelGenerator.createCreatureBillboard(type, 0);
    sprite.position.set(x, y, z);
    this.scene.add(sprite);
    this.creatureMeshes.set(id, sprite);
  }

  private updateCreatures(dt: number) {
    const now = performance.now() / 1000;

    for (let i = this.creatures.length - 1; i >= 0; i--) {
      const c = this.creatures[i];
      const sprite = this.creatureMeshes.get(c.id);

      if (c.health <= 0) {
        soundManager.playCreatureRoar(c.type);
        this.spawnManaSphere(c.x, c.y + 1.8, c.z, c.manaReward, 'NEUTRAL');
        if (sprite) this.scene.remove(sprite);
        this.creatureMeshes.delete(c.id);
        this.creatures.splice(i, 1);
        this.callbacks.onLogMessage(`${c.name} was defeated! (+${c.manaReward} Mana)`, 'combat');
        continue;
      }

      c.animTimer += dt;
      const distToPlayer = Math.hypot(c.x - this.player.position.x, c.z - this.player.position.z);

      if (c.type === 'WYRM') {
        c.y = Math.sin(c.animTimer * 1.5) * 4.2;

        if (distToPlayer < 45 && now - c.lastAttackTime > c.attackCooldown) {
          c.lastAttackTime = now;
          soundManager.playCreatureRoar('WYRM');
          const dx = this.player.position.x - c.x;
          const dy = this.player.position.y - c.y;
          const dz = this.player.position.z - c.z;
          const d = Math.hypot(dx, dy, dz);

          this.spawnProjectile({
            id: `venom_${Date.now()}`,
            type: 'WYRM_VENOM',
            caster: 'NEUTRAL',
            x: c.x,
            y: c.y + 2.0,
            z: c.z,
            vx: (dx / d) * 25.0,
            vy: (dy / d) * 25.0,
            vz: (dz / d) * 25.0,
            damage: 18,
            radius: 0.5,
            lifetime: 3.0,
            maxLifetime: 3.0
          });
        }
      } else if (c.type === 'GRIFFIN') {
        c.yaw += 0.8 * dt;
        c.x += Math.sin(c.yaw) * 16 * dt;
        c.z += Math.cos(c.yaw) * 16 * dt;

        if (distToPlayer < 32 && now - c.lastAttackTime > c.attackCooldown) {
          c.lastAttackTime = now;
          soundManager.playCreatureRoar('GRIFFIN');
          if (this.player.activeShieldTimer <= 0) {
            this.callbacks.onPlayerDamage(14);
            soundManager.playExplosion(0.4);
            this.callbacks.onLogMessage('A Griffin swoops and claws your carpet! (-14 HP)', 'combat');
          }
        }
      } else if (c.type === 'RIVAL_WIZARD') {
        const dx = this.player.position.x - c.x;
        const dz = this.player.position.z - c.z;
        const d = Math.hypot(dx, dz);

        if (d > 22) {
          c.x += (dx / d) * 16 * dt;
          c.z += (dz / d) * 16 * dt;
        }

        if (d < 50 && now - c.lastAttackTime > c.attackCooldown) {
          c.lastAttackTime = now;
          soundManager.playFireballCast();
          this.spawnProjectile({
            id: `rival_fire_${Date.now()}`,
            type: 'FIREBALL',
            caster: 'RIVAL',
            x: c.x,
            y: c.y,
            z: c.z,
            vx: (dx / d) * 28.0,
            vy: ((this.player.position.y - c.y) / d) * 28.0,
            vz: (dz / d) * 28.0,
            damage: 22,
            radius: 0.6,
            lifetime: 3.0,
            maxLifetime: 3.0
          });
        }
      }

      if (sprite) {
        sprite.position.set(c.x, c.y, c.z);
      }
    }
  }

  // ==========================================
  // PROJECTILES & CATACLYSMS
  // ==========================================

  public spawnProjectile(proj: Projectile) {
    this.projectiles.push(proj);

    // Faceted Voxel Projectile
    const geo = new THREE.DodecahedronGeometry(proj.radius, 0);
    let col = 0xff4500;
    if (proj.type === 'METEOR') col = 0xff1744;
    if (proj.type === 'LIGHTNING' || proj.type === 'TURRET_BOLT') col = 0x00e5ff;
    if (proj.type === 'WYRM_VENOM') col = 0x00e676;

    const mat = new THREE.MeshBasicMaterial({ color: col });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(proj.x, proj.y, proj.z);
    this.scene.add(mesh);
    this.projectileMeshes.set(proj.id, mesh);
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.lifetime -= dt;

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;

      const mesh = this.projectileMeshes.get(p.id);
      if (mesh) mesh.position.set(p.x, p.y, p.z);

      let impact = false;

      // Ground impact & stepped voxel deformation
      const groundH = this.terrain.getHeightAt(p.x, p.z);
      if (p.y <= groundH || p.y <= 0) {
        impact = true;
        if (p.type === 'METEOR') {
          this.terrain.deformCrater(p.x, p.z, 16.0, 9.0);
          soundManager.playExplosion(2.2);
          this.screenShake = 0.8;
          this.callbacks.onLogMessage('METEOR IMPACT! A stepped voxel crater has been carved into the earth!', 'cataclysm');
        } else if (p.type === 'FIREBALL') {
          this.terrain.deformCrater(p.x, p.z, 5.0, 1.8);
          soundManager.playExplosion(1.0);
        }
      }

      // Player Collision
      if (p.caster !== 'PLAYER' && !impact) {
        const dToPlayer = Math.hypot(p.x - this.player.position.x, p.y - this.player.position.y, p.z - this.player.position.z);
        if (dToPlayer < 2.0) {
          impact = true;
          if (this.player.activeShieldTimer <= 0) {
            this.callbacks.onPlayerDamage(p.damage);
            soundManager.playExplosion(0.8);
            this.callbacks.onLogMessage(`Hit! You took ${p.damage} damage!`, 'combat');
          } else {
            this.callbacks.onLogMessage('Your Arcane Shield deflected the attack!', 'info');
          }
        }
      }

      // Creature Collision
      if (p.caster === 'PLAYER' && !impact) {
        for (const c of this.creatures) {
          const d = Math.hypot(p.x - c.x, p.y - c.y, p.z - c.z);
          if (d < 3.2) {
            impact = true;
            c.health -= p.damage;
            soundManager.playExplosion(0.8);
            this.callbacks.onLogMessage(`Hit ${c.name} for ${p.damage} damage! [${Math.max(0, c.health)}/${c.maxHealth} HP]`, 'combat');
            break;
          }
        }
      }

      if (impact || p.lifetime <= 0) {
        if (mesh) {
          this.scene.remove(mesh);
          this.projectileMeshes.delete(p.id);
        }
        this.projectiles.splice(i, 1);
      }
    }
  }

  // ==========================================
  // ACTIVE VOLCANOES
  // ==========================================

  public spawnVolcano(x: number, z: number) {
    const peakY = this.terrain.getHeightAt(x, z) + 24.0;
    this.terrain.deformVolcano(x, z, 22.0, 24.0);

    const volcano: ActiveVolcano = {
      id: `volcano_${Date.now()}`,
      x,
      z,
      peakY,
      radius: 22.0,
      height: 24.0,
      duration: 35.0,
      nextEruptTime: 0
    };
    this.activeVolcanoes.push(volcano);

    soundManager.playVolcanoErupt();
    this.screenShake = 1.0;
    this.callbacks.onLogMessage('RAISE VOLCANO: A stepped voxel volcano erupts with fiery magma!', 'cataclysm');
  }

  private updateVolcanoes(dt: number) {
    const now = performance.now() / 1000;

    for (let i = this.activeVolcanoes.length - 1; i >= 0; i--) {
      const v = this.activeVolcanoes[i];
      v.duration -= dt;

      if (now > v.nextEruptTime) {
        v.nextEruptTime = now + 1.8;
        soundManager.playVolcanoErupt();

        for (let r = 0; r < 3; r++) {
          const angle = Math.random() * Math.PI * 2;
          const spd = 14 + Math.random() * 12;

          this.spawnProjectile({
            id: `vrock_${Date.now()}_${r}`,
            type: 'FIREBALL',
            caster: 'NEUTRAL',
            x: v.x,
            y: v.peakY,
            z: v.z,
            vx: Math.cos(angle) * spd,
            vy: 20.0 + Math.random() * 10,
            vz: Math.sin(angle) * spd,
            damage: 35,
            radius: 1.0,
            lifetime: 4.0,
            maxLifetime: 4.0
          });
        }
      }

      if (v.duration <= 0) {
        this.activeVolcanoes.splice(i, 1);
      }
    }
  }

  // ==========================================
  // SPELL CASTING DISPATCHER
  // ==========================================

  public castSpell(spellId: SpellId) {
    const def = SPELLS[spellId];
    if (!def) return;

    if (this.player.mana < def.manaCost) {
      this.callbacks.onLogMessage('Not enough Mana to cast this spell!', 'info');
      return;
    }
    if (this.player.spellCooldowns[spellId] > 0) return;

    this.player.mana -= def.manaCost;
    this.player.spellCooldowns[spellId] = def.cooldown;

    const forwardX = -Math.sin(this.player.yaw) * Math.cos(this.player.pitch);
    const forwardY = Math.sin(this.player.pitch);
    const forwardZ = -Math.cos(this.player.yaw) * Math.cos(this.player.pitch);

    switch (spellId) {
      case 'FIREBALL':
        soundManager.playFireballCast();
        this.spawnProjectile({
          id: `fire_${Date.now()}`,
          type: 'FIREBALL',
          caster: 'PLAYER',
          x: this.player.position.x + forwardX * 2,
          y: this.player.position.y + forwardY * 2,
          z: this.player.position.z + forwardZ * 2,
          vx: forwardX * 45.0,
          vy: forwardY * 45.0,
          vz: forwardZ * 45.0,
          damage: 30,
          radius: 0.6,
          lifetime: 3.5,
          maxLifetime: 3.5
        });
        break;

      case 'METEOR':
        soundManager.playMeteor();
        this.spawnProjectile({
          id: `meteor_${Date.now()}`,
          type: 'METEOR',
          caster: 'PLAYER',
          x: this.player.position.x + forwardX * 15,
          y: this.player.position.y + 40,
          z: this.player.position.z + forwardZ * 15,
          vx: forwardX * 25.0,
          vy: -25.0,
          vz: forwardZ * 25.0,
          damage: 80,
          radius: 2.2,
          lifetime: 4.0,
          maxLifetime: 4.0
        });
        break;

      case 'LIGHTNING':
        soundManager.playLightning();
        const target = this.creatures.find(c => Math.hypot(c.x - this.player.position.x, c.z - this.player.position.z) < 60);
        if (target) {
          target.health -= 45;
          this.callbacks.onLogMessage(`LIGHTNING strikes ${target.name} for 45 damage!`, 'combat');
        } else {
          this.callbacks.onLogMessage('LIGHTNING arcs across the storm clouds!', 'combat');
        }
        break;

      case 'POSSESS':
        soundManager.playPossess();
        let claimedCount = 0;
        this.manaSpheres.forEach(s => {
          const d = Math.hypot(s.x - this.player.position.x, s.z - this.player.position.z);
          if (d < 35 && s.owner !== 'PLAYER') {
            s.owner = 'PLAYER';
            claimedCount++;
          }
        });
        this.callbacks.onLogMessage(`POSSESS: Converted ${claimedCount} Mana Spheres to your blue aura!`, 'mana');
        break;

      case 'CASTLE':
        this.buildCastle(this.player.position.x, this.player.position.z, 'PLAYER');
        break;

      case 'HEAL':
        soundManager.playPossess();
        this.player.health = Math.min(this.player.maxHealth, this.player.health + 40);
        this.callbacks.onLogMessage('Pure mana restores +40 Health.', 'info');
        break;

      case 'SPEED':
        soundManager.playFireballCast();
        this.player.activeSpeedTimer = 10.0;
        this.callbacks.onLogMessage('AFTERBURNER SPEED: Flight speed boosted for 10s!', 'info');
        break;

      case 'SHIELD':
        soundManager.playPossess();
        this.player.activeShieldTimer = 8.0;
        this.callbacks.onLogMessage('ARCANE SHIELD: Invulnerability active for 8s!', 'info');
        break;

      case 'VOLCANO':
        this.spawnVolcano(this.player.position.x + forwardX * 25, this.player.position.z + forwardZ * 25);
        break;

      case 'CRATER':
        this.terrain.deformCrater(this.player.position.x + forwardX * 20, this.player.position.z + forwardZ * 20, 14.0, 7.0);
        soundManager.playExplosion(1.8);
        this.screenShake = 0.6;
        this.callbacks.onLogMessage('CRATER: Stepped voxel depression blasted into earth!', 'cataclysm');
        break;

      case 'EARTHQUAKE':
        this.terrain.deformEarthquake(this.player.position.x, this.player.position.z, 40.0, 5.0);
        soundManager.playVolcanoErupt();
        this.screenShake = 1.0;
        this.callbacks.onLogMessage('EARTHQUAKE: The voxel realm fractures along fault lines!', 'cataclysm');
        break;

      case 'TELEPORT':
        const castle = this.castles.find(c => c.owner === 'PLAYER');
        if (castle) {
          this.player.position.x = castle.x;
          this.player.position.z = castle.z;
          this.player.position.y = castle.y + 12.0;
          soundManager.playPossess();
          this.callbacks.onLogMessage('TELEPORT: Recalled safely to Voxel Citadel!', 'info');
        } else {
          this.callbacks.onLogMessage('You must build a Castle first before you can Teleport to it!', 'info');
        }
        break;

      case 'SUMMON_WYRM':
        soundManager.playCreatureRoar('WYRM');
        this.spawnCreature(
          'WYRM',
          'Allied Sea Wyrm',
          this.player.position.x + forwardX * 10,
          0,
          this.player.position.z + forwardZ * 10,
          'PLAYER',
          120,
          0
        );
        this.callbacks.onLogMessage('SUMMON: An allied Sea Wyrm emerges from the ocean waters!', 'combat');
        break;
    }
  }

  // ==========================================
  // WATER WAVES & RENDER
  // ==========================================

  private updateWaterWaves() {
    if (this.waterMesh) {
      this.waterMesh.position.y = Math.sin(performance.now() * 0.002) * 0.2;
    }

    if (this.screenShake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.screenShake;
      this.camera.position.y += (Math.random() - 0.5) * this.screenShake;
      this.screenShake = Math.max(0, this.screenShake - 0.05);
    }
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  public resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }
}
