import "@testing-library/jest-dom";

// jsdom に存在しないブラウザ API のモック（Radix UI / floating-ui が参照する）。
// node 環境のテストでも読み込まれるため window の有無で分岐する。
if (typeof window !== "undefined") {
  window.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
}
