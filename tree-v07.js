/* Floresta da Aurora 0.7.2: a árvore pintada substitui a árvore geométrica */
(function(root){
'use strict';
const forest=root.AscensionForest;if(!forest)throw Error('Mundo da floresta ausente');
const previous=forest.prop,tree=new Image();
let loaded=false,failed=false,drawn=0;
tree.onload=()=>{loaded=tree.naturalWidth>=300&&tree.naturalHeight>=270;failed=!loaded};
tree.onerror=()=>{loaded=false;failed=true};
if(typeof root.AscensionTreeData==='string')tree.src=root.AscensionTreeData;
else failed=true;
forest.prop=function(ctx,o,t){
 if(o.type!=='tree'||!loaded)return previous(ctx,o,t);
 drawn++;
 const s=o.s||1,flip=(o.variant||0)>.52?-1:1;
 ctx.save();ctx.translate(o.x,o.y);
 ctx.fillStyle='#183a2880';ctx.beginPath();ctx.ellipse(5,18,42*s,13*s,-.15,0,Math.PI*2);ctx.fill();
 // A brisa oscila delicadamente toda a silhueta enquanto as folhas se movem por cima.
 ctx.rotate(Math.sin(t*1.17+o.x*.013+o.y*.016)*.012);
 ctx.scale(s*flip,s);
 ctx.drawImage(tree,-111,-183,222,198);
 ctx.restore();
};
root.AscensionTree={ready:()=>loaded,stats:()=>({loaded,failed,drawn})};
})(window);