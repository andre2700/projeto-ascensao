/* Projeto Ascensão 0.8 — recorte limpo, pivô nos pés e consistência de quadros */
(function(root){
'use strict';
const motion=root.AscensionMotion;
if(!motion)throw Error('Animacoes iniciais ausentes');
const fallbackHero=motion.hero,fallbackEnemy=motion.drawEnemy;
const input=root.AscensionIllustrationData||{},TAU=Math.PI*2;
const specs={hero:{n:5,w:128,h:117,visual:91},wraith:{n:4,w:128,h:117,visual:71},beast:{n:4,w:128,h:117,visual:64}};
const states={},counts={hero:0,wraith:0,beast:0,fallback:0};
const STRIDE_FRAMES=16;let runningFrames=null,runFrameBuildMs=0,runDraws=0,hitDraws=0,attackDraws=0;const creatureFrames={},creatureDraws={beast:0,wraith:0};
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
   st.failed=!st.ready;st.details=st.frames.map(f=>f?({h:f.visibleH,pivot:Math.round(f.footX)}):null);
   if(st.ready){try{if(name==='hero')prepareRunningFrames();else prepareCreatureFrames(name)}catch(error){console.warn('[Ascensão] animação por fase indisponível: '+name,error)}}
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
// Síntese de passadas a partir de UMA ilustração estável.
// O mesmo desenho é preservado em todas as 16 fases; não há trocas de traje, arma ou tamanho.
function prepareRunningFrames(){
 if(runningFrames||!states.hero?.ready)return;
 const start=performance.now(),source=raster('hero',1,91);
 if(!source)return;
 const {out,footX,factor}=source,c=out.getContext('2d',{willReadFrequently:true});
 const w=out.width,h=out.height,src=c.getImageData(0,0,w,h).data;
 const result=[];
 // Evita processamento contínuo: todos os frames são criados uma única vez.
 for(let index=0;index<STRIDE_FRAMES;index++){
  const angle=index*Math.PI*2/STRIDE_FRAMES;
  const dest=document.createElement('canvas');dest.width=w;dest.height=h;
  const dc=dest.getContext('2d',{willReadFrequently:true});const id=dc.createImageData(w,h),outPixels=id.data;
  const swing=Math.sin(angle),opposite=-swing,plant=Math.cos(angle*2);
  for(let y=0;y<h;y++){
   const ny=y/h,leg=Math.max(0,Math.min(1,(ny-.55)/.31));
   const skirt=Math.max(0,Math.min(1,(ny-.28)/.42))*(1-leg);
   const head=Math.max(0,1-Math.max(0,(ny-.12)/.32));
   for(let x=0;x<w;x++){
    const nx=(x-footX)/w,side=Math.tanh(nx*7.2);
    // Quadris e pés reagem em oposição; o tronco se mantém ancorado.
    const leftRight=side<0?swing:opposite;
    const stance=leg*(3.5+1.8*Math.abs(side));
    const cape=(nx<-.11?1:0)*skirt;
    const shiftX=stance*leftRight+1.3*swing*skirt+2.6*Math.sin(angle-.35)*cape+head*.4*swing;
    const lift=leg*Math.max(0,leftRight)*3.15+Math.max(0,plant)*.45*(1-leg);
    let sx=x-shiftX,sy=y+lift;
    if(sx<0||sx>=w-1||sy<0||sy>=h-1)continue;
    const ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy;
    const i0=(iy*w+ix)*4,i1=i0+4,i2=i0+w*4,i3=i2+4,at=(y*w+x)*4;
    const wa=(1-fx)*(1-fy),wb=fx*(1-fy),wc=(1-fx)*fy,wd=fx*fy;
    for(let k=0;k<4;k++)outPixels[at+k]=src[i0+k]*wa+src[i1+k]*wb+src[i2+k]*wc+src[i3+k]*wd
   }
  }
  dc.putImageData(id,0,0);
  result.push({out:dest,footX,paintH:91,factor});
 }
 runningFrames=result;runFrameBuildMs=Math.round(performance.now()-start)
}
function runSprite(ctx,phase,mirror=1){
 if(!runningFrames)prepareRunningFrames();
 if(!runningFrames)return sprite(ctx,'hero',1,91,mirror);
 const wrapped=((phase%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
 const index=Math.floor(wrapped/(Math.PI*2)*STRIDE_FRAMES)%STRIDE_FRAMES;
 const f=runningFrames[index];
 ctx.save();ctx.scale(mirror,1);
 ctx.drawImage(f.out,-f.footX/f.factor,-91+13-f.factor*.36,f.out.width/f.factor,f.out.height/f.factor);
 ctx.restore();runDraws++;counts.hero++;return true
}
function prepareCreatureFrames(name){
 if(creatureFrames[name]||!states[name]?.ready)return;
 const frameCount=name==='beast'?12:10,visualH=name==='beast'?64:70;
 const source=raster(name,0,visualH);
 if(!source)return;
 const w=source.out.width,h=source.out.height,factor=source.factor;
 const outputs=[];
 for(let i=0;i<frameCount;i++){
  const phase=i/frameCount*Math.PI*2,s=Math.sin(phase),k=Math.cos(phase);
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const c=canvas.getContext('2d');
  c.save();
  const x=source.footX,base=h-factor*.8;
  c.translate(x,base);
  if(name==='beast'){
   const step=Math.sin(phase*2);
   c.translate(s*factor*1.2,-Math.max(0,step)*factor*1.25);
   c.rotate(s*.035);c.transform(1,0,s*.032,1,0,0);
   c.scale(1+Math.cos(phase*2)*.017,1-Math.cos(phase*2)*.024);
  }else{
   c.translate(Math.cos(phase*.72)*factor*1.1,-Math.sin(phase)*factor*2.0);
   c.rotate(s*.027);
   c.transform(1,0,Math.sin(phase+.3)*.028,1,0,0);
  }
  c.drawImage(source.out,-x,-base);
  c.restore();
  outputs.push({out:canvas,footX:source.footX,paintH:visualH,factor});
 }
 creatureFrames[name]=outputs
}
function creatureSprite(ctx,name,phase,mirror=1){
 const arr=creatureFrames[name];if(!arr?.length)return sprite(ctx,name,0,name==='beast'?64:70,mirror);
 const t=((phase%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
 const f=arr[Math.floor(t/(Math.PI*2)*arr.length)%arr.length];
 ctx.save();ctx.scale(mirror,1);
 ctx.drawImage(f.out,-f.footX/f.factor,-f.paintH+13-f.factor*.36,
   f.out.width/f.factor,f.out.height/f.factor);
 ctx.restore();counts[name]++;creatureDraws[name]++;return true
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
 if(!states.hero.ready){counts.fallback++;return fallbackHero(c,p,t,g)}
 const movement=Math.min(1,p.motion||0),moving=movement>.13,atk=(p.attackPulse||0)>.005,hit=(p.hurt||0)>0;
 const age=atk?Math.max(0,Math.min(1,1-(p.attackPulse||0)/.36)):0;
 const phase=p.move||0;
 // Quatro etapas: antecipação -> golpe -> recuperação -> corrida/idle.
 const anticipation=atk&&age<.36,release=atk&&age>=.36&&age<.70,recovery=atk&&age>=.70;
 const frame=hit?4:release?3:anticipation?2:recovery?3:0;
 const cadence=moving?Math.sin(phase):0,weight=moving?Math.abs(Math.sin(phase*2))*1.65*movement:Math.sin(t*2.8)*.30;
 const heading=p.heading||0,direction=p.direction??2;
 const back=direction===5||direction===6||direction===7,diagonal=direction%2===1,side=direction===0||direction===4;
 c.save();c.translate(p.x,p.y-weight);
 // Tronco em contra-movimento às pernas; sem deformar a escala global entre poses.
 const recoil=anticipation?-(age/.36)*.055:release?(.70-age)/.34*.083:recovery?-.02:0;
 const tilt=(moving?cadence*.025:Math.sin(t*.9)*.007)+recoil*(p.face||1);
 c.rotate(tilt);
 if(moving&&!atk)c.translate(cadence*(diagonal?1.15:.7),.42*Math.cos(phase*2));
 const stretch=moving&&!atk?Math.sin(phase*2)*.010:Math.sin(t*2.4)*.005;
 c.scale(side?.986:1,1-stretch);
 if(back&&!atk)c.transform(1,0,cadence*.009,1,0,0);
 const mirror=p.face===-1?-1:1;
 const ok=hit?sprite(c,'hero',4,91,mirror):
     atk?sprite(c,'hero',frame,91,mirror):
     moving?runSprite(c,phase,mirror):sprite(c,'hero',0,91,mirror);
 if(atk)attackDraws++;if(hit)hitDraws++;
 // O brilho fica concentrado na lâmina; nada de um círculo que atravessa o corpo.
 if(atk&&release){const force=Math.sin((age-.36)/.34*Math.PI);
  const color=g?.fire?'#fbb277':g?.ice?'#9af4ff':'#e7f0dc';
  c.save();c.globalAlpha=.23*Math.max(0,force);c.strokeStyle=color;c.lineWidth=1.8;
  c.shadowBlur=10;c.shadowColor=color;c.beginPath();
  c.arc(8,-35,39,-1.18,-.37);c.stroke();c.restore()
 }
 c.restore();
 if(!ok){counts.fallback++;fallbackHero(c,p,t,g)}
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
 const bob=beast?Math.max(0,Math.sin(phase*1.4))*1.15:Math.sin(phase*.82)*2.2;
 const recoil=Math.min(.9,(e.impactT||0)/.20)*(e.impactPower||.4);
 c.translate(-recoil*(e.face===-1?-1:1)*4,-bob+recoil*1.5);
 if(attacking){const anticipation=attackProgress<.48?attackProgress/.48:(1-attackProgress)/.52;
   c.translate((e.face===-1?-1:1)*Math.sin(attackProgress*Math.PI)*6,-Math.sin(attackProgress*Math.PI)*4);
   c.scale(1+Math.max(0,anticipation)*.08,1-Math.max(0,anticipation)*.07)
 }
 if(beast)c.rotate(Math.sin(phase*.4)*.025+recoil*.07);else c.rotate(Math.sin(phase*.66)*.028-recoil*.052);
 if(attacking||hit)sprite(c,name,cell,beast?64:70,e.face===-1?-1:1);
 else creatureSprite(c,name,phase,e.face===-1?-1:1);
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
 if(hit||recoil>.15){c.globalAlpha=.11+recoil*.16;c.fillStyle='#fff6e7';c.beginPath();c.ellipse(0,-26,beast?29:19,beast?22:32,0,0,TAU);c.fill()}
 if(e.burn>0||e.slow>0){c.save();c.globalAlpha=.20;c.fillStyle=e.burn>0?'#ffb067':'#aaf6ff';c.beginPath();c.ellipse(0,-26,beast?30:22,beast?23:36,0,0,TAU);c.fill();c.restore()}
 c.restore();
}
motion.hero=hero;motion.drawEnemy=enemy;
root.AscensionIllustrated={ready:()=>Object.values(states).every(v=>v.ready),stats:()=>({
 loaded:Object.fromEntries(Object.entries(states).map(([n,v])=>[n,v.ready])),
 failed:Object.fromEntries(Object.entries(states).map(([n,v])=>[n,v.failed])),
 framesDrawn:{...counts},normalized:true,lockedWraithLantern:true,outlined:true,sharpened:true,interpolatedMotion:true,directionalSecondaryMotion:true,footfallRhythm:true,virtualStrideFrames:runningFrames?.length||0,creaturePhaseFrames:{beast:creatureFrames.beast?.length||0,wraith:creatureFrames.wraith?.length||0},creatureDraws:{...creatureDraws},runFrameBuildMs,runDraws,attackDraws,hitDraws,
 frameHeights:Object.fromEntries(Object.entries(states).map(([n,v])=>[n,v.details.map(d=>d?.h||0)]))
})};
})(window);