# Clean Home (online copy)

The Clean Home TV launcher loads these files each time it opens, so changes
here reach the TV without reinstalling. If they can't be reached, the TV uses
the copy built into the app.

- `apps.js` – the tiles (names, colours, HDMI inputs)
- `main.js` – how the launcher works
- `style.css` – the look

## Reinstalling on the TV

`app/` holds the full app. To reinstall it from a Mac with Tizen Studio, run in Terminal:

    bash <(curl -sL https://mhnr73-cell.github.io/cleanhome-tv/update-tv.sh)
