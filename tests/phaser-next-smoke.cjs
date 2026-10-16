/* Teste ponta a ponta da nova fundação Phaser: Safari WebKit e Android */
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const assert=require('node:assert/strict');
const {chromium,webkit,devices}=require('playwright');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'test-output');fs.mkdirSync(dir,{recursive:true});
const contentType={'.html':'text/html','.js':'application/javascript','.css':'text/css','.avif':'image/avif','.png':'image/png'};
const server=http.createServer((req,res)=>{
 let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end('not found')}
 res.writeHead(200,{'Content-Type':contentType[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});
 fs.createReadStream(file).pipe(res)
});
(async()=>{
 await new Promise(resolve=>server.listen(8769,'127.0.0.1',resolve));
 const results=[];
 for(const [name,type,device] of [['iphone',webkit,devices['iPhone 13']],['android',chromium,devices['Pixel 7']]]){
  const browser=await type.launch({headless:true});
  const ctx=await browser.newContext({...device,locale:'pt-BR'});
  const page=await ctx.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error'&&/Phaser|Uncaught|failed to load|Error:/i.test(m.text()))errors.push(m.text())});
  try{
   await page.goto('http://127.0.0.1:8769/phaser-next.html?qa=1',{waitUntil:'load',timeout:55000});
   await page.waitForFunction(()=>window.AscensionNext?.ready===true,null,{timeout:50000,polling:200});
   let before=await page.evaluate(()=>window.AscensionNext.stats());
   assert(before?.version==='phaser-0.1'&&before.trees>25&&before.enemies>=10,'Cena real do Phaser carregada');
   assert.equal(before.animationTechnique,'single stable illustrated pose until coherent directional atlas exists');
   await page.getByRole('button',{name:/INICIAR JORNADA/}).click();
   await page.waitForFunction(()=>window.AscensionNext.stats()?.playing===true);
   const initial=await page.evaluate(()=>window.AscensionNext.stats());
   const size=device.viewport;
   await page.mouse.move(size.width*.30,size.height*.74);
   await page.mouse.down();
   await page.mouse.move(size.width*.68,size.height*.63,{steps:9});
   await page.waitForFunction(p=>{const s=window.AscensionNext?.stats?.();return s&&Math.hypot(s.hero.x-p.x,s.hero.y-p.y)>42},initial.hero,{timeout:45000,polling:150});
   const moving=await page.evaluate(()=>window.AscensionNext.stats());
   assert.equal(await page.locator('#stick').isVisible(),true,'joystick deve aparecer ao tocar');
   await page.mouse.up();
   await page.screenshot({path:path.join(dir,'phaser-next-'+name+'.jpg'),type:'jpeg',quality:87});
   await page.getByRole('button',{name:'Afastar câmera'}).click();
   const zoom=await page.evaluate(()=>window.AscensionNext.stats());
   assert(zoom.zoom<moving.zoom,'zoom real aplicado na câmera');
   // Ensaio de combate determinístico: inimigo central ao alcance.
   await page.evaluate(()=>{window.AscensionNext.test.clearEnemies();window.AscensionNext.test.spawn('beast',67,0,110)});
   const attackBefore=await page.evaluate(()=>window.AscensionNext.stats());
   await page.waitForFunction(start=>window.AscensionNext.stats()?.hits>start.hits,attackBefore,{timeout:30000,polling:180});
   let fighting=await page.evaluate(()=>window.AscensionNext.stats());
   assert(fighting.attacks>0&&fighting.hits>0,'espadada provoca dano real');
   await page.evaluate(()=>window.AscensionNext.test.forceXP(15));
   assert.equal(await page.locator('#levelmenu').isVisible(),true,'menu de subida de nível');
   await page.locator('#choices button').first().click();
   const leveled=await page.evaluate(()=>window.AscensionNext.stats());
   assert.equal(leveled.level,2,'subida de nível após seleção');
   await page.getByRole('button',{name:'Pausar partida'}).click();
   assert.equal(await page.locator('#pausemenu').isVisible(),true,'pausa funcional');
   await page.getByRole('button',{name:'CONTINUAR'}).click();
   const resumed=await page.evaluate(()=>window.AscensionNext.stats());
   assert(resumed.playing&&!resumed.paused,'jogo retoma');
   assert.equal(errors.length,0,'nenhuma exceção Javascript: '+errors.join(' | '));
   const result={status:'PASS',browser:name,engine:'Phaser',version:resumed.version,
     movement:Math.round(Math.hypot(moving.hero.x-initial.hero.x,moving.hero.y-initial.hero.y)),
     totalHits:fighting.hits,attacks:fighting.attacks,level:leveled.level,zoomInitial:moving.zoom,zoomFinal:zoom.zoom,
     trees:resumed.trees,enemies:resumed.enemies,animationTechnique:resumed.animationTechnique,errors};
   results.push(result);console.log(JSON.stringify(result))
  }catch(e){
   errors.push(String(e));
   await page.screenshot({path:path.join(dir,'phaser-next-'+name+'-FAILED.jpg'),type:'jpeg',quality:86}).catch(()=>{});
   const result={status:'FAIL',browser:name,errors,stats:await page.evaluate(()=>window.AscensionNext?.stats?.()).catch(()=>null)};
   results.push(result);console.error(JSON.stringify(result))
  }finally{await browser.close()}
 }
 fs.writeFileSync(path.join(dir,'phaser-next-report.json'),JSON.stringify(results,null,2));
 server.close();
 if(results.some(x=>x.status!=='PASS'))process.exitCode=1
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
