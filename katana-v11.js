/* Projeto Ascensão 0.11 — Crescentes de katana originais inspirados em leitura de trajetória, não em assets de terceiros. */
(function(root){
'use strict';
const PI=Math.PI,TAU=PI*2;
const styles=[
 {core:'#fbffff',mid:'#7ae5f7',edge:'#2f84cd',halo:'#5ac8ec'},
 {core:'#fff9da',mid:'#f2cf83',edge:'#a77842',halo:'#eec06a'},
 {core:'#fff1ee',mid:'#ff868a',edge:'#ac284f',halo:'#e95574'}
];
function stage(blade=1,area=0,multi=0){
 if(blade>=6||area>=6||multi>=5)return 2;
 if(blade>=3||area>=2||multi>=2)return 1;
 return 0
}
function waveConfig(blade=1,area=0,multi=0){
 const evolution=stage(blade,area,multi);
 return {evolution,range:115+area*49+blade*12,speed:275+area*14+evolution*24,
 height:44+area*7+evolution*12,width:26+area*4+evolution*3,
 damage:(13+blade*4)*(evolution===2?1.25:1),pierce:3+Math.floor(area/2)+evolution*2}
}
function drawCrescent(ctx,wave,worldTime){
 const age=wave.distance/(wave.maxDistance||1),alive=Math.max(0,Math.min(1,(1-age)*6));
 if(alive<=0)return;
 const colors=styles[wave.evolution||0],size=wave.height,wide=wave.width;
 const corePath=()=>{
  ctx.beginPath();
  ctx.moveTo(-wide*.59,-size*.59);
  ctx.bezierCurveTo(wide*.48,-size*.57,wide*.92,-size*.23,wide,0);
  ctx.bezierCurveTo(wide*.92,size*.23,wide*.48,size*.57,-wide*.59,size*.59);
  ctx.bezierCurveTo(wide*.10,size*.36,wide*.26,size*.13,wide*.24,0);
  ctx.bezierCurveTo(wide*.26,-size*.13,wide*.10,-size*.36,-wide*.59,-size*.59);
  ctx.closePath()
 };
 ctx.save();ctx.translate(wave.x,wave.y-17);ctx.rotate(wave.aim);
 const pulse=1+Math.sin(worldTime*10+wave.phase)*.045;
 ctx.scale(pulse,pulse);
 // Ghost trail uses the same silhouette as the main wave.
 for(let i=3;i>=1;i--){
  ctx.save();ctx.translate(-9*i,0);ctx.globalAlpha=alive*.055*i;ctx.fillStyle=colors.halo;
  corePath();ctx.fill();ctx.restore()
 }
 ctx.globalAlpha=alive*.25;ctx.shadowColor=colors.halo;ctx.shadowBlur=18;
 ctx.fillStyle=colors.halo;corePath();ctx.fill();
 ctx.shadowBlur=7;ctx.globalAlpha=alive;
 const g=ctx.createLinearGradient(-wide,-size*.3,wide,size*.20);
 g.addColorStop(0,colors.edge);g.addColorStop(.50,colors.mid);g.addColorStop(1,colors.core);
 ctx.fillStyle=g;corePath();ctx.fill();
 ctx.strokeStyle=colors.core;ctx.lineWidth=1.7;ctx.globalAlpha=alive*.76;ctx.stroke();
 ctx.restore()
}
function hitTest(w,e,oldX=w.x,oldY=w.y){
 const dx=e.x-w.x,dy=e.y-w.y;
 const along=dx*Math.cos(w.aim)+dy*Math.sin(w.aim);
 const cross=-dx*Math.sin(w.aim)+dy*Math.cos(w.aim);
 const radius=(e.r||16)*.55;
 // Lag-tolerant swept wave collision: crossing path between frames counts.
 const segmentLength=Math.hypot(w.x-oldX,w.y-oldY);
 return along>=-w.width*.7-segmentLength-radius&&along<=w.width+radius&&Math.abs(cross)<w.height*.52+radius
}
root.AscensionKatana={stage,waveConfig,drawCrescent,hitTest,
 stats:()=>({travelingCrescents:true,threeVisualEvolutions:true,multiDirection:true,worldSpace:true})};
})(window);