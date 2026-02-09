declare module 'ogl' {
  export class Renderer {
    constructor(options?: any);
    gl: WebGLRenderingContext;
    dpr: number;
    setSize(width: number, height: number): void;
    render(options: { scene: any }): void;
  }
  export class Program {
    constructor(gl: WebGLRenderingContext, options?: any);
    uniforms: any;
  }
  export class Mesh {
    constructor(gl: WebGLRenderingContext, options?: any);
  }
  export class Color {
    constructor(color: string | number[]);
    r: number;
    g: number;
    b: number;
  }
  export class Triangle {
    constructor(gl: WebGLRenderingContext, options?: any);
    attributes: any;
  }
}
