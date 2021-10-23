export interface IIntervalTree {
  insert(low: number, high: number, index: number): void;
  remove(index: number): void;
  search(
    low: number,
    high: number,
    callback: (index: number, low: number) => any
  ): void;
  size: number;
}
export declare function createIntervalTree(): IIntervalTree;
