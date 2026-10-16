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
 let requestPath=decodeURIComponent(u.pathname);if(requestPath==='/')requestPath='/index.html';
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
  await page.goto('http://127.0.0.1:8765/index.html?test='+label+'&qa=1',{waitUntil:'load',timeout:45000});
  await page.waitForFunction(()=>!!window.AscensionGame,{timeout:45000});
  await page.waitForFunction(()=>window.AscensionIllustrated?.ready?.()&&window.AscensionTerrain?.ready?.()&&window.AscensionWorld?.stats?.().spriteReady,{timeout:25000});
  const art=await page.evaluate(()=>({illustrated:window.AscensionIllustrated.stats(),terrain:window.AscensionTerrain.stats(),tree:window.AscensionWorld.stats(),wind:window.AscensionWind.stats()}));
  assert.equal(art.illustrated.loaded.hero,true,'sprite do heroi ilustrado carregado');
  assert.equal(art.illustrated.virtualStrideFrames,16,'a corrida precisa ter 16 fases pré-renderizadas');
  assert.equal(art.illustrated.creaturePhaseFrames.beast,12,'a fera precisa de doze fases de movimento');
  assert.equal(art.illustrated.creaturePhaseFrames.wraith,10,'o espectro precisa de dez fases de movimento');
  assert.equal(art.illustrated.normalized,true,'personagens com escala e pivô padronizados');
  assert.equal(art.illustrated.sharpened,true,'o personagem deve ter nitidez aprimorada');
  assert.equal(art.illustrated.outlined,true,'contorno sutil habilitado');
  assert.equal(art.tree.baseRadiusX>=35,true,'colisão deve abranger toda a base horizontal da árvore');
  assert.equal(art.tree.baseRadiusY>=18,true,'colisão deve ter área vertical adequada');
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
  const collision=await page.evaluate(()=>{const t=window.AscensionWorld.trees[0],inside=t.x+t.radiusX*.88;
    const r=window.AscensionWorld.resolve(inside,t.y+9,13);
    return{hit:r.collided,radiusX:t.radiusX,radiusY:t.radiusY,normalized:Math.hypot((r.x-t.x)/(t.radiusX+13),(r.y-(t.y+9))/(t.radiusY+11))};
  });
  assert(collision.hit&&collision.normalized>=.98,'colisão deve impedir entrada na base inteira do tronco '+JSON.stringify(collision));
  await page.screenshot({path:path.join(out,label+'-menu.png')});
  await page.getByRole('button',{name:/INICIAR JORNADA/i}).click({timeout:12000});
  await page.waitForFunction(()=>window.AscensionGame.mode()==='play',{timeout:12000});
  const directionTest=await page.evaluate(()=>window.AscensionQATools.verifyDirections());
  assert.equal(directionTest.length,8,'o guerreiro deve atacar em oito direções');
  assert(directionTest.every(d=>d.started&&d.actual===d.expected&&d.hit),
    'as oito direções precisam acertar inimigos à frente: '+JSON.stringify(directionTest));
  const upgrades=await page.evaluate(()=>window.AscensionQATools.verifyUpgrades());
  assert(upgrades.upgraded.radius>upgrades.basic.radius,'área deve aumentar alcance');
  assert(upgrades.upgraded.spread>upgrades.basic.spread,'área deve aumentar abertura do arco');
  assert.equal(upgrades.upgraded.cuts,4,'quantidade 3 deve gerar quatro cortes');
  const katana=await page.evaluate(()=>window.AscensionQATools.verifyKatanaEvolution());
  assert.equal(katana.length,3,'3 estágios de evolução da espada');
  assert.equal(katana[0].numberOfWaves,0,'espada básica é um corte corpo a corpo');
  assert(katana[1].numberOfWaves>=2,'espada intermediária gera crescentes viajantes');
  assert(katana[2].range>katana[1].range&&katana[1].range>katana[0].range,'alcance cresce com evolução');
  assert(katana[2].size>katana[1].size,'evolução aumenta tamanho das ondas');
  assert(katana[2].uniqueDirections>=5,'evolução ataca em múltiplas direções');
  const contact=await page.evaluate(()=>window.AscensionQATools.verifyWaveContact());
  assert(!contact.before&&contact.onContact&&!contact.behind,'trajetória das ondas deve colidir corretamente '+JSON.stringify(contact));
  const initialZoom=await page.evaluate(()=>window.AscensionGame.debug().cameraZoom);
  assert(initialZoom>.74&&initialZoom<.99,'câmera móvel inicia enquadrada com afastamento');
  await page.evaluate(()=>{
    window.AscensionQATools.spawn('hound',86,22,550);
    window.AscensionQATools.spawn('wraith',-84,36,550);
  });
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
  await page.waitForFunction(origin=>{const p=window.AscensionGame?.debug?.();return p&&Math.hypot(p.x-origin.x,p.y-origin.y)>25&&p.motion>.12},{x:before.x,y:before.y},{timeout:90000,polling:180});
  const moving=await page.evaluate(()=>window.AscensionGame.debug());
  const gestureEvents=await page.evaluate(()=>window.__ascensionPointerTrace||[]);
  await page.screenshot({path:path.join(out,label+'-moving.png')});
  await page.evaluate(({x,y})=>window.__testTouch('touchend',x+68,y-39),{x,y});
  let dis=Math.hypot(moving.x-before.x,moving.y-before.y);
  assert(dis>25,'jogador deve se mover com joystick; inicio='+JSON.stringify(before)+' fim='+JSON.stringify(moving)+' deslocamento='+dis+' FPS='+moving.fps+' eventos='+JSON.stringify(gestureEvents));
  assert(moving.motion>.12,'animação de caminhada deve ser ativada; valor='+moving.motion);
  await page.waitForFunction(()=>window.AscensionIllustrated?.stats?.().runDraws>0,null,{timeout:35000,polling:200});
  const animationStats=await page.evaluate(()=>window.AscensionIllustrated.stats());
  assert(animationStats.runDraws>0,'o guerreiro deve desenhar os novos quadros de corrida');
  assert(animationStats.creatureDraws.beast+animationStats.creatureDraws.wraith>0,
    'inimigos devem receber quadros contínuos de animação');
  await page.waitForFunction(()=>window.AscensionGame?.debug?.().motion <.11,null,{timeout:60000,polling:250});
  const still=await page.evaluate(()=>window.AscensionGame.debug());
  assert(still.motion<moving.motion,'personagem precisa voltar à pose parada');
  // Partida real com katana evoluída: duas feras, uma delas fora do alcance corpo a corpo.
  await page.evaluate(()=>{
    window.AscensionQATools.clear();window.AscensionQATools.setBuild(6,4);
    window.AscensionQATools.spawn('hound',58,0,2000);
    window.AscensionQATools.spawn('hound',185,0,600);
  });
  await page.waitForFunction(()=>{const v=window.AscensionGame.debug();return v.totalWaves>0&&v.waveHits>=2},{},{timeout:60000,polling:200});
  const evolved=await page.evaluate(()=>window.AscensionGame.debug());
  assert.equal(evolved.katanaStage,2,'katana avançada deve mudar de estágio visual');
  assert(evolved.cameraZoom<=initialZoom+.005,'câmera deve recuar com aumento de poder');
  await page.screenshot({path:path.join(out,label+'-katana-evolved.jpg'),type:'jpeg',quality:84});
  await page.evaluate(()=>{window.AscensionQATools.clear();window.AscensionQATools.setBuild(0,0)});
  // QA determinístico: inimigo real ao alcance da espada, sem projéteis.
  assert.equal(await page.evaluate(()=>!!window.AscensionQATools),true,'ganchos de QA devem existir apenas com ?qa=1');
  await page.evaluate(()=>{window.AscensionQATools.clear();window.AscensionQATools.spawn('hound',33,0,320)});
  const beforeAttack=await page.evaluate(()=>window.AscensionGame.debug());
  await page.waitForFunction(before=>{const now=window.AscensionGame?.debug?.();return now&&now.meleeHits>before.meleeHits&&now.enemyStrikes>before.enemyStrikes},beforeAttack,{timeout:55000,polling:180});
  let action=await page.evaluate(()=>window.AscensionGame.debug());
  assert(action.swordSwings>0&&action.meleeHits>0,'a espada deve causar dano corpo a corpo');
  assert.equal(action.projectiles,0,'o guerreiro não pode lançar projéteis');
  assert(action.enemyStrikes>0,'o inimigo deve executar ataque com antecipação');
  assert.equal(action.combatMode,'evolving-katana');
  await page.screenshot({path:path.join(out,label+'-sword-action.png')});
  await sleep(750);
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
  assert.equal(state.projectiles,0,'sem projéteis do guerreiro');
  const latestError=await page.evaluate(()=>window.__ascensionLastError||null);
  assert.equal(latestError,null,'nenhuma falha gráfica silenciosa durante a partida');
  assert.equal(failedResources.length,0,'sem arquivos ausentes '+failedResources.join(','));
  await page.screenshot({path:path.join(out,label+'-game.png')});
  await page.screenshot({path:path.join(out,label+'-game.jpg'),type:'jpeg',quality:78});
  const image=fs.readFileSync(path.join(out,label+'-game.png')),pixels=brightness(image);
  assert(pixels.meanBrightness>65,'floresta deve ser CLARA; brilho='+pixels.meanBrightness);
  assert(pixels.greenMinusRed>=-10,'floresta deve ter predominância verde; diferença='+pixels.greenMinusRed);
  const report={animationStats,katana,contact,initialZoom,cameraZoom:state.cameraZoom,evolved:{stage:evolved.katanaStage,waveHits:evolved.waveHits,totalWaves:evolved.totalWaves,cameraZoom:evolved.cameraZoom},directionTest,upgrades,art,world:state.tree,shakeEvents:state.shakeEvents,collision,combat:{meleeHits:action.meleeHits,enemyStrikes:action.enemyStrikes,projectiles:action.projectiles,swordSwings:action.swordSwings},browser:label,status:'PASS',time:state.seconds.toFixed(1),enemies:state.enemies,kills:state.kills,playerMovePx:Math.round(dis),motionDuringMove:moving.motion,motionIdle:still.motion,color:pixels,errors,failedResources};
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
