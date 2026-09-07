// Public Drive data only. Browser API keys must be restricted by HTTP referrer.
export async function fetchDriveTracks({apiKey,folderId}) {
 if (!apiKey) throw new Error('Chưa cấu hình API key cho GitHub Pages. Xem hướng dẫn triển khai.');
 if (!/^[\w-]{10,150}$/.test(folderId)) throw new Error('ID thư mục Google Drive không hợp lệ.');
 let files=[],pageToken;
 do {
  const params=new URLSearchParams({key:apiKey,q:`'${folderId}' in parents and trashed = false`,fields:'nextPageToken,files(id,name,mimeType)',pageSize:'1000'});
  if(pageToken) params.set('pageToken',pageToken);
  const response=await fetch(`https://www.googleapis.com/drive/v3/files?${params}`);
  const data=await response.json();
  if(!response.ok) throw new Error('Không đọc được Google Drive. Kiểm tra API key, giới hạn website và quyền chia sẻ thư mục.');
  files.push(...(data.files||[]));pageToken=data.nextPageToken;
 } while(pageToken);
 return files.filter(f=>f.mimeType?.startsWith('audio/')||/\.(mp3|m4a|wav|ogg|flac|aac)$/i.test(f.name)).map((f,index)=>{
  const name=f.name.replace(/\.[^.]+$/,'');const parts=name.split(/\s+-\s*/);
  return {id:f.id,title:parts[0],artist:parts.slice(1).join(' - ')||'Thư viện Google Drive',index,src:`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(f.id)}?${new URLSearchParams({alt:'media',key:apiKey})}`};
 });
}
