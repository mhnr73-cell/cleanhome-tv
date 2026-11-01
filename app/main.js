(function () {
  if (window.CLEAN_HOME_STARTED) return;  // only start once
  window.CLEAN_HOME_STARTED = true;
  var KEY = { LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, ENTER: 13, BACK: 10009, BLUE: 406 };
  var hasTizen = typeof tizen !== "undefined";
  var grid = document.getElementById("grid");
  var tiles = [], items = [], focus = 0, cols = window.COLUMNS || 3, showingAll = false;
  var installed = [];

  function toast(msg) {
    var t = document.getElementById("toast");
    t.textContent = msg; t.className = "show";
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { t.className = ""; }, 3000);
  }

  function norm(s) { return (s || "").toLowerCase().replace(/[^a-z0-9]/g, ""); }

  // Match a tile to an installed app by name, so you don't need app IDs.
  function findApp(app) {
    var names = [app.name].concat(app.also || []), i, j, want;
    for (j = 0; j < names.length; j++) {
      want = norm(names[j]);
      for (i = 0; i < installed.length; i++) {
        if (norm(installed[i].name) === want) return installed[i];
      }
    }
    for (j = 0; j < names.length; j++) {
      want = norm(names[j]);
      for (i = 0; i < installed.length; i++) {
        if (norm(installed[i].name).indexOf(want) === 0) return installed[i];
      }
    }
    if (app.id) return { id: app.id };
    return hasTizen ? null : { id: "preview" };
  }

  // HDMI: shows the chosen input full screen. Back returns to the tiles.
  var watching = false;
  function showHdmi(item) {
    if (!hasTizen || !tizen.tvwindow) { toast("Would switch to " + item.name); return; }
    var fail = function () { toast("Couldn't switch to " + item.name + ". Try the Source button."); };
    try {
      tizen.tvwindow.setSource({ type: "HDMI", number: item.hdmi }, function () {
        tizen.tvwindow.show(function () {
          watching = true;
          document.body.className = "watching";
        }, fail, ["0px", "0px", "1920px", "1080px"], "MAIN");
      }, fail, "MAIN");
    } catch (err) { fail(); }
  }
  function stopHdmi() {
    watching = false;
    document.body.className = "";
    try { tizen.tvwindow.hide(function () {}, function () {}, "MAIN"); } catch (err) {}
  }

  // Darken (amount < 0) or lighten a #rrggbb colour.
  function shade(hex, amount) {
    var n = parseInt(hex.slice(1), 16), out = "#";
    for (var s = 16; s >= 0; s -= 8) {
      var c = Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * (1 + amount))));
      out += (c < 16 ? "0" : "") + c.toString(16);
    }
    return out;
  }

  function add(parent, tag, cls) {
    var el = document.createElement(tag);
    el.className = cls; parent.appendChild(el); return el;
  }

  function render(list, small) {
    items = list; grid.innerHTML = ""; tiles = [];
    cols = small ? 6 : COLUMNS;
    var gap = 40, w = Math.floor((1680 - gap * (cols - 1)) / cols);
    for (var i = 0; i < list.length; i++) {
      var item = list[i], color = item.color || "#2a3042";
      var el = document.createElement("div");
      el.className = "tile" + (small ? " small" : "") + (item.launchId ? "" : " missing") +
        (item.hdmi ? " input" : "");
      el.style.background = "-webkit-linear-gradient(top left, " + shade(color, 0.15) + ", " + shade(color, -0.55) + ")";
      el.style.background = "linear-gradient(to bottom right, " + shade(color, 0.15) + ", " + shade(color, -0.55) + ")";
      el.style.width = w + "px";
      if ((i + 1) % cols === 0) el.style.marginRight = "0";
      add(el, "div", "shine");
      if (item.hdmi) {
        add(el, "img", "hdmi").src = "hdmi.svg";
      } else {
        // The app's own logo from the TV, with its name underneath.
        // If there's no logo, the name is shown large instead.
        var word = add(el, "div", "word");
        word.textContent = item.name;
        if (item.icon) {
          var img = add(el, "img", "logo"), label = add(el, "div", "label");
          label.textContent = item.name;
          word.style.display = "none";
          img.onerror = (function (img, label, word) {
            return function () { img.style.display = label.style.display = "none"; word.style.display = ""; };
          })(img, label, word);
          img.src = item.icon;
        }
      }
      if (item.hdmi || small) add(el, "div", "label").textContent = item.name;
      grid.appendChild(el); tiles.push(el);
    }
    setFocus(0);
  }

  function setFocus(i) {
    if (!tiles.length) return;
    if (tiles[focus]) tiles[focus].className = tiles[focus].className.replace(" focus", "");
    focus = Math.max(0, Math.min(tiles.length - 1, i));
    tiles[focus].className += " focus";
    tiles[focus].scrollIntoView && tiles[focus].scrollIntoView({ block: "nearest" });
  }

  function launch(item) {
    if (item.hdmi) { showHdmi(item); return; }
    if (!item.launchId) { toast(item.name + " isn't installed on this TV"); return; }
    if (!hasTizen) { toast("Would open " + item.name + " (" + item.launchId + ")"); return; }
    tizen.application.launch(item.launchId, null, function () {
      toast("Couldn't open " + item.name);
    });
  }

  function showHome() {
    showingAll = false;
    render(APPS.map(function (a) {
      var found = a.hdmi ? null : findApp(a);
      return { name: a.name, color: a.color, hdmi: a.hdmi,
               launchId: a.hdmi ? "hdmi" : (found && found.id),
               icon: found && found.icon };
    }), false);
  }

  function showAll() {
    showingAll = true;
    render(installed.map(function (a) {
      return { name: a.name, launchId: a.id, icon: a.icon };
    }), true);
    toast("All apps on this TV. Back to return.");
  }

  document.addEventListener("keydown", function (e) {
    if (watching) {
      if (e.keyCode === KEY.BACK || e.keyCode === KEY.ENTER) { stopHdmi(); e.preventDefault(); }
      return;
    }
    switch (e.keyCode) {
      case KEY.LEFT:  setFocus(focus - 1); break;
      case KEY.RIGHT: setFocus(focus + 1); break;
      case KEY.UP:    setFocus(focus - cols); break;
      case KEY.DOWN:  setFocus(focus + cols); break;
      case KEY.ENTER: launch(items[focus]); break;
      case KEY.BLUE:  if (installed.length) showAll(); break;
      case KEY.BACK:
        if (showingAll) { showHome(); }
        else if (hasTizen) { tizen.application.getCurrentApplication().exit(); }
        break;
      default: return;
    }
    e.preventDefault();
  });

  function tick() {
    var d = new Date();
    var h = d.getHours(), m = d.getMinutes();
    document.getElementById("clock").textContent = h + ":" + (m < 10 ? "0" : "") + m;
    document.getElementById("greeting").textContent =
      h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    document.getElementById("date").textContent = days[d.getDay()] + ", " + d.getDate() + " " + months[d.getMonth()];
  }
  tick(); setInterval(tick, 10000);

  if (hasTizen) {
    try { tizen.tvinputdevice.registerKey("ColorF3Blue"); } catch (err) {}
    tizen.application.getAppsInfo(function (list) {
      installed = list.filter(function (a) { return a.show && a.name; })
        .map(function (a) { return { name: a.name, id: a.id, icon: a.iconPath && a.iconPath.charAt(0) === "/" ? "file://" + a.iconPath : a.iconPath }; })
        .sort(function (a, b) { return a.name.localeCompare(b.name); });
      showHome();
    }, showHome);
  } else {
    showHome(); // previewing in a normal browser
  }
})();
