/* Projeto Ascensão 0.7 — vento e vegetação viva com movimento ambiental independente do jogo */
(function(root){
'use strict';
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),fract=n=>n-Math.floor(n);
const hash=(x,y)=>fract(Math.sin(x*127.1+y*311.7)*43758.5453123);
function wind(t){const dir=.75+.25*Math.sin(t*.057)+.14*Math.sin(t*.17);const strength=.46+.23*Math.sin(t*.37)+.16*Math.cos(t*.089);return{x:dir,y:-.28+.13*Math.cos(t*.075),strength:clamp(strength,.18,.95)}}
function blades(ctx,x,y,size,t,w,phase,color){
 const sway=(Math.sin(t*1.6+phase)*.27+w.strength*.6)*size;
 ctx.lineCap='round';ctx.lineWidth=Math.max(1,size*.16);ctx.strokeStyle=color;
 for(let j=-2;j<=2;j++){const h=size*(.68+hash(phase,j)*.55);ctx.beginPath();ctx.moveTo(x+j*size*.23,y);ctx.quadraticCurveTo(x+j*size*.16+sway*.55,y-h*.55,x+j*size*.3+sway,y-h);ctx.stroke()}
}
function ground(ctx,cam,W,H,t){
 const w=wind(t),cell=83,minX=Math.floor((cam.x-W/2-40)/cell),maxX=Math.floor((cam.x+W/2+40)/cell);
 const minY=Math.floor((cam.y-H/2-40)/cell),maxY=Math.floor((cam.y+H/2+40)/cell);
 ctx.save();
 for(let i=minX;i<=maxX;i++)for(let j=minY;j<=maxY;j++){
  let h=hash(i,j);if(h<.21)continue;
  let x=i*cell+hash(i+33,j)*cell,y=j*cell+hash(i,j+17)*cell;
  let dim=4+h*9,phase=i*2.1+j*4.7;let col=h>.73?'#c7d8998e':h>.49?'#5e955d9a':'#32785785';
  blades(ctx,x,y,dim,t,w,phase,col);
  if(h>.79)blades(ctx,x+14,y-7,dim*.62,t,w,phase+1.2,'#e6dc9b73');
 }
 ctx.restore();
}
function leaf(ctx,x,y,size,angle,front=false){
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);
 let grad=ctx.createLinearGradient(-size,0,size,0);grad.addColorStop(0,front?'#4e8759':'#83ae62');grad.addColorStop(.55,front?'#87b76a':'#d2d77e');grad.addColorStop(1,'#e0c681');
 ctx.beginPath();ctx.moveTo(-size,0);ctx.quadraticCurveTo(-size*.2,-size*.8,size,0);ctx.quadraticCurveTo(0,size*.55,-size,0);ctx.fillStyle=grad;ctx.fill();
 ctx.strokeStyle=front?'#366847':'#75985c';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(-size,0);ctx.quadraticCurveTo(0,-size*.05,size,0);ctx.stroke();ctx.restore();
}
function air(ctx,cam,W,H,t){
 const w=wind(t),space=W+220;
 ctx.save();
 for(let i=0;i<24;i++){
  const speed=(i%4===0?26:15+(i%6)*3)*w.strength;
  let x=(((i*137.6+t*speed)%(space)+space)%space)-110;
  let y=fract((i*79.23)/Math.max(1,H))*H +Math.sin(t*.61+i)*20;
  let px=x+cam.x-W/2,py=y+cam.y-H/2;
  const near=i%6===0,size=near?5+(i%4):2.3+(i%3)*1.2;
  ctx.globalAlpha=near?.63:.30+.25*Math.sin(t*.25+i)**2;
  leaf(ctx,px,py,size,t*.6+i*2.2+Math.sin(t*.23+i),near);
 }
 ctx.restore();
}
function sun(ctx,cam,W,H,t){
 ctx.save();ctx.translate(cam.x-W/2,cam.y-H/2);
 let x=W*.17+Math.sin(t*.03)*20,y=H*.13;
 const g=ctx.createRadialGradient(x,y,18,x,y,Math.max(W,H)*.68);
 g.addColorStop(0,'#fff3bf26');g.addColorStop(.38,'#ffe6a111');g.addColorStop(1,'#ffe7ac00');
 ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 for(let i=0;i<5;i++){ctx.save();ctx.translate(x+i*87-110,0);ctx.rotate(.14+Math.sin(t*.23+i)*.035);ctx.globalAlpha=.025+i*.005;ctx.fillStyle='#fff8d8';ctx.beginPath();ctx.moveTo(-22,0);ctx.lineTo(47,0);ctx.lineTo(230,H);ctx.lineTo(82,H);ctx.fill();ctx.restore()}
 ctx.restore();
}
let paints=0;
root.AscensionWind={ground:(...a)=>{paints++;ground(...a)},air:(...a)=>{paints++;air(...a)},sun:(...a)=>{paints++;sun(...a)},wind,stats:()=>({paints})};
})(window);