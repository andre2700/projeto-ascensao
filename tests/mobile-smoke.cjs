/* Teste end-to-end REAL de Projeto Ascensão com Chromium e WebKit (motor do Safari). */
const { chromium, webkit, devices } = require('playwright');
const { PNG } = require('pngjs');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output');
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.json':'application/json'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost');
 let requestPath=decodeURIComponent(u.pathname);if(requestPath==='/')requestPath='/preview-v08.html';
 const file=path.resolve(root,'.'+requestPath);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end('Not found: '+requestPath)}
 res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});
 fs.createReadStream(file).pipe(res);
});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function brightness(buffer){
 let image=PNG.sync.read(buffer),count=0,sum=0,greens=0;
 let top=Math.floor(image.height*.27),bottom=Math.floor(image.height*.83);
 for(let y=top;y<bottom;y+=12)for(let x=25;x<image.width-25;x+=12){
  let pos=(y*image.width+x)*4,r=image.data[pos],g=image.data[pos+1],b=image.data[pos+2];
  sum+=(r+g+b)/3;greens+=(g-r);count++;
 }
 return {meanBrightness:Math.round(sum/count),greenMinusRed:Math.round(greens/count)}
}
async function testEngine(kind,device){
 const browser=await kind.launch({headless:true,args:kind===chromium?['--disable-dev-shm-usage']:[]});
 const ctx=await browser.newContext({...device,reducedMotion:'no-preference'});
 const page=await ctx.newPage(),errors=[],failedResources=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 page.on('response',r=>{if(r.status()>=400&&new URL(r.url()).origin==='http://127.0.0.1:8765')failedResources.push(r.url()+' '+r.status())});
 let label=kind===webkit?'webkit-iphone':'chromium-mobile';
 try{
  await page.goto('http://127.0.0.1:8765/preview-v08.html?test='+label,{waitUntil:'load',timeout:45000});
  await page.waitForFunction(()=>!!window.AscensionGame,{timeout:45000});
  await page.waitForFunction(()=>window.AscensionIllustrated?.ready?.()&&window.AscensionTerrain?.ready?.()&&window.AscensionWorld?.stats?.().spriteReady,{timeout:25000});
  const art=await page.evaluate(()=>({illustrated:window.AscensionIllustrated.stats(),terrain:window.AscensionTerrain.stats(),tree:window.AscensionWorld.stats(),wind:window.AscensionWind.stats()}));
  assert.equal(art.illustrated.loaded.hero,true,'sprite do heroi ilustrado carregado');
  assert.equal(art.illustrated.normalized,true,'personagens com escala e pivô padronizados');
  assert.equal(art.illustrated.lockedWraithLantern,true,'lanterna do espectro deve ficar na mesma mão');
  assert.equal(art.tree.worldCanvas,true,'árvores devem pertencer ao canvas do mundo');
  assert(art.tree.trees>50,'colisores reais de tronco devem existir');
  assert.equal(art.wind.worldSpaceLeaves,true,'folhas devem usar coordenadas de mundo');
  assert.equal(art.terrain.sharpened,true,'textura do solo deve receber nitidez');
  assert.equal(await page.locator('#forest-tree-layer').count(),0,'nenhuma arvore em camada DOM separada');
  assert.equal(art.illustrated.loaded.wraith,true,'espectro ilustrado carregado');
  assert.equal(art.illustrated.loaded.beast,true,'fera ilustrada carregada');
  let init=await page.evaluate(()=>window.AscensionGame.debug());
  assert.equal(init.mode,'menu','deve abrir no menu');
  assert.equal(init.tiles,4,'precisa gerar quatro texturas de floresta antes de jogar');
  assert(init.props>1000,'precisa preparar árvores, folhagens e elementos de cenário');
  const collision=await page.evaluate(()=>{let t=window.AscensionWorld.trees[0];let r=window.AscensionWorld.resolve(t.x,t.y+9,13);return{radius:Math.hypot(r.x-t.x,r.y-(t.y+9)),required:t.radius+13,hit:r.collided}});
  assert(collision.hit&&collision.radius>=collision.required-.5,'colisão sólida: tronco não atravessável '+JSON.stringify(collision));
  await page.screenshot({path:path.join(out,label+'-menu.png')});
  await page.getByRole('button',{name:/INICIAR JORNADA/i}).click({timeout:12000});
  await page.waitForFunction(()=>window.AscensionGame.mode()==='play',{timeout:12000});
  const before=await page.evaluate(()=>window.AscensionGame.debug());
  await page.evaluate(()=>{
    window.__ascensionPointerTrace=[];
    for(const event of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture','touchstart','touchmove','touchend']){
      document.getElementById('game').addEventListener(event,e=>{
        if(window.__ascensionPointerTrace.length<28)window.__ascensionPointerTrace.push({event,identifier:e.pointerId??e.changedTouches?.[0]?.identifier,x:e.clientX??e.changedTouches?.[0]?.clientX,y:e.clientY??e.changedTouches?.[0]?.clientY});
      },{passive:true});
    }
  });
  // Evento compatível com Touch para exercitar o handler REAL do Safari, sem API Touch ilegal no Linux.
  let x=device.viewport.width*.31,y=device.viewport.height*.75;
  await page.evaluate(({x,y})=>{
    let cv=document.getElementById('game');
    function touch(type,px,py){let e=new Event(type,{bubbles:true,cancelable:true});
      Object.defineProperty(e,'changedTouches',{value:[{identifier:7,clientX:px,clientY:py}]});cv.dispatchEvent(e)}
    window.__testTouch=touch;
    touch('touchstart',x,y);
  },{x,y});
  await page.evaluate(({x,y})=>window.__testTouch('touchmove',x+68,y-39),{x,y});
  await page.waitForFunction(start=>window.AscensionGame?.debug?.().seconds >= start+.8,before.seconds,{timeout:75000,polling:250});
  const moving=await page.evaluate(()=>window.AscensionGame.debug());
  const gestureEvents=await page.evaluate(()=>window.__ascensionPointerTrace||[]);
  await page.screenshot({path:path.join(out,label+'-moving.png')});
  await page.evaluate(({x,y})=>window.__testTouch('touchend',x+68,y-39),{x,y});
  let dis=Math.hypot(moving.x-before.x,moving.y-before.y);
  assert(dis>25,'jogador deve se mover com joystick; deslocamento='+dis+' FPS='+moving.fps+' stick='+JSON.stringify(moving.stick)+' eventos='+JSON.stringify(gestureEvents));
  assert(moving.motion>.12,'animação de caminhada deve ser ativada; valor='+moving.motion);
  await page.waitForFunction(()=>window.AscensionGame?.debug?.().motion <.11,null,{timeout:60000,polling:250});
  const still=await page.evaluate(()=>window.AscensionGame.debug());
  assert(still.motion<moving.motion,'personagem precisa voltar à pose parada');
  // Ataque automático por mais alguns segundos, sem sobreposição nem travamento.
  await sleep(3200);
  let state=await page.evaluate(()=>window.AscensionGame.debug());
  if(state.mode==='upgrade'){
    const btn=page.locator('.choice').first();
    await btn.click();
    await sleep(200);
    state=await page.evaluate(()=>window.AscensionGame.debug());
  }
  assert.notEqual(state.mode,'error','o motor gráfico não pode mostrar erro de recuperação');
  assert.equal(errors.length,0,'sem erros JavaScript ou falhas de renderização: '+errors.join(' | '));
  assert(state.shakeEvents<=3,'tremidas não podem acontecer continuamente: '+state.shakeEvents);
  const latestError=await page.evaluate(()=>window.__ascensionLastError||null);
  assert.equal(latestError,null,'nenhuma falha gráfica silenciosa durante a partida');
  assert.equal(failedResources.length,0,'sem arquivos ausentes '+failedResources.join(','));
  await page.screenshot({path:path.join(out,label+'-game.png')});
  await page.screenshot({path:path.join(out,label+'-game.jpg'),type:'jpeg',quality:78});
  const image=fs.readFileSync(path.join(out,label+'-game.png')),pixels=brightness(image);
  assert(pixels.meanBrightness>65,'floresta deve ser CLARA; brilho='+pixels.meanBrightness);
  assert(pixels.greenMinusRed>=-10,'floresta deve ter predominância verde; diferença='+pixels.greenMinusRed);
  const report={art,world:state.tree,shakeEvents:state.shakeEvents,collision,browser:label,status:'PASS',time:state.seconds.toFixed(1),enemies:state.enemies,kills:state.kills,playerMovePx:Math.round(dis),motionDuringMove:moving.motion,motionIdle:still.motion,color:pixels,errors,failedResources};
  fs.writeFileSync(path.join(out,label+'-report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
  return report;
 }catch(e){
  try{await page.screenshot({path:path.join(out,label+'-FAILED.png')});await page.screenshot({path:path.join(out,label+'-FAILED.jpg'),type:'jpeg',quality:80})}catch{}
  const captured=await page.evaluate(()=>({lastError:window.__ascensionLastError||null,debug:window.AscensionGame?.debug()||null,pointerTrace:window.__ascensionPointerTrace||[]})).catch(()=>null);
  let report={browser:label,status:'FAIL',error:String(e),captured,errors,failedResources};
  fs.writeFileSync(path.join(out,label+'-report.json'),JSON.stringify(report,null,2));
  console.error(JSON.stringify(report));
  throw e;
 }finally{await browser.close()}
}
(async()=>{
 await new Promise(resolve=>server.listen(8765,'127.0.0.1',resolve));
 try{
   let results=[];
   results.push(await testEngine(webkit,devices['iPhone 13']));
   results.push(await testEngine(chromium,devices['Pixel 7']));
   fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(results,null,2));
 }finally{server.close()}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
