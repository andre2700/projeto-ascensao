/* Projeto Ascensão 0.7 — renderer ilustrado com sprite sheets AVIF transparentes.
   O módulo anterior só é usado como fallback se a imagem falhar. */
(function(root){
'use strict';
const motion=root.AscensionMotion;
if(!motion)throw Error('Motor de animacao nao carregado');
const fallbackHero=motion.hero,fallbackEnemy=motion.drawEnemy;
const raw=root.AscensionIllustrationData||{};
const sheets={};
const counts={hero:0,wraith:0,beast:0,fallback:0};
const meta={hero:{cells:5,w:128,h:117},wraith:{cells:4,w:128,h:117},beast:{cells:4,w:128,h:117}};
for(const name of Object.keys(meta)){
 const img=new Image();const state={img,ok:false,fail:false};
 sheets[name]=state;
 img.onload=()=>{state.ok=img.naturalWidth===meta[name].w*meta[name].cells&&img.naturalHeight>=meta[name].h*.95;state.fail=!state.ok};
 img.onerror=()=>{state.fail=true;state.ok=false};
 if(typeof raw[name]==='string'&&raw[name].startsWith('data:image/'))img.src=raw[name];
 else state.fail=true;
}
function circle(ctx,x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
function glow(ctx,x,y,r,color){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)}
function frame(ctx,name,index,x,y,w,h){
 const {img,ok}=sheets[name],m=meta[name];
 if(!ok)return false;
 index=Math.max(0,Math.min(m.cells-1,index));
 ctx.drawImage(img,index*m.w,0,m.w,m.h,x,y,w,h);
 counts[name]++;return true;
}
function hero(ctx,p,t,g){
 if(!sheets.hero.ok){counts.fallback++;return fallbackHero(ctx,p,t,g)}
 const moving=(p.motion||0)>.12,attack=(p.attackPulse||0)>0,hit=(p.hurt||0)>0;
 const v=attack?Math.max(0,1-(p.attackPulse||0)/.32):0;
 // 0 repouso, 1 corrida, 2 antecipação, 3 arco de golpe, 4 dano
 const cell=hit?4:attack?(v<.43?2:3):moving?(Math.sin((p.move||0))>.1?1:0):0;
 const strength=Math.min(1,(p.motion||0)),bounce=moving?Math.abs(Math.sin((p.move||0)))*2.7*strength:Math.sin(t*2.7)*1.1;
 const lean=moving?Math.sin((p.move||0))*.045:Math.sin(t*1.1)*.018;
 ctx.save();ctx.translate(p.x,p.y);
 circle(ctx,0,10,24,7,'#17362b7d');
 let aura=g?.ice>0?'#a0f7ff2b':g?.fire>0?'#ffc67b27':'#f8de9921';
 glow(ctx,0,-34,57,aura);
 ctx.scale(p.face===-1?-1:1,1);
 ctx.rotate(lean);ctx.translate(0,-bounce);
 const wave=Math.sin(t*6+(p.move||0)*.4)*.017;
 ctx.transform(1,wave,0,1,0,0);
 const w=111,h=101;
 if(!frame(ctx,'hero',cell,-w*.5,-h+12,w,h)){ctx.restore();counts.fallback++;return fallbackHero(ctx,p,t,g)}
 if(attack){let intensity=Math.sin(Math.min(1,v)*Math.PI);if(intensity>.05){
  let color=g?.fire>0?'#ffba6b':g?.ice>0?'#89eeff':'#b6e9ff';
  ctx.save();ctx.globalAlpha=.13+intensity*.72;ctx.strokeStyle=color;ctx.shadowColor=color;ctx.shadowBlur=18;
  ctx.lineWidth=4+intensity*4;ctx.beginPath();ctx.arc(1,-42,52,-1.23,.17+v*.35);ctx.stroke();
  ctx.lineWidth=1.5;ctx.globalAlpha*=.5;ctx.beginPath();ctx.arc(0,-42,59,-1.42,.30+v*.29);ctx.stroke();ctx.restore()
 }}
 if(hit){ctx.globalAlpha=Math.min(.24,p.hurt*.7);circle(ctx,0,-31,28,33,'#fff9df')}
 ctx.restore();
}
function enemy(ctx,e,t){
 const name=e.kind==='hound'?'beast':e.kind==='wraith'?'wraith':null;
 if(!name||!sheets[name].ok){counts.fallback++;return fallbackEnemy.call(motion,ctx,e,t)}
 const phase=e.phase||0;
 const tHit=(e.flash||0)>0,attacking=(e.attackT||0)>.07;
 let cell=tHit?3:attacking?2:(e.motion||0)>.2?(Math.sin(phase)>.1?1:0):0;
 ctx.save();ctx.translate(e.x,e.y);
 const beast=name==='beast',w=beast?105:79,h=beast?72:79;
 circle(ctx,0,beast?14:11,beast?28:18,beast?9:6,'#17392c72');
 if(!beast)glow(ctx,0,-26,45,'#23ffbc24');
 else glow(ctx,0,-20,50,'#fbb36e16');
 ctx.scale(e.face===-1?-1:1,1);
 let bob=beast?Math.abs(Math.sin(phase*1.6))*2.2:Math.sin(phase*.74)*4.1;
 ctx.translate(0,-bob);
 if(beast)ctx.rotate(Math.sin(phase*.6)*.025);
 const ready=frame(ctx,name,cell,-w*.5,-h+16,w,h);
 if(!ready){ctx.restore();counts.fallback++;return fallbackEnemy.call(motion,ctx,e,t)}
 if(tHit){ctx.globalAlpha=.20;circle(ctx,0,-24,w*.27,h*.42,'#fff9e6')}
 if(e.burn>0){ctx.globalAlpha=.30+Math.sin(t*14)*.12;glow(ctx,0,-24,w*.44,'#ff9b4b96')}
 if(e.slow>0){ctx.globalAlpha=.40;ctx.strokeStyle='#b1f1ff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-25,w*.33,h*.39,0,0,Math.PI*2);ctx.stroke()}
 ctx.restore();
}
motion.hero=hero;motion.drawEnemy=enemy;
const illustrated={ready:()=>Object.keys(sheets).every(n=>sheets[n].ok),stats:()=>({loaded:Object.fromEntries(Object.entries(sheets).map(([k,v])=>[k,v.ok])),failed:Object.fromEntries(Object.entries(sheets).map(([k,v])=>[k,v.fail])),framesDrawn:{...counts}})};
root.AscensionIllustrated=illustrated;
})(window);