interface IIntervalTree {
    insert(low: number, high: number, index: number): void;
    remove(low: number, high: number, index: number): void;
    search(low: number, high: number, callback: (index: number, low: number) => any): void;
    size: number;
}
declare const IntervalTree: () => IIntervalTree;
export default IntervalTree;
