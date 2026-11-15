WEEK 09 - SYNC & ASYNC WORKSHOP

1. Extract the ZIP and open the sync-async-workshop folder in your editor.
2. In that folder, run: node server.mjs
3. Open http://127.0.0.1:18709 in the browser.
4. Edit practice.js. Save and reload the browser after each change.

Use the course Node installation (Node 24; the server also supports Node 20+).
No npm install, database, or build step is required.
Only one copy of server.mjs should use port 18709 at a time.

Change 1: wait(ms) - replace busy waiting with a Promise-based timer.
Change 2: loadConcurrent(task) - start three tasks before waiting for all.
Change 3: shouldRender(id, latest) - allow only the current request ID.

loadSequential and busyWork are provided comparison functions.
lab.js connects buttons, animation, timelines, logging, and requests.
index.html and style.css provide the interface.
server.mjs serves these files and delayed local JSON responses.

The starter deliberately blocks in wait, loads both schedules sequentially,
and allows every search result to render. These are the three changes to make.
The completed version contains all three improvements.

Save and reload; the server reads current files on each request.
If a change is not visible, confirm you edited the folder used by the running server.
If port 18709 is in use, stop your previous server with Ctrl+C before starting again.
