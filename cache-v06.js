/* Ascensão 0.6: animação real por quadros cacheados, otimizada para iPhone Safari */
(function(root){
'use strict';
const motion=root.AscensionMotion,forest=root.AscensionForest;
if(!motion||!forest)throw Error('Camadas de arte não carregadas');
const origHero=motion.hero,origEnemy=motion.drawEnemy,origProp=forest.prop;
const characters=new Map(),nature=new Map(),TAU=Math.PI*2;
function mkCanvas(w,h,render){const SS=1.75;let c=document.createElement('canvas');c.width=Math.ceil(w*SS);c.height=Math.ceil(h*SS);let ctx=c.getContext('2d');ctx.scale(SS,SS);render(ctx);return c}
function wrapPhase(x){return ((x%TAU)+TAU)%TAU}
function getChar(key,w,h,draw){let value=characters.get(key);if(value)return value;value=mkCanvas(w,h,draw);characters.set(key,value);return value}
function paintHero(ctx,p,t,game){
 const attack=p.attackPulse>0,walk=p.motion>.12;
 const state=attack?'attack':walk?'walk':'idle';
 const phases=attack?12:walk?12:6;
 const frame=attack?Math.min(phases-1,Math.floor((1-Math.min(1,p.attackPulse/.32))*phases)):
   Math.floor(wrapPhase(walk?p.move:t*1.3)/TAU*phases);
 const traits=(game?.fire>0?'f':'_')+(game?.ice>0?'i':'_')+(game?.lightning>0?'l':'_');
 const key='h:'+state+':'+frame+':'+traits;
 const image=getChar(key,220,250,c=>{
  const cp={x:0,y:0,face:1,move:walk?frame/phases*TAU:0,motion:walk?1:0,
    attackPulse:attack?(1-(frame+.4)/phases)*.32:0,hurt:0};
  c.translate(110,145);origHero(c,cp,frame/phases*TAU+(state==='idle'?frame:0),game);
 });
 ctx.save();ctx.translate(p.x,p.y);ctx.scale(p.face===-1?-1:1,1);
 ctx.drawImage(image,-110,-145,220,250);
 if(p.hurt>0){ctx.globalAlpha=.16+Math.abs(Math.sin(t*29))*.13;ctx.fillStyle='#ffb6bc';ctx.beginPath();ctx.ellipse(0,-19,23,35,0,0,TAU);ctx.fill()}
 ctx.restore();
}
function paintEnemy(ctx,e,t){
 const kind=e.kind||'wraith',boss=kind==='boss';
 const n=boss?12:kind==='hound'?12:10;
 const frame=Math.floor(wrapPhase(e.phase)/TAU*n);
 const attacking=(e.attackT||0)>.05;
 const key='e:'+kind+':'+frame+':'+(attacking?1:0);
 const w=boss?280:176,h=boss?330:190,centerX=w/2,centerY=boss?185:110;
 const image=getChar(key,w,h,c=>{
  c.translate(centerX,centerY);
  const r=kind==='boss'?39:kind==='hound'?16:kind==='sentinel'?23:18;
  origEnemy.call(motion,c,{x:0,y:0,face:1,kind,r,phase:frame/n*TAU,hp:100,maxHp:100,attackT:attacking?.22:0,flash:0,burn:0,slow:0},frame/n*TAU);
 });
 ctx.save();ctx.translate(e.x,e.y);ctx.scale(e.face===-1?-1:1,1);
 // show weight shifts and recoil even between keyframes
 if(e.flash>0)ctx.translate(2.2,0);
 if(kind==='hound')ctx.translate(0,Math.sin(e.phase*2)*.7);
 else if(kind==='wraith')ctx.translate(0,Math.sin(e.phase*.83)*1.2);
 ctx.drawImage(image,-centerX,-centerY,w,h);
 if(e.flash>0){ctx.globalAlpha=Math.min(.5,e.flash*3);ctx.fillStyle='#fff8d6';ctx.beginPath();ctx.ellipse(0,-10,boss?36:16,boss?55:24,0,0,TAU);ctx.fill()}
 if(e.burn>0){ctx.globalAlpha=.32+.15*Math.sin(t*12);ctx.fillStyle='#ffa044';ctx.beginPath();ctx.ellipse(0,-10,boss?45:21,boss?63:30,0,0,TAU);ctx.fill()}
 if(e.slow>0){ctx.globalAlpha=.53;ctx.strokeStyle='#9cf6ff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-3,boss?46:23,boss?55:28,0,0,TAU);ctx.stroke()}
 ctx.restore();
}
function paintProp(ctx,o,t){
 const type=o.type||'fern',varBucket=Math.max(0,Math.min(7,Math.floor((o.variant||.2)*8)));
 const key=type+':'+varBucket;
 let image=nature.get(key);
 const isTree=type==='tree',width=isTree?260:150,height=isTree?290:160;
 const ax=width/2,ay=isTree?228:94;
 if(!image){image=mkCanvas(width,height,c=>{
    c.translate(ax,ay);
    origProp(c,{x:0,y:0,rot:0,s:1,type,variant:(varBucket+.5)/8},0);
   });nature.set(key,image)}
 ctx.save();ctx.translate(o.x,o.y);
 if(isTree||type==='flower'||type==='fern'||type==='brush')ctx.rotate(Math.sin(t*1.3+o.x*.017+o.y*.02)*.015);
 ctx.rotate(o.rot||0);ctx.scale(o.s||1,o.s||1);
 ctx.drawImage(image,-ax,-ay,width,height);ctx.restore();
}
motion.hero=paintHero;motion.drawEnemy=paintEnemy;forest.prop=paintProp;
root.AscensionCache={stats:()=>({characterFrames:characters.size,natureFrames:nature.size}),prewarm:()=>{}};
})(window);
