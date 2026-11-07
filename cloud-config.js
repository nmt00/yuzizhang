(function () {
  var isNative = Boolean(
    window.Capacitor &&
      typeof window.Capacitor.isNativePlatform === 'function' &&
      window.Capacitor.isNativePlatform()
  );
  var localPreview =
    location.protocol === 'http:' &&
    (location.hostname === '127.0.0.1' || location.hostname === 'localhost') &&
    location.port === '4173';
  window.YUZI_NATIVE = isNative;
  window.YUZI_CLOUD_URL = window.YUZI_CLOUD_URL || (localPreview ? 'http://127.0.0.1:8787' : '');
})();
