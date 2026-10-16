/* Projeto Ascensão 0.8 — folhas realmente fixadas ao mundo, vento lento, sem seguir herói */
(function(root){
'use strict';
const wind=root.AscensionWind,forest=root.AscensionForest;
if(!wind)throw Error('Wind system required');
const TAU=Math.PI*2,fract=n=>n-Math.floor(n),hash=(a,b)=>fract(Math.sin(a*127.1+b*311.7)*43758.5453);
let drawn=0;
const variants=[];
for(let i=0;i<4;i++){
 const a=document.createElement('canvas');a.width=33;a.height=22;
 const c=a.getContext('2d');c.translate(16,11);
 let gradient=c.createLinearGradient(-12,0,12,0);
 gradient.addColorStop(0,['#467d56','#9aaa65','#b79b5c','#587951'][i]);gradient.addColorStop(.65,['#7fb477','#d2d683','#f0c77d','#b2bb76'][i]);gradient.addColorStop(1,'#f3dea0');
 c.beginPath();c.moveTo(-12,0);c.quadraticCurveTo(-3,-9,12,0);c.quadraticCurveTo(0,7,-12,0);c.fillStyle=gradient;c.fill();
 c.strokeStyle='#54794caa';c.lineWidth=.8;c.beginPath();c.moveTo(-10,0);c.lineTo(9,0);c.stroke();
 variants.push(a)
}
function air(c,cam,W,H,t){
 const w=wind.wind(t),unit=235;
 const x1=Math.floor((cam.x-W*.5-100)/unit),x2=Math.ceil((cam.x+W*.5+100)/unit);
 const y1=Math.floor((cam.y-H*.5-100)/unit),y2=Math.ceil((cam.y+H*.5+100)/unit);
 c.save();
 for(let i=x1;i<=x2;i++)for(let j=y1;j<=y2;j++){
  for(let k=0;k<2;k++){
   const h=hash(i*3+k,j*7+k*13),v=hash(i*17+k,j*19);
   if(h<.24)continue;
   // Posições em coordenadas ABSOLUTAS do mapa, e não relativas à câmera.
   const vx=(8+v*16)*w.strength;
   const x=(i+fract(h+t*vx/unit))*unit;
   const y=(j+fract(v+.32*Math.sin(t*.19+i+j)))*unit+Math.sin(t*.54+i*7+j)*5;
   c.save();c.translate(x,y);c.rotate(t*.32+v*TAU+Math.sin(t*.21+h*5)*.22);
   c.globalAlpha=.28+v*.36;
   const sc=.34+h*.43;c.scale(sc,sc);
   c.drawImage(variants[(i*7+j*11+k*3+120000)%4],-16,-11);
   c.restore();drawn++
  }
 }
 c.restore()
}
wind.air=air;
const original=wind.stats;
wind.stats=()=>({...original(),worldSpaceLeaves:true,leafDraws:drawn});
})(window);