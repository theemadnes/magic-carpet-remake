import * as THREE from 'three';

// Procedural Voxel Model & Retro Sprite Generator for Magic Carpet

export class VoxelModelGenerator {
  private static textureCache: Map<string, THREE.Texture> = new Map();

  // ==========================================
  // VOXEL CASTLE BUILDER (Tier 1 - 5)
  // ==========================================

  public static createVoxelCastle(level: number, owner: 'PLAYER' | 'RIVAL'): THREE.Group {
    const group = new THREE.Group();
    const isPlayer = owner === 'PLAYER';
    const mainCol = isPlayer ? 0x1e88e5 : 0xd32f2f;
    const accentCol = 0xffd700;
    const stoneCol = 0x5c4033; // Ancient stone
    const wallCol = 0x8b5a2b;

    const blockMat = new THREE.MeshLambertMaterial({ color: stoneCol, flatShading: true });
    const bannerMat = new THREE.MeshLambertMaterial({ color: mainCol, flatShading: true });
    const goldMat = new THREE.MeshLambertMaterial({ color: accentCol, flatShading: true });

    const createVoxelBox = (w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material = blockMat) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y + h / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      return mesh;
    };

    if (level === 1) {
      // Level 1: Nomad Bedouin Voxel Tent
      createVoxelBox(4.0, 0.4, 4.0, 0, 0, 0, blockMat); // Foundation
      createVoxelBox(3.2, 2.2, 3.2, 0, 0.4, 0, bannerMat); // Tent Body
      // Center Tent Peak
      createVoxelBox(1.6, 1.4, 1.6, 0, 2.6, 0, bannerMat);
      createVoxelBox(0.4, 1.2, 0.4, 0, 4.0, 0, goldMat); // Peak Totem
    } else if (level === 2) {
      // Level 2: Wooden / Stone Outpost & Palisade
      createVoxelBox(5.0, 0.6, 5.0, 0, 0, 0, blockMat);
      createVoxelBox(3.8, 3.2, 3.8, 0, 0.6, 0, blockMat);
      // 4 Corner Wooden Towers
      const corners = [[-2, -2], [2, -2], [-2, 2], [2, 2]];
      corners.forEach(([cx, cz]) => {
        createVoxelBox(1.0, 4.8, 1.0, cx, 0.6, cz, bannerMat);
      });
      // Central Banner
      createVoxelBox(0.3, 2.0, 0.3, 0, 3.8, 0, goldMat);
    } else if (level === 3) {
      // Level 3: Stone Keep & Watchtowers
      createVoxelBox(6.0, 0.8, 6.0, 0, 0, 0, blockMat);
      createVoxelBox(4.6, 4.5, 4.6, 0, 0.8, 0, blockMat);
      // 4 Heavy Corner Bastions
      const corners = [[-2.5, -2.5], [2.5, -2.5], [-2.5, 2.5], [2.5, 2.5]];
      corners.forEach(([cx, cz]) => {
        createVoxelBox(1.6, 6.5, 1.6, cx, 0.8, cz, blockMat);
        createVoxelBox(1.8, 0.6, 1.8, cx, 7.3, cz, bannerMat); // Battlement ring
      });
      // Central Keep Tower
      createVoxelBox(2.2, 3.5, 2.2, 0, 5.3, 0, bannerMat);
      createVoxelBox(0.8, 2.0, 0.8, 0, 8.8, 0, goldMat);
    } else if (level === 4) {
      // Level 4: Moated Citadel with Turrets
      createVoxelBox(8.0, 1.0, 8.0, 0, 0, 0, blockMat);
      createVoxelBox(6.0, 6.0, 6.0, 0, 1.0, 0, blockMat);
      // Crenellations & Corner Spires
      const corners = [[-3.2, -3.2], [3.2, -3.2], [-3.2, 3.2], [3.2, 3.2]];
      corners.forEach(([cx, cz]) => {
        createVoxelBox(2.0, 8.5, 2.0, cx, 1.0, cz, blockMat);
        createVoxelBox(1.2, 2.5, 1.2, cx, 9.5, cz, bannerMat);
      });
      // Central Citadel Spire
      createVoxelBox(3.0, 5.0, 3.0, 0, 7.0, 0, bannerMat);
      createVoxelBox(1.5, 3.0, 1.5, 0, 12.0, 0, goldMat);
    } else {
      // Level 5: Grand Arcane Voxel Fortress
      createVoxelBox(10.0, 1.2, 10.0, 0, 0, 0, blockMat);
      createVoxelBox(7.5, 8.0, 7.5, 0, 1.2, 0, blockMat);
      // 4 Massive Arcane Spires
      const corners = [[-4.0, -4.0], [4.0, -4.0], [-4.0, 4.0], [4.0, 4.0]];
      corners.forEach(([cx, cz]) => {
        createVoxelBox(2.4, 11.0, 2.4, cx, 1.2, cz, blockMat);
        createVoxelBox(1.6, 3.5, 1.6, cx, 12.2, cz, bannerMat);
        createVoxelBox(0.8, 2.0, 0.8, cx, 15.7, cz, goldMat);
      });
      // Grand Center Palace
      createVoxelBox(4.0, 7.0, 4.0, 0, 9.2, 0, bannerMat);
      createVoxelBox(2.2, 4.5, 2.2, 0, 16.2, 0, goldMat);
      // Floating Arcane Crystal
      const crystalGeo = new THREE.OctahedronGeometry(1.2, 0);
      const crystalMat = new THREE.MeshBasicMaterial({ color: isPlayer ? 0x00ffff : 0xff1744 });
      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      crystal.position.set(0, 22.0, 0);
      group.add(crystal);
    }

    return group;
  }

  // ==========================================
  // VOXEL MANA BALLOON
  // ==========================================

  public static createVoxelBalloon(owner: 'PLAYER' | 'RIVAL'): THREE.Group {
    const group = new THREE.Group();
    const isPlayer = owner === 'PLAYER';
    const primaryCol = isPlayer ? 0x00bcd4 : 0xe53935;
    const stripeCol = isPlayer ? 0xffeb3b : 0x212121;
    const woodCol = 0x6d4c41;

    const envMat1 = new THREE.MeshLambertMaterial({ color: primaryCol, flatShading: true });
    const envMat2 = new THREE.MeshLambertMaterial({ color: stripeCol, flatShading: true });
    const basketMat = new THREE.MeshLambertMaterial({ color: woodCol, flatShading: true });

    // Stepped Voxel Envelope Layers
    const layers = [
      { r: 1.4, h: 0.6, y: 0.8, mat: envMat1 },
      { r: 2.0, h: 0.8, y: 1.4, mat: envMat2 },
      { r: 2.5, h: 1.2, y: 2.2, mat: envMat1 },
      { r: 2.6, h: 1.0, y: 3.4, mat: envMat2 },
      { r: 2.2, h: 0.8, y: 4.4, mat: envMat1 },
      { r: 1.5, h: 0.6, y: 5.2, mat: envMat2 },
      { r: 0.8, h: 0.4, y: 5.8, mat: envMat1 }
    ];

    layers.forEach(l => {
      const geo = new THREE.CylinderGeometry(l.r, l.r, l.h, 10);
      const mesh = new THREE.Mesh(geo, l.mat);
      mesh.position.y = l.y;
      group.add(mesh);
    });

    // Voxel Basket
    const bGeo = new THREE.BoxGeometry(1.2, 0.8, 1.2);
    const basket = new THREE.Mesh(bGeo, basketMat);
    basket.position.y = -0.4;
    group.add(basket);

    // Glowing Burner Flame
    const burnerGeo = new THREE.OctahedronGeometry(0.35, 0);
    const burnerMat = new THREE.MeshBasicMaterial({ color: 0xffa000 });
    const burner = new THREE.Mesh(burnerGeo, burnerMat);
    burner.position.y = 0.3;
    group.add(burner);

    return group;
  }

  // ==========================================
  // RETRO 2.5D BILLBOARD SPRITES FOR CREATURES
  // ==========================================

  public static createCreatureBillboard(type: 'WYRM' | 'GRIFFIN' | 'SKELETON' | 'TROLL' | 'RIVAL_WIZARD', animTimer: number = 0): THREE.Sprite {
    const key = `${type}_${Math.floor(animTimer * 4) % 2}`;
    let texture = this.textureCache.get(key);

    if (!texture) {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, 128, 128);

      const frame = Math.floor(animTimer * 4) % 2;

      if (type === 'WYRM') {
        this.drawVoxelWyrm(ctx, frame);
      } else if (type === 'GRIFFIN') {
        this.drawVoxelGriffin(ctx, frame);
      } else if (type === 'RIVAL_WIZARD') {
        this.drawVoxelRivalWizard(ctx, frame);
      } else {
        this.drawVoxelSkeleton(ctx, frame);
      }

      texture = new THREE.CanvasTexture(canvas);
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      this.textureCache.set(key, texture);
    }

    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(type === 'WYRM' ? 6.0 : type === 'GRIFFIN' ? 5.0 : 3.5, type === 'WYRM' ? 6.0 : type === 'GRIFFIN' ? 5.0 : 3.5, 1);
    return sprite;
  }

  private static drawVoxelWyrm(ctx: CanvasRenderingContext2D, frame: number) {
    const yOff = frame * 4;
    // Sea Wyrm Green Dragon Head & Serpentine Coils
    ctx.fillStyle = '#00796b';
    ctx.fillRect(40, 20 + yOff, 48, 36); // Head
    ctx.fillRect(28, 32 + yOff, 72, 20); // Jaws

    // Pointed Crest Horns
    ctx.fillStyle = '#ffb300';
    ctx.fillRect(36, 8 + yOff, 12, 16);
    ctx.fillRect(80, 8 + yOff, 12, 16);

    // Glowing Menacing Eyes
    ctx.fillStyle = '#ff1744';
    ctx.fillRect(44, 26 + yOff, 8, 8);
    ctx.fillRect(76, 26 + yOff, 8, 8);

    // Fangs & Flaming Maw
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(40, 52 + yOff, 6, 8);
    ctx.fillRect(82, 52 + yOff, 6, 8);

    // Serpentine Body Coils in Water
    ctx.fillStyle = '#004d40';
    ctx.fillRect(32, 64 + yOff, 64, 28);
    ctx.fillRect(20, 92 + yOff, 88, 24);

    // Yellow Belly Scales
    ctx.fillStyle = '#ffd54f';
    ctx.fillRect(48, 70 + yOff, 32, 40);
  }

  private static drawVoxelGriffin(ctx: CanvasRenderingContext2D, frame: number) {
    const wingY = frame === 0 ? -8 : 10;

    // Griffin Raptor Head & Beak
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(48, 30, 32, 30);
    ctx.fillStyle = '#fbc02d'; // Golden hooked beak
    ctx.fillRect(40, 42, 16, 16);

    // Piercing Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(60, 36, 8, 8);
    ctx.fillStyle = '#d50000';
    ctx.fillRect(62, 38, 4, 4);

    // Feathered Wings (Flapping Animation)
    ctx.fillStyle = '#bcaaa4';
    ctx.fillRect(8, 20 + wingY, 40, 24);
    ctx.fillRect(80, 20 + wingY, 40, 24);
    ctx.fillStyle = '#d7ccc8';
    ctx.fillRect(0, 14 + wingY, 24, 18);
    ctx.fillRect(104, 14 + wingY, 24, 18);

    // Lion Body & Talons
    ctx.fillStyle = '#6d4c41';
    ctx.fillRect(44, 60, 40, 36);
    ctx.fillStyle = '#ffb300';
    ctx.fillRect(44, 96, 14, 16);
    ctx.fillRect(70, 96, 14, 16);
  }

  private static drawVoxelRivalWizard(ctx: CanvasRenderingContext2D, _frame: number) {
    // Flying Crimson Carpet
    ctx.fillStyle = '#b71c1c';
    ctx.fillRect(16, 88, 96, 16);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(24, 92, 80, 8);

    // Dark Sorcerer Robes
    ctx.fillStyle = '#212121';
    ctx.fillRect(48, 40, 32, 48);

    // Hood & Red Glowing Eyes
    ctx.fillStyle = '#311b92';
    ctx.fillRect(46, 20, 36, 28);
    ctx.fillStyle = '#ff1744';
    ctx.fillRect(52, 30, 6, 4);
    ctx.fillRect(70, 30, 6, 4);

    // Arcane Staff with Fire Orb
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(84, 10, 6, 80);
    ctx.fillStyle = '#ff3d00';
    ctx.beginPath();
    ctx.arc(87, 12, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  private static drawVoxelSkeleton(ctx: CanvasRenderingContext2D, frame: number) {
    const legOff = frame * 4;

    // Skull
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(48, 16, 32, 28);
    ctx.fillStyle = '#121212';
    ctx.fillRect(52, 24, 8, 8);
    ctx.fillRect(68, 24, 8, 8);

    // Ribcage & Spine
    ctx.fillStyle = '#bdbdbd';
    ctx.fillRect(60, 44, 8, 36);
    ctx.fillRect(44, 48, 40, 6);
    ctx.fillRect(44, 58, 40, 6);
    ctx.fillRect(44, 68, 40, 6);

    // Scimitar Blade
    ctx.fillStyle = '#90caf9';
    ctx.fillRect(88, 30, 6, 45);

    // Leg Bones
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(50, 80 + legOff, 8, 32);
    ctx.fillRect(70, 80 - legOff, 8, 32);
  }
}
