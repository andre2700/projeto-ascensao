/* Projeto Ascensão 0.9 — VFX de espada e moedas de essência, baixo custo no iPhone */
(function(root){
'use strict';
const TAU=Math.PI*2,coin=document.createElement('canvas'),c=coin.getContext('2d');
coin.width=coin.height=92;
function ring(x,y,r,color,width){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.arc(x,y,r,0,TAU);c.stroke()}
function circle(x,y,r,fill){c.fillStyle=fill;c.beginPath();c.arc(x,y,r,0,TAU);c.fill()}
const outer=c.createRadialGradient(33,24,4,48,46,43);outer.addColorStop(0,'#fffae2');outer.addColorStop(.3,'#f8d57a');outer.addColorStop(.72,'#bd802e');outer.addColorStop(1,'#6f461d');
c.shadowBlur=9;c.shadowColor='#4a371851';circle(46,46,34,outer);c.shadowBlur=0;
ring(46,46,31,'#ffe4a0',2.6);ring(46,46,25,'#6a47278c',2);
const inner=c.createLinearGradient(22,20,68,71);inner.addColorStop(0,'#ffe5a5');inner.addColorStop(.55,'#d5a54e');inner.addColorStop(1,'#916128');
circle(46,46,22,inner);
c.fillStyle='#ffefbd';c.beginPath();c.moveTo(46,24);c.lineTo(52,42);c.lineTo(68,46);c.lineTo(52,50);c.lineTo(46,67);c.lineTo(40,50);c.lineTo(25,46);c.lineTo(40,42);c.closePath();c.fill();
c.fillStyle='#b17731';c.beginPath();c.moveTo(46,33);c.lineTo(50,45);c.lineTo(46,58);c.lineTo(42,45);c.closePath();c.fill();
for(let i=0;i<8;i++){let a=i*TAU/8,x=46+Math.cos(a)*28,y=46+Math.sin(a)*28;circle(x,y,1.8,'#fff0bb')}
const caches={coin};
function loot(ctx,o,t){
 const phase=o.phase||0,pulse=Math.sin(phase)*.09,scale=o.value>=4?1.25:o.value>1?1.05:.83;
 ctx.save();ctx.translate(o.x,o.y);
 ctx.fillStyle='#143b2660';ctx.beginPath();ctx.ellipse(0,7,10*scale,3.4*scale,0,0,TAU);ctx.fill();
 let y=-2+Math.sin(phase*.7)*2;
 ctx.translate(0,y);ctx.scale(scale,scale);
 ctx.shadowBlur=10;ctx.shadowColor='#ffd97488';
 // leve giro: a moeda tem volume, sem ficar invisível de lado.
 ctx.scale(.79+Math.abs(Math.cos(phase*.28))*.21,1+pulse);
 ctx.drawImage(coin,-18,-18,36,36);
 ctx.shadowBlur=0;ctx.restore()
}
function slash(ctx,sw,p,g){
 const phase=sw.time/sw.duration;
 if(phase<.17)return;
 const swing=(phase-.17)/.83,life=1-Math.max(0,swing-.18)/.82;
 const r=sw.radius;
 const hue=g?.fire?'#ffae5f':g?.ice?'#9deeff':g?.lightning?'#dbeaff':'#ffeed0';
 ctx.save();ctx.translate(p.x,p.y-20);ctx.rotate(sw.aim);
 const start=-.94+swing*1.85;
 ctx.globalAlpha=Math.max(0,life)*(.35+.65*Math.sin(Math.min(1,swing)*Math.PI));
 ctx.shadowBlur=19;ctx.shadowColor=hue;ctx.lineCap='round';
 for(let i=0;i<3;i++){
  ctx.strokeStyle=i===0?'#fff7df':i===1?hue:'#edc780aa';
  ctx.lineWidth=i===0?2.5:i===1?5.4:9;
  ctx.globalAlpha=Math.max(0,life)*(i===0?.85:i===1?.58:.14);
  ctx.beginPath();ctx.arc(0,0,r-i*3,start-.22,start+.45);ctx.stroke()
 }
 ctx.globalAlpha=Math.max(0,life)*.8;ctx.shadowBlur=0;
 for(let k=0;k<5;k++){let a=start+.33-k*.14,rr=r+3-k*4,x=Math.cos(a)*rr,y=Math.sin(a)*rr;
 ctx.fillStyle=k%2?'#fff3c3':hue;ctx.fillRect(x,y,1.8,1.8)}
 ctx.restore()
}
function enemyStrike(ctx,e){
 if(!e.attackT||e.attackT<=0)return;
 const pr=1-Math.min(1,e.attackT/.44),alpha=.28+.4*Math.sin(pr*Math.PI);
 ctx.save();ctx.translate(e.x,e.y-22);ctx.globalAlpha=alpha;
 const col=e.kind==='wraith'?'#77f4d9':e.kind==='hound'?'#f4a96b':e.kind==='boss'?'#db8ded':'#c3e6b5';
 ctx.strokeStyle=col;ctx.lineWidth=2.4;ctx.shadowBlur=11;ctx.shadowColor=col;
 ctx.beginPath();ctx.arc(0,0,e.r+15,-2.1+pr*2.1,-1.5+pr*2.1);ctx.stroke();
 ctx.restore()
}
root.AscensionCombatFX={slash,loot,enemyStrike,stats:()=>({swordDraw:true,lootCoin:true,enemyAttackFX:true})};
})(window);