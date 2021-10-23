class ResizeObserver {
  els = [];
  callback = () => {};
  constructor(callback) {
    this.callback = callback;
  }
  observe(el) {
    // do nothing
    try {
      this.callback([{ target: el }]);
    } catch (err) {}
  }
  unobserve() {
    // do nothing
  }
  disconnect() {}
}

window.ResizeObserver = ResizeObserver;

export default ResizeObserver;
