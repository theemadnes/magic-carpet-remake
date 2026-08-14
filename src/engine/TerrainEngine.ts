import * as THREE from 'three';

// True Stepped Voxel Heightfield Terrain Engine for Magic Carpet (1994)

export class TerrainEngine {
  public mesh: THREE.Mesh;
  public geometry: THREE.BufferGeometry;
  public size: number = 320;        // World units
  public resolution: number = 96;   // 96x96 voxel columns
  public heightGrid: Float32Array;  // (resolution + 1) * (resolution + 1)

  private cellSize: number;
  private material: THREE.MeshLambertMaterial;

  constructor() {
    this.cellSize = this.size / this.resolution;
    const stride = this.resolution + 1;
    this.heightGrid = new Float32Array(stride * stride);

    this.geometry = new THREE.BufferGeometry();
    this.generateProceduralVoxelMap();
    this.buildVoxelMeshGeometry();

    this.material = new THREE.MeshLambertMaterial({
      vertexColors: true,
      flatShading: true,
      roughness: 0.9
    } as any);

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
  }

  // ==========================================
  // PROCEDURAL VOXEL HEIGHTFIELD MAP
  // ==========================================

  private generateProceduralVoxelMap() {
    const stride = this.resolution + 1;
    const halfSize = this.size / 2;

    for (let r = 0; r <= this.resolution; r++) {
      for (let c = 0; c <= this.resolution; c++) {
        const idx = r * stride + c;
        const wx = (c / this.resolution) * this.size - halfSize;
        const wz = (r / this.resolution) * this.size - halfSize;

        // Multi-harmonic island formula
        const dFromCenter = Math.hypot(wx, wz) / (this.size * 0.48);
        const islandFalloff = Math.max(0, 1 - Math.pow(dFromCenter, 2.0));

        const wave1 = Math.sin(wx * 0.032) * Math.cos(wz * 0.032) * 10.0;
        const wave2 = Math.sin(wx * 0.07 + 1.2) * Math.sin(wz * 0.06 + 0.8) * 4.0;
        const wave3 = Math.cos(wx * 0.12) * Math.sin(wz * 0.12) * 2.0;

        let rawH = (wave1 + wave2 + wave3 + 5.0) * islandFalloff - (1 - islandFalloff) * 8.0;
        rawH += Math.sin(wx * 0.05 + wz * 0.03) * 2.5;

        // Quantize height into distinct stepped voxel blocks (0.8 unit steps)
        const voxelStep = 0.8;
        const quantizedH = Math.round(rawH / voxelStep) * voxelStep;

        this.heightGrid[idx] = quantizedH;
      }
    }
  }

  // ==========================================
  // STEPPED VOXEL MESH BUILDER
  // ==========================================

  public buildVoxelMeshGeometry() {
    const stride = this.resolution + 1;
    const halfSize = this.size / 2;
    const cs = this.cellSize;

    const positions: number[] = [];
    const normals: number[] = [];
    const colors: number[] = [];

    const getH = (c: number, r: number): number => {
      if (c < 0 || c > this.resolution || r < 0 || r > this.resolution) return -4.0;
      return this.heightGrid[r * stride + c];
    };

    // Voxel Palette Colors
    const getTopColor = (h: number): [number, number, number] => {
      if (h < 0.2) return [0.22, 0.42, 0.40];      // Submerged shore
      if (h < 3.0) return [0.92, 0.78, 0.46];      // Desert sand gold
      if (h < 12.0) return [0.32, 0.62, 0.28];     // Oasis lush green
      if (h < 22.0) return [0.58, 0.42, 0.26];     // Mesa clay brown
      return [0.88, 0.92, 0.95];                   // Mountain snow
    };

    const getSideColor = (h: number): [number, number, number] => {
      // Stratified cliff walls (darker sedimentary rock)
      const top = getTopColor(h);
      return [top[0] * 0.65, top[1] * 0.60, top[2] * 0.55];
    };

    // Helper: Push a Quad (2 Triangles)
    const addQuad = (
      p1: [number, number, number],
      p2: [number, number, number],
      p3: [number, number, number],
      p4: [number, number, number],
      norm: [number, number, number],
      col: [number, number, number]
    ) => {
      // Triangle 1: p1, p2, p3
      positions.push(...p1, ...p2, ...p3);
      normals.push(...norm, ...norm, ...norm);
      colors.push(...col, ...col, ...col);

      // Triangle 2: p1, p3, p4
      positions.push(...p1, ...p3, ...p4);
      normals.push(...norm, ...norm, ...norm);
      colors.push(...col, ...col, ...col);
    };

    for (let r = 0; r < this.resolution; r++) {
      for (let c = 0; c < this.resolution; c++) {
        const h = getH(c, r);
        const x0 = c * cs - halfSize;
        const z0 = r * cs - halfSize;
        const x1 = x0 + cs;
        const z1 = z0 + cs;

        const topCol = getTopColor(h);
        const sideCol = getSideColor(h);

        // 1. TOP HORIZONTAL VOXEL QUAD
        addQuad(
          [x0, h, z0],
          [x1, h, z0],
          [x1, h, z1],
          [x0, h, z1],
          [0, 1, 0],
          topCol
        );

        // 2. VERTICAL STEPPED CLIFF WALLS (between neighbors)
        // North Neighbor (r - 1)
        const hN = getH(c, r - 1);
        if (h > hN) {
          addQuad(
            [x1, h, z0],
            [x0, h, z0],
            [x0, hN, z0],
            [x1, hN, z0],
            [0, 0, -1],
            sideCol
          );
        }

        // South Neighbor (r + 1)
        const hS = getH(c, r + 1);
        if (h > hS) {
          addQuad(
            [x0, h, z1],
            [x1, h, z1],
            [x1, hS, z1],
            [x0, hS, z1],
            [0, 0, 1],
            sideCol
          );
        }

        // West Neighbor (c - 1)
        const hW = getH(c - 1, r);
        if (h > hW) {
          addQuad(
            [x0, h, z0],
            [x0, h, z1],
            [x0, hW, z1],
            [x0, hW, z0],
            [-1, 0, 0],
            sideCol
          );
        }

        // East Neighbor (c + 1)
        const hE = getH(c + 1, r);
        if (h > hE) {
          addQuad(
            [x1, h, z1],
            [x1, h, z0],
            [x1, hE, z0],
            [x1, hE, z1],
            [1, 0, 0],
            sideCol
          );
        }
      }
    }

    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    this.geometry.computeVertexNormals();
  }

  // ==========================================
  // REAL-TIME STEPPED VOXEL TERRAFORMING
  // ==========================================

  public deformCrater(worldX: number, worldZ: number, radius: number, depth: number) {
    const stride = this.resolution + 1;
    const halfSize = this.size / 2;
    const voxelStep = 0.8;

    for (let r = 0; r <= this.resolution; r++) {
      for (let c = 0; c <= this.resolution; c++) {
        const idx = r * stride + c;
        const wx = (c / this.resolution) * this.size - halfSize;
        const wz = (r / this.resolution) * this.size - halfSize;

        const dist = Math.hypot(wx - worldX, wz - worldZ);
        if (dist < radius) {
          const factor = Math.cos((dist / radius) * (Math.PI / 2));
          const delta = depth * factor;
          const newH = this.heightGrid[idx] - delta;
          this.heightGrid[idx] = Math.round(newH / voxelStep) * voxelStep;
        }
      }
    }

    this.buildVoxelMeshGeometry();
  }

  public deformVolcano(worldX: number, worldZ: number, radius: number, height: number) {
    const stride = this.resolution + 1;
    const halfSize = this.size / 2;
    const voxelStep = 0.8;

    for (let r = 0; r <= this.resolution; r++) {
      for (let c = 0; c <= this.resolution; c++) {
        const idx = r * stride + c;
        const wx = (c / this.resolution) * this.size - halfSize;
        const wz = (r / this.resolution) * this.size - halfSize;

        const dist = Math.hypot(wx - worldX, wz - worldZ);
        if (dist < radius) {
          const factor = 1 - (dist / radius);
          let delta = height * Math.pow(factor, 1.4);

          // Central crater depression
          if (dist < radius * 0.25) {
            const craterFactor = 1 - (dist / (radius * 0.25));
            delta -= (height * 0.35) * craterFactor;
          }

          const newH = this.heightGrid[idx] + delta;
          this.heightGrid[idx] = Math.round(newH / voxelStep) * voxelStep;
        }
      }
    }

    this.buildVoxelMeshGeometry();
  }

  public deformEarthquake(worldX: number, worldZ: number, radius: number, magnitude: number) {
    const stride = this.resolution + 1;
    const halfSize = this.size / 2;
    const voxelStep = 0.8;

    for (let r = 0; r <= this.resolution; r++) {
      for (let c = 0; c <= this.resolution; c++) {
        const idx = r * stride + c;
        const wx = (c / this.resolution) * this.size - halfSize;
        const wz = (r / this.resolution) * this.size - halfSize;

        const dist = Math.hypot(wx - worldX, wz - worldZ);
        if (dist < radius) {
          const angle = Math.atan2(wz - worldZ, wx - worldX);
          const fissure = Math.sin(angle * 5 + dist * 0.4) * magnitude;
          const newH = this.heightGrid[idx] + fissure;
          this.heightGrid[idx] = Math.round(newH / voxelStep) * voxelStep;
        }
      }
    }

    this.buildVoxelMeshGeometry();
  }

  // ==========================================
  // CONTINUOUS HEIGHT LOOKUP
  // ==========================================

  public getHeightAt(worldX: number, worldZ: number): number {
    const halfSize = this.size / 2;
    const gx = ((worldX + halfSize) / this.size) * this.resolution;
    const gz = ((worldZ + halfSize) / this.size) * this.resolution;

    if (gx < 0 || gx >= this.resolution || gz < 0 || gz >= this.resolution) {
      return -4.0;
    }

    const c = Math.floor(gx);
    const r = Math.floor(gz);
    const stride = this.resolution + 1;

    return this.heightGrid[r * stride + c] || 0;
  }
}
