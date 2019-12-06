import createIntervalTree from './IntervalTree'

const searchTree = (tree, start, end): any[] => {
  const results: any[] = []
  tree.search(start, end, (...args) => results.push(args))
  return results
}

function getPermutations(array: any[]): any[] {
  function p(array, temp): void {
    let i, x
    if (!array.length) result.push(temp)

    for (i = 0; i < array.length; i++) {
      x = array.splice(i, 1)[0]
      p(array, temp.concat([x]))
      array.splice(i, 0, x)
    }
  }

  const result: any[] = []
  p(array, [])
  return result
}

describe('Interval tree', function() {
  it('should insert', function() {
    const tree = createIntervalTree()
    tree.insert(4, 7, 1)
    const results = searchTree(tree, 0, 10)
    expect(results[0]).toEqual([1, 4, 7])
  })

  it('should find left overlap', function() {
    const tree = createIntervalTree()
    tree.insert(4, 7, 1)
    const results = searchTree(tree, 0, 10)
    expect(results.length).toEqual(1)
  })

  it('should find center overlap', function() {
    const tree = createIntervalTree()
    tree.insert(4, 7, 1)
    const results = searchTree(tree, 5, 6)
    expect(results.length).toEqual(1)
  })

  it('should find right overlap', function() {
    const tree = createIntervalTree()
    tree.insert(4, 7, 1)
    const results = searchTree(tree, 5, 10)
    expect(results.length).toEqual(1)
  })

  it('should find complete overlap', function() {
    const tree = createIntervalTree()
    tree.insert(4, 7, 1)
    const results = searchTree(tree, 0, 10)
    expect(results.length).toEqual(1)
  })

  it('should not remove non existing node', function() {
    const tree = createIntervalTree()
    tree.insert(4, 7, 1)
    tree.remove(4, 7, 2)
    tree.remove(5, 7, 1)
    const results = searchTree(tree, 0, 10)
    expect(results.length).toEqual(1)
  })

  it('should remove', function() {
    const tree = createIntervalTree()
    tree.insert(4, 7, 1)
    tree.remove(4, 7, 1)
    const results = searchTree(tree, 0, 10)
    expect(results.length).toEqual(0)
  })

  it('should not remove from empty tree', function() {
    const tree = createIntervalTree()
    tree.remove(4, 7, 1)
    const results = searchTree(tree, 0, 10)
    expect(results.length).toEqual(0)
  })

  it('should handle many insertions and deletions', function() {
    const permutations = getPermutations([
      [2240, 2456, 1],
      [3104, 3320, 2],
      [3968, 4184, 3],
      [4832, 5048, 4],
      [5696, 5912, 5],
      [2252, 2270, 6],
    ])

    const inserts = [...permutations[0]]

    for (let i = 0; i < permutations.length; i++) {
      const permutation = permutations[i]
      const tree = createIntervalTree()

      for (const item of inserts) tree.insert.apply(null, item)

      while (permutation.length) {
        const choice = permutation.pop()
        tree.remove.apply(null, choice)
        expect(tree.size).toEqual(permutation.length)
        expect(searchTree(tree, 0, 6000).length).toEqual(permutation.length)
      }
    }
  })

  it('should handle many values with same key', function() {
    const permutations = getPermutations([
      [1000, 2456, 1],
      [1000, 3320, 2],
      [1000, 4184, 3],
      [1000, 5048, 4],
      [1000, 5912, 5],
      [1000, 2270, 6],
    ])

    const inserts = [...permutations[0]]

    for (let i = 0; i < permutations.length; i++) {
      const permutation = permutations[i]
      //console.log(`[${i+1}] Testing permutation`, permutation)
      const tree = createIntervalTree()

      for (const item of inserts) tree.insert.apply(null, item)

      while (permutation.length) {
        const choice = permutation.pop()
        tree.remove.apply(null, choice)
        // console.log(choice[2], searchTree(tree, 0, 6000))
        expect(tree.size).toEqual(permutation.length)
        expect(searchTree(tree, 0, 6000).length).toEqual(permutation.length)
      }
    }
  })
})
