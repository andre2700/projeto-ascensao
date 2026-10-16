/* QA temporal Phaser: 12 capturas da partida; números técnicos NÃO aprovam a arte. */
const {chromium,devices}=require('playwright');
const {PNG}=require('pngjs'),fs=require('fs'),path=require('path'),http=require('http');
const assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output');
fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css'};
const server=http.createServer((req,res)=>{
 const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
 if(!p.startsWith(root+path.sep)||!fs.existsSync(p)){res.writeHead(404);return res.end('Not found')}
 res.writeHead(200,{'Content-Type':types[path.extname(p)]||'application/octet-stream'});
 fs.createReadStream(p).pipe(res)
});
function sheet(buffers){
 const list=buffers.map(buf=>PNG.sync.read(buf)),w=175,h=Math.round(w*list[0].height/list[0].width),cols=4,rows=Math.ceil(list.length/4);
 const output=new PNG({width:w*cols,height:h*rows});
 for(let k=0;k<list.length;k++){
  const image=list[k],ix=k%cols,iy=Math.floor(k/cols);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const sx=Math.min(image.width-1,Math.floor(x*image.width/w));
   const sy=Math.min(image.height-1,Math.floor(y*image.height/h));
   const from=(sy*image.width+sx)*4,to=((iy*h+y)*output.width+ix*w+x)*4;
   output.data[to]=image.data[from];output.data[to+1]=image.data[from+1];
   output.data[to+2]=image.data[from+2];output.data[to+3]=255
  }
 }
 return PNG.sync.write(output)
}
(async()=>{
 await new Promise(resolve=>server.listen(8771,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({...devices['iPhone 13'],locale:'pt-BR'});
 const page=await context.newPage(),frames=[],states=[];
 try{
  await page.goto('http://127.0.0.1:8771/phaser-next.html?motion-test=1',{waitUntil:'load',timeout:50000});
  await page.waitForFunction(()=>window.AscensionNext?.ready===true,null,{timeout:50000});
  await page.getByRole('button',{name:/INICIAR JORNADA/}).click();
  await page.evaluate(()=>window.AscensionNext.test.clearEnemies());
  // 6 quadros correndo, 6 parado e em combate, observando escala e rotação.
  const W=devices['iPhone 13'].viewport.width,H=devices['iPhone 13'].viewport.height;
  await page.mouse.move(W*.34,H*.7);await page.mouse.down();
  await page.mouse.move(W*.7,H*.64,{steps:9});
  for(let i=0;i<6;i++){
   await page.waitForTimeout(145);
   frames.push(await page.screenshot({type:'png'}));
   states.push(await page.evaluate(()=>window.AscensionNext.stats()))
  }
  await page.mouse.up();
  await page.evaluate(()=>window.AscensionNext.test.spawn('beast',82,9,850));
  for(let i=0;i<6;i++){
   await page.waitForTimeout(160);
   frames.push(await page.screenshot({type:'png'}));
   states.push(await page.evaluate(()=>window.AscensionNext.stats()))
  }
  fs.writeFileSync(path.join(out,'phaser-next-motion.png'),sheet(frames));
  const first=states[0].hero;
  const sizes=states.map(s=>[s.hero.displayWidth,s.hero.displayHeight]);
  const rotations=states.map(s=>s.hero.angle);
  const framesUsed=[...new Set(states.map(s=>s.hero.frame))];
  const data={status:'CAPTURED_REVIEW_REQUIRED',count:frames.length,version:states[0].version,
    sizes:[...new Set(sizes.map(JSON.stringify))].map(JSON.parse),rotations,framesUsed,
    movementDistance:Math.round(Math.hypot(states[5].hero.x-first.x,states[5].hero.y-first.y)),
    warning:'A animação original ainda não está pronta. Capturas e testes de escala não certificam qualidade visual.'};
  fs.writeFileSync(path.join(out,'phaser-next-motion.json'),JSON.stringify(data,null,2));
  assert.equal(new Set(sizes.map(JSON.stringify)).size,1,'tamanho do guerreiro deve permanecer consistente');
  assert(rotations.every(v=>Math.abs(v)<.001),'herói não deve chacoalhar/rotacionar');
  assert(data.movementDistance>20,'jogador deve realmente se deslocar');
  console.log(JSON.stringify(data))
 }finally{await browser.close();server.close()}
})().catch(err=>{console.error(err.stack);process.exitCode=1;server.close()});
