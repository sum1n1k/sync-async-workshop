// No dependencies. Run with Node.js 20+ (the course uses Node 24).
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT||18709);
const posts=[
 {title:'Java study group',tags:['java']},
 {title:'Spring Boot office hours',tags:['java']},
 {title:'JavaScript async examples',tags:['java','javascript']},
 {title:'Vue project meetup',tags:['javascript','vue']},
 {title:'Campus lunch menu',tags:['lunch']}
];
const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
const files=new Map([['/','index.html'],['/index.html','index.html'],['/style.css','style.css'],['/lab.js','lab.js'],['/practice.js','practice.js']]);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
 try {
  const url=new URL(req.url,'http://localhost');
  if(req.method!=='GET'){send(res,405,{error:'GET only'});return;}
  if(url.pathname==='/api/health'){send(res,200,{service:'sync-async-lab'});return;}
  if(url.pathname==='/api/demo'){
   const kind=url.searchParams.get('kind'),delay=Number(url.searchParams.get('delay')),query=(url.searchParams.get('query')||'').slice(0,60);
   if(!['profile','posts','alerts','search'].includes(kind)||!Number.isFinite(delay)||delay<0||delay>2000){send(res,400,{error:'Invalid kind or delay (0–2000 ms)'});return;}
   // The server can accept other requests while this timer is pending.
   const timer=setTimeout(()=>{
    if(res.destroyed)return;
    send(res,200,kind==='search'?{query,posts:posts.filter(p=>`${p.title} ${p.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()))}:{kind,delay,received:true});
   },delay);
   res.on('close',()=>clearTimeout(timer));return;
  }
  if(url.pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}
  const name=files.get(url.pathname);if(!name){send(res,404,{error:'Not found'});return;}
  const contents=await fs.readFile(path.join(root,name));res.writeHead(200,{'Content-Type':types[path.extname(name)],'Cache-Control':'no-store'});res.end(contents);
 }catch(error){if(!res.headersSent)send(res,500,{error:'Local server error'});else res.end();console.error(error.message);}
});
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`Sync & Async lab: http://127.0.0.1:${port}\nOpen DevTools → Network → Fetch/XHR. Stop with Ctrl+C.`));
