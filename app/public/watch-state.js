import {isCryptoAsset} from './asset-policy.js';
export const groupColors=['#86b5ff','#b49cf0','#62c9ad','#e7b66d','#e78f9e','#8eabc3'];
export function normalizeWatchlists(value,legacy=[]){
 const rows=Array.isArray(value?.lists)?value.lists:[];
 const lists=rows.filter(x=>x&&typeof x.name==='string').map((x,i)=>({id:typeof x.id==='string'&&/^[\w-]+$/.test(x.id)?x.id:'list-'+i,name:x.name.slice(0,40)||'Liste',color:/^#[0-9a-f]{6}$/i.test(x.color)?x.color:groupColors[i%groupColors.length],collapsed:!!x.collapsed,symbols:[...new Set((x.symbols||[]).filter(s=>typeof s==='string'&&isCryptoAsset(s)&&/^(?:[A-Z0-9]{2,20}USDT|CRYPTOCAP:[A-Z0-9.]+)$/.test(s)))]}));
 if(!lists.length)lists.push({id:'main',name:'Varlıklarım',color:groupColors[0],collapsed:false,symbols:[...new Set(legacy.filter(isCryptoAsset))]});
 const seen=new Set();for(const [i,x] of lists.entries()){let suffix=0;while(seen.has(x.id))x.id='list-'+i+'-'+suffix++;seen.add(x.id);}
 return {version:1,lists};
}
export const watchSymbols=state=>[...new Set(state.lists.flatMap(x=>x.symbols))];
export function toggleWatchSymbol(state,id,symbol){const list=state.lists.find(x=>x.id===id);if(!list)return;list.symbols=list.symbols.includes(symbol)?list.symbols.filter(x=>x!==symbol):[...list.symbols,symbol];}
export function removeWatchGroup(state,id){if(state.lists.length<2)return;const removed=state.lists.find(x=>x.id===id);if(!removed)return;state.lists=state.lists.filter(x=>x.id!==id);state.lists[0].symbols=[...new Set([...state.lists[0].symbols,...removed.symbols])];}
