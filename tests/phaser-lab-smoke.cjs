/* Teste independente — laboratório Phaser no Safari/WebKit e Chromium */
const http=require('node:http'), fs=require('node:fs'),path=require('node:path');
const assert=require('node:assert/strict');
const {chromium,webkit,devices}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output');
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.avif':'image/avif','.png':'image/png','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
  let file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/%20/g,' '));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end('not found')}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});
  fs.createReadStream(file).pipe(res)
});
(async()=>{
 await new Promise(ok=>server.listen(8768,'127.0.0.1',ok));
 const results=[];
 for(const [label,browserType,profile] of [['iphone',webkit,devices['iPhone 13']],['android',chromium,devices['Pixel 7']]]){
  const browser=await browserType.launch({headless:true});
  const context=await browser.newContext({...profile,locale:'pt-BR'});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  try{
   await page.goto('http://127.0.0.1:8768/phaser-lab.html',{waitUntil:'load',timeout:60000});
   await page.waitForFunction(()=>window.AscensionPhaser?.ready===true,{timeout:50000,polling:200});
   const before=await page.evaluate(()=>window.AscensionPhaser.stats());
   assert(before.phaser.startsWith('3.90'),'engine realmente Phaser 3.90.0');
   assert(before.trees>=10&&before.foes>=8,'sprites e árvores Phaser foram criados');
   await page.getByRole('button',{name:'INICIAR TESTE'}).click();
   await page.waitForFunction(()=>window.AscensionPhaser?.stats()?.playing===true,{timeout:8000});
   const start=await page.evaluate(()=>window.AscensionPhaser.stats());
   await page.mouse.move(profile.viewport.width*.32,profile.viewport.height*.73);
   await page.mouse.down();
   await page.mouse.move(profile.viewport.width*.63,profile.viewport.height*.65,{steps:12});
   await page.waitForTimeout(1600);
   const mid=await page.evaluate(()=>window.AscensionPhaser.stats());
   await page.mouse.up();
   await page.getByRole('button',{name:'Afastar câmera'}).click();
   const after=await page.evaluate(()=>window.AscensionPhaser.stats());
   const traveled=Math.hypot(mid.hero.x-start.hero.x,mid.hero.y-start.hero.y);
   assert(traveled>12,'controle analógico movimenta personagem, dist='+traveled);
   assert(after.zoom<mid.zoom,'zoom Phaser mudou ao apertar botão');
   assert.equal(errors.length,0,'sem exceções JS: '+errors.join('; '));
   await page.screenshot({path:path.join(out,'phaser-lab-'+label+'.jpg'),type:'jpeg',quality:83});
   let report={result:'PASS',browser:label,engine:before.phaser,trees:before.trees,
     foeCount:after.foes,traveled,zoomBefore:mid.zoom,zoomAfter:after.zoom,errors};
   results.push(report);console.log(JSON.stringify(report))
  }catch(err){
   errors.push(String(err));
   await page.screenshot({path:path.join(out,'phaser-lab-'+label+'-FAILED.jpg'),type:'jpeg',quality:78}).catch(()=>{});
   results.push({result:'FAIL',browser:label,errors});
   console.error(err)
  }finally{await browser.close()}
 }
 fs.writeFileSync(path.join(out,'phaser-lab-report.json'),JSON.stringify(results,null,2));
 server.close();
 if(results.some(x=>x.result!=='PASS'))process.exitCode=1
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});