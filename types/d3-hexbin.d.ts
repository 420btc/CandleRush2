declare module 'd3-hexbin' {
  export function hexbin(): HexbinGenerator;

  interface HexbinGenerator {
    x<T>(accessor: (d: T) => number): HexbinGenerator;
    y<T>(accessor: (d: T) => number): HexbinGenerator;
    radius(radius: number): HexbinGenerator;
    extent(extent: [[number, number], [number, number]]): HexbinGenerator;
    size(size: [number, number]): HexbinGenerator;
    hexagon(radius?: number): string;
    centers(): Array<[number, number]>;
    mesh(): string;
    <T>(data: T[]): Array<HexbinBin<T>>;
  }

  interface HexbinBin<T> extends Array<T> {
    x: number;
    y: number;
  }
}
