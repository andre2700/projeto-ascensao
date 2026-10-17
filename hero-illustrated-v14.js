/* Projeto Ascensão 0.14 — herói ilustrado, sem as formas geométricas da v13.
 * Frame A/B trocam apoio na corrida; rosto/torso permanecem voltados somente
 * para esquerda/direita. Atlas detalhado já presente no próprio jogo.
 */
(function(root){
'use strict';
const motion=root.AscensionMotion;if(!motion)return;
if(new URLSearchParams(root.location?.search||'').get('hero')==='old')return;
const fallback=motion.hero,src=root.AscensionIllustrationData?.hero;
const FW=128,FH=117,groundX=64,groundY=109;
const frames={idle:[],run:[],attack:[]};
let ready=false,errors=[],rendered=0,activeFrame='none';
function can(){const c=document.createElement('canvas');c.width=FW;c.height=FH;return c}
function cut(img,n){const c=can(),g=c.getContext('2d');g.drawImage(img,FW*n,0,FW,FH,0,0,FW,FH);return c}
function idleFrames(rest){
 // Um personagem único; respiração/tecido discreto retornam à pose inicial.
 for(let i=0;i<3;i++){
  const c=can(),g=c.getContext('2d');g.drawImage(rest,0,0);
  if(i===1){
   g.save();g.beginPath();g.moveTo(10,43);g.bezierCurveTo(5,61,8,88,34,100);g.lineTo(37,74);g.lineTo(31,42);g.closePath();g.clip();
   g.drawImage(rest,0,-1);g.restore()
  }
  frames.idle.push(c)
 }
}
function runFrames(running,passing){
 // Tronco ilustrado único; apenas a metade inferior troca apoios e passagens.
 // O contato com o solo sempre fica em y=109, mesmo ao mudar a pose.
 const hip=77;
 for(let i=0;i<4;i++){
  const c=can(),g=c.getContext('2d');g.imageSmoothingEnabled=true;
  g.drawImage(running,0,0);g.clearRect(0,hip,FW,FH-hip);
  if(i===0){
   // Contato A: esquerda à frente, direita atrás.
   g.drawImage(running,0,hip,FW,FH-hip,0,hip,FW,FH-hip)
  }else if(i===2){
   // Contato B: direita à frente, esquerda atrás. Inversão LOCAL,
   // não espelhamento total do herói.
   g.save();g.translate(FW,0);g.scale(-1,1);
   g.drawImage(running,0,hip,FW,FH-hip,0,hip,FW,FH-hip);
   g.restore()
  }else{
   // Fases intermediárias: alternância das pernas que estão em apoio.
   const dx=i===1?-5:5;
   g.save();g.beginPath();g.rect(0,hip,FW,FH-hip);g.clip();
   g.drawImage(passing,0,hip,FW,FH-hip,dx,hip,FW,FH-hip);
   g.globalAlpha=.34;
   g.drawImage(running,0,hip,FW,FH-hip,0,hip,FW,FH-hip);
   g.restore()
  }
  frames.run.push(c)
 }
}
function attackFrames(rest,anticipation,contact){
 // Golpe padrão, executado UMA vez; recuperação devolve à mesma guarda.
 for(const f of [rest,anticipation,contact,contact,rest]){
  const c=can();c.getContext('2d').drawImage(f,0,0);frames.attack.push(c)
 }
}
if(typeof src==='string'&&src.startsWith('data:image/')){
 const image=new Image();image.onload=()=>{
  try{
   if(image.naturalWidth!==640||image.naturalHeight!==117)throw Error('atlas ilustrado incompatível');
   const a=Array.from({length:5},(_,i)=>cut(image,i));
   idleFrames(a[0]);runFrames(a[1],a[0]);attackFrames(a[0],a[2],a[3]);ready=true;
  }catch(e){errors.push(String(e?.message||e));console.warn('[Hero14]',e)}
 };
 image.onerror=()=>errors.push('Falha ao carregar arte ilustrada');
 image.src=src;
}
function draw(ctx,p,t,g){
 if(!ready){fallback(ctx,p,t,g);return}
 const atk=(p.attackPulse||0)>0,moving=(p.motion||0)>.18;
 let state='idle',i=0;
 if(atk){
  state='attack';const v=Math.max(0,Math.min(.999,1-p.attackPulse/.36));
  i=v<.16?0:v<.32?1:v<.60?2:v<.78?3:4
 }else if(moving){
  state='run';
  // Passos sincronizados com a distância REAL percorrida, não com um relógio.
  i=((Math.floor((p.move||0)*.65)%4)+4)%4
 }else i=Math.floor(t*2.6)%3;
 const f=frames[state][i];if(!f){fallback(ctx,p,t,g);return}
 ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));
 const size=.80;ctx.scale((p.face===-1?-1:1)*size,size);
 ctx.imageSmoothingEnabled=true;
 ctx.drawImage(f,-groundX,-groundY);
 if(p.hurt>0){ctx.globalAlpha=.19;ctx.fillStyle='#fff2dd';ctx.fillRect(-18,-87,36,74)}
 ctx.restore();rendered++;activeFrame=state+':'+i
}
motion.hero=draw;
root.AscensionHeroFrames={version:'0.14-illustrated',states:{idle:3,run:4,strike:5},
 ready:()=>ready,stats:()=>({ready,rendered,activeFrame,errors,source:'illustrated-original',runOrder:['esquerda-frente','passagem-direita','direita-frente','passagem-esquerda'],leftRightOnly:true})};
})(window);