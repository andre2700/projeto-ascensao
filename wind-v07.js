/* Floresta Viva 0.7.1 — vento com mini-sprites pré-renderizados: otimizado para Safari iPhone */
(function(root){
'use strict';
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fract=n=>n-Math.floor(n);
const hash=(x,y)=>fract(Math.sin(x*127.1+y*311.7)*43758.5453123);
function wind(t){return{x:.78+.18*Math.sin(t*.055),y:-.18+.10*Math.cos(t*.075),strength:clamp(.60+.18*Math.sin(t*.38)+.10*Math.cos(t*.1),.20,.9)}}
function canvas(w,h){const a=document.createElement('canvas');a.width=w;a.height=h;return{canvas:a,ctx:a.getContext('2d')}}
const grass=[];for(let variant=0;variant<3;variant++){
 const {canvas:a,ctx:c}=canvas(56,44);
 c.strokeStyle=['#4f9367c8','#accd83b3','#327957ba'][variant];c.lineWidth=1.7;c.lineCap='round';
 for(let i=0;i<9;i++){let x=8+i*4.9,h=11+(i*7+variant*11)%22;c.beginPath();c.moveTo(x,42);c.quadraticCurveTo(x+(i%3-1)*4,42-h*.50,x+(i%3-1)*5,42-h);c.stroke()}
 grass.push(a)
}
const leaves=[];for(let j=0;j<3;j++){
 const {canvas:a,ctx:c}=canvas(40,24);c.translate(20,12);
 const g=c.createLinearGradient(-13,0,13,0);g.addColorStop(0,['#2f815a','#97ad5f','#b88752'][j]);g.addColorStop(1,['#cadd82','#ebd58c','#f6c88a'][j]);
 c.beginPath();c.moveTo(-15,0);c.quadraticCurveTo(-5,-10,14,-1);c.quadraticCurveTo(4,9,-15,0);c.fillStyle=g;c.fill();
 c.strokeStyle='#4e7e4b88';c.lineWidth=.9;c.beginPath();c.moveTo(-13,0);c.lineTo(12,0);c.stroke();
 leaves.push(a)
}
const sunTile=(()=>{const{canvas:a,ctx:c}=canvas(128,128);const g=c.createRadialGradient(64,64,5,64,64,64);g.addColorStop(0,'#ffeeb344');g.addColorStop(.5,'#fbe2a719');g.addColorStop(1,'#fff0aa00');c.fillStyle=g;c.fillRect(0,0,128,128);return a})();
let paints=0;
function ground(c,cam,W,H,t){
 paints++;const w=wind(t),unit=125;
 const x1=Math.floor((cam.x-W/2-40)/unit),x2=Math.ceil((cam.x+W/2+40)/unit);
 const y1=Math.floor((cam.y-H/2-40)/unit),y2=Math.ceil((cam.y+H/2+40)/unit);
 c.save();
 for(let i=x1;i<=x2;i++)for(let j=y1;j<=y2;j++){
  const h=hash(i,j);if(h<.22)continue;
  const x=i*unit+hash(i+5,j)*unit,y=j*unit+hash(i,j+5)*unit;
  const sway=.11*Math.sin(t*1.4+i*3+j*2)+w.strength*.18;
  c.save();c.translate(x,y);c.rotate(sway);c.globalAlpha=.48+h*.36;
  let size=17+h*11;
  c.drawImage(grass[Math.floor(h*3)],-size/2,-size*.96,size,size);
  c.restore();
 }
 c.restore();
}
function air(c,cam,W,H,t){
 paints++;const w=wind(t),count=15,span=W+150;
 c.save();
 for(let i=0;i<count;i++){
  const speed=(20+(i%5)*5)*w.strength;
  let x=(((i*117.4+t*speed)%(span)+span)%span)-75;
  let y=fract(i*.16851)*H+Math.sin(t*.6+i)*13;
  c.save();c.translate(x+cam.x-W/2,y+cam.y-H/2);
  c.rotate(t*.51+i*1.3);
  c.globalAlpha=.32+(i%3)*.13;
  let s=i%6===0?1.04:.68;
  c.drawImage(leaves[i%3],-20*s,-12*s,40*s,24*s);
  c.restore();
 }
 c.restore();
}
function sun(c,cam,W,H,t){
 paints++;
 // Nenhum gradiente em tela cheia por frame; usa um pequeno glow estático em cache.
 c.save();c.globalAlpha=.48+Math.sin(t*.25)*.10;
 c.drawImage(sunTile,cam.x-W/2,cam.y-H/2,W*.92,Math.min(H*.68,W*1.45));
 c.restore();
}
root.AscensionWind={ground,air,sun,wind,stats:()=>({paints,cachedSprites:true})};
})(window);