/* Projeto Ascensão — revisão VISUAL temporal.
   Captura uma sequência real da partida. Não atesta qualidade artística automaticamente. */
const {chromium,devices}=require('playwright');
const {PNG}=require('pngjs');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),output=path.join(root,'test-output');
fs.mkdirSync(output,{recursive:true});
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.avif':'image/avif','.webp':'image/webp','.json':'application/json'};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
  res.writeHead(404);return res.end('missing '+pathname);
 }
 res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-cache'});
 fs.createReadStream(file).pipe(res)
});
function contactSheet(buffers,columns=4,targetWidth=198){
 const decoded=buffers.map(b=>PNG.sync.read(b)),native=decoded[0];
 const targetHeight=Math.round(native.height*targetWidth/native.width);
 const rows=Math.ceil(buffers.length/columns),canvas=new PNG({width:columns*targetWidth,height:rows*targetHeight});
 canvas.data.fill(18);
 for(let i=0;i<decoded.length;i++){
  const im=decoded[i],cx=i%columns*targetWidth,cy=Math.floor(i/columns)*targetHeight;
  for(let y=0;y<targetHeight;y++)for(let x=0;x<targetWidth;x++){
   const sx=Math.min(im.width-1,Math.floor(x*im.width/targetWidth));
   const sy=Math.min(im.height-1,Math.floor(y*im.height/targetHeight));
   const src=(sy*im.width+sx)*4,dst=((cy+y)*canvas.width+cx+x)*4;
   canvas.data[dst]=im.data[src];canvas.data[dst+1]=im.data[src+1];canvas.data[dst+2]=im.data[src+2];canvas.data[dst+3]=255
  }
 }
 return PNG.sync.write(canvas)
}
(async()=>{
 await new Promise(r=>server.listen(8766,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 const ctx=await browser.newContext({...devices['iPhone 13'],reducedMotion:'no-preference'});
 const page=await ctx.newPage(),issues=[],frames=[],records=[];
 page.on('pageerror',e=>issues.push(String(e)));
 page.on('console',e=>{if(e.type()==='error')issues.push(e.text())});
 try{
  await page.goto('http://127.0.0.1:8766/index.html?qa=1&motion-review=1',{waitUntil:'load',timeout:40000});
  await page.waitForFunction(()=>!!window.AscensionGame&&window.AscensionIllustrated?.ready?.(),{timeout:40000});
  await page.getByRole('button',{name:/INICIAR JORNADA/i}).click();
  await page.waitForFunction(()=>window.AscensionGame.mode()==='play');
  // Começar andando sem inimigos para isolar a qualidade da corrida.
  await page.evaluate(()=>{
   window.AscensionQATools.clear();
   const cv=document.getElementById('game');
   window.__reviewTouch=(type,x,y)=>{
    let ev=new Event(type,{bubbles:true,cancelable:true});
    Object.defineProperty(ev,'changedTouches',{value:[{identifier:8,clientX:x,clientY:y}]});
    cv.dispatchEvent(ev)
   }
  });
  const x=126,y=660;
  await page.evaluate(({x,y})=>{window.__reviewTouch('touchstart',x,y);window.__reviewTouch('touchmove',x+72,y-26)},{x,y});
  for(let i=0;i<6;i++){
   await page.waitForTimeout(240);
   frames.push(await page.screenshot({type:'png'}));
   records.push(await page.evaluate(()=>{let d=window.AscensionGame.debug();return{seconds:d.seconds,x:d.x,y:d.y,motion:d.motion,fps:d.fps,heroDraws:window.AscensionIllustrated.stats().framesDrawn.hero}}))
  }
  await page.evaluate(({x,y})=>{
   window.__reviewTouch('touchend',x+72,y-26);
   window.AscensionQATools.spawn('hound',62,0,2000);
   window.AscensionQATools.spawn('wraith',-85,35,2000)
  },{x,y});
  for(let i=0;i<6;i++){
   await page.waitForTimeout(260);
   frames.push(await page.screenshot({type:'png'}));
   records.push(await page.evaluate(()=>{let d=window.AscensionGame.debug();return{seconds:d.seconds,x:d.x,y:d.y,motion:d.motion,fps:d.fps,heroDraws:window.AscensionIllustrated.stats().framesDrawn.hero}}))
  }
  fs.writeFileSync(path.join(output,'motion-review.png'),contactSheet(frames));
  const outcome={version:(await page.evaluate(()=>window.AscensionGame.debug().version)),sampledFrames:frames.length,
   method:'12 successive screenshots of gameplay under held touch: 6 running and 6 combat',
   frameSequence:records,exceptions:issues,
   artisticStatus:'REQUIRES HUMAN VISUAL REVIEW: never infer visual quality from green browser tests'};
  fs.writeFileSync(path.join(output,'motion-review.json'),JSON.stringify(outcome,null,2));
  assert.equal(issues.length,0,'JavaScript errors in visual capture');
  assert(records.at(-1).seconds>records[0].seconds,'simulation should advance');
  console.log(JSON.stringify({status:'CAPTURED_NOT_VISUALLY_APPROVED',version:outcome.version,frames:frames.length,fps:records.map(x=>x.fps)}))
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
