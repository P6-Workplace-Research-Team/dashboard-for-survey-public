// Calls requireAuth() once scripts are loaded.
(function () {
  try {
    if (typeof requireAuth === 'function') {
      Promise.resolve(requireAuth()).catch(function () {});
    }
  } catch (_) {}
})();

