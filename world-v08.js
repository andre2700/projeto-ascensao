/* Projeto Ascensao 0.8 — mundo unico: arvores, sombras, profundidade e colisao */
(function(root){
'use strict';
const forest=root.AscensionForest;
if(!forest)throw Error('Forest required for integrated world');
const image=new Image(),CELL=180,treeHeight=182,treeWidth=190;
const trees=[],grid=new Map(),feet=[],stats={collisions:0,footsteps:0,draws:0};
let ready=false,failed=false;
image.onload=()=>{ready=image.naturalWidth>=250&&image.naturalHeight>=240;failed=!ready};
image.onerror=()=>{ready=false;failed=true};
if(typeof root.AscensionTreeData==='string')image.src=root.AscensionTreeData;else failed=true;
function key(x,y){return x+','+y}
function cell(x){return Math.floor(x/CELL)}
function hash(x,y){const v=Math.sin(x*127.1+y*311.7)*43758.5453123;return v-Math.floor(v)}
function contact(ctx,x,y,rx=18,ry=6,alpha=.6){
 ctx.save();ctx.globalAlpha=alpha;
 ctx.fillStyle='#102d2260';ctx.beginPath();ctx.ellipse(x+4,y+2,rx*1.45,ry*2,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#09291fba';ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#dce6b724';ctx.beginPath();ctx.ellipse(x,y+ry*.85,rx*.8,ry*.28,0,0,Math.PI*2);ctx.fill();
 ctx.restore();
}
function prepare(props){
 trees.length=0;grid.clear();
 for(const p of props){
  if(p.type!=='tree')continue;
  const tr={x:p.x,y:p.y,s:p.s||1,variant:p.variant||.2,flip:hash(p.x,p.y)>.5?-1:1,radius:22*(p.s||1),phase:hash(p.y,p.x)*Math.PI*2};
  trees.push(tr);
  const ix=cell(tr.x),iy=cell(tr.y+10);
  const id=key(ix,iy);
  let bucket=grid.get(id);if(!bucket)grid.set(id,bucket=[]);bucket.push(tr)
 }
 return trees.length;
}
function nearby(x,y){
 const ix=cell(x),iy=cell(y),near=[];
 for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){let b=grid.get(key(ix+dx,iy+dy));if(b)for(let tr of b)near.push(tr)}
 return near
}
function resolve(x,y,r=13){
 let collided=false;
 for(let i=0;i<2;i++){
  let correction=false;
  for(let tree of nearby(x,y)){
   let dx=x-tree.x,dy=y-(tree.y+9),min=r+tree.radius;
   const dist=Math.hypot(dx,dy);
   if(dist<min){
    collided=true;correction=true;stats.collisions++;
    const ux=dist>0.001?dx/dist:1,uy=dist>0.001?dy/dist:0;
    x+=ux*(min-dist+.05);y+=uy*(min-dist+.05)
   }
  }
  if(!correction)break
 }
 return{x,y,collided}
}
function segmentBlocked(ax,ay,bx,by,margin=12){
 for(const t of nearby(bx,by)){const dx=bx-t.x,dy=by-(t.y+9);if(dx*dx+dy*dy<(margin+t.radius)**2)return true}return false
}
function drawTree(ctx,tr,t){
 stats.draws++;
 const w=treeWidth*tr.s,h=treeHeight*tr.s;
 // Sombra ancorada no solo, nao na copa. A arvore recebe o MESMO camera shake do personagem.
 contact(ctx,tr.x+13*tr.s,tr.y+15*tr.s,38*tr.s,10*tr.s,.72);
 if(!ready){forest.prop(ctx,{x:tr.x,y:tr.y,s:tr.s,rot:0,variant:tr.variant,type:'tree'},t);return}
 ctx.save();ctx.translate(tr.x,tr.y+16*tr.s);
 // Transformação da copa em torno da base: vento suave sem deslocar o tronco do chão.
 const lean=.013*Math.sin(t*.92+tr.phase)+.009*Math.sin(t*.45+tr.phase*2);
 ctx.rotate(lean);
 ctx.scale(tr.flip,1);
 ctx.drawImage(image,-w/2,-h,w,h);
 ctx.restore();
}
function footstep(x,y,kind,t,pressure=1){
 if(feet.length>95)feet.shift();
 const size=kind==='beast'?7:4;
 feet.push({x:x+(Math.random()-.5)*7,y:y+7,life:.42,max:.42,size:size*pressure,vx:(Math.random()-.5)*12,vy:-5-Math.random()*8});
 stats.footsteps++
}
function update(dt){for(const f of feet){f.x+=f.vx*dt;f.y+=f.vy*dt;f.life-=dt}for(let i=feet.length-1;i>=0;i--)if(feet[i].life<=0)feet.splice(i,1)}
function drawSteps(ctx){ctx.save();for(const f of feet){ctx.globalAlpha=.22*(f.life/f.max);ctx.fillStyle='#e9dfb4';ctx.beginPath();ctx.ellipse(f.x,f.y,f.size*1.1,f.size*.5,0,0,Math.PI*2);ctx.fill()}ctx.restore()}
root.AscensionWorld={
 prepare,nearby,resolve,segmentBlocked,contact,drawTree,footstep,update,drawSteps,
 trees,stats:()=>({spriteReady:ready,failed,trees:trees.length,collisions:stats.collisions,footsteps:stats.footsteps,draws:stats.draws,worldCanvas:true})
};
})(window);