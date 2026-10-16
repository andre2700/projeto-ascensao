/* Solo ilustrado — uma única preparação em Canvas, reaproveitada durante a partida */
(function(root){
'use strict';
const forest=root.AscensionForest;
if(!forest)throw Error('Floresta não inicializada');
const original=forest.floorTile;
const image=new Image();
let ready=false,failed=false,preparations=0;
const surfaces=[];
function repaint(tile){const c=tile.getContext('2d');c.clearRect(0,0,640,640);c.drawImage(image,0,0,640,640);preparations++}
const pending=[];
function notify(){while(pending.length){let f=pending.shift();try{f()}catch(e){console.error(e)}}}
image.onload=()=>{ready=image.naturalWidth>=480&&image.naturalHeight>=480;failed=!ready;if(ready)for(const tile of surfaces)repaint(tile);notify()};
image.onerror=()=>{ready=false;failed=true;notify()};
if(typeof root.AscensionForestTextureData==='string')image.src=root.AscensionForestTextureData;
else {failed=true}
forest.floorTile=function(seed){const tile=original(seed);surfaces.push(tile);if(ready)repaint(tile);return tile};
root.AscensionTerrain={ready:()=>ready,onReady:f=>{if(ready||failed)f();else pending.push(f)},stats:()=>({loaded:ready,failed,preparations})};
})(window);