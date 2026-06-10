declare module "three" {
  export class Vector2 {
    constructor(x?: number, y?: number);
    x: number;
    y: number;
  }

  export class Vector3 {
    constructor(x?: number, y?: number, z?: number);
    x: number;
    y: number;
    z: number;
    copy(vector: Vector3): this;
    set(x: number, y: number, z: number): this;
  }

  export class Object3D {
    position: Vector3;
    rotation: { x: number; y: number; z: number };
    scale: { setScalar(value: number): void };
    userData: Record<string, unknown>;
    add(...objects: Object3D[]): void;
    clear(): void;
  }

  export class Scene extends Object3D {
    fog: unknown;
    background: unknown;
  }

  export class Color {
    constructor(color: number);
  }

  export class FogExp2 {
    constructor(color: number, density: number);
  }

  export class PerspectiveCamera extends Object3D {
    constructor(fov: number, aspect: number, near: number, far: number);
    aspect: number;
    lookAt(x: number, y: number, z: number): void;
    updateProjectionMatrix(): void;
  }

  export class WebGLRenderer {
    constructor(options?: Record<string, unknown>);
    domElement: HTMLCanvasElement;
    setPixelRatio(value: number): void;
    setSize(width: number, height: number): void;
    setClearColor(color: number, alpha?: number): void;
    render(scene: Scene, camera: PerspectiveCamera): void;
    dispose(): void;
  }

  export class HemisphereLight extends Object3D {
    constructor(skyColor: number, groundColor: number, intensity: number);
  }

  export class DirectionalLight extends Object3D {
    constructor(color: number, intensity: number);
  }

  export class PointLight extends Object3D {
    constructor(color: number, intensity: number, distance?: number, decay?: number);
  }

  export class GeometryLike {
    dispose(): void;
  }

  export class PlaneGeometry extends GeometryLike {
    constructor(width: number, height: number);
  }

  export class BoxGeometry extends GeometryLike {
    constructor(width: number, height: number, depth: number);
  }

  export class TorusGeometry extends GeometryLike {
    constructor(
      radius: number,
      tube: number,
      radialSegments: number,
      tubularSegments: number,
    );
  }

  export class IcosahedronGeometry extends GeometryLike {
    constructor(radius: number, detail: number);
  }

  export class MaterialLike {
    opacity: number;
    dispose(): void;
  }

  export class MeshStandardMaterial extends MaterialLike {
    constructor(options?: Record<string, unknown>);
  }

  export class Mesh extends Object3D {
    constructor(geometry?: GeometryLike, material?: MaterialLike);
    geometry: GeometryLike;
    material: MaterialLike | MaterialLike[];
  }

  export class GridHelper extends Object3D {
    constructor(size: number, divisions: number, color1?: number, color2?: number);
    geometry: GeometryLike;
    material: MaterialLike;
  }

  export class Raycaster {
    setFromCamera(mouse: Vector2, camera: PerspectiveCamera): void;
    intersectObjects(objects: Object3D[]): Array<{ object: Object3D }>;
  }

  export const DoubleSide: number;
  export const AdditiveBlending: number;
}
