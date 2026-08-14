import * as THREE from 'three';

// Advanced Terrain Engine for Magic Carpet (1994)
// Supports stepped voxel terracing and smooth fractal heightfield with rich biome palette,
// dynamic magma craters, volcanoes with glowing calderas, and real-time deformation.

export class TerrainEngine {
  public mesh: THREE.Mesh;
  public geometry: THREE.PlaneGeometry;
  public size: number = 340;        // World units
  public segments: number = 140;    // 140x140 vertices grid
  public heightGrid: Float32Array;  // Raw height values
  public isVoxelStepped: boolean = true; // Toggleable Voxel / Smooth mode

  private posAttr: THREE.BufferAttribute;
  private colorAttr: THREE.BufferAttribute;
  private material: THREE.MeshLambertMaterial;

  constructor() {
    this.geometry = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
    this.geometry.rotateX(-Math.PI / 2);

    this.posAttr = this.geometry.attributes.position as THREE.BufferAttribute;
    const vertexCount = this.posAttr.count;

    this.heightGrid = new Float32Array(vertexCount);
    const colors = new Float32Array(vertexCount * 3);
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.colorAttr = this.geometry.attributes.color as THREE.BufferAttribute;

    this.generateProceduralWorld();
    this.rebuildTerrainMesh();

    this.material = new THREE.MeshLambertMaterial({
      vertexColors: true,
      flatShading: true,
      roughness: 0.85
    } as any);

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
  }

  // ==========================================
  // PROCEDURAL BIOME & HEIGHTMAP GENERATION
  // ==========================================

  private generateProceduralWorld() {
    const cols = this.segments + 1;
    const rows = this.segments + 1;
    const half = this.size / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const wx = (c / this.segments) * this.size - half;
        const wz = (r / this.segments) * this.size - half;

        // Archipelago island falloff
        const dCenter = Math.hypot(wx, wz) / (this.size * 0.48);
        const islandMask = Math.max(0, 1 - Math.pow(dCenter, 2.2));

        // Multi-octave terrain waves
        const n1 = Math.sin(wx * 0.03) * Math.cos(wz * 0.03) * 11.0;
        const n2 = Math.sin(wx * 0.065 + 1.4) * Math.sin(wz * 0.055 + 0.6) * 4.5;
        const n3 = Math.cos(wx * 0.12) * Math.sin(wz * 0.11) * 2.0;
        const dunes = Math.sin(wx * 0.08 + wz * 0.05) * 2.2;

        let h = (n1 + n2 + n3 + 5.0) * islandMask - (1 - islandMask) * 8.0 + dunes;

        // Quantize if in voxel stepped mode
        if (this.isVoxelStepped) {
          h = Math.round(h / 0.75) * 0.75;
        }

        this.heightGrid[idx] = h;
      }
    }
  }

  // ==========================================
  // REBUILD VERTICES, PALETTE COLORS & NORMALS
  // ==========================================

  public rebuildTerrainMesh() {
    const count = this.posAttr.count;

    for (let i = 0; i < count; i++) {
      let h = this.heightGrid[i];
      if (this.isVoxelStepped) {
        h = Math.round(h / 0.75) * 0.75;
      }
      this.posAttr.setY(i, h);

      // Authentic 1994 Magic Carpet Biome Palette
      let r = 0.92, g = 0.80, b = 0.50; // Desert Sand

      if (h < 0.2) {
        // Deep water bed / submerged shoreline
        r = 0.20; g = 0.42; b = 0.40;
      } else if (h >= 0.2 && h < 2.5) {
        // Golden beach / shoreline dunes
        r = 0.93; g = 0.82; b = 0.52;
      } else if (h >= 2.5 && h < 11.0) {
        // Emerald Oasis & grassy plateaus
        r = 0.28 + (Math.sin(i * 0.3) * 0.04);
        g = 0.58 + (Math.cos(i * 0.4) * 0.04);
        b = 0.24;
      } else if (h >= 11.0 && h < 22.0) {
        // Terracotta & Brown Mesa Cliffs
        r = 0.62; g = 0.44; b = 0.28;
      } else {
        // High Volcanic Peak / Dark Obsidian or Mountain Snow
        r = 0.42; g = 0.32; b = 0.30;
      }

      this.colorAttr.setXYZ(i, r, g, b);
    }

    this.posAttr.needsUpdate = true;
    this.colorAttr.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  // ==========================================
  // DYNAMIC TERRAFORMING (CRATER, VOLCANO, EARTHQUAKE)
  // ==========================================

  public deformCrater(worldX: number, worldZ: number, radius: number, depth: number) {
    const cols = this.segments + 1;
    const half = this.size / 2;

    for (let r = 0; r < cols; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const wx = (c / this.segments) * this.size - half;
        const wz = (r / this.segments) * this.size - half;

        const dist = Math.hypot(wx - worldX, wz - worldZ);
        if (dist < radius) {
          const factor = Math.cos((dist / radius) * (Math.PI / 2));
          const delta = depth * factor;
          this.heightGrid[idx] -= delta;
        }
      }
    }

    this.rebuildTerrainMesh();
  }

  public deformVolcano(worldX: number, worldZ: number, radius: number, height: number) {
    const cols = this.segments + 1;
    const half = this.size / 2;

    for (let r = 0; r < cols; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const wx = (c / this.segments) * this.size - half;
        const wz = (r / this.segments) * this.size - half;

        const dist = Math.hypot(wx - worldX, wz - worldZ);
        if (dist < radius) {
          const factor = 1 - (dist / radius);
          let delta = height * Math.pow(factor, 1.35);

          // Central Caldera Crater depression
          if (dist < radius * 0.28) {
            const craterFactor = 1 - (dist / (radius * 0.28));
            delta -= (height * 0.38) * craterFactor;
          }

          this.heightGrid[idx] += delta;
        }
      }
    }

    this.rebuildTerrainMesh();
  }

  public deformEarthquake(worldX: number, worldZ: number, radius: number, magnitude: number) {
    const cols = this.segments + 1;
    const half = this.size / 2;

    for (let r = 0; r < cols; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const wx = (c / this.segments) * this.size - half;
        const wz = (r / this.segments) * this.size - half;

        const dist = Math.hypot(wx - worldX, wz - worldZ);
        if (dist < radius) {
          const angle = Math.atan2(wz - worldZ, wx - worldX);
          const fissure = Math.sin(angle * 5 + dist * 0.45) * magnitude;
          this.heightGrid[idx] += fissure;
        }
      }
    }

    this.rebuildTerrainMesh();
  }

  public toggleVoxelMode(): boolean {
    this.isVoxelStepped = !this.isVoxelStepped;
    this.rebuildTerrainMesh();
    return this.isVoxelStepped;
  }

  // ==========================================
  // CONTINUOUS HEIGHT LOOKUP
  // ==========================================

  public getHeightAt(worldX: number, worldZ: number): number {
    const half = this.size / 2;
    const gx = ((worldX + half) / this.size) * this.segments;
    const gz = ((worldZ + half) / this.size) * this.segments;

    if (gx < 0 || gx >= this.segments || gz < 0 || gz >= this.segments) {
      return -4.0;
    }

    const c0 = Math.floor(gx);
    const r0 = Math.floor(gz);
    const c1 = Math.min(this.segments, c0 + 1);
    const r1 = Math.min(this.segments, r0 + 1);

    const tx = gx - c0;
    const tz = gz - r0;
    const stride = this.segments + 1;

    const h00 = this.heightGrid[r0 * stride + c0] || 0;
    const h10 = this.heightGrid[r0 * stride + c1] || 0;
    const h01 = this.heightGrid[r1 * stride + c0] || 0;
    const h11 = this.heightGrid[r1 * stride + c1] || 0;

    let h = (h00 * (1 - tx) + h10 * tx) * (1 - tz) + (h01 * (1 - tx) + h11 * tx) * tz;
    if (this.isVoxelStepped) {
      h = Math.round(h / 0.75) * 0.75;
    }
    return h;
  }
}
