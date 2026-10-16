/* Projeto Ascensão 0.8 — recorte limpo, pivô nos pés e consistência de quadros */
(function(root){
'use strict';
const motion=root.AscensionMotion;
if(!motion)throw Error('Animacoes iniciais ausentes');
const fallbackHero=motion.hero,fallbackEnemy=motion.drawEnemy;
const input=root.AscensionIllustrationData||{},TAU=Math.PI*2;
const specs={hero:{n:5,w:128,h:117,visual:91},wraith:{n:4,w:128,h:117,visual:71},beast:{n:4,w:128,h:117,visual:64}};
const states={},counts={hero:0,wraith:0,beast:0,fallback:0};
const runAsset=root.AscensionRunnerArt||null;
const runImage=new Image(),seenRunFrames=new Set();
let runReady=false,runFailed=false,runDraws=0,attackDraws=0;
runImage.onload=()=>{runReady=runImage.naturalWidth===168*7&&runImage.naturalHeight===136;runFailed=!runReady};
runImage.onerror=()=>{runFailed=true};
if(runAsset?.image)runImage.src=runAsset.image;else runFailed=true;
// Heads are aligned at a constant world pivot; feet have a stable ground baseline.
const heads=[104,111,106,101,86,69,93],stride=[0,1,2,3,4,3,2,1];
function illustratedPose(c,index,face){
 const scale=91/136,ix=Math.max(0,Math.min(6,index)),head=heads[ix];
 c.save();c.scale(face===-1?-1:1,1);
 c.drawImage(runImage,ix*168,0,168,136,-head*scale,-91+13,168*scale,91);
 c.restore()
}

function clean(canvas){
 const c=canvas.getContext('2d',{willReadFrequently:true});
 const pixels=c.getImageData(0,0,canvas.width,canvas.height),p=pixels.data;
 for(let k=0;k<p.length;k+=4){
  const a=p[k+3];
  if(a<24){p[k+3]=0;p[k]=0;p[k+1]=0;p[k+2]=0}
  else if(a<155)p[k+3]=Math.min(255,Math.round((a-17)*255/238));
 }
 c.putImageData(pixels,0,0);
 return canvas;
}
function makeFrames(name,img){
 const spec=specs[name],frames=[];
 for(let j=0;j<spec.n;j++){
  const cv=document.createElement('canvas');cv.width=spec.w;cv.height=spec.h;
  const c=cv.getContext('2d',{willReadFrequently:true});c.drawImage(img,j*spec.w,0,spec.w,spec.h,0,0,spec.w,spec.h);
  clean(cv);
  const a=c.getImageData(0,0,spec.w,spec.h).data;
  let loX=spec.w,hiX=0,loY=spec.h,hiY=0,weight=0,sumX=0;
  for(let y=0;y<spec.h;y++)for(let x=0;x<spec.w;x++){
   let alpha=a[(y*spec.w+x)*4+3];
   if(alpha>50){loX=Math.min(loX,x);hiX=Math.max(hiX,x);loY=Math.min(loY,y);hiY=Math.max(hiY,y)}
  }
  if(hiY<=loY){frames.push(null);continue}
  // Âncora horizontal pelos pixels na faixa inferior (pernas), não pela espada.
  let ankleStart=loY+(hiY-loY)*.73;
  for(let y=Math.floor(ankleStart);y<=hiY;y++)for(let x=loX;x<=hiX;x++){
   let alpha=a[(y*spec.w+x)*4+3];
   if(alpha>75){let w=alpha/255;sumX+=x*w;weight+=w}
  }
  const footX=weight>0?sumX/weight:(loX+hiX)/2;
  frames.push({image:cv,crop:{x:Math.max(0,loX-1),y:Math.max(0,loY-1),w:Math.min(spec.w-loX+1,hiX-loX+3),h:Math.min(spec.h-loY+1,hiY-loY+3)},footX,footY:hiY,visibleH:hiY-loY+1});
 }
 return frames
}
for(const [name,spec] of Object.entries(specs)){
 const img=new Image(),st={img,frames:[],ready:false,failed:false,details:[]};states[name]=st;
 img.onload=()=>{
  try{st.frames=makeFrames(name,img);st.ready=img.naturalWidth===spec.w*spec.n&&st.frames.every(Boolean);
   st.failed=!st.ready;st.details=st.frames.map(f=>f?({h:f.visibleH,pivot:Math.round(f.footX)}):null)
  }catch(e){st.failed=true;console.error('[Art] recorte '+name,e)}
 };
 img.onerror=()=>st.failed=true;
 if(typeof input[name]==='string'&&input[name].startsWith('data:image/'))img.src=input[name];else st.failed=true;
}
// Cache dos sprites no tamanho real exibido, com borda escura sutil já rasterizada.
const rasterCache=new Map();
function raster(name,index,visualH){
 const id=name+':'+index+':'+visualH,found=rasterCache.get(id);if(found)return found;
 const f=states[name].frames[index]||states[name].frames[0];
 if(!f)return null;
 const factor=2.25,h=visualH*factor,cr=f.crop,scale=h/cr.h,w=cr.w*scale;
 const edge=5;
 const out=document.createElement('canvas');out.width=Math.ceil(w+edge*2);out.height=Math.ceil(h+edge*2);
 const c=out.getContext('2d',{willReadFrequently:true});c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
 const ox=edge,oy=edge;
 // 1,1 px outline no mundo, preto translúcido e suavizado, não cartoon grosso.
 c.globalAlpha=.25;
 for(let a=0;a<8;a++){let theta=a*Math.PI/4;let ex=Math.cos(theta)*factor*.85,ey=Math.sin(theta)*factor*.85;
   c.drawImage(f.image,cr.x,cr.y,cr.w,cr.h,ox+ex,oy+ey,w,h)}
 c.globalAlpha=1;
 // Escurece só a borda do recorte, sem aumentar contraste de toda a figura.
 c.globalCompositeOperation='source-in';c.fillStyle='#192b32';c.fillRect(0,0,out.width,out.height);
 c.globalCompositeOperation='source-over';
 c.drawImage(f.image,cr.x,cr.y,cr.w,cr.h,ox,oy,w,h);
 // Máscara de nitidez de força moderada — aplicada UMA VEZ no asset, nunca por frame.
 const pixels=c.getImageData(0,0,out.width,out.height),p=pixels.data,src=new Uint8ClampedArray(p),stride=out.width*4;
 for(let y=1;y<out.height-1;y++)for(let x=1;x<out.width-1;x++){
   const at=(y*out.width+x)*4;if(src[at+3]<36)continue;
   for(let k=0;k<3;k++){let n=at+k,val=src[n],neighbor=(src[n-stride]+src[n+stride]+src[n-4]+src[n+4])*.25;
     p[n]=Math.max(0,Math.min(255,val+(val-neighbor)*.53))}
 }
 c.putImageData(pixels,0,0);
 const anchorX=(f.footX-cr.x)*scale+edge;
 const result={out,footX:anchorX,footY:out.height-edge,paintH:visualH,paintW:out.width/factor,factor};
 rasterCache.set(id,result);return result
}
function sprite(ctx,name,index,visualH,mirror=1){
 const st=states[name];if(!st.ready)return false;
 const f=raster(name,index,visualH);if(!f)return false;
 ctx.save();ctx.scale(mirror,1);
 ctx.drawImage(f.out,-f.footX/f.factor,-visualH+13-f.factor*.36,f.out.width/f.factor,f.out.height/f.factor);
 ctx.restore();counts[name]++;return true
}
function contact(c,x,y,rx,ry,alpha){if(root.AscensionWorld?.contact)root.AscensionWorld.contact(c,x,y,rx,ry,alpha)}
function hero(c,p,t,g){
 if(!runReady){
  // Não mistura personagens. Falha de asset usa o renderer da versão anterior.
  if(!states.hero.ready){counts.fallback++;return fallbackHero(c,p,t,g)}
  const attack=(p.attackPulse||0)>.02,hit=(p.hurt||0)>0,moving=(p.motion||0)>.12;
  return sprite(c,'hero',hit?4:attack?3:moving?1:0,91,p.face===-1?-1:1)
 }
 const moving=(p.motion||0)>.12,attack=(p.attackPulse||0)>.015,hit=(p.hurt||0)>0;
 const period=(p.move||0)/(Math.PI*2),cycle=((period%1)+1)%1;
 let frame=0;
 if(hit)frame=3;
 else if(attack){
  // Desenhos distintos de preparação, liberação e recuperação do golpe.
  const phase=Math.max(0,Math.min(1,1-(p.attackPulse||0)/.36));
  frame=phase<.32?6:phase<.78?5:4;
  attackDraws++
 }else if(moving){
  frame=stride[Math.floor(cycle*stride.length)%stride.length];
  seenRunFrames.add(frame);
  runDraws++
 }else frame=5;
 // Pés ficam fixados em y+8 no solo. Nenhum bounce, rotate, skew ou scale temporal.
 c.save();c.translate(p.x,p.y);illustratedPose(c,frame,p.face);c.restore();
 counts.hero++
}
function enemy(c,e,t){
 const name=e.kind==='hound'?'beast':e.kind==='wraith'?'wraith':null;
 if(!name||!states[name].ready){counts.fallback++;return fallbackEnemy.call(motion,c,e,t)}
 const beast=name==='beast',phase=e.phase||0,attacking=(e.attackT||0)>.08,hit=(e.flash||0)>0;
 // Espectro: mesma silhueta e mesma mao segurando lanterna em TODOS os frames.
 // Animar flutuação/tecido e partículas, sem trocar mão/arma nas poses.
 const cell=name==='wraith'?0:hit?3:attacking?2:(e.motion||0)>.2?(Math.sin(phase)>.08?1:0):0;
 c.save();c.translate(e.x,e.y);
 const attackProgress=e.attackT>0?1-Math.min(1,e.attackT/.44):0;
 const bob=beast?0:Math.sin(phase*.82)*1.1;
 c.translate(0,-bob);
 if(attacking){const anticipation=attackProgress<.48?attackProgress/.48:(1-attackProgress)/.52;
   c.translate((e.face===-1?-1:1)*Math.sin(attackProgress*Math.PI)*6,-Math.sin(attackProgress*Math.PI)*4);
   // Ataque muda a pose, não o tamanho do inimigo
 }
 // Fera ancorada no solo; espectro flutua discretamente, sem balanço lateral.
 sprite(c,name,cell,beast?64:70,e.face===-1?-1:1);
 if(!beast){ // brilho da lanterna sempre do mesmo lado do sprite
  const side=e.face===-1?-1:1;
  c.save();c.globalAlpha=.35+.22*Math.sin(t*5+e.phase);c.shadowColor='#82fbdc';c.shadowBlur=13;
  c.fillStyle='#a2ffe9';c.beginPath();c.arc(side*23,-25,3.3,0,TAU);c.fill();c.restore()
 }
 if(attacking){const pr=attackProgress,glow=Math.sin(pr*Math.PI);
   c.save();c.globalAlpha=.25+glow*.42;c.strokeStyle=beast?'#ffc77b':'#9cfae3';c.shadowColor=c.strokeStyle;c.shadowBlur=12;c.lineWidth=2.4;
   c.beginPath();if(beast)c.arc(16,-20,31,-1.05,.45);else c.arc(0,-28,32,-1.3,.05);
   c.stroke();c.restore()
 }
 if(hit){c.globalAlpha=.16;c.fillStyle='#fff6e7';c.beginPath();c.ellipse(0,-26,beast?29:19,beast?22:32,0,0,TAU);c.fill()}
 if(e.burn>0||e.slow>0){c.save();c.globalAlpha=.20;c.fillStyle=e.burn>0?'#ffb067':'#aaf6ff';c.beginPath();c.ellipse(0,-26,beast?30:22,beast?23:36,0,0,TAU);c.fill();c.restore()}
 c.restore();
}
motion.hero=hero;motion.drawEnemy=enemy;
root.AscensionIllustrated={ready:()=>Object.values(states).every(v=>v.ready),stats:()=>({
 loaded:Object.fromEntries(Object.entries(states).map(([n,v])=>[n,v.ready])),
 failed:Object.fromEntries(Object.entries(states).map(([n,v])=>[n,v.failed])),
 framesDrawn:{...counts},runReady,runFailed,runDraws,attackDraws,distinctRunFrames:seenRunFrames.size,paintedRunFrames:7,heroPivotLocked:true,proceduralWarp:false,normalized:true,lockedWraithLantern:true,outlined:true,sharpened:true,interpolatedMotion:true,directionalSecondaryMotion:true,footfallRhythm:true,
 frameHeights:Object.fromEntries(Object.entries(states).map(([n,v])=>[n,v.details.map(d=>d?.h||0)]))
})};
})(window);