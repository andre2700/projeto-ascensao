/* Projeto Ascensão · Phaser vertical slice 0.1
 * Arquitectura: mundo e câmera Phaser, dados de arte existentes, colisões elípticas,
 * animação não destrutiva (sem deformar sprite), combate em oito direções,
 * XP/coleta, level-up, vento em coordenadas de mundo e diagnósticos de QA.
 * A limitação artística dos quadros originais é intencionalmente visível, não disfarçada.
 */
(function(){
'use strict';
const Phaser=window.Phaser,DATA=window.AscensionIllustrationData,FOREST=window.AscensionForestTextureData,TREE=window.AscensionTreeData;
const UI={
 menu:document.getElementById('menu'),start:document.getElementById('start'),loading:document.getElementById('loading'),
 hud:document.getElementById('hud'),hp:document.getElementById('hp-fill'),xp:document.getElementById('xp-fill'),
 level:document.getElementById('level'),lifeLabel:document.getElementById('hp-label'),kills:document.getElementById('kills'),
 time:document.getElementById('time'),weapon:document.getElementById('weapon'),lvlMenu:document.getElementById('levelmenu'),
 choices:document.getElementById('choices'),pause:document.getElementById('pause'),pauseMenu:document.getElementById('pausemenu'),
 resume:document.getElementById('resume'),restart:document.getElementById('restart'),defeat:document.getElementById('defeat'),
 defeatInfo:document.getElementById('defeat-info'),again:document.getElementById('again'),stick:document.getElementById('stick'),
 knob:document.getElementById('knob'),plus:document.getElementById('zoom-in'),minus:document.getElementById('zoom-out'),
 fxLabel:document.getElementById('quality'),
};
const WORLD=3200,CENTER=WORLD/2,TAU=Math.PI*2,DIR_STEP=Math.PI/4;
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
const norm=(x,y)=>{const m=Math.hypot(x,y);return m>1e-6?{x:x/m,y:y/m,m}:{x:0,y:0,m:0}};
const snap=a=>Math.round(a/DIR_STEP)*DIR_STEP;
function rng(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
let scene=null;
const diagnostic={engine:'Phaser',ready:false,playing:false,errors:[],version:'phaser-0.1',
 stats(){return scene?.stats()||null},
 test:{
  setBuild(area=0,multi=0,blade=1){if(!scene||!scene.playing)return false;scene.build.area=area;scene.build.multi=multi;scene.build.blade=blade;scene.refreshHud();return true},
  spawn(kind='beast',dx=80,dy=5,hp=150){if(!scene)return false;scene.spawnEnemy(kind,scene.hero.x+dx,scene.hero.y+dy,hp);return true},
  forceXP(count=15){if(!scene)return false;scene.addXp(count);return true},
  clearEnemies(){if(!scene)return false;for(const e of scene.enemies)scene.removeEnemy(e,false);scene.enemies=[];return true},
  getColliders(){return scene?.trunks.map(({x,y,rx,ry})=>({x,y,rx,ry})).slice(0,10)||[]},
 }
};
window.AscensionNext=diagnostic;
window.addEventListener('error',e=>{if(e.message&&!e.message.includes('ResizeObserver'))diagnostic.errors.push(e.message)});
window.addEventListener('unhandledrejection',e=>diagnostic.errors.push(String(e.reason)));
const choose=[
 {key:'area',symbol:'◈',title:'Runas de Alcance',desc:'Arco maior e corte projetado mais longe.'},
 {key:'multi',symbol:'✧',title:'Dança de Lâminas',desc:'Mais cortes consecutivos a cada ataque.'},
 {key:'blade',symbol:'⚔',title:'Lâmina Ancestral',desc:'Golpes mais fortes e novos crescentes.'},
 {key:'speed',symbol:'↗',title:'Botas do Vento',desc:'Movimento mais rápido pela floresta.'},
 {key:'vitality',symbol:'♥',title:'Essência Vital',desc:'Mais vida máxima e cura imediata.'}
];
function fail(reason){
 const msg=String(reason?.message||reason);
 diagnostic.errors.push(msg);UI.loading.textContent='Erro: '+msg;UI.menu.hidden=false;
 console.error('[Ascensão Phaser]',reason)
}
if(!Phaser||!DATA?.hero||!DATA?.beast||!DATA?.wraith||!FOREST||!TREE){fail('O motor ou as ilustrações não foram carregados.');return}
class ForestGame extends Phaser.Scene{
 constructor(){super('forest');this.random=rng(20261016);this.elapsed=0;this.playing=false;this.paused=false;
  this.enemies=[];this.trunks=[];this.leaves=[];this.gems=[];this.fx=[];this.blades=[];this.sounds=false;
  this.kills=0;this.attacks=0;this.hits=0;this.critical=0;this.damageReceived=0;this.gemCollected=0;this.shakeEvents=0;
  this.level=1;this.xp=0;this.xpNext=8;this.health=120;this.maxHealth=120;this.speed=202;
  this.build={area:0,multi:0,blade:1,speed:0,vitality:0};
  this.keyState=null;this.inputId=null;this.joy={x:0,y:0};this.touchStart=null;this.vx=0;this.vy=0;
  this.attackCooldown=0;this.comboRemaining=0;this.comboTimer=0;this.comboIndex=0;this.lastAim=0;this.fxCount=0;
 }
 preload(){
   const data=DATA;
   this.load.spritesheet('warrior',data.hero,{frameWidth:128,frameHeight:117});
   this.load.spritesheet('wolf',data.beast,{frameWidth:128,frameHeight:117});
   this.load.spritesheet('ghost',data.wraith,{frameWidth:128,frameHeight:117});
   this.load.image('ground',FOREST);
   this.load.image('oak',TREE)
 }
 makeTextures(){
  // Somente VFX e recompensas procedurais. Personagens continuam ilustrados.
  const make=(key,size,paint)=>{
   const c=document.createElement('canvas');c.width=c.height=size;
   const ctx=c.getContext('2d');paint(ctx,size);
   this.textures.addCanvas(key,c)
  };
  make('xp-shard',58,(ctx,s)=>{
   ctx.translate(29,29);ctx.shadowColor='#3ffbfc';ctx.shadowBlur=10;
   const g=ctx.createLinearGradient(-12,-18,12,20);
   g.addColorStop(0,'#e9ffff');g.addColorStop(.3,'#79ffff');g.addColorStop(.66,'#1aabc1');g.addColorStop(1,'#18618d');
   ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,-21);ctx.lineTo(14,0);ctx.lineTo(0,20);ctx.lineTo(-14,0);ctx.closePath();ctx.fill();
   ctx.shadowBlur=0;ctx.lineWidth=1.3;ctx.strokeStyle='#e4feffb8';ctx.stroke();ctx.beginPath();
   ctx.moveTo(-1,-16);ctx.lineTo(5,-2);ctx.lineTo(-1,15);ctx.lineTo(-5,0);ctx.closePath();
   ctx.fillStyle='#dfffff8f';ctx.fill();
  });
  make('gold-essence',66,(ctx,s)=>{
   ctx.translate(33,33);ctx.shadowColor='#ffe2a0';ctx.shadowBlur=8;
   const g=ctx.createRadialGradient(-12,-14,2,0,0,27);g.addColorStop(0,'#fff7dc');g.addColorStop(.48,'#ffcb6a');g.addColorStop(.8,'#ba7834');g.addColorStop(1,'#6b4023');
   ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,22,24,0,0,TAU);ctx.fill();
   ctx.shadowBlur=0;ctx.lineWidth=2.5;ctx.strokeStyle='#ffe2a9';ctx.stroke();
   ctx.beginPath();ctx.moveTo(0,-15);ctx.lineTo(6,-4);ctx.lineTo(15,0);ctx.lineTo(6,5);ctx.lineTo(0,16);
   ctx.lineTo(-5,5);ctx.lineTo(-15,0);ctx.lineTo(-5,-4);ctx.closePath();ctx.fillStyle='#fff1ba';ctx.fill();
   ctx.lineWidth=1;ctx.strokeStyle='#b07838';ctx.stroke();
  });
  make('slash',200,(ctx,s)=>{
   ctx.translate(100,100);
   // Um crescente bem definido, com halo e ponta, pré-renderizado (não por-frame).
   const path=()=>{
     ctx.beginPath();ctx.arc(0,0,81,-1.28,.55);
     ctx.arc(12,0,61,.63,-1.50,true);
     ctx.closePath()
   };
   ctx.shadowColor='#b0f0ff';ctx.shadowBlur=22;ctx.globalAlpha=.43;ctx.fillStyle='#77cfff';path();ctx.fill();
   ctx.shadowBlur=9;ctx.globalAlpha=.95;
   const g=ctx.createLinearGradient(10,-80,85,75);g.addColorStop(0,'#fffce5');g.addColorStop(.32,'#e8ffff');g.addColorStop(.72,'#7bd7f8');g.addColorStop(1,'#3b77b3');
   ctx.fillStyle=g;path();ctx.fill();ctx.shadowBlur=0;
   ctx.strokeStyle='#fcffff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,80,-1.27,.55);ctx.stroke()
  });
  make('glint',36,(ctx)=>{
    ctx.translate(18,18);ctx.shadowBlur=9;ctx.shadowColor='#fdf0bf';ctx.strokeStyle='#fffde5';ctx.lineWidth=2.3;
    ctx.beginPath();ctx.moveTo(-13,0);ctx.lineTo(13,0);ctx.moveTo(0,-13);ctx.lineTo(0,13);ctx.stroke();
  });
 }
 create(){
  scene=this;this.makeTextures();const rnd=this.random;
  this.cameras.main.setBackgroundColor('#76986b');
  this.ground=this.add.tileSprite(0,0,WORLD,WORLD,'ground').setOrigin(0).setDepth(-100000);
  this.ground.tileScaleX=1.03;this.ground.tileScaleY=1.03;
  // Sombra projetada e tronco sólido. Árvore e herói compartilham o mesmo sistema de profundidade.
  for(let i=0;i<62;i++){
    const x=150+rnd()*(WORLD-300),y=150+rnd()*(WORLD-300);
    if(Math.hypot(x-CENTER,y-CENTER)<275)continue;
    const sc=.74+rnd()*.46,rx=39*sc,ry=24*sc;
    const canopyShadow=this.add.ellipse(x+13*sc,y+26*sc,108*sc,33*sc,0x183c29,.18).setDepth(y-8);
    const trunkShadow=this.add.ellipse(x+2*sc,y+13*sc,67*sc,17*sc,0x183c29,.30).setDepth(y-7);
    const art=this.add.image(x,y+16*sc,'oak').setOrigin(.5,1).setDisplaySize(183*sc,186*sc).setDepth(y+7);
    // Só a copa move muito discretamente; tronco NÃO balança / separa do chão.
    this.trunks.push({x,y:y+13*sc,rx,ry,art,shadow:canopyShadow,trunkShadow})
  }
  const sparkle=this.add.particles(0,0,'glint',{x:{min:0,max:WORLD},y:{min:0,max:WORLD},
     frequency:340,quantity:1,lifespan:1200,scale:{start:.09,end:.0},alpha:{start:.13,end:0},
     speedX:{min:3,max:12},speedY:{min:-5,max:1},maxParticles:32}).setDepth(-2);
  // Partículas de pólen permanecem no mundo e não seguem o jogador.
  this.sparkles=sparkle;
  this.contact=this.add.ellipse(CENTER,CENTER+11,41,12,0x153725,.45).setDepth(CENTER-2);
  this.hero=this.add.sprite(CENTER,CENTER,'warrior',0).setOrigin(.5,.89).setDisplaySize(106,97).setDepth(CENTER);
  this.hero.setPipeline('TextureTintPipeline'); // Renderizador Phaser mantém upscale uniforme
  this.cameras.main.startFollow(this.hero,true,.075,.075);
  this.cameras.main.setBounds(0,0,WORLD,WORLD);
  this.cameras.main.setZoom(.90);
  this.cameras.main.roundPixels=false;
  for(let i=0;i<12;i++)this.spawnEnemy();
  this.keyboard=this.input.keyboard?.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT')||null;
  this.input.on('pointerdown',p=>{
    if(!this.playing||this.paused||this.inputId!==null)return;
    if(p.y<150&&p.x>this.scale.width-120)return;
    this.inputId=p.id;this.touchStart={x:p.x,y:p.y};
    UI.stick.style.display='block';UI.stick.style.left=(p.x-57)+'px';UI.stick.style.top=(p.y-57)+'px';
    this.setStick(p)
  });
  this.input.on('pointermove',p=>{if(p.id===this.inputId&&this.touchStart)this.setStick(p)});
  const up=p=>{if(p.id===this.inputId){this.inputId=null;this.touchStart=null;this.joy.x=0;this.joy.y=0;UI.stick.style.display='none';UI.knob.style.transform='translate(0px,0px)'}};
  this.input.on('pointerup',up);this.input.on('pointerupoutside',up);
  UI.start.disabled=false;UI.loading.textContent='Motor Phaser '+Phaser.VERSION+' pronto.';
  UI.start.onclick=()=>this.startRun();
  UI.pause.onclick=()=>this.pauseRun();
  UI.resume.onclick=()=>this.resumeRun();
  UI.restart.onclick=()=>this.restartRun();
  UI.again.onclick=()=>this.restartRun();
  UI.plus.onclick=()=>this.cameras.main.setZoom(clamp(this.cameras.main.zoom+.10,.68,1.12));
  UI.minus.onclick=()=>this.cameras.main.setZoom(clamp(this.cameras.main.zoom-.10,.68,1.12));
  this.graphics=this.add.graphics().setDepth(100000);
  diagnostic.ready=true;this.refreshHud()
 }
 setStick(p){
  const dx=p.x-this.touchStart.x,dy=p.y-this.touchStart.y,n=norm(dx,dy),scale=Math.min(1,n.m/55);
  this.joy.x=n.x*scale;this.joy.y=n.y*scale;
  UI.knob.style.transform='translate('+(this.joy.x*40)+'px,'+(this.joy.y*40)+'px)'
 }
 startRun(){if(this.playing)return;
   UI.menu.hidden=true;UI.hud.hidden=false;UI.pause.hidden=false;
   this.playing=true;diagnostic.playing=true;this.paused=false;
   this.input.addPointer(2);
 }
 pauseRun(){if(!this.playing||this.paused)return;
  this.paused=true;UI.pauseMenu.hidden=false;UI.pause.hidden=true;this.joy.x=this.joy.y=0;this.inputId=null;UI.stick.style.display='none'
 }
 resumeRun(){if(!this.paused)return;this.paused=false;UI.pauseMenu.hidden=true;UI.pause.hidden=false}
 restartRun(){window.location.reload()}
 collision(x,y,radius){
  x=clamp(x,55,WORLD-55);y=clamp(y,55,WORLD-55);
  for(let i=0;i<3;i++){
   let changed=false;
   for(const t of this.trunks){
    let dx=x-t.x,dy=y-t.y,rx=t.rx+radius,ry=t.ry+radius*.74,d=Math.hypot(dx/rx,dy/ry);
    if(d>=1)continue;
    if(d<.00001){dx=1;dy=0;d=1/rx}
    const scale=1/d-1;
    x+=dx*scale+Math.sign(dx)*.02;y+=dy*scale+Math.sign(dy)*.02;changed=true
   }
   if(!changed)break
  }
  return{x,y}
 }
 spawnEnemy(kind=null,x=null,y=null,hp=null){
  const rnd=this.random;
  if(!kind)kind=rnd()<.43?'wraith':'beast';
  if(x===null){const angle=rnd()*TAU,rad=240+rnd()*480;x=this.hero.x+Math.cos(angle)*rad;y=this.hero.y+Math.sin(angle)*rad}
  x=clamp(x,70,WORLD-70);y=clamp(y,70,WORLD-70);
  let beast=kind==='beast',size=beast?86:77,baseHp=hp|| (beast?64:47);
  const shadow=this.add.ellipse(x,y+7,beast?43:35,beast?13:11,0x1c432b,.33).setDepth(y-3);
  const spr=this.add.sprite(x,y,beast?'wolf':'ghost',0).setDisplaySize(size,beast?75:77).setOrigin(.5,.9).setDepth(y);
  const e={sprite:spr,shadow,x,y,hp:baseHp,maxHp:baseHp,kind,r:beast?19:16,
    speed:beast?76:64,hurt:0,windup:0,attack:0,cooldown:.7+rnd()*.7,vx:0,vy:0,knockX:0,knockY:0};
  this.enemies.push(e);return e
 }
 removeEnemy(e,reward=true){
  if(e.gone)return;e.gone=true;
  e.sprite.destroy();e.shadow.destroy();
  if(reward){
   this.kills++;this.dropGem(e.x,e.y,Math.random()<.15?3:1);
   // Mortes são recompensadas com pequeno flash, não terremoto constante.
   for(let i=0;i<4;i++)this.sparkles.emitParticleAt(e.x+(this.random()-.5)*30,e.y+(this.random()-.5)*30,1)
  }
 }
 dropGem(x,y,value=1){
  if(this.gems.length>100)return;
  const image=this.add.image(x,y-4,value>1?'gold-essence':'xp-shard').setDisplaySize(value>1?26:20,value>1?26:20).setDepth(y+3);
  const g={x,y,image,value,phase:this.random()*TAU};this.gems.push(g)
 }
 addXp(n){
  this.xp+=n;this.gemCollected+=n;
  if(this.xp>=this.xpNext){this.xp-=this.xpNext;this.level++;this.xpNext=Math.round(8+this.level*6.5);this.presentLevel()}
  this.refreshHud()
 }
 presentLevel(){
  this.paused=true;
  UI.pause.hidden=true;UI.lvlMenu.hidden=false;UI.choices.replaceChildren();
  const rnd=this.random,options=[...choose].sort(()=>rnd()-.5).slice(0,3);
  for(const power of options){
    const b=document.createElement('button');b.className='choice';b.type='button';
    const title=document.createElement('strong');title.textContent=power.symbol+'  '+power.title;
    const desc=document.createElement('span');desc.textContent=power.desc;
    b.append(title,desc);
    b.onclick=()=>{
      if(power.key==='vitality'){this.maxHealth+=22;this.health=Math.min(this.maxHealth,this.health+32)}
      else if(power.key==='speed')this.build.speed++;
      else this.build[power.key]++;
      UI.lvlMenu.hidden=true;UI.pause.hidden=false;this.paused=false;this.refreshHud()
    };
    UI.choices.append(b)
  }
 }
 refreshHud(){
  UI.hp.style.width=Math.round(100*this.health/this.maxHealth)+'%';
  UI.xp.style.width=Math.round(100*this.xp/this.xpNext)+'%';
  UI.lifeLabel.textContent=Math.ceil(this.health)+' / '+this.maxHealth;
  UI.level.textContent=this.level;UI.kills.textContent=this.kills;
  UI.weapon.textContent='⚔ '+(this.build.blade)+'  ◈ '+this.build.area+'  ✧ '+this.build.multi;
 }
 hurtEnemy(e,amount,angle){
  if(e.gone)return;
  e.hp-=amount;e.hurt=.13;e.knockX+=Math.cos(angle)*65;e.knockY+=Math.sin(angle)*65;this.hits++;
  e.sprite.setTint(0xfff2d9);
  if(e.hp<=0){this.removeEnemy(e);return}
  // Pequenos números brilham e somem, sem sobrecarregar a cena.
  if(this.fxCount<20){this.fxCount++;
   const t=this.add.text(e.x,e.y-34,Math.round(amount).toString(),{fontFamily:'Arial',fontSize:'15px',fontStyle:'bold',color:'#f8e0b2',
      stroke:'#344034',strokeThickness:3}).setOrigin(.5).setDepth(e.y+50);
   this.tweens.add({targets:t,y:e.y-59,alpha:0,duration:500,
      onComplete:()=>{t.destroy();this.fxCount--}})
  }
 }
 attack(){
  if(!this.playing||this.paused||this.comboRemaining>0)return;
  let target=null,dist=Infinity;
  for(const e of this.enemies){
   if(e.gone)continue;
   const d=Math.hypot(e.x-this.hero.x,e.y-this.hero.y);
   if(d<178+this.build.area*14&&d<dist){dist=d;target=e}
  }
  if(!target)return;
  this.lastAim=snap(Math.atan2(target.y-this.hero.y,target.x-this.hero.x));
  this.comboRemaining=1+this.build.multi;this.comboIndex=0;this.comboTimer=0;
 }
 slash(){
  if(this.comboRemaining<=0)return;
  const dir=this.comboIndex%2===0?1:-1;
  const angle=this.lastAim+(this.comboIndex%2===0?0:.14);
  const reach=80+this.build.area*15;
  const ox=this.hero.x+Math.cos(angle)*35,oy=this.hero.y-19+Math.sin(angle)*27;
  const scale=.82+this.build.area*.15;
  const ghost=this.add.image(ox,oy,'slash').setDisplaySize(175*scale,175*scale).setOrigin(.5);
  ghost.setRotation(angle+(dir===1?0:Math.PI)).setDepth(oy+120).setAlpha(.78);
  this.tweens.add({targets:ghost,alpha:0,scaleX:1.10,scaleY:1.10,duration:200,ease:'Cubic.easeOut',
    onComplete:()=>ghost.destroy()});
  this.attacks++;
  const power=23+this.build.blade*10;
  for(const e of this.enemies){
    if(e.gone)continue;
    const dx=e.x-this.hero.x,dy=e.y-this.hero.y,len=Math.hypot(dx,dy);
    if(len>reach+e.r*.6||len<1)continue;
    const diff=Math.atan2(Math.sin(Math.atan2(dy,dx)-angle),Math.cos(Math.atan2(dy,dx)-angle));
    if(Math.abs(diff)>.82+this.build.area*.036)continue;
    this.hurtEnemy(e,power,angle)
  }
  this.comboRemaining--;this.comboIndex++;this.comboTimer=.21;
 }
 update(time,dt0){
  const dt=Math.min(.038,dt0/1000);
  if(!this.playing||this.paused)return;
  this.elapsed+=dt;
  const k=this.keyboard;
  const x=this.joy.x+(k?Number(k.D.isDown||k.RIGHT.isDown)-Number(k.A.isDown||k.LEFT.isDown):0);
  const y=this.joy.y+(k?Number(k.S.isDown||k.DOWN.isDown)-Number(k.W.isDown||k.UP.isDown):0);
  const v=norm(x,y),power=clamp(v.m,0,1),moveSpeed=this.speed+this.build.speed*13;
  const response=1-Math.exp(-dt*13);
  this.vx=Phaser.Math.Linear(this.vx,v.x*moveSpeed*power,response);
  this.vy=Phaser.Math.Linear(this.vy,v.y*moveSpeed*power,response);
  const result=this.collision(this.hero.x+this.vx*dt,this.hero.y+this.vy*dt,15);
  this.hero.x=result.x;this.hero.y=result.y;this.hero.setDepth(this.hero.y);
  this.contact.setPosition(this.hero.x,this.hero.y+10).setDepth(this.hero.y-2);
  if(Math.abs(this.vx)>15)this.hero.setFlipX(this.vx<0);
  // Não usar tween de escala/rotação ou troca de quadro na corrida sem sprites reais.
  // O Phaser garante movimento interpolado, câmera suave e quadros consistentes.
  this.attackCooldown-=dt;
  this.comboTimer-=dt;
  if(this.comboRemaining>0&&this.comboTimer<=0)this.slash();
  else if(this.comboRemaining===0&&this.attackCooldown<=0){
    this.attack();this.attackCooldown=.72/(1+this.build.blade*.035)
  }
  for(const e of this.enemies){
    if(e.gone)continue;
    const delta=norm(this.hero.x-e.x,this.hero.y-e.y),d=delta.m;
    if(e.windup>0){
      e.windup-=dt;if(e.windup<=0){e.attack=.19;e.cooldown=1.15;
        if(d<51&&this.health>0){this.health-=e.kind==='beast'?13:8;this.damageReceived++;
          this.cameras.main.flash(75,255,108,96,false);this.refreshHud();
          if(this.health<=0)this.endRun()
        }
      }
    }else if(e.cooldown<=0&&d<61)e.windup=.31;
    else e.cooldown-=dt;
    const attacking=e.windup>0||e.attack>0,ease=attacking?.18:1;
    if(d>40){const aimX=delta.x*e.speed*ease,aimY=delta.y*e.speed*ease;
      e.vx=Phaser.Math.Linear(e.vx,aimX,1-Math.exp(-dt*8));
      e.vy=Phaser.Math.Linear(e.vy,aimY,1-Math.exp(-dt*8))
    }else{e.vx*=Math.exp(-dt*12);e.vy*=Math.exp(-dt*12)}
    const newPos=this.collision(e.x+(e.vx+e.knockX)*dt,e.y+(e.vy+e.knockY)*dt,e.r);
    e.x=newPos.x;e.y=newPos.y;e.knockX*=Math.exp(-dt*17);e.knockY*=Math.exp(-dt*17);
    e.sprite.setPosition(e.x,e.y).setDepth(e.y).setFlipX(delta.x<0);
    e.shadow.setPosition(e.x,e.y+8).setDepth(e.y-2);
    e.attack=Math.max(0,e.attack-dt);e.hurt=Math.max(0,e.hurt-dt);
    if(e.hurt===0)e.sprite.clearTint()
  }
  this.enemies=this.enemies.filter(e=>!e.gone);
  // XP magnetizado perto do personagem. Cada item permanece no mundo até a coleta.
  for(const g of this.gems){
    const dx=this.hero.x-g.x,dy=this.hero.y-g.y,d=Math.hypot(dx,dy);
    if(d<135&&d>3){const speed=110+(135-d)*2.8;g.x+=dx/d*speed*dt;g.y+=dy/d*speed*dt}
    g.phase+=dt*3.2;
    g.image.setPosition(g.x,g.y-4+Math.sin(g.phase)*2);
    if(d<25){g.dead=true;g.image.destroy();this.addXp(g.value)}
  }
  this.gems=this.gems.filter(g=>!g.dead);
  if(this.enemies.length<30&&this.elapsed>3&&this.random()<dt*(1.65+this.elapsed*.032)){
    this.spawnEnemy()
  }
  UI.time.textContent=Math.floor(this.elapsed/60).toString().padStart(2,'0')+':'+Math.floor(this.elapsed%60).toString().padStart(2,'0');
 }
 endRun(){this.playing=false;diagnostic.playing=false;this.paused=true;UI.hud.hidden=true;UI.pause.hidden=true;UI.defeat.hidden=false;
  UI.defeatInfo.textContent=this.kills+' inimigos derrotados · '+Math.floor(this.elapsed)+'s sobrevividos'}
 stats(){
  return {version:diagnostic.version,ready:diagnostic.ready,playing:this.playing,paused:this.paused,hero:{x:this.hero?.x,y:this.hero?.y},
   elapsed:this.elapsed,kills:this.kills,attacks:this.attacks,hits:this.hits,level:this.level,xp:this.xp,
   build:{...this.build},gems:this.gems.length,trees:this.trunks.length,enemies:this.enemies.length,
   zoom:this.cameras.main.zoom,renderer:this.game.renderer.type===Phaser.WEBGL?'WebGL':'Canvas',
   hp:this.health,errors:diagnostic.errors,animationTechnique:'single stable illustrated pose until coherent directional atlas exists'};
 }
}
try{
 const game=new Phaser.Game({type:Phaser.AUTO,parent:'stage',backgroundColor:'#72966b',
  scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH,width:innerWidth,height:innerHeight},
  render:{antialias:true,pixelArt:false},antialias:true,input:{activePointers:2},scene:[ForestGame]});
}catch(e){fail(e)}
})();