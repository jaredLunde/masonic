import bench from '@essentials/benchmark'
import randInt from 'rand-int'
import createIntervalTree from '../src/IntervalTree'

bench('IntervalTree.search()', ({duration}) => {
  duration(4000)

  const tree = createIntervalTree()
  for (let i = 0; i < 5000; i++) {
    const lower = randInt(0, 200000)
    tree.insert(lower, lower + randInt(200, 400), i)
  }
  const cb = () => {}

  return () => {
    tree.search(0, 300000, cb)
  }
})

bench('IntervalTree.insert()', ({duration}) => {
  duration(4000)
  const tree = createIntervalTree()
  let i = 0

  return () => {
    tree.insert(randInt(0, 200000), randInt(200001, 40000000), i++)
  }
})

bench('IntervalTree.remove()', ({duration}) => {
  duration(4000)
  const intervals: number[][] = []
  const tree = createIntervalTree()
  let i = 0
  for (; i < 5000000; i++) {
    const interval = [randInt(0, 200000), randInt(200001, 40000000), i]
    intervals.push(interval)
    tree.insert.apply(null, interval)
  }

  return () => {
    tree.remove.apply(null, intervals[--i])
  }
})
