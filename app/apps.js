/*
 * YOUR TILES — edit this list to change them.
 *
 * name:  what the tile says. The launcher uses it to find the app on your TV
 *        (and its logo), so keep it close to the app's real name.
 * also:  other names the app might have on the TV (optional).
 * color: the tile's main colour. The shading is added automatically.
 * hdmi:  for an HDMI input tile, the port number instead of an app.
 *
 * Add, remove or reorder lines freely. Keep the commas between entries.
 */
var APPS = [
  { name: "Netflix",     color: "#e50914" },
  { name: "HBO Max",     color: "#7b2ff7", also: ["Max"] },
  { name: "Disney+",     color: "#1f63e6", also: ["Disney Plus"] },
  { name: "Prime Video", color: "#00a8e1", also: ["Amazon Prime Video", "Amazon Video"] },
  { name: "YouTube",     color: "#ff0033" },
  { name: "BBC iPlayer", color: "#f54997", also: ["iPlayer"] },
  { name: "HDMI 1",      color: "#3a4256", hdmi: 1 },
  { name: "HDMI 2",      color: "#3a4256", hdmi: 2 },
  { name: "HDMI 3",      color: "#3a4256", hdmi: 3 }
];

/* How many tiles per row. */
var COLUMNS = 3;
