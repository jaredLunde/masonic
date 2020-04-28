class ResizeObserver {
  els = []
  callback = () => {}
  constructor(callback) {
    this.callback = callback
  }
  observe(el) {
    // do nothing
    this.callback([{target: el}])
  }
  unobserve() {
    // do nothing
  }
  disconnect() {}
}

window.ResizeObserver = ResizeObserver

export default ResizeObserver
