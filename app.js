import { fetchDriveTracks } from './drive.js';
const config=window.LOV_CONFIG||{source:'server'};
const $=s=>document.querySelector(s);
const audio=$('#audio');
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
let favorites=read('favorites',[]),recent=read('recent',[]),songs=[],current=null,view='home',shuffle=false,repeat=false,request=0;
const art=i=>`https://images.unsplash.com/${['photo-1475924156734-496f6cac6ec1','photo-1472396961693-142e6e269027','photo-1519681393784-d120267933ba','photo-1500534623283-312aade485b7','photo-1441974231531-c6227db76b6e','photo-1470770841072-f978cf4d019e'][i%6]}?auto=format&fit=crop&w=400&q=80`;
const persist=()=>{try{localStorage.setItem('favorites',JSON.stringify(favorites));localStorage.setItem('recent',JSON.stringify(recent))}catch{toast('Trình duyệt không cho phép lưu dữ liệu.')}};
let timer;function toast(t){$('#toast').textContent=t;$('#toast').style.display='block';clearTimeout(timer);timer=setTimeout(()=>$('#toast').style.display='none',4500)}
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n}
function icon(name, style='solid'){const node=el('i',`fa-${style} fa-${name}`);node.setAttribute('aria-hidden','true');return node}
function setIcon(selector,name,style='solid'){$(selector).replaceChildren(icon(name,style))}
function equalizer(){const node=el('span','equalizer');node.setAttribute('aria-hidden','true');for(let i=0;i<4;i++)node.append(el('b'));return node}
function paintRange(input){input.style.setProperty('--progress',`${(Number(input.value)-Number(input.min))/(Number(input.max)-Number(input.min))*100}%`)}
let layout=read('library-layout','grid')==='list'?'list':'grid';
function render(){
 syncMobileQueue();
 $('#fav-count').textContent=favorites.length;$('#saved-note').hidden=view!=='favorites';
 document.querySelectorAll('[data-view]').forEach(n=>n.classList.toggle('active',n.dataset.view===view));
 $('#section-heading').textContent=({home:'Dành cho bạn',all:'Tất cả bài hát',favorites:'Bài hát đã lưu',recent:'Đã nghe gần đây'})[view];
 const keyword=$('#search').value.trim();
 const query=keyword.toLocaleLowerCase('vi');
 document.body.classList.toggle('is-searching',!!query);
 $('#cards').classList.toggle('list-layout',layout==='list');
 $('#layout-toggle').replaceChildren(icon(layout==='grid'?'list':'grip'),el('span','',layout==='grid'?'Danh sách':'Lưới'));
 $('#layout-toggle').setAttribute('aria-pressed',layout==='list');
 $('#layout-toggle').title=layout==='grid'?'Chuyển sang danh sách':'Chuyển sang lưới';
 $('#layout-toggle').setAttribute('aria-label',$('#layout-toggle').title);
 let list=songs.filter(s=>(!!query||view!=='favorites'||favorites.includes(s.id))&&(!!query||view!=='recent'||recent.includes(s.id))&&`${s.title} ${s.artist}`.toLocaleLowerCase('vi').includes(query));
 if(view==='recent'&&!query)list.sort((a,b)=>recent.indexOf(a.id)-recent.indexOf(b.id));
 $('#search-summary').hidden=!query;
 if(query){$('#section-heading').textContent='Kết quả tìm kiếm';$('#search-summary').textContent=`${list.length} bài hát cho “${keyword}”`;}
 $('#cards').replaceChildren();
 for(const [index,s] of list.entries()){
  const card=el('article','card'+(current?.id===s.id?' playing':''));
  card.style.setProperty('--entry-delay',`${Math.min(index,8)*35}ms`);
  const play=el('button','card-main');play.title=`${s.title} — ${s.artist}`;play.setAttribute('aria-label',`Phát ${s.title}`);
  const cover=el('div','cover');cover.style.backgroundImage=`url("${art(s.index)}")`;
  const badge=el('span','card-play');badge.append(icon('play'));
  if(current?.id===s.id){badge.append(equalizer());play.setAttribute('aria-current','true')}
  cover.append(badge);
  play.append(cover,el('strong','',s.title),el('small','',s.artist));play.onclick=()=>current?.id===s.id?toggle():playSong(s);
  const save=el('button','save-track'+(favorites.includes(s.id)?' saved':''));
  save.dataset.trackId=s.id;save.title=favorites.includes(s.id)?'Bỏ lưu bài hát':'Lưu bài hát';save.setAttribute('aria-label',`${save.title}: ${s.title}`);save.setAttribute('aria-pressed',favorites.includes(s.id));
  save.append(icon('bookmark',favorites.includes(s.id)?'solid':'regular'));save.onclick=()=>toggleSaved(s.id);
  card.append(play,save);$('#cards').append(card);
 }
 if(!list.length){const empty=el('div','empty');empty.append(icon('music'),el('strong','',songs.length?'Chưa có bài hát phù hợp':'Thư viện đang chờ những giai điệu đầu tiên'),el('p','',songs.length?view==='favorites'?'Bấm biểu tượng lưu trên bài hát để thêm vào bộ sưu tập.':'Thử tìm kiếm khác hoặc chọn thêm bài đã lưu.':'Kết nối thư mục Google Drive để nghe nhạc của bạn tại đây.'));if(!songs.length){const b=el('button','','Kết nối thư viện ↗');b.onclick=openConfig;empty.append(b)}$('#cards').append(empty)}
 $('#queue-count').textContent=`${songs.length} bài hát`;
 $('#queue-list').replaceChildren();
 songs.forEach((s,i)=>{const b=el('button','queue-row'+(s.id===current?.id?' selected':''));const cover=el('div','queue-cover');cover.style.backgroundImage=`url("${art(s.index)}")`;const meta=el('div','meta');meta.append(el('strong','',s.title),el('small','',s.artist));b.append(el('span','number',String(i+1)),cover,meta,s.id===current?.id?equalizer():icon('ellipsis'));b.title=`${s.title} — ${s.artist}`;b.onclick=()=>playSong(s);$('#queue-list').append(b)});
 if(!songs.length){const e=el('div','empty');e.append(icon('list-ul'),el('strong','','Chưa có bài trong hàng đợi'),el('p','','Nhạc từ thư viện sẽ xuất hiện ở đây.'));$('#queue-list').append(e)}
 setIcon('#favorite',$('#expanded-player').open?'heart':'bookmark',current&&favorites.includes(current.id)?'solid':'regular');$('#favorite').setAttribute('aria-pressed',!!current&&favorites.includes(current.id));$('#favorite').setAttribute('aria-label',current&&favorites.includes(current.id)?'Bỏ lưu bài hát':'Lưu bài hát');$('#favorite').title=$('#favorite').getAttribute('aria-label');$('#favorite').style.color=current&&favorites.includes(current.id)?'#b298ff':'';
}
async function load(){const seq=++request;$('#refresh').classList.add('loading');$('#cards').setAttribute('aria-busy','true');$('#connection').textContent='Đang tải thư viện Google Drive…';try{const folder=read('folder',config.folderId||'');let loaded;
 if(config.source==='drive'){loaded=await fetchDriveTracks({apiKey:config.apiKey,folderId:folder})}else{const response=await fetch('./api/tracks'+(folder?'?folder='+encodeURIComponent(folder):''));const data=await response.json();if(!response.ok)throw new Error(data.error);loaded=data.tracks}
 if(seq!==request)return;songs=loaded;$('#connection').textContent=songs.length?`● Đã kết nối Google Drive · ${songs.length} bài hát · Ảnh minh họa`:'Thư mục chưa có file âm thanh, hoặc chưa được chia sẻ công khai.';render()}catch(e){if(seq!==request)return;$('#connection').replaceChildren(document.createTextNode(e.message+' '));const a=el('a','','Hướng dẫn kết nối ↗');a.href='./guide.txt';a.target='_blank';$('#connection').append(a);render()}finally{if(seq===request){$('#refresh').classList.remove('loading');$('#cards').setAttribute('aria-busy','false')}}}
async function playSong(song){current=song;audio.src=song.src;$('#now-title').textContent=song.title;$('#now-artist').textContent=song.artist;$('#now-art').textContent='';$('#now-art').style.backgroundImage=`url("${art(song.index)}")`;recent=[song.id,...recent.filter(id=>id!==song.id)].slice(0,100);persist();render();try{await audio.play()}catch(e){if(e.name!=='AbortError')toast('Không phát được bài hát. Kiểm tra quyền tải file trên Drive.')}}
function next(direction=1){if(!songs.length)return toast('Kết nối thư viện trước để bắt đầu nghe.');const i=songs.findIndex(s=>s.id===current?.id);const index=shuffle&&songs.length>1?(Math.max(i,0)+1+Math.floor(Math.random()*(songs.length-1)))%songs.length:(i+direction+songs.length)%songs.length;playSong(songs[index])}
function toggle(){if(!current){if(songs.length)playSong(songs[0]);else openConfig();return}if(audio.paused)audio.play().catch(()=>toast('Không thể phát bài hát. Vui lòng thử lại.'));else audio.pause()}
function openConfig(){$('#folder-input').value=read('folder',config.folderId||'1xmor8nF56-i_UU3c5B7IOgdx5dgoUn5D');$('#config').showModal()}
$('#settings').onclick=openConfig;$('#profile').onclick=openConfig;
$('#save-folder').onclick=()=>{const value=$('#folder-input').value.trim();const id=value.match(/folders\/([\w-]+)/)?.[1]||value;if(!/^[\w-]{10,150}$/.test(id))return toast('Vui lòng nhập link thư mục Drive hợp lệ.');try{localStorage.setItem('folder',JSON.stringify(id))}catch{return toast('Không lưu được cài đặt trình duyệt.')}audio.pause();current=null;songs=[];$('#now-title').textContent='Chọn một bài hát';$('#now-artist').textContent='Âm nhạc đang chờ bạn';$('#now-art').style.backgroundImage='';setIcon('#now-art','music');$('#config').close();render();load()};
$('#play').onclick=toggle;$('#hero-play').onclick=toggle;$('#prev').onclick=()=>next(-1);$('#next').onclick=()=>next();$('#refresh').onclick=load;
$('#hero-library').onclick=()=>{view='all';render();$('.library').scrollIntoView({behavior:'smooth'})};
$('#search').oninput=render;
 $('#layout-toggle').onclick=()=>{layout=layout==='grid'?'list':'grid';try{localStorage.setItem('library-layout',JSON.stringify(layout))}catch{toast('Không thể lưu kiểu hiển thị trên trình duyệt này.')}render()};
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>{view=b.dataset.view;render()};
for(const b of document.querySelectorAll('[data-query]'))b.onclick=()=>{view=b.classList.contains('m3')?'favorites':'all';$('#search').value=b.dataset.query;render();$('.library').scrollIntoView({behavior:'smooth'})};
function toggleSaved(id){
 const wasSaved=favorites.includes(id);const nextSaved=wasSaved?favorites.filter(x=>x!==id):[...favorites,id];
 try{localStorage.setItem('favorites',JSON.stringify(nextSaved))}catch{return toast('Không lưu được. Hãy cho phép trình duyệt lưu dữ liệu.')}
 favorites=nextSaved;render();toast(wasSaved?'Đã bỏ lưu bài hát.':'Đã thêm vào Bài hát đã lưu.');
 const button=[...document.querySelectorAll('.save-track')].find(b=>b.dataset.trackId===id);button?.focus({preventScroll:true});
}
$('#favorite').onclick=()=>{if(!current)return toast('Chọn một bài hát trước nhé.');toggleSaved(current.id)};
$('#shuffle').onclick=()=>{shuffle=!shuffle;$('#shuffle').classList.toggle('enabled',shuffle);$('#shuffle').setAttribute('aria-pressed',shuffle);syncMobileQueue()};
$('#repeat').onclick=()=>{repeat=!repeat;audio.loop=repeat;$('#repeat').classList.toggle('enabled',repeat);$('#repeat').setAttribute('aria-pressed',repeat)};
audio.volume=Number(read('volume',.7));$('#volume').value=audio.volume;paintRange($('#volume'));
$('#volume').oninput=e=>{audio.volume=Number(e.target.value);audio.muted=false;paintRange(e.target);setIcon('#mute','volume-high');try{localStorage.setItem('volume',JSON.stringify(audio.volume))}catch{}};
$('#mute').onclick=()=>{audio.muted=!audio.muted;setIcon('#mute',audio.muted?'volume-xmark':'volume-high');$('#mute').setAttribute('aria-label',audio.muted?'Bật tiếng':'Tắt tiếng')};
const time=s=>Number.isFinite(s)?`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`:'0:00';
audio.ontimeupdate=()=>{$('#elapsed').textContent=time(audio.currentTime);$('#duration').textContent=time(audio.duration);$('#seek').value=audio.duration?audio.currentTime/audio.duration*100:0;paintRange($('#seek'))};
$('#seek').oninput=e=>{if(Number.isFinite(audio.duration))audio.currentTime=Number(e.target.value)/100*audio.duration};
audio.onplay=()=>{setIcon('#play','pause');document.body.classList.add('is-playing');$('#play').setAttribute('aria-label','Tạm dừng');$('#hero-play').replaceChildren(icon('pause'),document.createTextNode(' Tạm dừng'))};audio.onpause=()=>{setIcon('#play','play');document.body.classList.remove('is-playing');$('#play').setAttribute('aria-label','Phát nhạc');$('#hero-play').replaceChildren(icon('play'),document.createTextNode(' Tiếp tục nghe'))};audio.onended=()=>next();audio.onerror=()=>toast('Không tải được âm thanh. File có thể bị giới hạn truy cập hoặc định dạng chưa được hỗ trợ.');
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();$('#search').focus()}if(e.code==='Space'&&!['INPUT','BUTTON','TEXTAREA'].includes(document.activeElement.tagName)&&!$('#config').open){e.preventDefault();toggle()}});
render();load();

$('#source-description').textContent=config.source==='drive'?'Nhạc được đọc trực tiếp từ Drive. Chỉ dùng thư mục đã chia sẻ công khai.':'API key được cấu hình riêng trên server.';

// Reuse the same controls and audio element in both player sizes.
const expandedPlayer=$('#expanded-player');
const player=$('.player');
const playerAnchor=document.createComment('mini-player');
player.before(playerAnchor);
let playerReturnFocus=null;
function openPlayer(){
 if(expandedPlayer.open)return;
 playerReturnFocus=document.activeElement;
 $('#expanded-content').append(player);
 setPlayerPanel('art');syncMobileQueue();expandedPlayer.showModal();setIcon('#favorite','heart',current&&favorites.includes(current.id)?'solid':'regular');
 document.body.classList.add('player-expanded');
 $('#now-art').setAttribute('aria-expanded','true');
}
function closePlayer(){setPlayerPanel('art');expandedPlayer.close()}
expandedPlayer.addEventListener('close',()=>{
 setPlayerPanel('art');playerAnchor.after(player);setIcon('#favorite','bookmark',current&&favorites.includes(current.id)?'solid':'regular');
 document.body.classList.remove('player-expanded');
 $('#now-art').setAttribute('aria-expanded','false');
 if(playerReturnFocus?.isConnected)playerReturnFocus.focus({preventScroll:true});
});
$('#now-art').addEventListener('click',openPlayer);
$('.now-details').addEventListener('click',openPlayer);
$('.now-details').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPlayer()}});
$('#collapse-player').onclick=closePlayer;
player.addEventListener('click',e=>{if(e.target===player)openPlayer()});
let swipeStart=null;
$('#player-drag-handle').addEventListener('touchstart',e=>{swipeStart={x:e.touches[0].clientX,y:e.touches[0].clientY}},{passive:true});
$('#player-drag-handle').addEventListener('touchend',e=>{
 if(!swipeStart)return;
 const touch=e.changedTouches[0];
 if(touch.clientY-swipeStart.y>65&&Math.abs(touch.clientX-swipeStart.x)<80)closePlayer();
 swipeStart=null;
},{passive:true});
$('#player-drag-handle').addEventListener('touchcancel',()=>{swipeStart=null},{passive:true});

// Animate only while audio is advancing; waiting and pause keep the selected row visible.
audio.addEventListener('playing',()=>document.body.classList.add('audio-advancing'));
for(const event of ['pause','waiting','ended','emptied','error']){
 audio.addEventListener(event,()=>document.body.classList.remove('audio-advancing'));
}

function syncMobileQueue(){
 const panel=$('#expanded-player');
 if(current)panel.style.setProperty('--song-art',`url("${art(current.index)}")`);else panel.style.removeProperty('--song-art');
 const list=$('#mobile-queue-tracks');list.replaceChildren();
 $('#mobile-queue-count').textContent=`${songs.length} bài hát`;
 const currentIndex=songs.findIndex(s=>s.id===current?.id);
 const ordered=currentIndex>=0?[...songs.slice(currentIndex),...songs.slice(0,currentIndex)]:songs;
 $('#queue-order-note').textContent=shuffle?'Đang bật phát ngẫu nhiên':'Theo thứ tự thư viện';
 for(const [position,song] of ordered.entries()){
  if(position===0|| (position===1&&currentIndex>=0))list.append(el('h3','queue-group-title',position===0&&currentIndex>=0?'Đang phát':`Tiếp theo (${ordered.length-(currentIndex>=0?1:0)})`));
  const active=song.id===current?.id;
  const row=el('button','mobile-song'+(active?' selected':''));
  const cover=el('span','mobile-song-cover');cover.style.backgroundImage=`url("${art(song.index)}")`;
  const meta=el('span','mobile-song-meta');meta.append(el('strong','',song.title),el('small','',song.artist));
  row.append(cover,meta,active?equalizer():icon('play'));row.setAttribute('aria-label',`Phát ${song.title}`);
  if(active)row.setAttribute('aria-current','true');
  row.onclick=()=>active?toggle():playSong(song);list.append(row);
 }
 if(!ordered.length)list.append(el('p','queue-hint','Chọn một bài từ thư viện để bắt đầu.'));
}
function setPlayerPanel(mode){
 const panel=$('#expanded-player');panel.dataset.panel=mode;
 $('#mobile-queue').hidden=mode!=='queue';$('#lyrics-panel').hidden=mode!=='lyrics';
 $('#open-mobile-queue').setAttribute('aria-pressed',mode==='queue');
 $('#open-mobile-queue').setAttribute('aria-label',mode==='queue'?'Quay lại bài đang phát':'Mở danh sách phát');
 setIcon('#open-mobile-queue',mode==='queue'?'xmark':'list-ul');
 $('#show-lyrics').setAttribute('aria-pressed',mode==='lyrics');
}
$('#open-mobile-queue').onclick=()=>{syncMobileQueue();setPlayerPanel(expandedPlayer.dataset.panel==='queue'?'art':'queue')};
$('#show-lyrics').onclick=()=>setPlayerPanel(expandedPlayer.dataset.panel==='lyrics'?'art':'lyrics');
$('#show-volume').onclick=()=>{const visible=expandedPlayer.classList.toggle('volume-visible');$('#show-volume').setAttribute('aria-pressed',visible);$('#show-volume').setAttribute('aria-label',visible?'Ẩn âm lượng':'Hiện âm lượng')};
