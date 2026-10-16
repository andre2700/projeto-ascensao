/* Projeto Ascensão 0.8 — solo definido com pintura natural, micrograma e emendas suaves */
(function(root){
'use strict';
const forest=root.AscensionForest;if(!forest)throw Error('Forest required');
const original=forest.floorTile;
const TILE=640,im=new Image(),surfaces=[],pending=[];
let loaded=false,failed=false,preparations=0,edgeContrast=0;
function seed(n){return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}}
const clamp=(v,a=0,b=255)=>Math.max(a,Math.min(b,v));
function crisp(c){
 const image=c.getImageData(0,0,TILE,TILE),src=new Uint8ClampedArray(image.data),d=image.data;
 let gradient=0,samples=0;
 // Máscara de nitidez local: recuperar leitura de grama e detalhes do solo.
 for(let y=1;y<TILE-1;y++)for(let x=1;x<TILE-1;x++){
  const p=(y*TILE+x)*4;
  for(let k=0;k<3;k++){
   const z=p+k,v=src[z],avg=(src[z-4]+src[z+4]+src[z-TILE*4]+src[z+TILE*4])*.25;
   d[z]=clamp(128+(v-128)*1.075+(v-avg)*1.15);
  }
  if(x%41===0&&y%41===0){gradient+=Math.abs(src[p]-src[p+4])+Math.abs(src[p+1]-src[p+5]);samples++}
 }
 // Sem grandes faixas desfocadas nas bordas: correção apenas a 6 px.
 const seam=18;
 for(let k=0;k<seam;k++){
  const a=.47*(1-k/seam)**2;
  for(let y=0;y<TILE;y++)for(let channel=0;channel<3;channel++){
   const l=(y*TILE+k)*4+channel,r=(y*TILE+TILE-k-1)*4+channel,v=(d[l]+d[r])/2;
   d[l]=d[l]*(1-a)+v*a;d[r]=d[r]*(1-a)+v*a
  }
  for(let x=0;x<TILE;x++)for(let channel=0;channel<3;channel++){
   const top=(k*TILE+x)*4+channel,bt=((TILE-k-1)*TILE+x)*4+channel,v=(d[top]+d[bt])/2;
   d[top]=d[top]*(1-a)+v*a;d[bt]=d[bt]*(1-a)+v*a
  }
 }
 c.putImageData(image,0,0);
 edgeContrast=Math.round(gradient/Math.max(1,samples));
}
function microdetail(c){
 const R=seed(20261016);
 c.lineCap='round';
 const repeat=(x,y,r,draw)=>{
  const X=[0],Y=[0];
  if(x<r)X.push(TILE);if(x>TILE-r)X.push(-TILE);
  if(y<r)Y.push(TILE);if(y>TILE-r)Y.push(-TILE);
  for(let dx of X)for(let dy of Y)draw(x+dx,y+dy)
 };
 for(let i=0;i<1250;i++){
  const x=R()*TILE,y=R()*TILE,h=1.5+R()*5.5;
  const tone=R()<.55?'#e2d7a13a':'#245b394a',b=(R()-.5)*3;
  repeat(x,y,9,(px,py)=>{
   c.strokeStyle=tone;c.lineWidth=.6+R()*.45;
   c.beginPath();c.moveTo(px,py);c.quadraticCurveTo(px+b,py-h*.58,px+b*1.3,py-h);c.stroke()
  })
 }
 for(let i=0;i<62;i++){
  const x=R()*TILE,y=R()*TILE,size=.7+R()*1.3;
  repeat(x,y,5,(px,py)=>{
   c.fillStyle=i%3===0?'#f7e9bacc':'#eef3b376';
   c.beginPath();c.ellipse(px,py,size,size*.65,0,0,Math.PI*2);c.fill()
  })
 }
}
function paint(tile){
 const c=tile.getContext('2d');
 c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.clearRect(0,0,TILE,TILE);
 c.drawImage(im,0,0,TILE,TILE);
 crisp(c);microdetail(c);preparations++;
}
function notify(){while(pending.length){try{pending.shift()()}catch(e){console.error(e)}}}
im.onload=()=>{loaded=im.naturalWidth>=480&&im.naturalHeight>=480;failed=!loaded;if(loaded)for(const tile of surfaces)paint(tile);notify()};
im.onerror=()=>{failed=true;notify()};
if(typeof root.AscensionForestTextureData==='string')im.src=root.AscensionForestTextureData;else failed=true;
forest.floorTile=function(seedValue){
 let tile;
 if(loaded){tile=document.createElement('canvas');tile.width=tile.height=TILE}
 else tile=original(seedValue);
 surfaces.push(tile);if(loaded)paint(tile);return tile
};
root.AscensionTerrain={ready:()=>loaded,onReady:f=>loaded||failed?f():pending.push(f),stats:()=>({loaded,failed,preparations,sharpened:true,gradient:edgeContrast,tileSize:TILE})};
})(window);