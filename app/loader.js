/*
 * Loads the newest Clean Home from the internet, so it can be updated
 * without reinstalling. If the internet copy can't be reached within a few
 * seconds, the copy built into the app is used instead.
 */
var UPDATE_URL = "https://mhnr73-cell.github.io/cleanhome-tv/";

(function () {
  var stamp = "?v=" + Date.now(), done = false;

  function script(src, ok, bad) {
    var s = document.createElement("script");
    s.src = src; s.onload = ok; s.onerror = bad;
    document.body.appendChild(s);
  }
  function local() {
    if (done) return; done = true;
    script("apps.js", function () { script("main.js"); });
  }

  if (!UPDATE_URL || location.protocol === "file:" && typeof tizen === "undefined") { local(); return; }

  var css = document.createElement("link");
  css.rel = "stylesheet"; css.href = UPDATE_URL + "style.css" + stamp;
  document.getElementsByTagName("head")[0].appendChild(css);

  var timer = setTimeout(local, 5000);
  script(UPDATE_URL + "apps.js" + stamp, function () {
    script(UPDATE_URL + "main.js" + stamp, function () {
      if (done) return; done = true; clearTimeout(timer);
    }, function () { clearTimeout(timer); local(); });
  }, function () { clearTimeout(timer); local(); });
})();
