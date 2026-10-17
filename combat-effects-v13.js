/* Projeto Ascensão 0.13: efeitos de espada orientados pela direção e pela evolução. */
(function(root){
'use strict';
const fx=root.AscensionCombatFX;if(!fx)return;
const TAU=Math.PI*2,PI=Math.PI;
const sparks=[];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ease=v=>{v=clamp(v,0,1);return v*v*(3-2*v)};
const palettes={
 basic:['#fff9e8','#a9dbed','#417c9e','#70c4dc'],
 fire:['#fff8dc','#ffb44e','#e64f35','#f36a2d'],
 ice:['#f5ffff','#94efff','#5189f4','#64c9ff'],
 lightning:['#ffffff','#debbff','#777bef','#a18cff']
};
function element(g){
 let k='basic',n=0;
 for(const e of ['fire','ice','lightning']){if((g?.[e]||0)>n){k=e;n=g[e]}}
 return k
}
function arc(c,r,a,b,w,color,alpha){c.globalAlpha=alpha;c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.arc(0,0,r,a,b,false);c.stroke()}
function slash(c,sw,p,g){
 const u=clamp(sw.time/sw.duration,0,1);if(u<.12||u>.93)return;
 const k=ease((u-.12)/.68),fade=ease((.93-u)/.23)*ease((u-.12)/.15);
 const stage=clamp(Math.floor((g?.blade||1)/3+(g?.area||0)/3),0,3);
 const type=element(g),col=palettes[type],dir=sw.direction||1,wide=sw.spread||1.25;
 const sweep=dir*(-wide*.5+wide*k),tail=sweep-dir*(.18+.22*k),a=Math.min(tail,sweep),b=Math.max(tail,sweep);
 const radius=clamp(sw.radius*.69,42,104),dist=18+sw.radius*.30;
 const ox=p.x+Math.cos(sw.aim)*dist,oy=p.y-26+Math.sin(sw.aim)*dist*.72;
 c.save();c.translate(ox,oy);c.rotate(sw.aim);c.lineCap='round';c.lineJoin='round';
 c.shadowColor=col[3];c.shadowBlur=14+stage*4;
 arc(c,radius+2,a,b,12+stage*3,col[3],fade*(.18+stage*.035));
 c.shadowBlur=6+stage*2;arc(c,radius,a,b,6+stage*.8,col[1],fade*.75);
 c.shadowBlur=2;arc(c,radius-1,a,b,2.2+stage*.35,col[0],fade*.97);
 c.shadowBlur=0;if(stage)arc(c,radius+7,a+Math.min(.09,(b-a)*.23),b,1.4+stage*.3,col[2],fade*.49);
 const tx=Math.cos(sweep)*radius,ty=Math.sin(sweep)*radius;c.globalAlpha=fade;c.fillStyle=col[0];
 c.beginPath();c.ellipse(tx,ty,3.6+stage,2.4,sweep,0,TAU);c.fill();
 const count=clamp(4+stage*3,4,14);
 if(type==='fire'){
  for(let i=0;i<count;i++){
   const v=(i+.37)/count,t=a+(b-a)*v,r=radius+(i%3)*4;
   c.globalAlpha=fade*(.3+.25*Math.sin(v*PI));c.fillStyle=i%3===0?'#fff1b0':col[2];
   c.beginPath();c.ellipse(Math.cos(t)*r,Math.sin(t)*r-4-(i%4)*2,1.4+(i%2),3.2+(i%3),.3,0,TAU);c.fill()
  }
 }else if(type==='ice'){
  for(let i=0;i<count;i++){
   const t=a+(b-a)*(i+.3)/count,r=radius+3+(i%3)*2,x=Math.cos(t)*r,y=Math.sin(t)*r;
   c.globalAlpha=fade*.65;c.fillStyle=i%2?'#a2e9ff':'#f1ffff';
   c.beginPath();c.moveTo(x,y-4);c.lineTo(x+2.5,y);c.lineTo(x,y+5);c.lineTo(x-2.5,y);c.closePath();c.fill()
  }
 }else if(type==='lightning'){
  c.strokeStyle='#f2e1ff';c.lineWidth=1.3;c.globalAlpha=fade*.82;c.beginPath();
  for(let i=0;i<count;i++){
   const t=a+(b-a)*(i+.35)/count,r=radius+(i%2?10:-3),x=Math.cos(t)*r,y=Math.sin(t)*r;
   if(i===0)c.moveTo(x,y);else c.lineTo(x,y)
  }c.stroke()
 }
 if((g?.fire||0)>0&&(g?.lightning||0)>0&&type!=='lightning'){
  c.strokeStyle='#dec9ff';c.lineWidth=1.1;c.globalAlpha=fade*.53;c.beginPath();
  c.arc(0,0,radius+12,a+.04,b-.03);c.stroke()
 }
 c.restore()
}
fx.slash=slash;
function hit(x,y,g,time,crit=false){
 sparks.push({x,y,start:time,life:crit?.29:.23,type:element(g),crit});
 if(sparks.length>45)sparks.splice(0,sparks.length-45)
}
function drawHits(c,time){
 for(let i=sparks.length-1;i>=0;i--){
  const s=sparks[i],v=(time-s.start)/s.life;
  if(v>1){sparks.splice(i,1);continue}
  if(v<0)continue;
  const r=7+18*ease(v),alpha=(1-v)*.77,col=palettes[s.type];
  c.save();c.translate(s.x,s.y);c.globalAlpha=alpha;c.lineCap='round';
  c.strokeStyle=col[1];c.lineWidth=2.7;c.beginPath();c.arc(0,0,r,0,TAU);c.stroke();
  c.strokeStyle=col[0];c.lineWidth=1.3;const count=s.crit?10:6;
  for(let j=0;j<count;j++){
   const angle=(j/count)*TAU+.21,d=r*(.5+(j%3)*.15);
   c.beginPath();c.moveTo(Math.cos(angle)*d*.35,Math.sin(angle)*d*.35);
   c.lineTo(Math.cos(angle)*d,Math.sin(angle)*d);c.stroke()
  }
  if(s.type==='lightning'){
   c.strokeStyle='#eedbff';c.beginPath();c.moveTo(-r,-r*.3);c.lineTo(-r*.4,r*.1);
   c.lineTo(0,-r*.17);c.lineTo(r*.4,r*.3);c.lineTo(r,-r*.2);c.stroke()
  }else if(s.type==='ice'){
   for(let k=0;k<4;k++){
    const a=k*TAU/4+.17;c.strokeStyle='#d9ffff';c.beginPath();
    c.moveTo(Math.cos(a)*r*.45,Math.sin(a)*r*.45);
    c.lineTo(Math.cos(a)*r*1.15,Math.sin(a)*r*1.15);c.stroke()
   }
  }
  c.restore()
 }
}
root.AscensionVFX13={hit,drawHits,stats:()=>({active:sparks.length,flavors:Object.keys(palettes),slashOverridden:fx.slash===slash})};
})(window);