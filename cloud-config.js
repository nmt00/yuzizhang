(function () {
  var local = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
  window.YUZI_CLOUD_URL = window.YUZI_CLOUD_URL || (local ? 'http://127.0.0.1:8787' : '');
})();
