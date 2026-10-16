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
 let requestPath=decodeURIComponent(u.pathname);if(requestPath==='/')requestPath='/preview-v06.html';
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
  await page.goto('http://127.0.0.1:8765/preview-v06.html?test='+label,{waitUntil:'load',timeout:45000});
  await page.waitForFunction(()=>!!window.AscensionGame,{timeout:45000});
  let init=await page.evaluate(()=>window.AscensionGame.debug());
  assert.equal(init.mode,'menu','deve abrir no menu');
  await page.screenshot({path:path.join(out,label+'-menu.png')});
  await page.getByRole('button',{name:/INICIAR JORNADA/i}).click({timeout:12000});
  await page.waitForFunction(()=>window.AscensionGame.mode()==='play',{timeout:12000});
  const before=await page.evaluate(()=>window.AscensionGame.debug());
  // Arraste o joystick de forma persistente: testamos deslocamento e alternância de pernas.
  let x=device.viewport.width*.31,y=device.viewport.height*.75;
  await page.mouse.move(x,y);await page.mouse.down();
  await page.mouse.move(x+68,y-39,{steps:12});
  await sleep(950);
  const moving=await page.evaluate(()=>window.AscensionGame.debug());
  await page.screenshot({path:path.join(out,label+'-moving.png')});
  await page.mouse.up();
  let dis=Math.hypot(moving.x-before.x,moving.y-before.y);
  assert(dis>25,'jogador deve se mover com joystick; deslocamento='+dis);
  assert(moving.motion>.12,'animação de caminhada deve ser ativada; valor='+moving.motion);
  await sleep(1100);
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
  assert(!errors.some(x=>/TypeError|Not enough arguments|ReferenceError|SyntaxError|Error:/i.test(x)),'erros de JavaScript: '+errors.join(' | '));
  assert.equal(failedResources.length,0,'sem arquivos ausentes '+failedResources.join(','));
  await page.screenshot({path:path.join(out,label+'-game.png')});
  const image=fs.readFileSync(path.join(out,label+'-game.png')),pixels=brightness(image);
  assert(pixels.meanBrightness>65,'floresta deve ser CLARA; brilho='+pixels.meanBrightness);
  assert(pixels.greenMinusRed>=-10,'floresta deve ter predominância verde; diferença='+pixels.greenMinusRed);
  const report={browser:label,status:'PASS',time:state.seconds.toFixed(1),enemies:state.enemies,kills:state.kills,playerMovePx:Math.round(dis),motionDuringMove:moving.motion,motionIdle:still.motion,color:pixels,errors,failedResources};
  fs.writeFileSync(path.join(out,label+'-report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
  return report;
 }catch(e){
  try{await page.screenshot({path:path.join(out,label+'-FAILED.png')})}catch{}
  let report={browser:label,status:'FAIL',error:String(e),errors,failedResources};
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
