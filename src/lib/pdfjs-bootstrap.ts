// PDF.js Bootstrap - 必须在导入 pdfjs 之前定义 DOMMatrix

// 定义 DOMMatrix 全局变量
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
    m11: number;
    m12: number;
    m13: number;
    m14: number;
    m21: number;
    m22: number;
    m23: number;
    m24: number;
    m31: number;
    m32: number;
    m33: number;
    m34: number;
    m41: number;
    m42: number;
    m43: number;
    m44: number;

    constructor(init?: any) {
      this.a = 1;
      this.b = 0;
      this.c = 0;
      this.d = 0;
      this.e = 0;
      this.f = 0;
      this.m11 = 1;
      this.m12 = 0;
      this.m13 = 0;
      this.m14 = 0;
      this.m21 = 0;
      this.m22 = 1;
      this.m23 = 0;
      this.m24 = 0;
      this.m31 = 0;
      this.m32 = 0;
      this.m33 = 1;
      this.m34 = 0;
      this.m41 = 0;
      this.m42 = 0;
      this.m43 = 0;
      this.m44 = 1;

      // Allow initialization from array or object
      if (init) {
        if (Array.isArray(init)) {
          [this.m11, this.m12, this.m13, this.m14,
           this.m21, this.m22, this.m23, this.m24,
           this.m31, this.m32, this.m33, this.m34,
           this.m41, this.m42, this.m43, this.m44] = init;
        } else {
          Object.assign(this, init);
        }
      }
    }

    multiply(other?: DOMMatrix) {
      // Simple stub - returns identity
      return this;
    }

    multiplySelf() {
      return this;
    }

    preMultiplySelf() {
      return this;
    }

    translate(x: number, y: number, z: number) {
      return this;
    }

    scale(scaleX: number, scaleY?: number, scaleZ?: number) {
      return this;
    }

    rotate(rotX?: number, rotY?: number, rotZ?: number) {
      return this;
    }

    rotateFromVector(x: number, y: number) {
      return this;
    }

    rotateAxisAngle(x: number, y: number, z: number, angle: number) {
      return this;
    }

    skewX() {
      return this;
    }

    skewY() {
      return this;
    }

    flipX() {
      return this;
    }

    flipY() {
      return this;
    }

    inverse() {
      return this;
    }

    invertSelf() {
      return this;
    }

    transformPoint(point: { x: number; y: number; z?: number }) {
      return {
        x: point.x || 0,
        y: point.y || 0,
        z: 0
      };
    }

    toFloat32Array() {
      return new Float32Array([
        this.m11, this.m12, this.m13, this.m14,
        this.m21, this.m22, this.m23, this.m24,
        this.m31, this.m32, this.m33, this.m34,
        this.m41, this.m42, this.m43, this.m44
      ]);
    }

    toFloat64Array() {
      return new Float64Array([
        this.m11, this.m12, this.m13, this.m14,
        this.m21, this.m22, this.m23, this.m24,
        this.m31, this.m32, this.m33, this.m34,
        this.m41, this.m42, this.m43, this.m44
      ]);
    }

    toString() {
      return `matrix(${this.m11}, ${this.m12}, ${this.m21}, ${this.m22}, ${this.e}, ${this.f})`;
    }
  } as any;
}

// 导出一个空的导出以确保这是一个模块
export {};
