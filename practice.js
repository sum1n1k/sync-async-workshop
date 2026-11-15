// Edit the three named functions during the workshop.
// Save this file, then reload the browser. No server restart is needed.
'use strict';

function busyWork(ms) {
  const end = performance.now() + ms;
  while (performance.now() < end) {}
}

function wait(ms) {
  // busyWork(ms);
  // return Promise.resolve();
  return new Promise(resolve => {setTimeout(resolve, ms)});
}

async function loadSequential(task) {
  const profile = await task(0);
  const posts = await task(1);
  const alerts = await task(2);
  return [profile, posts, alerts];
}

async function loadConcurrent(task) {
  const jobs = [task(0), task(1), task(2)];
  return Promise.all(jobs);
}

function shouldRender(id, latest) {
  return id === latest;
}

window.practice = { busyWork, wait, loadSequential, loadConcurrent, shouldRender };
