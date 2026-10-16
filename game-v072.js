(()=>{
'use strict';
const AscensionMotion=window.AscensionMotion,AscensionForest=window.AscensionForest,AscensionWind=window.AscensionWind;
if(!AscensionMotion||!AscensionForest||!AscensionWind)throw new Error('A nova Floresta da Aurora não carregou');
const cv=document.getElementById('game'),ctx=cv.getContext('2d',{alpha:false});
const el=id=>document.getElementById(id),hud=el('hud'),overlay=el('overlay'),panel=el('panel'),joystick=el('joystick'),knob=el('knob'),bossbar=el('bossbar');
const TAU=Math.PI*2,PI=Math.PI,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,rnd=(a,b)=>a+Math.random()*(b-a),length=(a,b)=>Math.hypot(a,b);
let W=innerWidth,H=innerHeight,DPR=1,last=0,worldTime=0,mode='menu',game=null,camera={x:0,y:0},shake=0,flash=0,toastT=0;
let keys=Object.create(null),stick=null,pointerId=null,hitstop=0,impactZoom=0;
let enemies=[],shots=[],orbs=[],particles=[],rings=[],floaters=[],props=[],tiles=[],watermarks=[];
const options=[
{id:'blade',name:'Lâmina Ancestral',icon:'⚔️',desc:'Aumenta o poder dos golpes mágicos.'},
{id:'fire',name:'Chama do Eclipse',icon:'🔥',desc:'Encanta ataques com fogo e queimadura.'},
{id:'ice',name:'Sopro do Inverno',icon:'❄️',desc:'Congela e desacelera as criaturas.'},
{id:'lightning',name:'Trovão Celeste',icon:'⚡',desc:'Descargas que saltam entre inimigos.'},
{id:'multi',name:'Arsenal Astral',icon:'✨',desc:'Dispara mais projéteis por ataque.'},
{id:'area',name:'Runas Ampliadas',icon:'🌀',desc:'Aumenta tamanho e alcance dos efeitos.'},
{id:'speed',name:'Passos do Vento',icon:'💨',desc:'Movimento mais ágil pela arena.'},
{id:'reload',name:'Ritual Veloz',icon:'⌛',desc:'Reduz o intervalo entre ataques.'},
{id:'heal',name:'Coração de Ouro',icon:'❤️',desc:'Aumenta a vitalidade e cura ferimentos.'},
{id:'storm',name:'Tempestade Ardente',icon:'🌋',desc:'Transforma mortes em explosões de fogo.'}
];
function resize(){W=innerWidth;H=innerHeight;DPR=Math.min(devicePixelRatio||1,1.25);cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);ctx.setTransform(DPR,0,0,DPR,0,0);ctx.imageSmoothingEnabled=true}
addEventListener('resize',resize,{passive:true});resize();
function seed(n){let t=n>>>0;return()=>{t+=0x6d2b79f5;let a=t;a=Math.imul(a^a>>>15,a|1);a^=a+Math.imul(a^a>>>7,a|61);return ((a^a>>>14)>>>0)/4294967296}}
function hash(x,y){let q=Math.sin(x*127.1+y*311.7)*43758.5453;return q-Math.floor(q)}
function poly(c,pts,fill,stroke,line=1){c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke()}}
function ellipse(c,x,y,rx,ry,color,rot=0){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,rot,0,TAU);c.fill()}
function glow(c,x,y,r,color){let g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,2*r,2*r)}
function stroke(c,pts,color,w=1){c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.stroke()}
function drawFloorTile(seedNum){return AscensionForest.floorTile(seedNum)}
function makeWorld(){
 const seamless=drawFloorTile(1927);tiles=[seamless,seamless,seamless,seamless];
 props=[];let R=seed(190203);
 const kinds=['tree','fern','brush','rock','flower','mushroom','log','crystal'];
 const weights=[.20,.34,.55,.68,.86,.93,.96,1];
 for(let i=0;i<1550;i++){
  let x=(R()-.5)*8000,y=(R()-.5)*8000;
  if(Math.hypot(x,y)<135)continue;
  let k=R(),ind=weights.findIndex(w=>k<w),type=kinds[ind<0?0:ind];
  if(type==='tree'&&Math.hypot(x,y)<210)continue;
  props.push({x,y,type,s:type==='tree'?.95+R()*.6:.72+R()*.55,rot:type==='tree'?0:R()*TAU,variant:R()})
 }
 props.push({x:-290,y:-170,type:'tree',s:1.1,rot:0,variant:.8},{x:300,y:-230,type:'tree',s:1.2,rot:0,variant:.25},
 {x:280,y:195,type:'flower',s:1.3,rot:0,variant:.85},{x:-185,y:210,type:'mushroom',s:1.15,rot:0,variant:.35},
 {x:190,y:-185,type:'crystal',s:.92,rot:0,variant:.7},{x:-240,y:160,type:'log',s:.92,rot:0,variant:.35});
 props.sort((a,b)=>a.y-b.y)
}
function drawWorld(){let left=camera.x-W/2-20,top=camera.y-H/2-20;const step=640;let x0=Math.floor(left/step),y0=Math.floor(top/step);for(let y=y0;y<=Math.ceil((camera.y+H/2+20)/step);y++)for(let x=x0;x<=Math.ceil((camera.x+W/2+20)/step);x++){let index=Math.floor(hash(x,y)*4),tile=tiles[index];ctx.drawImage(tile,x*step,y*step)}for(let site of [[0,0,135],[920,-650,117],[-880,780,127],[1250,1150,130]])ritual(site[0],site[1],site[2])}
function ritual(x,y,r){}
function deco(o){AscensionForest.prop(ctx,o,worldTime)}
function newGame(){game={p:{x:0,y:0,r:17,hp:125,maxHp:125,speed:225,face:1,move:0,motion:0,hurt:0,attackPulse:0,attackAim:0},elapsed:0,kills:0,level:1,xp:0,need:8,blade:1,fire:0,ice:0,lightning:0,multi:0,area:0,reload:0,storm:0,boss:false,bossDead:false,attack:0,spawn:1,levelQueue:0,score:0};camera.x=0;camera.y=0;enemies=[];shots=[];orbs=[];particles=[];rings=[];floaters=[];shake=0;flash=0;hitstop=0;impactZoom=0;worldTime=0;bossbar.classList.remove('visible');updateHUD(true)}
function toast(message){let t=el('toast');t.textContent=message;t.classList.add('visible');toastT=1.65}
function show(html){panel.innerHTML=html;overlay.classList.remove('hidden')}
function hide(){overlay.classList.add('hidden')}
const crest='<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M50 6 86 24v25c0 23-16 34-36 46C30 83 14 72 14 49V24L50 6Z" stroke="currentColor" stroke-width="4"/><path d="M50 16v65M31 38l19 12 19-12M28 63l22 15 22-15" stroke="currentColor" stroke-width="5"/><path d="m50 24 8 16-8 9-8-9 8-16Z" fill="currentColor"/></svg>';
function menu(){mode='menu';hud.classList.add('hidden');el('pause').classList.add('hidden');el('footer').style.display='block';bossbar.classList.remove('visible');show('<div class="eyebrow">UM NOVO MUNDO DESPERTA</div><div class="emblem">'+crest+'</div><h1>PROJETO<br>ASCENSÃO</h1><div class="rule">✦</div><p class="lead">Atravesse a Floresta da Aurora. Enfrente seres antigos, domine poderes elementais e descubra o seu destino.</p><div class="menu-traits"><div><span>⚔️</span><small>COMBATE<br>AUTOMÁTICO</small></div><div><span>💎</span><small>EVOLUÇÃO<br>SEM LIMITES</small></div><div><span>🔥</span><small>MAGIAS<br>ELEMENTAIS</small></div></div><button class="button" id="start">✦ &nbsp; INICIAR JORNADA</button><p class="fine">Arraste o dedo para mover • Ataques automáticos</p><p class="fine"><span class="version">ALPHA 0.7 — FLORESTA VIVA</span></p>');el('start').onclick=start}
function recoverFromError(err,where='partida'){window.__ascensionLastError={where,message:String(err?.message||err),stack:String(err?.stack||'')};console.error('[Ascensao] '+where+' '+window.__ascensionLastError.stack);mode='error';hud.classList.add('hidden');el('pause').classList.add('hidden');const msg=String(err?.message||err||'Erro desconhecido').slice(0,180).replace(/[<>&"]/g,' ');show('<div class="eyebrow">RECUPERAÇÃO DO JOGO</div><h1>NÃO FOI POSSÍVEL INICIAR</h1><p class="lead">Detectamos uma falha no motor visual. Você pode continuar jogando pela versão estável enquanto corrigimos o problema.</p><button class="button" id="safe">JOGAR VERSÃO ESTÁVEL</button><p class="fine">Detalhe técnico: '+msg+'</p>');el('safe').onclick=()=>{window.location.href='./?engine=stable&v=5.1.0'}}
function start(){if(mode==='play')return;try{newGame();mode='play';hud.classList.remove('hidden');el('pause').classList.remove('hidden');el('footer').style.display='none';hide();toast('A JORNADA COMEÇOU')}catch(err){recoverFromError(err,'iniciar')}}
function pause(){if(mode==='play'){mode='paused';show('<div class="eyebrow">UM MOMENTO DE DESCANSO</div><div class="emblem">'+crest+'</div><h1>JORNADA PAUSADA</h1><p class="lead">Até os mais fortes precisam recuperar o fôlego.</p><button class="button" id="resume">CONTINUAR AVENTURA</button><button class="button alt" id="quit">VOLTAR AO INÍCIO</button>');el('resume').onclick=()=>{mode='play';hide()};el('quit').onclick=menu()}else if(mode==='paused'){mode='play';hide()}}
el('pause').onclick=pause;
const rarities=[{name:'COMUM',amount:1,weight:.63,style:''},{name:'RARA',amount:2,weight:.25,style:'rare'},{name:'ÉPICA',amount:3,weight:.10,style:'epic'},{name:'LENDÁRIA',amount:5,weight:.02,style:'legend'}];
function upgrade(){mode='upgrade';let pool=options.filter(o=>o.id!=='storm'||(game.fire>0&&game.area>0)),picks=[];while(pool.length&&picks.length<3){let i=Math.floor(rnd(0,pool.length));picks.push(pool.splice(i,1)[0])}
let html='<div class="eyebrow">O DESTINO LHE CONCEDE PODER</div><h1>ASCENSÃO • NÍVEL '+game.level+'</h1><p class="lead">Escolha a bênção que irá moldar seu próximo combate.</p><div class="choices">';
picks.forEach((o,i)=>{let r=Math.random(),acc=0,R=rarities[0];for(let v of rarities){acc+=v.weight;if(r<=acc){R=v;break}}o._bonus=R.amount;html+='<button class="choice '+R.style+'" data-i="'+i+'"><span class="glyph">'+o.icon+'</span><span class="choicebody"><b>'+o.name+'</b><small>'+o.desc+'</small><span class="rarity">'+R.name+' • +'+R.amount+' NÍVEL'+(R.amount>1?'S':'')+'</span></span><span style="color:#e4c17f">❯</span></button>'});
show(html+'</div><p class="fine">Toda escolha transforma sua jornada.</p>');panel.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{let o=picks[+b.dataset.i];applyUpgrade(o.id,o._bonus);hide();mode='play';updateHUD(true);if(game.levelQueue>0){game.levelQueue--;upgrade()}})}
function applyUpgrade(id,n){if(id==='heal'){game.p.maxHp+=22*n;game.p.hp=Math.min(game.p.maxHp,game.p.hp+38*n)}else if(id==='speed')game.p.speed+=18*n;else game[id]+=n;burst(game.p.x,game.p.y,'#f0c879',22,140);rings.push({x:game.p.x,y:game.p.y,r:8,life:.8,max:.8,color:'#e8ca7b',growth:160})}
function updateHUD(force=false){if(!game)return;if(!force&&game.elapsed-(updateHUD.last||0)<.09)return;updateHUD.last=game.elapsed;let p=game.p;el('hpFill').style.width=clamp(100*p.hp/p.maxHp,0,100)+'%';el('xpFill').style.width=clamp(100*game.xp/game.need,0,100)+'%';el('hpText').textContent=Math.ceil(p.hp)+' / '+p.maxHp;el('level').textContent='NV. '+game.level;el('clock').textContent=String(Math.floor(game.elapsed/60)).padStart(2,'0')+':'+String(Math.floor(game.elapsed%60)).padStart(2,'0');el('kills').textContent=game.kills;el('buffs').textContent='⚔ '+game.blade+'  🔥 '+game.fire+'  ❄ '+game.ice+'  ⚡ '+game.lightning;el('objective').textContent=game.boss?'Derrote o Guardião':'Sobreviva até o Guardião';}
function addXp(n){game.xp+=n;let count=0;while(game.xp>=game.need){game.xp-=game.need;game.level++;game.need=Math.floor(game.need*1.21+3);game.levelQueue++;count++}if(count){toast('NÍVEL '+game.level+'!');rings.push({x:game.p.x,y:game.p.y,r:10,life:.85,max:.85,color:'#73dfff',growth:200})}}
function spawnEnemy(isBoss=false){let a=Math.random()*TAU,rad=Math.max(W,H)*.66+rnd(40,110),t=game.elapsed,k=isBoss?'boss':(Math.random()<.21?'hound':Math.random()<clamp(t/240,.1,.39)?'sentinel':'wraith');let hp=isBoss?1050:k==='sentinel'?65+t*.58:k==='hound'?24+t*.28:34+t*.37;let speed=isBoss?60:k==='hound'?112+t*.1:k==='sentinel'?43+t*.11:61+t*.13;enemies.push({x:game.p.x+Math.cos(a)*rad,y:game.p.y+Math.sin(a)*rad,kind:k,hp,maxHp:hp,r:isBoss?39:k==='sentinel'?23:k==='hound'?16:18,speed,damage:isBoss?24:k==='sentinel'?14:k==='hound'?9:10,burn:0,slow:0,flash:0,phase:rnd(0,TAU),face:1,attackT:0,motion:0})}
function burst(x,y,color,count=10,speed=90){for(let i=0;i<count&&particles.length<250;i++){let a=rnd(0,TAU),v=rnd(speed*.2,speed),life=rnd(.25,.72);particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-25,life,max:life,size:rnd(1,3.4),color})}}
function textAt(x,y,amount,color){if(floaters.length<40)floaters.push({x,y,text:String(Math.ceil(amount)),color,life:.57,max:.57,vx:rnd(-12,12)})}
function die(e){game.kills++;game.score+=e.kind==='boss'?150:1;let gems=e.kind==='boss'?14:e.kind==='sentinel'?3:1;for(let i=0;i<gems;i++)orbs.push({x:e.x+rnd(-15,15),y:e.y+rnd(-12,12),r:e.kind==='boss'?7:5,value:e.kind==='boss'?4:1,phase:rnd(0,TAU)});burst(e.x,e.y,e.kind==='boss'?'#e1a2ff':e.kind==='hound'?'#e99961':'#78a9c7',e.kind==='boss'?35:9,180);rings.push({x:e.x,y:e.y,r:8,life:.42,max:.42,color:e.kind==='boss'?'#db88ff':'#8aa4c7',growth:e.kind==='boss'?190:66});if(game.storm&&Math.random()<.2){let d=15+game.storm*9;rings.push({x:e.x,y:e.y,r:10,life:.5,max:.5,color:'#ff8c43',growth:120});impact(e,d*2+game.area*6,false,'fire');for(let o of enemies)if(o!==e&&o.hp>0&&length(o.x-e.x,o.y-e.y)<60+game.area*8)damage(o,d,'fire')}if(e.kind==='boss'){game.bossDead=true;impact(e,480,true,'lightning');win()}}
function impact(e,damageAmount,crit=false,flavor='physical'){
 const d=Math.max(0,damageAmount),isBoss=e&&e.kind==='boss',isElite=e&&e.kind==='sentinel';
 // Magnitude REAL do dano determina a intensidade da tremida e da parada de impacto.
 let power=Math.pow(Math.max(1,d),.64)*.37;
 if(isElite)power*=1.2;if(isBoss)power*=1.32;if(crit)power*=1.17;
 const screenDist=game?Math.hypot(e.x-game.p.x,e.y-game.p.y):0;
 power*=Math.max(.60,1-screenDist/1300);
 power=clamp(power,0,19);
 shake=Math.max(shake,power);
 impactZoom=Math.max(impactZoom,clamp((power-3)*.0029,0,.035));
 if(power>5)hitstop=Math.max(hitstop,Math.min(.060,(power-4)*.005));
 const color=flavor==='fire'?'#ff984c':flavor==='ice'?'#86eafa':flavor==='lightning'?'#fff0a6':crit?'#f9e4af':'#e7c58a';
 const radius=13+power*3.2;
 const duration=.19+power*.021;
 rings.push({x:e.x,y:e.y,r:5,life:duration,max:duration,color,growth:radius*3.2});
 if(power>5)rings.push({x:e.x,y:e.y,r:9,life:duration+.1,max:duration+.1,color:'#fff0d3',growth:radius*2.3});
 burst(e.x,e.y,color,Math.min(24,Math.ceil(power*1.5)),52+power*14);
 if(crit&&floaters.length<40)floaters.push({x:e.x,y:e.y-e.r-33,text:'✦ CRÍTICO!',color:'#ffdf87',life:.8,max:.8,vx:0});
}
function damage(e,n,kind){if(e.hp<=0)return;e.hp-=n;e.flash=.13;if(game){let dx=e.x-game.p.x,dy=e.y-game.p.y,dist=length(dx,dy)||1,kick=Math.min(6,Math.pow(n,.62)*.45);e.x+=dx/dist*kick;e.y+=dy/dist*kick;}let color=kind==='fire'?'#ffad63':kind==='ice'?'#85efff':kind==='lightning'?'#f6ed96':'#f6dba3';textAt(e.x+rnd(-12,12),e.y-e.r-8,n,color);if(kind==='fire')e.burn=Math.max(e.burn,2.8);if(kind==='ice')e.slow=Math.max(e.slow,2.5);burst(e.x+rnd(-5,5),e.y+rnd(-5,5),color,4,74);if(e.hp<=0)die(e)}
function attack(){game.p.attackPulse=.32;let targets=enemies.filter(e=>e.hp>0).sort((a,b)=>length(a.x-game.p.x,a.y-game.p.y)-length(b.x-game.p.x,b.y-game.p.y)).slice(0,1+game.multi);for(let e of targets){let dx=e.x-game.p.x,dy=e.y-game.p.y,l=length(dx,dy)||1;game.p.attackAim=Math.atan2(dy,dx);if(Math.abs(dx)>14)game.p.face=dx<0?-1:1;shots.push({x:game.p.x+dx/l*17,y:game.p.y+dy/l*17,vx:dx/l*535,vy:dy/l*535,life:1.25,r:8+game.area*.6,trail:[],phase:rnd(0,TAU),crit:Math.random()<.15});burst(game.p.x+dx/l*15,game.p.y+dy/l*15,'#f4d18d',3,45)}}
function update(dt){worldTime+=dt;toastT-=dt;if(toastT<=0)el('toast').classList.remove('visible');shake=Math.max(0,shake-dt*(shake>9?32:shake>5?24:16));impactZoom=Math.max(0,impactZoom-dt*.15);flash=Math.max(0,flash-dt*2);if(hitstop>0){hitstop=Math.max(0,hitstop-dt);return}if(game&&game.winPending>0){game.winPending-=dt;if(game.winPending<=0){endResult(true);return}}if(mode!=='play'){camera.x=lerp(camera.x,0,.025);camera.y=lerp(camera.y,0,.025);return}
let p=game.p;game.elapsed+=dt;let vx=0,vy=0;if(keys.w||keys.arrowup)vy--;if(keys.s||keys.arrowdown)vy++;if(keys.a||keys.arrowleft)vx--;if(keys.d||keys.arrowright)vx++;if(stick){vx+=stick.dx;vy+=stick.dy}let len=length(vx,vy),power=Math.min(1,len);if(len>0.04){p.x+=vx/len*p.speed*power*dt;p.y+=vy/len*p.speed*power*dt;p.face=vx<-.04?-1:vx>.04?1:p.face;p.move+=dt*12.5*power;p.motion=lerp(p.motion,power,Math.min(1,dt*15))}else{p.move+=dt*.4;p.motion=lerp(p.motion,0,Math.min(1,dt*14))}
camera.x=lerp(camera.x,p.x,Math.min(1,dt*11));camera.y=lerp(camera.y,p.y,Math.min(1,dt*11));p.hurt=Math.max(0,p.hurt-dt);p.attackPulse=Math.max(0,(p.attackPulse||0)-dt);
game.spawn-=dt;if(game.spawn<=0){game.spawn=Math.max(.18,.86-game.elapsed*.002);let num=1+Math.floor(game.elapsed/65);for(let i=0;i<num&&enemies.length<105;i++)spawnEnemy()}
if(game.elapsed>=157&&!game.boss){game.boss=true;spawnEnemy(true);toast('O GUARDIÃO DESPERTOU');bossbar.classList.add('visible')}
game.attack-=dt;if(game.attack<=0){game.attack=Math.max(.12,.75/(1+game.reload*.125));attack()}
for(let e of enemies){if(e.hp<=0)continue;e.phase+=dt*(e.kind==='hound'?13:e.kind==='sentinel'?5:e.kind==='boss'?2.4:4.5);e.flash=Math.max(0,e.flash-dt);e.attackT=Math.max(0,(e.attackT||0)-dt);if(e.burn>0){e.burn-=dt;e.hp-=(5+game.fire*3)*dt;if(e.hp<=0){die(e);continue}}if(e.slow>0)e.slow-=dt;let dx=p.x-e.x,dy=p.y-e.y,dis=length(dx,dy)||1;if(dis>5){let m=e.speed*(e.slow>0?.52:1)*dt;e.x+=dx/dis*m;e.y+=dy/dis*m;e.face=dx<0?-1:1;e.motion=lerp(e.motion,1,Math.min(1,dt*12))}if(dis<p.r+e.r*.68&&p.hurt<=0){e.attackT=.25;p.hp-=e.damage;flash=.55;shake=Math.max(shake,4.3);p.hurt=.54;burst(p.x,p.y,'#ff6f87',10,110);if(p.hp<=0){p.hp=0;lose();break}}}
for(let s of shots){s.trail.unshift({x:s.x,y:s.y});if(s.trail.length>5)s.trail.pop();s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;for(let e of enemies){if(e.hp<=0)continue;if(length(s.x-e.x,s.y-e.y)<s.r+e.r*.72){
  const main=(16+game.blade*8)*(s.crit?2.45:1);
  const fire=game.fire>0?3+game.fire*3:0,ice=game.ice>0?2+game.ice*2:0,bolt=game.lightning>0?4+game.lightning*4:0;
  const total=main+fire+ice+bolt;
  damage(e,main,'physical');if(fire)damage(e,fire,'fire');if(ice)damage(e,ice,'ice');
  if(bolt){damage(e,bolt,'lightning');if(Math.random()<.34){let near=enemies.filter(o=>o!==e&&o.hp>0&&length(o.x-e.x,o.y-e.y)<120+game.area*9).slice(0,3);near.forEach(o=>{const chain=3+game.lightning*5;damage(o,chain,'lightning');impact(o,chain*.65,false,'lightning');rings.push({x:o.x,y:o.y,r:4,life:.3,max:.3,color:'#ffeb90',growth:38})})}}
  impact(e,total,s.crit,game.fire?'fire':game.lightning?'lightning':game.ice?'ice':'physical');
  s.life=0;break
 }}}
shots=shots.filter(s=>s.life>0);enemies=enemies.filter(e=>e.hp>0);
for(let o of orbs){o.phase+=dt*4;let dx=p.x-o.x,dy=p.y-o.y,dis=length(dx,dy)||1;if(dis<140+game.area*7){let speed=Math.min(550,240+350/(dis*.06+1));o.x+=dx/dis*Math.min(dis,speed*dt);o.y+=dy/dis*Math.min(dis,speed*dt)}if(dis<23){o.dead=true;addXp(o.value);burst(o.x,o.y,'#78e8ff',3,45)}}orbs=orbs.filter(o=>!o.dead);
for(let f of particles){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=1-dt*.75;f.vy*=1-dt*.75;f.life-=dt}particles=particles.filter(f=>f.life>0);
for(let r of rings){r.r+=r.growth*dt;r.life-=dt}rings=rings.filter(r=>r.life>0);
for(let f of floaters){f.y-=dt*48;f.x+=f.vx*dt;f.life-=dt}floaters=floaters.filter(f=>f.life>0);
let boss=enemies.find(e=>e.kind==='boss');if(boss){el('bossFill').style.width=clamp(boss.hp/boss.maxHp*100,0,100)+'%'}else if(game.boss){bossbar.classList.remove('visible')}
updateHUD();if(game.levelQueue>0&&mode==='play'){game.levelQueue--;upgrade()}}
function hero(x,y,p){AscensionMotion.hero(ctx,p,worldTime,game)}
function enemySprite(e){AscensionMotion.drawEnemy(ctx,e,worldTime)}
function render(){ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='#80aa79';ctx.fillRect(0,0,W,H);ctx.save();let jitterX=shake?(Math.sin(worldTime*173)*.78+Math.sin(worldTime*107)*.25)*shake:0,jitterY=shake?(Math.cos(worldTime*141)*.72+Math.sin(worldTime*87)*.27)*shake:0;if(impactZoom>0){ctx.translate(W/2,H/2);ctx.scale(1+impactZoom,1+impactZoom);ctx.translate(-W/2,-H/2)}ctx.translate(Math.round(W/2-camera.x+jitterX),Math.round(H/2-camera.y+jitterY));drawWorld();AscensionWind.sun(ctx,camera,W,H,worldTime);
let left=camera.x-W/2-85,right=camera.x+W/2+85,top=camera.y-H/2-85,bottom=camera.y+H/2+85;for(let o of props)if(o.x>left&&o.x<right&&o.y>top&&o.y<bottom)deco(o);AscensionWind.ground(ctx,camera,W,H,worldTime);
for(let o of orbs){let z=Math.sin(o.phase)*2;glow(ctx,o.x,o.y+z,24,o.value>1?'#efba504a':'#62ddff4a');ctx.save();ctx.translate(o.x,o.y+z);ctx.rotate(.785);ctx.shadowColor=o.value>1?'#ffe08a':'#63e0ff';ctx.shadowBlur=13;ctx.fillStyle=o.value>1?'#ffdb76':'#63daff';ctx.fillRect(-o.r,-o.r,o.r*2,o.r*2);ctx.shadowBlur=0;ctx.fillStyle='#e8ffff';ctx.fillRect(-o.r*.4,-o.r*.4,o.r*.75,o.r*.75);ctx.restore()}
let shown=enemies.filter(e=>e.x>left-30&&e.x<right+30&&e.y>top-30&&e.y<bottom+30).sort((a,b)=>a.y-b.y);for(let e of shown)enemySprite(e);
if(game)hero(game.p.x,game.p.y,game.p);else hero(0,0,{x:0,y:0,face:1,move:worldTime*.4,motion:0,hurt:0});
for(let s of shots){ctx.strokeStyle=s.crit?'#fbe4aacc':'#f7bd6090';ctx.shadowBlur=s.crit?22:13;ctx.shadowColor=s.crit?'#fff6c0':'#f6e1a0';ctx.lineWidth=s.crit?7:5;ctx.beginPath();ctx.moveTo(s.x,s.y);for(let q of s.trail)ctx.lineTo(q.x,q.y);ctx.stroke();ctx.save();ctx.translate(s.x,s.y);ctx.rotate(Math.atan2(s.vy,s.vx)+PI/2);poly(ctx,[[-6,5],[0,-13],[7,5],[0,12]],'#f5edd5','#fff7c0',1.5);ctx.restore();ctx.shadowBlur=0}
for(let r of rings){ctx.save();ctx.globalAlpha=clamp(r.life/r.max,0,1)*.8;ctx.strokeStyle=r.color;ctx.lineWidth=3;ctx.shadowColor=r.color;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,TAU);ctx.stroke();ctx.restore()}
for(let f of particles){ctx.globalAlpha=clamp(f.life/f.max,0,1);ctx.fillStyle=f.color;ctx.fillRect(f.x,f.y,f.size,f.size)}ctx.globalAlpha=1;
ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='700 15px Outfit,system-ui';for(let f of floaters){ctx.globalAlpha=clamp(f.life/f.max,0,1);ctx.strokeStyle='#060d1c';ctx.lineWidth=3;ctx.strokeText(f.text,f.x,f.y);ctx.fillStyle=f.color;ctx.fillText(f.text,f.x,f.y)}ctx.globalAlpha=1;AscensionForest.motes(ctx,camera,W,H,worldTime);AscensionWind.air(ctx,camera,W,H,worldTime);ctx.restore();
// Luz natural da floresta: sem vignette ou filtros em tela cheia a cada quadro.
if(flash>0){ctx.fillStyle='rgba(235,41,80,'+(flash*.24)+')';ctx.fillRect(0,0,W,H)}
}
let currentFps=0,fpsCount=0,fpsTime=0;function frame(t){let delta=Math.min(.12,Math.max(0,(t-last)/1000||.016));last=t;fpsCount++;if(t-fpsTime>=1000){currentFps=Math.round(fpsCount*1000/(t-fpsTime));fpsCount=0;fpsTime=t}try{let remain=delta;while(remain>.00001){let dt=Math.min(.032,remain);update(dt);remain-=dt}render()}catch(err){if(mode!=='error')recoverFromError(err,'renderização')}requestAnimationFrame(frame)}
let joyX=0,joyY=0,touchId=null;
function resetStick(){pointerId=null;touchId=null;stick=null;joystick.classList.remove('active');knob.style.transform='translate(0,0)'}
function beginStick(x,y){joyX=x;joyY=y;stick={dx:0,dy:0};joystick.classList.add('active');joystick.style.left=(joyX-63)+'px';joystick.style.top=(joyY-63)+'px'}
function moveStick(x,y){if(!stick)return;let dx=x-joyX,dy=y-joyY,len=length(dx,dy),radius=Math.min(45,len);stick.dx=dx/Math.max(52,len);stick.dy=dy/Math.max(52,len);knob.style.transform='translate('+(len?dx/len*radius:0)+'px,'+(len?dy/len*radius:0)+'px)'}
cv.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||mode!=='play'||pointerId!==null||touchId!==null)return;e.preventDefault();pointerId=e.pointerId;beginStick(e.clientX,e.clientY);try{cv.setPointerCapture(e.pointerId)}catch{}});
cv.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||e.pointerId!==pointerId||!stick)return;e.preventDefault();moveStick(e.clientX,e.clientY)});
cv.addEventListener('pointerup',e=>{if(e.pointerId===pointerId)resetStick()});
cv.addEventListener('pointercancel',e=>{if(e.pointerId===pointerId)resetStick()});
cv.addEventListener('touchstart',e=>{if(mode!=='play'||touchId!==null)return;let t=e.changedTouches[0];if(!t)return;e.preventDefault();touchId=t.identifier;pointerId=null;beginStick(t.clientX,t.clientY)},{passive:false});
cv.addEventListener('touchmove',e=>{if(touchId===null||!stick)return;for(let t of e.changedTouches){if(t.identifier===touchId){e.preventDefault();moveStick(t.clientX,t.clientY);break}}},{passive:false});
const finishTouch=e=>{if(touchId===null)return;for(let t of e.changedTouches){if(t.identifier===touchId){e.preventDefault();resetStick();break}}};
cv.addEventListener('touchend',finishTouch,{passive:false});cv.addEventListener('touchcancel',finishTouch,{passive:false});
addEventListener('blur',()=>{keys=Object.create(null);resetStick();if(mode==='play')pause()});addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.key==='Escape'&&mode==='play')pause()});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
function endResult(won){mode=won?'won':'lost';hud.classList.add('hidden');el('pause').classList.add('hidden');bossbar.classList.remove('visible');show('<div class="eyebrow">'+(won?'A LENDA FOI ESCRITA':'A JORNADA CONTINUA')+'</div><div class="emblem">'+crest+'</div><h1>'+(won?'GUARDIÃO DERROTADO':'A NOITE VENCEU')+'</h1><p class="lead">'+(won?'Você sobreviveu às ruínas e venceu o Guardião. Sua ascensão está apenas começando.':'Cada batalha revela um novo caminho. Reúna forças e tente novamente.')+'</p><div class="result-grid"><div><b>'+game.level+'</b><span>NÍVEL</span></div><div><b>'+game.kills+'</b><span>ELIMINAÇÕES</span></div><div><b>'+Math.floor(game.elapsed/60)+':'+String(Math.floor(game.elapsed%60)).padStart(2,'0')+'</b><span>TEMPO</span></div><div><b>'+game.score+'</b><span>PONTOS</span></div></div><button class="button" id="again">NOVA JORNADA</button><button class="button alt" id="home">MENU PRINCIPAL</button>');el('again').onclick=start;el('home').onclick=menu}
function win(){if(mode==='play'&&!game.winPending){game.winPending=.8;hitstop=Math.max(hitstop,.085)}}function lose(){if(mode==='play')endResult(false)}
makeWorld();menu();window.AscensionGame={start,mode:()=>mode,debug:()=>({mode,seconds:game?.elapsed||0,x:game?.p.x||0,y:game?.p.y||0,motion:game?.p.motion||0,attackPulse:game?.p.attackPulse||0,kills:game?.kills||0,enemies:enemies.length,shots:shots.length,tiles:tiles.length,props:props.length,fps:currentFps,stick:stick?{dx:stick.dx,dy:stick.dy}:null,touchActive:touchId!==null,terrain:'Floresta da Aurora',illustrated:window.AscensionIllustrated?.stats()||null,wind:AscensionWind.stats(),tree:window.AscensionTree?.stats()||null,version:'0.7.2'})};document.addEventListener('pointerup',e=>{if(mode==='menu'&&e.target&&e.target.closest&&e.target.closest('#start'))start()},{capture:true});document.addEventListener('touchend',e=>{if(mode==='menu'&&e.target&&e.target.closest&&e.target.closest('#start')){e.preventDefault();start()}},{capture:true,passive:false});requestAnimationFrame(frame);
})();