'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const practice = window.practice;
  const now = () => performance.now();
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const posts = [
    {title:'Java study group', tags:['java']},
    {title:'Spring Boot office hours', tags:['java']},
    {title:'JavaScript async examples', tags:['java','javascript']},
    {title:'Vue project meetup', tags:['javascript','vue']},
    {title:'Campus lunch menu', tags:['lunch']}
  ];
  const findPosts = query => posts.filter(p => `${p.title} ${p.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    document.querySelectorAll('.scene').forEach(s => s.hidden = s.id !== button.dataset.tab);
  }));
  const codes = {
    sync:`function busyWork(ms) {\n  const end = performance.now() + ms;\n  while (performance.now() < end) {}\n}\n\nbusyWork(1200);\nshowResult();`,
    timer:`function wait(ms) {\n  return new Promise(resolve => {\n    setTimeout(resolve, ms);\n  });\n}\n\nawait wait(1200);\nshowResult();`,
    keyword:`async function work() {\n  busyWork(1200);\n  return "done";\n}\n\nawait work();\n// async does not move CPU work\n// to another thread.`,
    sequential:`const profile = await request("profile");\nconst posts = await request("posts");\nconst alerts = await request("alerts");\n\n// Start B after A finishes.\n// Start C after B finishes.`,
    concurrent:`const jobs = [\n  request("profile"),\n  request("posts"),\n  request("alerts")\n];\nconst results = await Promise.all(jobs);\n\n// Calls start the requests.\n// Promise.all waits for their results.`
  };
  codes.sync = practice.busyWork.toString();
  codes.timer = practice.wait.toString();
  codes.sequential = practice.loadSequential.toString();
  codes.concurrent = practice.loadConcurrent.toString();
  $('response-code').textContent = codes.sync;
  $('requests-code').textContent = codes.sequential;
  let taps = 0, frames = 0, lastFrame = now(), measured = false, maxGap = 0;
  function frame(t) {
    const gap = t - lastFrame; lastFrame = t;
    if (measured) maxGap = Math.max(maxGap, gap);
    frames++;
    const track = $('runner').parentElement.clientWidth;
    $('runner').style.transform = `translateX(${((Math.sin(t / 500) + 1) / 2) * Math.max(0,track - 22)}px)`;
    if (frames % 6 === 0) $('frame-count').textContent = `${frames} frames`;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  $('tap').onclick = () => $('taps').textContent = String(++taps);
  function busyWork(ms) { return practice.busyWork(ms); }
  async function cpuInAsync() { busyWork(1200); }
  let responsivenessBusy = false;
  document.querySelectorAll('[data-run]').forEach(button => button.onclick = async () => {
    if (responsivenessBusy) return;
    responsivenessBusy = true;
    const mode = button.dataset.run, titles = {sync:'Synchronous CPU work',timer:'Asynchronous timer wait',keyword:'CPU work inside async'};
    document.querySelectorAll('[data-run]').forEach(b => b.disabled = true);
    $('response-code-title').textContent = titles[mode]; $('response-code').textContent = codes[mode];
    $('response-status').textContent = 'Running · watch the dot and try the counter.';
    $('response-detail').textContent = mode === 'timer' ? 'Watch whether the dot and counter can respond while your wait function runs.' : 'A deliberate 1.2-second main-thread busy loop is about to begin.';
    $('response-note').textContent = mode === 'keyword' ? 'An async function returns a Promise. Synchronous code inside it still runs on the main thread.' : mode === 'timer' ? 'await suspends this function until the timer promise settles. It does not put the main thread to sleep.' : 'The loop must finish before the next statement and queued UI work can run.';
    // Allow the Running label to paint before measuring the demonstration.
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    maxGap = 0; measured = true; const start = now();
    if (mode === 'timer') await practice.wait(1200);
    else if (mode === 'keyword') await cpuInAsync();
    else busyWork(1200);
    const elapsed = now() - start;
    await new Promise(resolve => requestAnimationFrame(resolve));
    measured = false;
    $('response-time').textContent = `${Math.round(elapsed)} ms`;
    $('frame-gap').textContent = `${Math.round(maxGap)} ms`;
    $('response-status').textContent = 'Finished · ' + titles[mode];
    $('response-detail').textContent = mode === 'timer' ? 'Compare the moving dot and largest frame gap before and after editing wait(ms).' : 'Animation and input handling were delayed by the busy loop. Adding async alone does not remove the block.';
    document.querySelectorAll('[data-run]').forEach(b => b.disabled = false);responsivenessBusy = false;
  });
  let active = 0;
  function activeChange(delta) { active += delta; $('transport').disabled = active > 0; }
  const transport = () => $('transport').value;
  async function request(kind, delay, query = '', source = transport()) {
    if (source === 'timer') { await wait(delay); return kind === 'search' ? {posts:findPosts(query)} : {kind}; }
    const params = new URLSearchParams({kind,delay:String(delay),query});
    const response = await fetch('/api/demo?' + params);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
  function updateTransportNote() {
    const http = transport() === 'http';
    $('transport-note').textContent = http ? 'Real fetch requests to this local server. Open DevTools → Network → Fetch/XHR.' : 'Timers simulate waiting. They will not appear as API calls in the Network tab.';
    $('search-mode').textContent = `${http ? 'Local HTTP API' : 'Timer simulation · no network'}. Query “java”: 1,600 ms; “javascript”: 300 ms.`;
  }
  $('transport').onchange = updateTransportNote;
  if (location.protocol.startsWith('http')) {
    fetch('/api/health').then(r => r.ok ? r.json() : null).then(data => {
      if (data?.service === 'sync-async-lab') {
        $('transport').options[1].disabled = false;
        $('transport').options[1].textContent = 'Local HTTP API · real fetch requests';
        // Do not change a user's selection or an in-progress run.
        if (!active && !$('sequential-time').dataset.ran && !$('query').value) $('transport').value = 'http';
        updateTransportNote();
      }
    }).catch(() => {});
  }
  function log(id,text) { const li = document.createElement('li');li.textContent = text;$(id).append(li);while($(id).children.length>60) $(id).firstChild.remove();$(id).scrollTop=$(id).scrollHeight; }
  let requestsBusy = false;
  async function runRequests(mode) {
    if (requestsBusy) return;requestsBusy = true;activeChange(1);
    $('sequential').disabled = $('concurrent').disabled = true;
    $('requests-code-title').textContent = mode === 'sequential' ? 'Sequential await' : 'Concurrent waiting with Promise.all';
    $('requests-code').textContent = codes[mode];$('request-log').replaceChildren();
    $('requests-status').textContent = 'Running · '+mode;
    $('requests-detail').textContent = 'Watch the start and finish times. Both runs use asynchronous requests.';
    const start = now(), source = transport(), states = [0,1,2].map(() => ({start:null,end:null})), jobs = [];
    const scale = 2400;
    function paint() {
      const current = now()-start;
      states.forEach((s,i) => {
        const bar = $('bar-'+i);
        bar.style.left = `${Math.min(99,(s.start??0)/scale*100)}%`;
        bar.style.width = s.start === null ? '0%' : `${Math.max(0,Math.min(scale-s.start,(s.end??current)-s.start))/scale*100}%`;
        bar.classList.toggle('done',s.end !== null);
      });
    }
    states.forEach((s,i) => $('task-status-'+i).textContent = 'Not started');paint();
    const tick=setInterval(paint,30);
    const kinds=['profile','posts','alerts'], names=['Profile','Posts','Notifications'], delays=[400,700,1000];
    async function task(i) {
      const s=states[i];s.start=now()-start;$('task-status-'+i).textContent='Waiting';log('request-log',`${Math.round(s.start)} ms · ${names[i]} started`);
      try { const result=await request(kinds[i],delays[i],'',source);$('task-status-'+i).textContent='Finished';return result; }
      catch(error) { $('task-status-'+i).textContent='Failed';throw error; }
      finally { s.end=now()-start;log('request-log',`${Math.round(s.end)} ms · ${names[i]} settled`);paint(); }
    }
    try {
      const trackedTask = i => { const job = task(i); jobs.push(job); return job; };
      if(mode==='sequential') await practice.loadSequential(trackedTask);
      else await practice.loadConcurrent(trackedTask);
      const elapsed=Math.round(now()-start);$(mode+'-time').textContent=`${elapsed} ms`;$('sequential-time').dataset.ran='true';
      $('requests-status').textContent=`Finished · ${elapsed} ms`;
      $('requests-detail').textContent=mode==='sequential'?'Each request started after the previous request finished. The main thread stayed available during each wait.':'Compare the start times and total with the sequential run. Your loadConcurrent function controls the schedule.';
    } catch(error) { $('requests-status').textContent='Request failed';$('requests-detail').textContent=error.message+' · Make sure server.mjs is still running.'; }
    finally { await Promise.allSettled(jobs);clearInterval(tick);paint();$('sequential').disabled=$('concurrent').disabled=false;requestsBusy=false;activeChange(-1); }
  }
  $('sequential').onclick=()=>runRequests('sequential');$('concurrent').onclick=()=>runRequests('concurrent');
  let latest=0,generation=0,replay=false;
  function render(target,results) { $(target).replaceChildren();for(const p of results){const li=document.createElement('li');li.textContent=p.title;$(target).append(li);}if(!results.length){const li=document.createElement('li');li.textContent='No matching posts';$(target).append(li);} }
  function clearSearch() {
    latest++;generation++;$('query').value='';$('search-log').replaceChildren();$('naive-results').replaceChildren();$('guard-results').replaceChildren();$('naive-label').textContent=$('guard-label').textContent='No results yet';
    replay=false;$('race-run').disabled=false;$('query').disabled=false;
  }
  async function search(query) {
    const id=++latest,run=generation,source=transport(),start=now();
    if(!query.trim()) { $('naive-results').replaceChildren();$('guard-results').replaceChildren();$('naive-label').textContent=$('guard-label').textContent='No results yet';return; }
    activeChange(1);
    const delay=query.toLowerCase()==='java'?1600:query.toLowerCase()==='javascript'?300:600;
    $('guard-label').textContent=`Loading “${query}”…`;$('naive-label').textContent=`Loading “${query}”…`;
    log('search-log',`#${id} requested “${query}” (${delay} ms)`);
    try {
      const result=await request('search',delay,query,source);
      if(run!==generation) return;
      render('naive-results',result.posts);$('naive-label').textContent=`Showing “${query}” · response #${id}`;
      if(practice.shouldRender(id, latest)) {render('guard-results',result.posts);$('guard-label').textContent=`Showing “${query}” · response #${id}`;}
      log('search-log',`#${id} “${query}” arrived after ${Math.round(now()-start)} ms · ${practice.shouldRender(id, latest)?'shown in both panels':'ignored by the guarded panel'}`);
    } catch(error) {
      if(run!==generation) return;
      log('search-log',`#${id} failed: ${error.message}`);$('naive-label').textContent='Request failed';if(practice.shouldRender(id, latest))$('guard-label').textContent='Request failed · check the local server';
    } finally {activeChange(-1);}
  }
  $('query').oninput=()=>search($('query').value);
  $('race-reset').onclick=clearSearch;
  $('race-run').onclick=async()=>{
    if(replay)return;clearSearch();replay=true;const run=generation;
    $('race-run').disabled=true;$('query').disabled=true;
    $('query').value='java';const first=search('java');await wait(150);
    if(run!==generation)return;
    $('query').value='javascript';const second=search('javascript');await Promise.all([first,second]);
    if(run!==generation)return;replay=false;$('race-run').disabled=false;$('query').disabled=false;
  };
})();
