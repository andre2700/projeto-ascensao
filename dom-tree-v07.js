/* Floresta Viva: árvores ilustradas em camada DOM acelerada, preservando o Canvas do jogo */
(function(root){
'use strict';
const forest=root.AscensionForest;
if(!forest)return;
const previous=forest.prop;
forest.prop=function(c,o,t){if(o.type==='tree')return;return previous(c,o,t)};
const layer=document.createElement('div');
layer.id='forest-tree-layer';
layer.style.cssText='position:fixed;inset:0;z-index:2;pointer-events:none;overflow:hidden;contain:layout paint;';
document.body.appendChild(layer);
const style=document.createElement('style');
style.textContent='@keyframes forest-canopy-sway{0%{transform:rotate(-1.2deg)}100%{transform:rotate(1.2deg)}}';
document.head.appendChild(style);
const image=new Image();let loaded=false,failed=false;
image.onload=()=>loaded=image.naturalWidth>200;
image.onerror=()=>failed=true;
if(typeof root.AscensionTreeData==='string')image.src=root.AscensionTreeData;
else failed=true;
function random(seed){let t=seed>>>0;return()=>{t+=0x6d2b79f5;let a=t;a=Math.imul(a^a>>>15,a|1);a^=a+Math.imul(a^a>>>7,a|61);return((a^a>>>14)>>>0)/4294967296}}
const R=random(190203),trees=[];
for(let x=-4400;x<=4400;x+=360)for(let y=-4400;y<=4400;y+=350){
 const px=x+(R()-.5)*155,py=y+(R()-.5)*130;
 if(Math.hypot(px,py)<245||R()>.48)continue;
 trees.push({x:px,y:py,s:.82+R()*.44,flip:R()>.5?-1:1})
}
trees.push({x:-290,y:-170,s:1,flip:1},{x:300,y:-230,s:1.08,flip:-1});
let camX=0,camY=0,prevTime=0,drawn=0;
const nodes=new Map(),spares=[];
function create(){
 const box=spares.pop()||document.createElement('div');
 box.style.cssText='position:absolute;left:0;top:0;transform-origin:50% 100%;will-change:transform;';
 if(!box.firstElementChild){
  const img=document.createElement('img');img.src=image.src;img.draggable=false;
  img.style.cssText='width:100%;height:100%;object-fit:contain;display:block;transform-origin:50% 94%;animation:forest-canopy-sway 4.2s ease-in-out infinite alternate;pointer-events:none';
  box.appendChild(img)
 }
 layer.appendChild(box);return box
}
function tick(time){
 try{
  let dt=prevTime?Math.min(.06,(time-prevTime)/1000):.016;prevTime=time;
  if(loaded){
   const user=root.AscensionGame?.debug?.();
   let k=Math.min(1,dt*11);
   camX+=(Number(user?.x||0)-camX)*k;camY+=(Number(user?.y||0)-camY)*k;
   const w=innerWidth,h=innerHeight,active=new Set();
   for(let i=0;i<trees.length;i++){
    const o=trees[i],px=o.x-camX+w*.5,py=o.y-camY+h*.5;
    if(px< -190||px>w+190||py< -95||py>h+260)continue;
    active.add(i);
    let node=nodes.get(i);
    if(!node){node=create();nodes.set(i,node);node.firstElementChild.style.animationDelay=(-i*3.11)+'s'}
    const width=190*o.s,height=182*o.s;
    node.style.width=width+'px';node.style.height=height+'px';
    node.style.transform='translate3d('+(px-width/2).toFixed(1)+'px,'+(py-height+16).toFixed(1)+'px,0) scaleX('+o.flip+')';
    drawn++
   }
   for(const [i,node] of nodes){if(!active.has(i)){nodes.delete(i);node.remove();if(spares.length<20)spares.push(node)}}
  }
 }catch(e){if(!root.__forestTreeError)root.__forestTreeError=String(e)}
 requestAnimationFrame(tick)
}
requestAnimationFrame(tick);
root.AscensionTree={ready:()=>loaded,stats:()=>({loaded,failed,drawn,visible:nodes.size,total:trees.length,dom:true})};
})(window);