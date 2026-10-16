/* Projeto Ascensão — laboratório Phaser 3.90.0.
   Prova de integração isolada, NÃO uma versão artística pronta.
   Reusa os PNG/AVIF da floresta e personagens existentes.
 */
(function () {
  'use strict';
  const WORLD=2900, C=1450, TAU=Math.PI*2;
  let game=null,activeScene=null;
  const bridge={engine:'Phaser',version:()=>window.Phaser?.VERSION||null,ready:false,playing:false,errors:[],stats:()=>activeScene?.debug()||null};
  window.AscensionPhaser=bridge;
  function num(n,min,max){return Math.max(min,Math.min(max,n))}
  function seeded(seed){return function(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
  function unit(x,y){const n=Math.hypot(x,y);return n>0?{x:x/n,y:y/n}:{x:0,y:0}}
  const ui={
    menu:document.getElementById('menu'),start:document.getElementById('start'),status:document.getElementById('status'),
    version:document.getElementById('engine'),hud:document.getElementById('hud'),kills:document.getElementById('kills'),
    time:document.getElementById('time'),stick:document.getElementById('stick'),knob:document.getElementById('knob'),
    zoomIn:document.getElementById('zoom-in'),zoomOut:document.getElementById('zoom-out')
  };
  function fail(err) {
    const txt=String(err?.message||err||'Erro desconhecido');
    bridge.errors.push(txt);ui.status.textContent='Falha ao carregar a prévia: '+txt;ui.menu.hidden=false;
    console.error('[Phaser Ascensão]',err)
  }
  window.addEventListener('error',e=>{if(!e.message?.includes('ResizeObserver'))bridge.errors.push(String(e.message))});
  if(!window.Phaser){fail('Phaser não foi carregado. Verifique a internet.');return}
  const Phaser=window.Phaser;
  class Grove extends Phaser.Scene {
    constructor(){super('Grove');this.tick=0;this.kills=0;this.elapsed=0;this.playing=false;this.treeTrunks=[];this.foes=[];this.windLeaves=[];this.pointerId=null;this.joy={x:0,y:0};this.stickOrigin=null;this.attackClock=0;this.startedAt=0;this._seed=seeded(302416)}
    preload(){
      if(!window.AscensionIllustrationData?.hero||!window.AscensionForestTextureData||!window.AscensionTreeData)throw Error('Arquivos ilustrados ausentes');
      this.load.spritesheet('hero',window.AscensionIllustrationData.hero,{frameWidth:128,frameHeight:117});
      this.load.spritesheet('beast',window.AscensionIllustrationData.beast,{frameWidth:128,frameHeight:117});
      this.load.spritesheet('wraith',window.AscensionIllustrationData.wraith,{frameWidth:128,frameHeight:117});
      this.load.image('forest',window.AscensionForestTextureData);
      this.load.image('tree',window.AscensionTreeData)
    }
    create(){
      activeScene=this;bridge.ready=true;ui.status.textContent='Motor Phaser '+Phaser.VERSION+' carregado — pronto para experimentar.';
      ui.version.textContent='PHASER '+Phaser.VERSION;ui.start.disabled=false;
      this.cameras.main.setBackgroundColor('#77966b');
      this.floor=this.add.tileSprite(0,0,WORLD,WORLD,'forest').setOrigin(0).setDepth(-100000);
      this.floor.tileScaleX=1;this.floor.tileScaleY=1;
      // Pequenas sombras mantêm contato entre os assets e o chão.
      const sr=this._seed;
      for(let i=0;i<39;i++){
        let x=180+sr()*(WORLD-360),y=180+sr()*(WORLD-360);
        if(Math.hypot(x-C,y-C)<245)continue;
        let scale=.83+sr()*.33;
        const sh=this.add.ellipse(x+8,y+14,64*scale,19*scale,0x143d2a,.23).setDepth(y-8);
        const tree=this.add.image(x,y+11,'tree').setOrigin(.5,1).setDisplaySize(174*scale,166*scale).setDepth(y+11);
        this.tweens.add({targets:tree,angle:{from:-.5,to:.5},duration:2300+sr()*2100,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
        this.treeTrunks.push({x,y:y+5,rx:27*scale,ry:18*scale});
      }
      this.heroShadow=this.add.ellipse(C,C+12,38,11,0x173a29,.51).setDepth(C-2);
      this.hero=this.add.sprite(C,C,'hero',0).setDisplaySize(105,97).setOrigin(.5,.92).setDepth(C);
      this.hero.x=C;this.hero.y=C;
      this.heroVX=0;this.heroVY=0;
      this.cameras.main.startFollow(this.hero,true,.095,.095);
      this.cameras.main.setBounds(0,0,WORLD,WORLD);
      this.cameras.main.setZoom(.89);
      this.cameras.main.roundPixels=false;
      for(let i=0;i<11;i++)this.spawnEnemy();
      this.input.on('pointerdown',pointer=>{
        if(!this.playing||this.pointerId!==null)return;
        this.pointerId=pointer.id;this.stickOrigin={x:pointer.x,y:pointer.y};
        ui.stick.style.display='block';ui.stick.style.left=(pointer.x-56)+'px';ui.stick.style.top=(pointer.y-56)+'px';
        this.setJoystick(pointer)
      });
      this.input.on('pointermove',pointer=>{if(pointer.id===this.pointerId&&this.stickOrigin)this.setJoystick(pointer)});
      const stop=pointer=>{if(pointer.id===this.pointerId){this.pointerId=null;this.stickOrigin=null;this.joy.x=0;this.joy.y=0;ui.stick.style.display='none';ui.knob.style.transform='translate(0,0)'}};
      this.input.on('pointerup',stop);this.input.on('pointerupoutside',stop);
      this.keys=this.input.keyboard?.addKeys?.('W,A,S,D,UP,DOWN,LEFT,RIGHT')||null;
      ui.zoomIn.addEventListener('click',()=>this.cameras.main.setZoom(num(this.cameras.main.zoom+.10,.68,1.18)));
      ui.zoomOut.addEventListener('click',()=>this.cameras.main.setZoom(num(this.cameras.main.zoom-.10,.68,1.18)));
      ui.start.addEventListener('click',()=>this.startGame());
      // Folhas estão fixas no espaço do mundo: passam pela tela quando a câmera acompanha o herói.
      for(let i=0;i<70;i++){
        const x=sr()*WORLD,y=sr()*WORLD;
        let leaf=this.add.ellipse(x,y,6+sr()*3,2.3+sr()*2,0xe9d29b,.46).setDepth(y+1);
        leaf.setRotation(sr()*TAU);
        this.windLeaves.push({obj:leaf,px:x,py:y,speed:8+sr()*14,phase:sr()*TAU})
      }
      this.slashes=this.add.graphics().setDepth(100000);
      this.scale.on('resize',()=>this.cameras.main.centerOn(this.hero.x,this.hero.y));
    }
    startGame(){
      ui.menu.hidden=true;ui.hud.hidden=false;this.startedAt=this.time.now;this.playing=true;bridge.playing=true;
      this.input.addPointer(2)
    }
    setJoystick(pointer){
      const dx=pointer.x-this.stickOrigin.x,dy=pointer.y-this.stickOrigin.y,r=Math.hypot(dx,dy);
      const v=Math.min(1,r/48);
      this.joy.x=r>0?dx/r*v:0;this.joy.y=r>0?dy/r*v:0;
      ui.knob.style.transform='translate('+(this.joy.x*40)+'px,'+(this.joy.y*40)+'px)'
    }
    collide(x,y,rad){
      x=num(x,55,WORLD-55);y=num(y,65,WORLD-65);
      for(const t of this.treeTrunks){
        let dx=x-t.x,dy=y-t.y,rx=t.rx+rad,ry=t.ry+rad*.65;
        let distance=Math.hypot(dx/rx,dy/ry);
        if(distance<1){
          if(distance<.0001){dx=1;dy=0;distance=.0001}
          x+=dx*(1/distance-1);y+=dy*(1/distance-1);
        }
      }
      return{x,y}
    }
    spawnEnemy(){
      const a=this._seed()*TAU,d=310+this._seed()*460;
      const x=num(this.hero.x+Math.cos(a)*d,90,WORLD-90),y=num(this.hero.y+Math.sin(a)*d,90,WORLD-90);
      const beast=this._seed()>.44;
      const shadow=this.add.ellipse(x,y+8,beast?39:30,beast?12:10,0x193b2b,.34).setDepth(y-1);
      const sprite=this.add.sprite(x,y,beast?'beast':'wraith',0).setOrigin(.5,.90).setDisplaySize(beast?89:80,beast?74:79).setDepth(y);
      this.foes.push({sprite,shadow,x,y,speed:beast?71:58,hp:3,kind:beast?'beast':'wraith',attack:0,hitFlash:0})
    }
    melee(target){
      const dx=target.x-this.hero.x,dy=target.y-this.hero.y,dist=Math.hypot(dx,dy);
      if(dist>160)return;
      this.slashes.clear();
      const theta=Math.atan2(dy,dx),cx=this.hero.x+Math.cos(theta)*39,cy=this.hero.y-23+Math.sin(theta)*32;
      // O efeito é um VFX técnico; a direção de arte será reconstruída com sprites profissionais.
      this.slashes.lineStyle(7,0xf8f3df,.8);
      this.slashes.beginPath();this.slashes.arc(cx,cy,70,theta-.65,theta+.65,false);this.slashes.strokePath();
      this.slashes.lineStyle(15,0x8bd9f1,.19);
      this.slashes.beginPath();this.slashes.arc(cx,cy,75,theta-.65,theta+.65,false);this.slashes.strokePath();
      this.tweens.add({targets:this.slashes,alpha:{from:1,to:0},duration:170,onComplete:()=>{this.slashes.clear();this.slashes.setAlpha(1)}});
      for(const foe of this.foes){
        let vx=foe.x-this.hero.x,vy=foe.y-this.hero.y,delta=Math.atan2(vy,vx)-theta;
        delta=Math.atan2(Math.sin(delta),Math.cos(delta));
        if(Math.hypot(vx,vy)>171||Math.abs(delta)>.95)continue;
        foe.hp--;foe.hitFlash=.2;
        if(foe.hp<=0){foe.sprite.destroy();foe.shadow.destroy();this.kills++;ui.kills.textContent=this.kills}
      }
      this.foes=this.foes.filter(f=>f.hp>0)
    }
    update(time,dt0){
      let dt=Math.min(.045,dt0/1000);this.tick+=dt;
      if(!this.playing)return;
      this.elapsed+=dt;
      const curs=this.keys;
      // Keyboard support is optional; on iPhone the floating joystick is the primary control.
      const inputX=this.joy.x+(curs?(curs.D.isDown||curs.RIGHT.isDown?1:0)-(curs.A.isDown||curs.LEFT.isDown?1:0):0);
      const inputY=this.joy.y+(curs?(curs.S.isDown||curs.DOWN.isDown?1:0)-(curs.W.isDown||curs.UP.isDown?1:0):0);
      const move=unit(inputX,inputY),power=num(Math.hypot(inputX,inputY),0,1);
      const lerp=1-Math.exp(-dt*15);
      this.heroVX=Phaser.Math.Linear(this.heroVX,move.x*195*power,lerp);
      this.heroVY=Phaser.Math.Linear(this.heroVY,move.y*195*power,lerp);
      const p=this.collide(this.hero.x+this.heroVX*dt,this.hero.y+this.heroVY*dt,18);
      this.hero.x=p.x;this.hero.y=p.y;this.hero.setDepth(p.y);
      this.heroShadow.setPosition(p.x,p.y+13).setDepth(p.y-4);
      if(Math.abs(this.heroVX)>12)this.hero.setFlipX(this.heroVX<0);
      // Enquanto não existirem sprites direcionais profissionais, não deformamos a arte original.
      this.attackClock-=dt;
      for(const foe of this.foes){
        const dx=this.hero.x-foe.x,dy=this.hero.y-foe.y,dist=Math.hypot(dx,dy)||1;
        if(dist>46){const next=this.collide(foe.x+dx/dist*foe.speed*dt,foe.y+dy/dist*foe.speed*dt,17);foe.x=next.x;foe.y=next.y}
        foe.sprite.setPosition(foe.x,foe.y).setDepth(foe.y).setFlipX(dx<0);
        foe.shadow.setPosition(foe.x,foe.y+10).setDepth(foe.y-3);
        foe.hitFlash=Math.max(0,foe.hitFlash-dt);
        foe.sprite.setTint(foe.hitFlash>0?0xffdbbf:0xffffff);
      }
      if(this.attackClock<=0){
        const nearest=this.foes.filter(f=>Math.hypot(f.x-this.hero.x,f.y-this.hero.y)<160)
          .sort((a,b)=>Phaser.Math.Distance.Between(a.x,a.y,this.hero.x,this.hero.y)-Phaser.Math.Distance.Between(b.x,b.y,this.hero.x,this.hero.y))[0];
        if(nearest){this.attackClock=.62;this.melee(nearest)}
      }
      if(this.foes.length<12&&this.kills<90&&this._seed()<dt*1.8)this.spawnEnemy();
      for(const leaf of this.windLeaves){
        leaf.px+=leaf.speed*dt;leaf.py+=Math.sin(this.tick*.7+leaf.phase)*dt*.9;
        if(leaf.px>WORLD)leaf.px=0;
        leaf.obj.setPosition(leaf.px,leaf.py);
      }
      ui.time.textContent=Math.floor(this.elapsed)+'s';
    }
    debug(){
      return {phaser:Phaser.VERSION,ready:bridge.ready,playing:this.playing,time:this.elapsed,kills:this.kills,
        hero:{x:this.hero.x,y:this.hero.y},foes:this.foes.length,trees:this.treeTrunks.length,
        zoom:this.cameras.main.zoom,webgl:this.game.renderer.type===Phaser.WEBGL,issues:bridge.errors};
    }
  }
  try{
    game=new Phaser.Game({type:Phaser.AUTO,parent:'stage',backgroundColor:'#658b65',
      scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH,width:window.innerWidth,height:window.innerHeight},
      antialias:true,pixelArt:false,render:{pixelArt:false,antialias:true},
      input:{activePointers:2},scene:[Grove]});
  }catch(e){fail(e)}
})();