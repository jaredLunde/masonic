export default class OneKeyMap {
  key = null
  value = null
  get = k => k === this.key ? this.value : void 0
  set = (k, v) => {
    this.key = k
    this.value = v
  }
}