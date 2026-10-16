/* Solo ilustrado — uma única preparação em Canvas, reaproveitada durante a partida */
(function(root){
'use strict';
const forest=root.AscensionForest;
if(!forest)throw Error('Floresta não inicializada');
const original=forest.floorTile;
const image=new Image();
let ready=false,failed=false,preparations=0;
const surfaces=[];
function repaint(tile){
 const c=tile.getContext('2d');c.clearRect(0,0,640,640);c.drawImage(image,0,0,640,640);
 const img=c.getImageData(0,0,640,640),p=img.data,W=640,H=640,N=44;
 // Igualar margens superior/inferior e esquerda/direita; repetir o tile sem costura.
 for(let k=0;k<N;k++){
  let a=Math.cos(k/N*Math.PI/2)**2;
  for(let x=0;x<W;x++)for(let ch=0;ch<3;ch++){
   let t=(k*W+x)*4+ch,b=((H-1-k)*W+x)*4+ch,m=(p[t]+p[b])*.5;
   p[t]=p[t]*(1-a)+m*a;p[b]=p[b]*(1-a)+m*a;
  }
 }
 for(let k=0;k<N;k++){
  let a=Math.cos(k/N*Math.PI/2)**2;
  for(let y=0;y<H;y++)for(let ch=0;ch<3;ch++){
   let l=(y*W+k)*4+ch,r=(y*W+W-1-k)*4+ch,m=(p[l]+p[r])*.5;
   p[l]=p[l]*(1-a)+m*a;p[r]=p[r]*(1-a)+m*a;
  }
 }
 c.putImageData(img,0,0);preparations++
}
const pending=[];
function notify(){while(pending.length){let f=pending.shift();try{f()}catch(e){console.error(e)}}}
image.onload=()=>{ready=image.naturalWidth>=480&&image.naturalHeight>=480;failed=!ready;if(ready)for(const tile of surfaces)repaint(tile);notify()};
image.onerror=()=>{ready=false;failed=true;notify()};
if(typeof root.AscensionForestTextureData==='string')image.src=root.AscensionForestTextureData;
else {failed=true}
forest.floorTile=function(seed){const tile=original(seed);surfaces.push(tile);if(ready)repaint(tile);return tile};
root.AscensionTerrain={ready:()=>ready,onReady:f=>{if(ready||failed)f();else pending.push(f)},stats:()=>({loaded:ready,failed,preparations})};
})(window);