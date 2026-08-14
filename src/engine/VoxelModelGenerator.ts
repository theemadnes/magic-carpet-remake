import * as THREE from 'three';

// High-Fidelity 3D Voxel Models & Cockpit Generator for Magic Carpet (1994)

export class VoxelModelGenerator {
  // ==========================================
  // PERSIAN MAGIC CARPET COCKPIT MODEL
  // ==========================================

  public static createCarpetCockpit(): THREE.Group {
    const group = new THREE.Group();

    // High-Detail Persian Rug Texture Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // 1. Rich Crimson Field
    ctx.fillStyle = '#800000';
    ctx.fillRect(0, 0, 512, 512);

    // 2. Ornate Golden Floral Border
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 16;
    ctx.strokeRect(20, 20, 472, 472);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 6;
    ctx.strokeRect(36, 36, 440, 440);

    // 3. Intricate Corner Arabesques
    const corners = [
      [50, 50],
      [462, 50],
      [50, 462],
      [462, 462]
    ];
    ctx.fillStyle = '#1e3a8a';
    corners.forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 4;
      ctx.stroke();
    });

    // 4. Central Large 16-Pointed Star Medallion
    ctx.save();
    ctx.translate(256, 256);
    ctx.fillStyle = '#1e3a8a'; // Royal Sapphire Blue
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI) / 8;
      const r = i % 2 === 0 ? 110 : 60;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Inner Gold Sun Center
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 5. Woven Fringe Tassels on Front & Back Edges
    ctx.fillStyle = '#fffbeb';
    for (let x = 24; x < 488; x += 12) {
      ctx.fillRect(x, 0, 5, 20);
      ctx.fillRect(x, 492, 5, 20);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;

    // Carpet Geometry (subdivided for gentle undulating wave motion)
    const carpetGeo = new THREE.PlaneGeometry(2.6, 3.4, 12, 12);
    carpetGeo.rotateX(-Math.PI / 2);

    const carpetMat = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.1
    });

    const rug = new THREE.Mesh(carpetGeo, carpetMat);
    rug.position.set(0, -0.68, -1.25);
    rug.castShadow = true;
    group.add(rug);

    // Add 3D Hanging Golden Tassels along the front lip
    const tasselMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
    for (let i = -5; i <= 5; i++) {
      const tGeo = new THREE.ConeGeometry(0.025, 0.12, 5);
      const tassel = new THREE.Mesh(tGeo, tasselMat);
      tassel.position.set(i * 0.22, -0.74, -2.9);
      group.add(tassel);
    }

    return group;
  }

  // ==========================================
  // 3D STEPPED VOXEL CASTLES (TIERS 1 - 5)
  // ==========================================

  public static createVoxelCastle(level: number, owner: 'PLAYER' | 'RIVAL'): THREE.Group {
    const group = new THREE.Group();
    const isPlayer = owner === 'PLAYER';
    const factionCol = isPlayer ? 0x1e88e5 : 0xd32f2f;
    const accentCol = 0xffd700;
    const stoneCol = 0x605045;
    const darkStoneCol = 0x3e342c;

    const stoneMat = new THREE.MeshLambertMaterial({ color: stoneCol, flatShading: true });
    const darkStoneMat = new THREE.MeshLambertMaterial({ color: darkStoneCol, flatShading: true });
    const bannerMat = new THREE.MeshLambertMaterial({ color: factionCol, flatShading: true });
    const goldMat = new THREE.MeshLambertMaterial({ color: accentCol, flatShading: true });

    const addBox = (w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material = stoneMat) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y + h / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      return mesh;
    };

    if (level === 1) {
      // Level 1: Nomad Voxel Tent & Palisade
      addBox(5.0, 0.4, 5.0, 0, 0, 0, darkStoneMat);
      addBox(3.6, 2.8, 3.6, 0, 0.4, 0, bannerMat);
      addBox(1.8, 1.8, 1.8, 0, 3.2, 0, bannerMat);
      addBox(0.4, 1.5, 0.4, 0, 5.0, 0, goldMat);
    } else if (level === 2) {
      // Level 2: Wooden / Stone Outpost with Watchtowers
      addBox(6.5, 0.6, 6.5, 0, 0, 0, darkStoneMat);
      addBox(4.5, 4.0, 4.5, 0, 0.6, 0, stoneMat);
      const corners = [[-2.5, -2.5], [2.5, -2.5], [-2.5, 2.5], [2.5, 2.5]];
      corners.forEach(([cx, cz]) => {
        addBox(1.4, 6.0, 1.4, cx, 0.6, cz, bannerMat);
      });
      addBox(0.4, 2.5, 0.4, 0, 4.6, 0, goldMat);
    } else if (level === 3) {
      // Level 3: Stone Keep & Heavy Bastions
      addBox(8.0, 0.8, 8.0, 0, 0, 0, darkStoneMat);
      addBox(5.8, 5.5, 5.8, 0, 0.8, 0, stoneMat);
      const corners = [[-3.2, -3.2], [3.2, -3.2], [-3.2, 3.2], [3.2, 3.2]];
      corners.forEach(([cx, cz]) => {
        addBox(2.0, 8.0, 2.0, cx, 0.8, cz, stoneMat);
        addBox(2.4, 0.8, 2.4, cx, 8.8, cz, bannerMat); // Battlement crest
      });
      addBox(2.8, 4.5, 2.8, 0, 6.3, 0, bannerMat);
      addBox(0.8, 2.5, 0.8, 0, 10.8, 0, goldMat);
    } else if (level === 4) {
      // Level 4: Moated Citadel with Corner Spire Turrets
      addBox(10.0, 1.0, 10.0, 0, 0, 0, darkStoneMat);
      addBox(7.2, 7.5, 7.2, 0, 1.0, 0, stoneMat);
      const corners = [[-4.0, -4.0], [4.0, -4.0], [-4.0, 4.0], [4.0, 4.0]];
      corners.forEach(([cx, cz]) => {
        addBox(2.5, 11.0, 2.5, cx, 1.0, cz, stoneMat);
        addBox(1.5, 3.5, 1.5, cx, 12.0, cz, bannerMat);
      });
      addBox(3.8, 6.0, 3.8, 0, 8.5, 0, bannerMat);
      addBox(1.8, 3.5, 1.8, 0, 14.5, 0, goldMat);
    } else {
      // Level 5: Grand Arcane Citadel & Floating Mana Core
      addBox(13.0, 1.2, 13.0, 0, 0, 0, darkStoneMat);
      addBox(9.5, 9.5, 9.5, 0, 1.2, 0, stoneMat);
      const corners = [[-5.2, -5.2], [5.2, -5.2], [-5.2, 5.2], [5.2, 5.2]];
      corners.forEach(([cx, cz]) => {
        addBox(3.0, 14.0, 3.0, cx, 1.2, cz, stoneMat);
        addBox(2.0, 4.5, 2.0, cx, 15.2, cz, bannerMat);
        addBox(1.0, 2.5, 1.0, cx, 19.7, cz, goldMat);
      });
      addBox(5.0, 8.5, 5.0, 0, 10.7, 0, bannerMat);
      addBox(2.8, 5.5, 2.8, 0, 19.2, 0, goldMat);

      // Floating Arcane Crystal
      const crystalGeo = new THREE.OctahedronGeometry(1.6, 0);
      const crystalMat = new THREE.MeshBasicMaterial({ color: isPlayer ? 0x00ffff : 0xff1744 });
      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      crystal.position.set(0, 26.5, 0);
      group.add(crystal);
    }

    return group;
  }

  // ==========================================
  // 3D STEPPED VOXEL HOT AIR BALLOON
  // ==========================================

  public static createVoxelBalloon(owner: 'PLAYER' | 'RIVAL'): THREE.Group {
    const group = new THREE.Group();
    const isPlayer = owner === 'PLAYER';
    const priCol = isPlayer ? 0x00bcd4 : 0xe53935;
    const secCol = isPlayer ? 0xffeb3b : 0x212121;
    const woodCol = 0x5d4037;

    const mat1 = new THREE.MeshLambertMaterial({ color: priCol, flatShading: true });
    const mat2 = new THREE.MeshLambertMaterial({ color: secCol, flatShading: true });
    const woodMat = new THREE.MeshLambertMaterial({ color: woodCol, flatShading: true });

    // Multi-tiered envelope
    const tiers = [
      { r: 1.2, h: 0.6, y: 0.9, mat: mat1 },
      { r: 1.8, h: 0.8, y: 1.5, mat: mat2 },
      { r: 2.4, h: 1.2, y: 2.3, mat: mat1 },
      { r: 2.5, h: 1.2, y: 3.5, mat: mat2 },
      { r: 2.1, h: 0.9, y: 4.6, mat: mat1 },
      { r: 1.4, h: 0.6, y: 5.4, mat: mat2 },
      { r: 0.8, h: 0.4, y: 6.0, mat: mat1 }
    ];

    tiers.forEach(t => {
      const geo = new THREE.CylinderGeometry(t.r, t.r, t.h, 10);
      const mesh = new THREE.Mesh(geo, t.mat);
      mesh.position.y = t.y;
      group.add(mesh);
    });

    // Wicker Basket
    const bGeo = new THREE.BoxGeometry(1.3, 0.9, 1.3);
    const basket = new THREE.Mesh(bGeo, woodMat);
    basket.position.y = -0.4;
    group.add(basket);

    // Glowing Burner Flame
    const burnerGeo = new THREE.OctahedronGeometry(0.4, 0);
    const burnerMat = new THREE.MeshBasicMaterial({ color: 0xffa000 });
    const burner = new THREE.Mesh(burnerGeo, burnerMat);
    burner.position.y = 0.35;
    group.add(burner);

    return group;
  }

  // ==========================================
  // 3D MULTI-SEGMENT UNDULATING SEA WYRM
  // ==========================================

  public static create3DWyrm(): THREE.Group {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x00897b, flatShading: true });
    const bellyMat = new THREE.MeshLambertMaterial({ color: 0xffd54f, flatShading: true });
    const crestMat = new THREE.MeshLambertMaterial({ color: 0xffa000, flatShading: true });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });

    // 1. Dragon Head
    const headGeo = new THREE.BoxGeometry(1.8, 1.4, 2.4);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.set(0, 1.2, 3.2);
    group.add(head);

    // Horns
    const hornGeo = new THREE.ConeGeometry(0.25, 1.2, 5);
    const hornL = new THREE.Mesh(hornGeo, crestMat);
    hornL.position.set(-0.6, 2.2, 2.6);
    hornL.rotation.x = -0.3;
    group.add(hornL);

    const hornR = new THREE.Mesh(hornGeo, crestMat);
    hornR.position.set(0.6, 2.2, 2.6);
    hornR.rotation.x = -0.3;
    group.add(hornR);

    // Glowing Red Eyes
    const eyeGeo = new THREE.SphereGeometry(0.25, 8, 8);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.75, 1.5, 3.8);
    group.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.75, 1.5, 3.8);
    group.add(eyeR);

    // 2. Six Articulated Body Coils
    for (let i = 0; i < 6; i++) {
      const segGeo = new THREE.CylinderGeometry(1.2 - i * 0.12, 1.3 - i * 0.12, 1.8, 8);
      const seg = new THREE.Mesh(segGeo, bodyMat);
      seg.rotation.x = Math.PI / 2;
      seg.position.set(0, 0.4, 1.8 - i * 1.6);
      seg.name = `wyrm_seg_${i}`;
      group.add(seg);

      // Yellow Belly scale
      const bGeo = new THREE.BoxGeometry(1.2 - i * 0.12, 0.3, 1.6);
      const belly = new THREE.Mesh(bGeo, bellyMat);
      belly.position.set(0, -0.4, 1.8 - i * 1.6);
      group.add(belly);
    }

    return group;
  }

  // ==========================================
  // 3D GRIFFIN MODEL WITH FLAPPING WINGS
  // ==========================================

  public static create3DGriffin(): THREE.Group {
    const group = new THREE.Group();
    const lionMat = new THREE.MeshLambertMaterial({ color: 0x8d6e63, flatShading: true });
    const beakMat = new THREE.MeshLambertMaterial({ color: 0xffb300, flatShading: true });
    const wingMat = new THREE.MeshLambertMaterial({ color: 0xd7ccc8, flatShading: true });

    // Eagle Head
    const headGeo = new THREE.BoxGeometry(1.2, 1.2, 1.4);
    const head = new THREE.Mesh(headGeo, lionMat);
    head.position.set(0, 0.8, 1.4);
    group.add(head);

    // Curved Beak
    const beakGeo = new THREE.ConeGeometry(0.35, 0.9, 5);
    const beak = new THREE.Mesh(beakGeo, beakMat);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 0.6, 2.2);
    group.add(beak);

    // Lion Body
    const bodyGeo = new THREE.BoxGeometry(1.6, 1.4, 3.2);
    const body = new THREE.Mesh(bodyGeo, lionMat);
    group.add(body);

    // Left Wing
    const wingLGeo = new THREE.BoxGeometry(3.6, 0.15, 1.6);
    const wingL = new THREE.Mesh(wingLGeo, wingMat);
    wingL.position.set(-2.2, 0.4, 0);
    wingL.name = 'griffin_wing_l';
    group.add(wingL);

    // Right Wing
    const wingRGeo = new THREE.BoxGeometry(3.6, 0.15, 1.6);
    const wingR = new THREE.Mesh(wingRGeo, wingMat);
    wingR.position.set(2.2, 0.4, 0);
    wingR.name = 'griffin_wing_r';
    group.add(wingR);

    return group;
  }

  // ==========================================
  // 3D RIVAL WIZARD ON FLYING CARPET
  // ==========================================

  public static create3DRivalWizard(): THREE.Group {
    const group = new THREE.Group();

    // Crimson Carpet
    const rugGeo = new THREE.BoxGeometry(2.2, 0.1, 3.2);
    const rugMat = new THREE.MeshLambertMaterial({ color: 0x991b1b, flatShading: true });
    const rug = new THREE.Mesh(rugGeo, rugMat);
    group.add(rug);

    // Wizard Robes & Hood
    const robeMat = new THREE.MeshLambertMaterial({ color: 0x1e1b4b, flatShading: true });
    const robeGeo = new THREE.CylinderGeometry(0.5, 0.9, 2.2, 8);
    const robe = new THREE.Mesh(robeGeo, robeMat);
    robe.position.y = 1.1;
    group.add(robe);

    // Pointed Wizard Hat
    const hatGeo = new THREE.ConeGeometry(0.8, 1.6, 8);
    const hat = new THREE.Mesh(hatGeo, robeMat);
    hat.position.y = 2.7;
    group.add(hat);

    // Arcane Staff & Fire Gem
    const staffMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
    const staffGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6);
    const staff = new THREE.Mesh(staffGeo, staffMat);
    staff.position.set(0.8, 1.3, 0.4);
    group.add(staff);

    const gemGeo = new THREE.OctahedronGeometry(0.3, 0);
    const gemMat = new THREE.MeshBasicMaterial({ color: 0xff3d00 });
    const gem = new THREE.Mesh(gemGeo, gemMat);
    gem.position.set(0.8, 2.6, 0.4);
    group.add(gem);

    return group;
  }

  // ==========================================
  // 3D SKELETON WARRIOR
  // ==========================================

  public static create3DSkeleton(): THREE.Group {
    const group = new THREE.Group();
    const boneMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee, flatShading: true });
    const steelMat = new THREE.MeshLambertMaterial({ color: 0x90caf9, flatShading: true });

    // Skull
    const skullGeo = new THREE.BoxGeometry(0.7, 0.8, 0.7);
    const skull = new THREE.Mesh(skullGeo, boneMat);
    skull.position.y = 2.4;
    group.add(skull);

    // Ribcage & Spine
    const ribGeo = new THREE.BoxGeometry(1.1, 1.2, 0.6);
    const rib = new THREE.Mesh(ribGeo, boneMat);
    rib.position.y = 1.4;
    group.add(rib);

    // Scimitar
    const swordGeo = new THREE.BoxGeometry(0.12, 1.8, 0.3);
    const sword = new THREE.Mesh(swordGeo, steelMat);
    sword.position.set(0.8, 1.4, 0.4);
    group.add(sword);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.2, 1.0, 0.2);
    const legL = new THREE.Mesh(legGeo, boneMat);
    legL.position.set(-0.3, 0.5, 0);
    group.add(legL);

    const legR = new THREE.Mesh(legGeo, boneMat);
    legR.position.set(0.3, 0.5, 0);
    group.add(legR);

    return group;
  }
}
