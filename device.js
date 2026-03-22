/**
 * 依視窗寬度自動切換：手機版（≤768px）／電腦版（>768px）
 * 使用 matchMedia，與 CSS 斷點一致，旋轉螢幕或調整視窗時會同步更新。
 */
(function () {
  var BREAKPOINT = "(max-width: 768px)";
  var mq = window.matchMedia(BREAKPOINT);

  function applyViewport() {
    var mobile = mq.matches;
    var root = document.documentElement;
    root.classList.toggle("is-mobile", mobile);
    root.classList.toggle("is-desktop", !mobile);
    root.dataset.viewport = mobile ? "mobile" : "desktop";

    try {
      window.dispatchEvent(
        new CustomEvent("viewportchange", {
          detail: { isMobile: mobile, viewport: root.dataset.viewport },
        })
      );
    } catch (e) {
      /* IE 無 CustomEvent 時略過 */
    }
  }

  applyViewport();

  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", applyViewport);
  } else if (typeof mq.addListener === "function") {
    mq.addListener(applyViewport);
  }

  window.__DEVICE__ = {
    breakpointPx: 768,
    isMobile: function () {
      return mq.matches;
    },
    getViewport: function () {
      return document.documentElement.dataset.viewport || "desktop";
    },
  };
})();
