/* Etapa de arte ilustrada: remove antigos objetos de cenário geométricos. */
(function(root){
 const forest=root.AscensionForest;
 if(!forest)return;
 const draw=forest.prop;
 forest.prop=function(c,o,t){
   if(o.type==='crystal'||o.type==='tree')return draw(c,o,t);
 };
})(window);