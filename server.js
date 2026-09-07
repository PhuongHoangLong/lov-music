import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
const port = process.env.PORT || 3000;
const key = process.env.DRIVE_API_KEY;
const folder = process.env.DRIVE_FOLDER_ID || '1xmor8nF56-i_UU3c5B7IOgdx5dgoUn5D';
const tracks = new Map();
const validId = s => /^[\w-]{10,150}$/.test(s);
function json(res, code, data) { res.writeHead(code, {'Content-Type':'application/json; charset=utf-8'}); res.end(JSON.stringify(data)); }
http.createServer(async (req,res) => {
 try {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/tracks') {
   if (!key) return json(res,503,{error:'Chưa cấu hình Google Drive API. Mở Hướng dẫn kết nối để bắt đầu.',code:'NOT_CONFIGURED'});
   const id = url.searchParams.get('folder') || folder;
   if (!validId(id)) return json(res,400,{error:'ID thư mục không hợp lệ.'});
   let result=[], page;
   do {
    const params = new URLSearchParams({key,q:`'${id}' in parents and trashed = false`,fields:'nextPageToken,files(id,name,mimeType,size)',pageSize:'1000'});
    if(page) params.set('pageToken',page);
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`);
    const data = await response.json();
    if(!response.ok) return json(res,response.status,{error:'Không đọc được Drive. Kiểm tra API key, Drive API và quyền chia sẻ thư mục.'});
    result.push(...data.files.filter(f=> f.mimeType.startsWith('audio/') || /\.(mp3|m4a|wav|ogg|flac|aac)$/i.test(f.name)));
    page = data.nextPageToken;
   } while(page);
   result = result.map((f,i)=> { const name=f.name.replace(/\.[^.]+$/,''); const parts=name.split(' - '); const t={id:f.id,title:parts[0],artist:parts.slice(1).join(' - ') || 'Thư viện Google Drive',index:i,src:`/api/audio/${f.id}`}; tracks.set(f.id,t); return t; });
   return json(res,200,{tracks:result,folder:id});
  }
  if(url.pathname.startsWith('/api/audio/')) {
   const id=url.pathname.split('/').pop();
   if(!key || !tracks.has(id)) return json(res,404,{error:'Bài hát không có trong thư viện đã tải.'});
   const upstream = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${encodeURIComponent(key)}`,{headers:req.headers.range ? {Range:req.headers.range} : {}});
   if(!upstream.ok) return json(res,upstream.status,{error:'Drive không cho phép phát file này.'});
   const headers={};
   for(const h of ['content-type','content-length','content-range','accept-ranges']) if(upstream.headers.has(h)) headers[h]=upstream.headers.get(h);
   res.writeHead(upstream.status,headers);
   const stream=Readable.fromWeb(upstream.body); stream.on('error',()=>res.destroy()); res.on('close',()=>stream.destroy()); stream.pipe(res); return;
  }
  const routes={'/config.js':'public/config.js','/drive.js':'public/drive.js','/guide.txt':'docs/SETUP.md','/assets/logo-lov.png':'public/assets/logo-lov.png','/':'public/index.html','/app.js':'public/app.js','/style.css':'public/style.css','/guide':'docs/SETUP.md'};
  const path=routes[url.pathname]; if(!path) return json(res,404,{error:'Not found'});
  const body=await readFile(new URL(path,import.meta.url));
  res.writeHead(200,{'Content-Type':path.endsWith('.png')?'image/png':path.endsWith('.html')?'text/html; charset=utf-8':path.endsWith('.css')?'text/css':path.endsWith('.js')?'text/javascript':'text/plain; charset=utf-8'});res.end(body);
 } catch(e) { console.error(e.message); if(!res.headersSent) json(res,502,{error:'Không kết nối được nguồn nhạc. Vui lòng thử lại.'}); else res.destroy(); }
}).listen(port,()=>console.log(`Nhạc Của Tôi: http://localhost:${port}`));
