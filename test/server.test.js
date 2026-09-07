import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
let server;
before(async()=>{
 server=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:'3199',DRIVE_API_KEY:''}});
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(new Error(`Server exited ${code}`)))});
});
after(()=>server.kill());
test('serves application and guide',async()=>{for(const path of ['/','/app.js','/style.css','/guide']){const r=await fetch(`http://localhost:3199${path}`);assert.equal(r.status,200);assert.ok((await r.text()).length>100)}});
test('missing credentials have explicit setup state',async()=>{const r=await fetch('http://localhost:3199/api/tracks');assert.equal(r.status,503);assert.equal((await r.json()).code,'NOT_CONFIGURED')});
test('unknown audio cannot be proxied',async()=>{assert.equal((await fetch('http://localhost:3199/api/audio/arbitrary-file')).status,404)});
test('environment file cannot be downloaded',async()=>{assert.equal((await fetch('http://localhost:3199/.env')).status,404)});
