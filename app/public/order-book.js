export function largestBookLevels(book,perSide=5){
 const largest=(levels,side)=>(levels||[]).map(([p,q])=>({price:Number(p),qty:Number(q),side}))
  .filter(x=>Number.isFinite(x.price)&&Number.isFinite(x.qty)&&x.price>0&&x.qty>0)
  .map(x=>({...x,value:x.price*x.qty})).filter(x=>Number.isFinite(x.value))
  .sort((a,b)=>b.value-a.value||b.price-a.price).slice(0,perSide);
 return [...largest(book?.bids,'buy'),...largest(book?.asks,'sell')].sort((a,b)=>b.value-a.value||b.price-a.price);
}
