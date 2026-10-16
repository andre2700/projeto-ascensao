/* Solo ilustrado — uma única preparação em Canvas, reaproveitada durante a partida */
(function(root){
'use strict';
const forest=root.AscensionForest;
if(!forest)throw Error('Floresta não inicializada');
const original=forest.floorTile;
const image=new Image();
let ready=false,failed=false,preparations=0;
const pending=[];
function notify(){while(pending.length){let f=pending.shift();try{f()}catch(e){console.error(e)}}}
image.onload=()=>{ready=image.naturalWidth>=480&&image.naturalHeight>=480;failed=!ready;notify()};
image.onerror=()=>{ready=false;failed=true;notify()};
if(typeof root.AscensionForestTextureData==='string')image.src=root.AscensionForestTextureData;
else {failed=true}
forest.floorTile=function(seed){
 if(!ready)return original(seed);
 const tile=document.createElement('canvas');tile.width=tile.height=640;
 const c=tile.getContext('2d');c.drawImage(image,0,0,640,640);
 preparations++;
 return tile
};
root.AscensionTerrain={ready:()=>ready,onReady:f=>{if(ready||failed)f();else pending.push(f)},stats:()=>({loaded:ready,failed,preparations})};
})(window);