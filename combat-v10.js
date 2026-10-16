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
function smooth(t){return t*t*(3-2*t)}
function slash(ctx,sw,p,g){
 const phase=Math.min(1,sw.time/sw.duration);
 if(phase<.14||phase>.96)return;
 const t=smooth((phase-.14)/.82),fade=Math.pow(Math.sin((phase-.14)/.82*Math.PI),.68);
 const r=sw.radius,wide=sw.spread||1.2,dir=sw.direction||1;
 const hue=g?.fire?'#ffbc76':g?.ice?'#9df3ff':g?.lightning?'#e8efff':'#fff1cc';
 const redirection=sw.aim+(sw.variant||0)*.19;
 // O centro do efeito é PROJETADO à frente do guerreiro e acompanha sua posição.
 const forward=19+r*.30;
 const ox=p.x+Math.cos(sw.aim)*forward,oy=p.y-23+Math.sin(sw.aim)*forward*.74;
 const radius=r*.70;
 const sweep=(-wide/2+wide*t)*dir,tail=sweep-dir*(.14+.25*t);
 ctx.save();ctx.translate(ox,oy);ctx.rotate(redirection);
 ctx.lineCap='round';ctx.lineJoin='round';
 const bladeAngle=sweep;
 // Lâmina de energia em forma de crescente, com núcleo definido e rastro translúcido.
 let a=tail,b=bladeAngle;if(dir<0){let tmp=a;a=b;b=tmp}
 ctx.globalAlpha=fade*.26;
 ctx.fillStyle=hue;ctx.shadowColor=hue;ctx.shadowBlur=16;
 ctx.beginPath();ctx.arc(0,0,radius+7,a,b);
 ctx.arc(0,0,radius-13,b,a,true);ctx.closePath();ctx.fill();
 for(let i=0;i<3;i++){
  ctx.globalAlpha=fade*(i===0?.85:i===1?.56:.19);
  ctx.strokeStyle=i===0?'#fffdf0':i===1?hue:'#d2b77f';
  ctx.lineWidth=i===0?2.8:i===1?5.1:9;
  ctx.beginPath();ctx.arc(0,0,radius-i*3,a,b);ctx.stroke()
 }
 const tipAngle=sweep,tx=Math.cos(tipAngle)*radius,ty=Math.sin(tipAngle)*radius;
 ctx.globalAlpha=fade*.82;ctx.shadowBlur=8;
 ctx.fillStyle='#fff7db';ctx.beginPath();ctx.ellipse(tx,ty,3.8,2.4,tipAngle,0,TAU);ctx.fill();
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
root.AscensionCombatFX={slash,loot,enemyStrike,stats:()=>({swordDraw:true,projectedForward:true,eightWayCompatible:true,lootCoin:true,enemyAttackFX:true})};
})(window);