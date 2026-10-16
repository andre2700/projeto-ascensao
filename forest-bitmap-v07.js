/* Ascensão — pintura de floresta real, sem formas geométricas */
(function(root){
'use strict';
const forest=root.AscensionForest,assets=root.AscensionForestAssets;
if(!forest||!assets)return;
const origFloor=forest.floorTile,origProp=forest.prop;
const floorImg=new Image(),treeImg=new Image();
let floorLoaded=false,treeLoaded=false,floorFailed=false,treeFailed=false;
let existing=[];
floorImg.onload=()=>{floorLoaded=floorImg.naturalWidth>0;for(const target of existing)paintFloor(target)};
floorImg.onerror=()=>floorFailed=true;
treeImg.onload=()=>treeLoaded=treeImg.naturalWidth>0;
treeImg.onerror=()=>treeFailed=true;
floorImg.src=assets.tile;
treeImg.src=assets.tree;
function paintFloor(canvas){
 if(!floorLoaded)return;
 const c=canvas.getContext('2d');
 c.save();c.clearRect(0,0,canvas.width,canvas.height);
 // Pintura seamless: mesma textura desenhada no grid com bordas ligadas.
 c.drawImage(floorImg,0,0,canvas.width,canvas.height);
 c.restore();
}
forest.floorTile=function(seed){
 const target=origFloor(seed);
 existing.push(target);
 if(floorLoaded)paintFloor(target);
 return target;
};
forest.prop=function(c,o,t){
 if(o.type!=='tree'||!treeLoaded)return origProp(c,o,t);
 c.save();c.translate(o.x,o.y);c.scale(o.s||1,o.s||1);
 const width=151,height=143,top=-122,base=height+top;const swing=Math.sin(t*.73+o.x*.017+o.y*.011)*2;
 // Raízes e tronco ficam presos ao solo; a copa oscila suavemente com o vento.
 c.drawImage(treeImg,0,164,320,138,-width/2,top+height*164/302,width,height*138/302);
 c.save();c.translate(swing,-.5*Math.abs(swing));c.drawImage(treeImg,0,0,320,175,-width/2,top,width,height*175/302);c.restore();
 c.restore();
};
root.AscensionBitmap={ready:()=>floorLoaded&&treeLoaded,stats:()=>({floorLoaded,treeLoaded,floorFailed,treeFailed,bitmaps:existing.length})};
})(window);