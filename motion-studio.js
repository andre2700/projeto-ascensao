/* Projeto Ascensão — Estúdio de Movimento (Phaser 3).
 * Laboratório isolado. Não modifica a Alpha principal.
 * As cinco poses existentes são temporárias: não equivalem a animação final.
 */
(function(root){
'use strict';
const P=root.Phaser,TAU=Math.PI*2,WORLD=2600,MID=WORLD/2;
const $=id=>document.getElementById(id);
const ui={menu:$('menu'),start:$('start'),status:$('status'),version:$('version'),state:$('state'),hits:$('hits'),
 stick:$('stick'),knob:$('knob'),attack:$('attack'),slow:$('slow'),zoomin:$('zoomin'),zoomout:$('zoomout')};
const metrics={ready:false,playing:false,errors:[],hits:0,swings:0,contactEvents:0,frameIndex:0,
 state:'idle',heroX:MID,heroY:MID,actorCount:0};
root.AscensionMotionStudio={debug:()=>({...metrics,phaser:P?.VERSION||null})};
function clamp(n,lo,hi){return Math.min(hi,Math.max(lo,n))}
function unit(x,y){const d=Math.hypot(x,y);return d>0?{x:x/d,y:y/d}:{x:0,y:0}}
function rng(seed){return ()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296)}
function fail(error){
 const msg=String(error?.message||error);metrics.errors.push(msg);
 ui.menu.hidden=false;ui.status.textContent='Falha na prévia: '+msg;console.error('[MotionStudio]',error)
}
root.addEventListener('error',e=>{if(e.message&&!e.message.includes('ResizeObserver'))metrics.errors.push(String(e.message))});
if(!P){fail('Phaser não carregou. Verifique a conexão com a internet.');return}

/* Os quadros do atlas antigo tinham pivôs diferentes. Recentrar pela região
   dos pés evita teleporte e tremedeira quando se muda de pose. */
function alignAtlas(scene,asset,count){
 const img=scene.textures.get(asset).getSourceImage();
 if(!img||img.width!==128*count||img.height!==117)throw Error('Dimensões inesperadas do atlas '+asset);
 const sample=document.createElement('canvas');sample.width=128;sample.height=117;
 const s=sample.getContext('2d',{willReadFrequently:true});
 for(let frame=0;frame<count;frame++){
  s.clearRect(0,0,128,117);s.drawImage(img,frame*128,0,128,117,0,0,128,117);
  const pixels=s.getImageData(0,0,128,117).data;
  let top=117,bottom=0,left=128,right=0;
  for(let y=0;y<117;y++)for(let x=0;x<128;x++){
   if(pixels[(y*128+x)*4+3]<56)continue;
   top=Math.min(top,y);bottom=Math.max(bottom,y);left=Math.min(left,x);right=Math.max(right,x)
  }
  if(bottom<=top)throw Error('Quadro de arte vazio: '+asset+'/'+frame);
  let xx=0,mass=0;
  const ank=Math.floor(top+(bottom-top)*.76);
  for(let y=ank;y<=bottom;y++)for(let x=left;x<=right;x++){
   const a=pixels[(y*128+x)*4+3]/255;
   if(a>.28){xx+=x*a;mass+=a}
  }
  const footX=mass?xx/mass:(left+right)*.5;
  const out=document.createElement('canvas');out.width=168;out.height=136;
  out.getContext('2d').drawImage(sample,Math.round(84-footX),Math.round(126-bottom));
  scene.textures.addCanvas(asset+'-pose-'+frame,out)
 }
}
function makeActor(scene,asset,x,y,scale){
 const body=scene.add.image(x,y,asset+'-pose-0').setOrigin(84/168,126/136).setScale(scale);
 const shadow=scene.add.ellipse(x,y+7,asset==='hero-sheet'?35:33,10,0x102a22,.43).setDepth(y-2);
 body.setDepth(y);return{body,shadow,x,y,asset,frame:-1,scale,phase:0,travel:0,hitT:0,alive:true,dead:false}
}
function pose(actor,frame){
 if(actor.frame===frame)return;
 actor.frame=frame;actor.body.setTexture(actor.asset+'-pose-'+frame);
 if(actor.asset==='hero-sheet'){metrics.frameIndex=frame}
}
function locate(actor){
 actor.body.setPosition(actor.x,actor.y).setDepth(actor.y);
 actor.shadow.setPosition(actor.x,actor.y+7).setDepth(actor.y-2)
}
class Studio extends P.Scene{
 constructor(){
  super('MotionStudio');
  this.playing=false;this.elapsed=0;this.seed=rng(161026);this.foes=[];this.trails=[];
  this.joy={x:0,y:0};this.joyId=null;this.joyOrigin=null;this.hitstop=0;
  this.attack={active:false,t:0,duration:.48,aim:0,variant:1,hit:false};
  this.vel={x:0,y:0};this.facing=1;this.moveClock=0;this.manualQueue=false;
  this.cooldown=0;this.timeScale=1;this.lastState=''
 }
 preload(){
  if(!root.AscensionIllustrationData?.hero||!root.AscensionForestTextureData||!root.AscensionTreeData)
   throw Error('Ilustrações locais não foram carregadas');
  this.load.image('hero-sheet',root.AscensionIllustrationData.hero);
  this.load.image('beast-sheet',root.AscensionIllustrationData.beast);
  this.load.image('wraith-sheet',root.AscensionIllustrationData.wraith);
  this.load.image('forest',root.AscensionForestTextureData);
  this.load.image('tree',root.AscensionTreeData);
  this.load.on('loaderror',file=>fail('Não foi possível carregar: '+file.key))
 }
 create(){
  try{this.initialize()}catch(error){fail(error);this.playing=false}
 }
 initialize(){
  alignAtlas(this,'hero-sheet',5);alignAtlas(this,'beast-sheet',4);alignAtlas(this,'wraith-sheet',4);
  this.cameras.main.setBackgroundColor('#648a6b');
  this.add.tileSprite(0,0,WORLD,WORLD,'forest').setOrigin(0).setDepth(-10000);
  this.obstacles=[];
  const sr=this.seed;
  for(let i=0;i<42;i++){
   const x=140+sr()*(WORLD-280),y=150+sr()*(WORLD-300);
   if(Math.hypot(x-MID,y-MID)<330)continue;
   const k=.76+sr()*.52;
   this.add.image(x,y+10,'tree').setOrigin(.5,1).setDisplaySize(170*k,164*k).setDepth(y+9);
   this.obstacles.push({x,y:y+4,r:22*k})
  }
  this.hero=makeActor(this,'hero-sheet',MID,MID,1.0);
  this.cameras.main.setBounds(0,0,WORLD,WORLD).startFollow(this.hero.body,true,.095,.095);
  this.cameras.main.setZoom(.90);
  this.slash=this.add.graphics().setDepth(99995);
  this.keys=this.input.keyboard?.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE')||null;
  this.input.keyboard?.on('keydown-SPACE',event=>event.preventDefault());
  this.input.on('pointerdown',p=>{
   if(!this.playing||this.joyId!==null)return;
   this.joyId=p.id;this.joyOrigin={x:p.x,y:p.y};
   ui.stick.style.left=(p.x-55)+'px';ui.stick.style.top=(p.y-55)+'px';
   ui.stick.style.display='block';this.moveStick(p)
  });
  this.input.on('pointermove',p=>{if(p.id===this.joyId)this.moveStick(p)});
  const release=p=>{if(p.id!==this.joyId)return;
   this.joyId=null;this.joyOrigin=null;this.joy.x=this.joy.y=0;
   ui.stick.style.display='none';ui.knob.style.transform='translate(0px,0px)'
  };
  this.input.on('pointerup',release);this.input.on('pointerupoutside',release);
  this.input.on('gameout',()=>{this.joyId=null;this.joyOrigin=null;this.joy.x=this.joy.y=0;ui.stick.style.display='none'});
  ui.attack.addEventListener('pointerdown',e=>{e.preventDefault();this.manualQueue=true});
  ui.attack.addEventListener('click',()=>{this.manualQueue=true});
  ui.slow.addEventListener('click',()=>{this.timeScale=this.timeScale===1?.5:1;ui.slow.textContent=this.timeScale===1?'1×':'½×'});
  ui.zoomin.addEventListener('click',()=>this.cameras.main.setZoom(clamp(this.cameras.main.zoom+.10,.65,1.20)));
  ui.zoomout.addEventListener('click',()=>this.cameras.main.setZoom(clamp(this.cameras.main.zoom-.10,.65,1.20)));
  ui.start.addEventListener('click',()=>this.start());
  for(let i=0;i<4;i++)this.spawn(i);
  metrics.actorCount=this.foes.length+1;metrics.ready=true;
  ui.version.textContent='Phaser '+P.VERSION+' · preview';
  ui.start.disabled=false;ui.status.textContent='Motor pronto. Arte antiga carregada; timing novo disponível.'
 }
 moveStick(p){
  if(!this.joyOrigin)return;
  const dx=p.x-this.joyOrigin.x,dy=p.y-this.joyOrigin.y,len=Math.hypot(dx,dy);
  const strength=clamp(len/45,0,1),n=unit(dx,dy);
  this.joy.x=n.x*strength;this.joy.y=n.y*strength;
  ui.knob.style.transform='translate('+(this.joy.x*38)+'px,'+(this.joy.y*38)+'px)'
 }
 start(){
  ui.menu.hidden=true;this.playing=true;metrics.playing=true;this.input.addPointer(2)
 }
 avoid(x,y,r){
  x=clamp(x,55,WORLD-55);y=clamp(y,65,WORLD-65);
  for(let pass=0;pass<2;pass++)for(const o of this.obstacles){
   const dx=x-o.x,dy=y-o.y,rx=o.r+r,ry=(o.r+r)*.66;
   const d=Math.hypot(dx/rx,dy/ry);
   if(d<1){
    const ax=d>1e-5?dx:1,ay=d>1e-5?dy:0;
    x+=ax*(1/Math.max(d,.001)-1);y+=ay*(1/Math.max(d,.001)-1)
   }
  }
  return{x:clamp(x,55,WORLD-55),y:clamp(y,65,WORLD-65)}
 }
 spawn(i=0){
  if(this.foes.length>=9)return;
  const angle=(i*2.39996)+this.seed()*.25,rad=235+this.seed()*58;
  const p=this.avoid(this.hero.x+Math.cos(angle)*rad,this.hero.y+Math.sin(angle)*rad,17);
  const type=i%2?'wraith-sheet':'beast-sheet';
  const actor=makeActor(this,type,p.x,p.y,type==='beast-sheet'?.84:.92);
  this.foes.push({...actor,speed:type==='beast-sheet'?72:60,hp:3,stun:0,atkT:0,atkCd:1+i*.25})
 }
 beginAttack(target,force){
  if(this.attack.active||this.cooldown>0)return false;
  if(!force&&!target)return false;
  let aim=target?Math.atan2(target.y-this.hero.y,target.x-this.hero.x):Math.atan2(this.vel.y,this.vel.x);
  if(!target&&Math.hypot(this.vel.x,this.vel.y)<7)aim=this.facing===-1?Math.PI:0;
  this.attack={active:true,t:0,duration:.48,aim,variant:-this.attack.variant,hit:false};
  this.cooldown=.11;metrics.swings++;return true
 }
 contact(){
  const sw=this.attack;
  if(sw.hit)return;sw.hit=true;metrics.contactEvents++;
  const reach=125,arc=.92;
  for(const foe of this.foes){
   if(!foe.alive||foe.dead)continue;
   const dx=foe.x-this.hero.x,dy=foe.y-this.hero.y,dist=Math.hypot(dx,dy);
   if(dist>reach+15||dist<4)continue;
   const aim=Math.atan2(dy,dx);
   const delta=Math.atan2(Math.sin(aim-sw.aim),Math.cos(aim-sw.aim));
   if(Math.abs(delta)>arc)continue;
   foe.hp--;foe.stun=.22;foe.hitT=.21;foe.atkT=0;
   // Knockback discreto e direcional, nunca tremedeira aleatória.
   foe.x+=dx/dist*9;foe.y+=dy/dist*9;locate(foe);
   metrics.hits++;ui.hits.textContent=metrics.hits;
   this.burst(foe.x,foe.y-30,foe.asset==='wraith-sheet'?0x9ae9da:0xffd49d);
   if(foe.hp<=0)this.kill(foe)
  }
 }
 burst(x,y,color){
  this.cameras.main.flash(36,252,235,195,false,()=>{});
  for(let i=0;i<7;i++){
   const a=i*TAU/7+this.seed()*.25,r=12+this.seed()*21;
   const obj=this.add.circle(x,y,1.6+this.seed()*2.2,i<2?0xffffff:color,.92).setDepth(y+50);
   this.tweens.add({targets:obj,x:x+Math.cos(a)*r,y:y-8+Math.sin(a)*r,
    alpha:0,scale:.3,duration:180+this.seed()*100,ease:'Quad.easeOut',onComplete:()=>obj.destroy()})
  }
 }
 kill(foe){
  if(foe.dead)return;foe.dead=true;foe.alive=false;
  this.tweens.add({targets:[foe.body,foe.shadow],alpha:0,duration:240,onComplete:()=>{
   foe.body.destroy();foe.shadow.destroy();
   this.foes=this.foes.filter(o=>o!==foe);
   this.time.delayedCall(1400,()=>{if(this.playing){this.spawn(Math.floor(this.seed()*99));metrics.actorCount=this.foes.length+1}})
  }})
 }
 updateHero(dt){
  const keys=this.keys;
  const x=this.joy.x+(keys?Number(keys.D.isDown||keys.RIGHT.isDown)-Number(keys.A.isDown||keys.LEFT.isDown):0);
  const y=this.joy.y+(keys?Number(keys.S.isDown||keys.DOWN.isDown)-Number(keys.W.isDown||keys.UP.isDown):0);
  const direction=unit(x,y),throttle=clamp(Math.hypot(x,y),0,1);
  const speed=this.attack.active?128:197,blend=1-Math.exp(-dt*13);
  this.vel.x=P.Math.Linear(this.vel.x,direction.x*speed*throttle,blend);
  this.vel.y=P.Math.Linear(this.vel.y,direction.y*speed*throttle,blend);
  const prevX=this.hero.x,prevY=this.hero.y;
  const next=this.avoid(prevX+this.vel.x*dt,prevY+this.vel.y*dt,17);
  this.hero.x=next.x;this.hero.y=next.y;locate(this.hero);
  const moved=Math.hypot(next.x-prevX,next.y-prevY),moving=moved>dt*18;
  // Passo atrelado à distância realmente percorrida: não patina parado junto a obstáculos.
  if(moving){this.moveClock+=moved*.145;
   if(Math.abs(this.vel.x)>18){this.facing=this.vel.x<0?-1:1}
  }
  this.hero.body.setFlipX(this.facing<0);
  if(this.attack.active){
   this.attack.t+=dt;
   const p=this.attack.t/this.attack.duration;
   if(p<.25){pose(this.hero,2);this.setState('PREPARAÇÃO')}
   else if(p<.73){pose(this.hero,3);this.setState('CORTE')}
   else{pose(this.hero,0);this.setState('RECUPERAÇÃO')}
   if(p>=.43&&!this.attack.hit)this.contact();
   if(p>=1){this.attack.active=false;this.attack.t=0}
  }else if(moving){pose(this.hero,Math.floor(this.moveClock/Math.PI)%2);this.setState('CORRIDA')}
  else{pose(this.hero,0);this.setState('GUARDA')}
  metrics.heroX=this.hero.x;metrics.heroY=this.hero.y;
  this.cooldown=Math.max(0,this.cooldown-dt);
  if(this.keys?.SPACE.isDown)this.manualQueue=true;
  if(this.manualQueue&&!this.attack.active&&this.cooldown<=0){
   const target=this.nearest(190);this.beginAttack(target,true);this.manualQueue=false
  }
 }
 nearest(radius){
  let best=null,dist=radius;
  for(const foe of this.foes){if(foe.dead)continue;
   const d=Math.hypot(foe.x-this.hero.x,foe.y-this.hero.y);
   if(d<dist){best=foe;dist=d}
  }
  return best
 }
 setState(s){if(this.lastState!==s){this.lastState=s;metrics.state=s;ui.state.textContent=s}}
 drawSlash(){
  const g=this.slash;g.clear();
  if(!this.attack.active)return;
  const sw=this.attack,p=sw.t/sw.duration;
  if(p<.24||p>.79)return;
  const v=clamp((p-.24)/.48,0,1),fade=clamp((.79-p)/.16,0,1);
  const a=sw.aim+sw.variant*(-.74+v*1.48),end=a-sw.variant*.39;
  const cx=this.hero.x+Math.cos(sw.aim)*29,cy=this.hero.y-30+Math.sin(sw.aim)*17;
  const low=Math.min(a,end),high=Math.max(a,end);
  g.lineStyle(15,0x68c8db,.12*fade);g.beginPath();g.arc(cx,cy,69,low,high);g.strokePath();
  g.lineStyle(8,0x98e4f3,.28*fade);g.beginPath();g.arc(cx,cy,65,low,high);g.strokePath();
  g.lineStyle(2.8,0xfff5d6,.92*fade);g.beginPath();g.arc(cx,cy,63,low,high);g.strokePath();
  g.fillStyle(0xfff7e0,.55*fade);g.fillCircle(cx+Math.cos(a)*63,cy+Math.sin(a)*63,2.6)
 }
 updateFoes(dt){
  for(const foe of this.foes){
   if(foe.dead)continue;
   foe.stun=Math.max(0,foe.stun-dt);foe.hitT=Math.max(0,foe.hitT-dt);
   foe.atkCd=Math.max(0,foe.atkCd-dt);
   if(foe.hitT>0){pose(foe,3);foe.body.setTint(0xffe6c3)}
   else{
    foe.body.clearTint();
    const dx=this.hero.x-foe.x,dy=this.hero.y-foe.y,d=Math.hypot(dx,dy)||1;
    const walk=foe.stun<=0&&d>90;
    if(walk){
     const oldX=foe.x,oldY=foe.y,s=foe.speed*dt;
     const pos=this.avoid(foe.x+dx/d*s,foe.y+dy/d*s,15);
     foe.x=pos.x;foe.y=pos.y;
     foe.travel+=Math.hypot(pos.x-oldX,pos.y-oldY)*.14;
     if(foe.asset==='beast-sheet')pose(foe,Math.floor(foe.travel/Math.PI)%2);
     else pose(foe,0); // O espectro paira; não simular passada humana nele.
    }else if(foe.atkCd<=0&&d<109){
     foe.atkT=.40;foe.atkCd=1.15+this.seed()*.45
    }else{
     if(foe.atkT>0){foe.atkT=Math.max(0,foe.atkT-dt);pose(foe,2)}
     else pose(foe,0)
    }
    // Para o ataque: não sobrepor os ciclos da corrida e do golpe.
    if(foe.atkT>0){foe.atkT=Math.max(0,foe.atkT-dt);pose(foe,2)}
    foe.body.setFlipX(dx<0)
   }
   locate(foe)
  }
 }
 update(time,ms){
  if(!this.playing)return;
  const dt=clamp(ms/1000,0,.044)*this.timeScale;
  this.elapsed+=dt;this.updateHero(dt);this.updateFoes(dt);this.drawSlash();
  metrics.actorCount=this.foes.length+1
 }
}
try{
 new P.Game({type:P.AUTO,parent:'stage',backgroundColor:'#648a6b',
  scale:{mode:P.Scale.RESIZE,autoCenter:P.Scale.CENTER_BOTH,width:root.innerWidth,height:root.innerHeight},
  antialias:true,pixelArt:false,render:{pixelArt:false,antialias:true},
  input:{activePointers:3},scene:[Studio]})
}catch(error){fail(error)}
})(window);
