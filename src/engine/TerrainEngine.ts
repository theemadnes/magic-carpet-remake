import * as THREE from 'three';

// Real-Time Deformable Voxel/Heightfield Terrain Engine for Magic Carpet

export class TerrainEngine {
  public mesh: THREE.Mesh;
  public geometry: THREE.PlaneGeometry;
  public size: number = 300;     // World units
  public segments: number = 120; // 120x120 vertices grid
  public heightData: Float32Array;

  private posAttr: THREE.BufferAttribute;
  private colorAttr: THREE.BufferAttribute;

  constructor() {
    this.geometry = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
    this.geometry.rotateX(-Math.PI / 2); // Lay flat on XZ plane

    this.posAttr = this.geometry.attributes.position as THREE.BufferAttribute;
    const vertexCount = this.posAttr.count;

    this.heightData = new Float32Array(vertexCount);
    const colors = new Float32Array(vertexCount * 3);
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.colorAttr = this.geometry.attributes.color as THREE.BufferAttribute;

    this.generateProceduralTerrain();
    this.updateColorsAndNormals();

    const material = new THREE.MeshLambertMaterial({
      vertexColors: true,
      flatShading: true,
      roughness: 0.8
    } as any);

    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.receiveShadow = true;
  }

  // ==========================================
  // Procedural Island / Desert Heightmap
  // ==========================================

  private generateProceduralTerrain() {
    const cols = this.segments + 1;
    const rows = this.segments + 1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const u = c / this.segments;
        const v = r / this.segments;
        const wx = (u - 0.5) * this.size;
        const wz = (v - 0.5) * this.size;

        // Multi-octave harmonic landscape
        const dFromCenter = Math.hypot(wx, wz) / (this.size * 0.48);
        const islandFalloff = Math.max(0, 1 - Math.pow(dFromCenter, 2.2));

        const wave1 = Math.sin(wx * 0.035) * Math.cos(wz * 0.035) * 8.0;
        const wave2 = Math.sin(wx * 0.08 + 1.2) * Math.sin(wz * 0.07 + 0.8) * 3.5;
        const wave3 = Math.cos(wx * 0.15) * Math.sin(wz * 0.14) * 1.5;

        // Base height above ocean level (-2 to 18)
        let h = (wave1 + wave2 + wave3 + 4.0) * islandFalloff - (1 - islandFalloff) * 6.0;

        // Add some desert dunes
        h += Math.sin(wx * 0.06 + wz * 0.04) * 2.0;

        this.heightData[idx] = h;
        this.posAttr.setY(idx, h);
      }
    }

    this.posAttr.needsUpdate = true;
  }

  // ==========================================
  // Real-Time Dynamic Terrain Deformation
  // ==========================================

  public deformCrater(worldX: number, worldZ: number, radius: number, depth: number) {
    const cols = this.segments + 1;
    const halfSize = this.size / 2;

    for (let r = 0; r < cols; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const wx = (c / this.segments) * this.size - halfSize;
        const wz = (r / this.segments) * this.size - halfSize;

        const dist = Math.hypot(wx - worldX, wz - worldZ);
        if (dist < radius) {
          const factor = Math.cos((dist / radius) * (Math.PI / 2));
          const delta = depth * factor;

          this.heightData[idx] -= delta;
          this.posAttr.setY(idx, this.heightData[idx]);
        }
      }
    }

    this.posAttr.needsUpdate = true;
    this.updateColorsAndNormals();
  }

  public deformVolcano(worldX: number, worldZ: number, radius: number, height: number) {
    const cols = this.segments + 1;
    const halfSize = this.size / 2;

    for (let r = 0; r < cols; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const wx = (c / this.segments) * this.size - halfSize;
        const wz = (r / this.segments) * this.size - halfSize;

        const dist = Math.hypot(wx - worldX, wz - worldZ);
        if (dist < radius) {
          const factor = 1 - (dist / radius);
          let delta = height * Math.pow(factor, 1.4);

          // Central crater depression
          if (dist < radius * 0.25) {
            const craterFactor = 1 - (dist / (radius * 0.25));
            delta -= (height * 0.35) * craterFactor;
          }

          this.heightData[idx] += delta;
          this.posAttr.setY(idx, this.heightData[idx]);
        }
      }
    }

    this.posAttr.needsUpdate = true;
    this.updateColorsAndNormals();
  }

  public deformEarthquake(worldX: number, worldZ: number, radius: number, magnitude: number) {
    const cols = this.segments + 1;
    const halfSize = this.size / 2;

    for (let r = 0; r < cols; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const wx = (c / this.segments) * this.size - halfSize;
        const wz = (r / this.segments) * this.size - halfSize;

        const dist = Math.hypot(wx - worldX, wz - worldZ);
        if (dist < radius) {
          const angle = Math.atan2(wz - worldZ, wx - worldX);
          const fissure = Math.sin(angle * 6 + dist * 0.5) * magnitude;

          this.heightData[idx] += fissure;
          this.posAttr.setY(idx, this.heightData[idx]);
        }
      }
    }

    this.posAttr.needsUpdate = true;
    this.updateColorsAndNormals();
  }

  // ==========================================
  // Colors & Normals
  // ==========================================

  public updateColorsAndNormals() {
    this.geometry.computeVertexNormals();

    const cols = this.segments + 1;
    const count = this.posAttr.count;

    for (let i = 0; i < count; i++) {
      const y = this.heightData[i];

      // Biome color ramps based on height and slope
      let r = 0.85, g = 0.72, b = 0.45; // Golden Desert Sand

      if (y < 0.2) {
        // Wet sand / underwater bed
        r = 0.25; g = 0.45; b = 0.42;
      } else if (y >= 0.2 && y < 2.5) {
        // Shoreline gold
        r = 0.88; g = 0.76; b = 0.48;
      } else if (y >= 2.5 && y < 12.0) {
        // Grassy oasis / verdant hills
        r = 0.32 + Math.sin(i * 0.2) * 0.05;
        g = 0.58 + Math.cos(i * 0.3) * 0.05;
        b = 0.28;
      } else if (y >= 12.0 && y < 22.0) {
        // Brown rocky crags
        r = 0.55; g = 0.40; b = 0.28;
      } else {
        // High volcanic peak / obsidian rock
        r = 0.35; g = 0.25; b = 0.22;
      }

      this.colorAttr.setXYZ(i, r, g, b);
    }

    this.colorAttr.needsUpdate = true;
  }

  // ==========================================
  // Continuous Height Lookup
  // ==========================================

  public getHeightAt(worldX: number, worldZ: number): number {
    const halfSize = this.size / 2;
    const gx = ((worldX + halfSize) / this.size) * this.segments;
    const gz = ((worldZ + halfSize) / this.size) * this.segments;

    if (gx < 0 || gx >= this.segments || gz < 0 || gz >= this.segments) {
      return -2.0; // Deep ocean out of bounds
    }

    const c0 = Math.floor(gx);
    const r0 = Math.floor(gz);
    const c1 = Math.min(this.segments, c0 + 1);
    const r1 = Math.min(this.segments, r0 + 1);

    const tx = gx - c0;
    const tz = gz - r0;
    const stride = this.segments + 1;

    const h00 = this.heightData[r0 * stride + c0] || 0;
    const h10 = this.heightData[r0 * stride + c1] || 0;
    const h01 = this.heightData[r1 * stride + c0] || 0;
    const h11 = this.heightData[r1 * stride + c1] || 0;

    // Bilinear interpolation
    const hTop = h00 * (1 - tx) + h10 * tx;
    const hBot = h01 * (1 - tx) + h11 * tx;
    return hTop * (1 - tz) + hBot * tz;
  }
}
