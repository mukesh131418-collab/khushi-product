import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import handler from './api/index.mjs';
const root=path.resolve('public');
http.createServer(async(req,res)=>{
  if(req.url.startsWith('/api/')) return handler(req,res);
  let pathname;
  try {
    pathname=decodeURIComponent(req.url.split('?')[0]);
    if(pathname.includes('\0')) throw new URIError('Invalid path');
  } catch {
    res.writeHead(400,{'Content-Type':'text/plain; charset=utf-8'});
    return res.end('Invalid request URL');
  }
  const p=path.resolve(root,'.'+pathname);
  if(!p.startsWith(root+path.sep)&&p!==root){res.writeHead(403);return res.end();}
  try {
    const file=fs.existsSync(p)&&fs.statSync(p).isFile()?p:path.join(root,'index.html');
    res.setHeader('Content-Type',({'html':'text/html','css':'text/css','js':'text/javascript','png':'image/png','svg':'image/svg+xml'})[file.split('.').pop()]||'application/octet-stream');
    const stream=fs.createReadStream(file);
    stream.on('error',()=>{
      if(res.headersSent) return res.destroy();
      res.writeHead(500,{'Content-Type':'text/plain; charset=utf-8'});
      res.end('Unable to load page');
    });
    stream.pipe(res);
  } catch {
    res.writeHead(500,{'Content-Type':'text/plain; charset=utf-8'});
    res.end('Unable to load page');
  }
}).listen(process.env.PORT||3000,()=>console.log('Local: http://localhost:'+(process.env.PORT||3000)));
