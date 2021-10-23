import { createIntervalTree } from "./interval-tree";
const toIdSorted = (result) => result.map(([id]) => id).sort((a, b) => a - b);
const toExpectedIdSorted = (result) =>
  result.map(([, , id]) => id).sort((a, b) => a - b);

const shuffle = (original) => {
  const array = original.concat();
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const search = (tree, low, high) => {
  const results: any[] = [];
  tree.search(low, high, (...args) => results.push(args));
  return results;
};

const expectSearch = (records, tree, low, high) => {
  const expectation = records.filter((record) => {
    if (!record) {
      return false;
    }
    const [otherLow, otherHigh] = record;
    return otherLow <= high && otherHigh >= low;
  });

  expect(toIdSorted(search(tree, low, high)).join(",")).toEqual(
    toExpectedIdSorted(expectation).join(",")
  );
};

describe("tree", () => {
  it("should insert, remove, and find", () => {
    const tree = createIntervalTree();

    const list = [
      [15, 23, 1],
      [8, 9, 2],
      [25, 30, 3],
      [19, 20, 4],
      [16, 21, 5],
      [5, 8, 6],
      [26, 26, 7],
      [0, 21, 8],
      [17, 19, 9],
      [6, 10, 10],
    ];

    for (const [low, high, id] of list) {
      tree.insert(low, high, id);
    }

    const results = [
      [0, 30, "1,2,3,4,5,6,7,8,9,10"],
      [7, 8, "2,6,8,10"],
      [0, 1, "8"],
      [-2, -1, ""],
    ];

    for (let i = 0; i < 10000; ++i) {
      for (const [, , id] of shuffle(list)) {
        tree.remove(id);
      }

      expect(tree.size).toBe(0);

      for (const [low, high, id] of shuffle(list)) {
        tree.insert(low, high, id);
      }

      expect(tree.size).toBe(10);

      for (const [low, high, result] of results) {
        expect(toIdSorted(search(tree, low, high)).join(",")).toEqual(result);
      }
    }
  });

  it("should insert and remove multiple", () => {
    const tree = createIntervalTree();

    const records = [];

    for (let i = 0; i < 1000; ++i) {
      const low = getRandomInt(0, 100);
      const high = getRandomInt(low, low + getRandomInt(0, 100));

      records.push([low, high, i]);
      tree.insert(low, high, i);

      expectSearch(records, tree, low, high);
      expect(tree.size).toBe(records.length);
    }

    const toRemove = shuffle(records.concat());
    for (let i = 0; i < toRemove.length; ++i) {
      const [low, high, id] = toRemove[i];
      toRemove[i] = undefined;
      tree.remove(id);
      expectSearch(toRemove, tree, low, high);

      for (let j = 0; j < 100; ++j) {
        const low = getRandomInt(0, 100);
        const high = getRandomInt(low, low + getRandomInt(0, 100));
        expectSearch(toRemove, tree, low, high);
      }
      expect(tree.size).toBe(records.length - i - 1);
    }
  });

  it("should insert and remove multiple randomly", () => {
    const list = [];
    const tree = createIntervalTree();
    let id = 0;

    const removeAnItem = (list, tree) => {
      if (list.length === 0) {
        return;
      }
      const idx = getRandomInt(0, list.length - 1);
      const item = list[idx];
      list.splice(idx, 1);
      tree.remove(item[2]);
    };

    const addAnItem = (list, tree) => {
      const low = getRandomInt(0, 100);
      const record = [low, low + getRandomInt(0, 100), ++id];
      list.push(record);
      tree.insert(record[0], record[1], record[2]);
    };

    for (let i = 0; i < 1000; ++i) {
      const action = getRandomInt(0, 3);
      if (action === 0) {
        removeAnItem(list, tree);
      }
      if (action === 1) {
        addAnItem(list, tree);
      }
      expect(list.length).toEqual(tree.size);
      for (let j = 0; j < 10; ++j) {
        const low = getRandomInt(0, 100);
        const high = low + getRandomInt(0, 100);
        expectSearch(list, tree, low, high);
      }
    }
  });

  it("should insert and find", () => {
    const list = [];
    const tree = createIntervalTree();
    let id = 0;

    const addAnItem = (list, tree) => {
      const low = getRandomInt(0, 100);
      const record = [low, low + getRandomInt(0, 100), ++id];
      list.push(record);
      tree.insert(record[0], record[1], record[2]);
    };

    for (let i = 0; i < 1000; ++i) {
      addAnItem(list, tree);
      expect(list.length).toEqual(tree.size);
      for (let j = 0; j < 10; ++j) {
        const low = getRandomInt(0, 100);
        const high = low + getRandomInt(0, 100);
        expectSearch(list, tree, low, high);
      }
    }
  });
});
