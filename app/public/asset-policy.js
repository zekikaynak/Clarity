// Fallback classifications from Binance public product tags, checked 2026-11-17.
// Live product metadata takes precedence when supplied by the market API.
const equities=new Set(["AAOIB", "AAPLB", "ADBEB", "AGPUB", "ALABB", "AMATB", "AMCB", "AMDB", "AMZNB", "APPB", "ARMB", "ASMLB", "ASTSB", "AVGOB", "AXTIB", "BABAB", "BBB", "BEB", "BMNRB", "BNCB", "BOTB", "BRKBB", "BSPB", "CBRSB", "COHRB", "COINB", "CRCLB", "CRDOB", "CRMB", "CRWDB", "CRWVB", "CYPHB", "DELLB", "DJTB", "DRAMB", "EWYB", "FLNCB", "FWDIB", "GEVB", "GLWB", "GMEB", "GOOGLB", "GPROB", "GSB", "HIMSB", "HOODB", "HPEB", "IBMB", "INTCB", "INTWB", "IRENB", "JPMB", "KORUB", "KSTRB", "LITEB", "LLYB", "MDBB", "METAB", "MRNAB", "MRVLB", "MSFTB", "MSTRB", "MUB", "MUUB", "MVLLB", "NBISB", "NFLXB", "NOKB", "NVDAB", "ORCLB", "PDDB", "PENGB", "PLTRB", "PYPLB", "QCOMB", "QNTB", "QQQB", "RDDTB", "RKLBB", "SECZB", "SHAZB", "SKDDB", "SKHYB", "SKUUB", "SMCIB", "SMHB", "SNDKB", "SNXXB", "SOXLB", "SOXSB", "SPCXB", "SPYB", "SQQQB", "STXB", "TMFB", "TQQQB", "TSLAB", "TSMB", "USARB", "USDEB", "UVXYB", "VSTB", "WDCB", "WENB", "ZMB"]);
const stables=new Set(["BFUSD", "EURI", "FDUSD", "KGST", "RLUSD", "RWUSD", "TUSD", "U", "USD1", "USDC", "USDE", "USDS", "USDT", "XUSD"]);
export function assetBase(asset){
 if(typeof asset==='object'&&asset){const base=asset.baseAsset||asset.b;if(base)return String(base).toUpperCase();}
 const symbol=String(typeof asset==='string'?asset:asset?.symbol||asset?.s||'').toUpperCase();
 return symbol!=='USDT'&&symbol.endsWith('USDT')?symbol.slice(0,-4):symbol;
}
export function isCryptoAsset(asset){
 const tags=(asset?.tags||[]).map(x=>String(x).toLowerCase().replace(/[ _-]/g,''));
 const name=String(asset?.assetName||asset?.name||asset?.an||'');
 return !equities.has(assetBase(asset))&&!tags.some(x=>['bstocks','xstocks','tokenizedstocks','tokenizedstock','tokenizedequities','tokenizedsecurities'].includes(x))&&!/\bbstocks\b|\bxstocks\b|tokenized (?:stock|equit|securit)/i.test(name);
}
export function isStableAsset(asset){return asset?.assetType==='stablecoin'||stables.has(assetBase(asset))||(asset?.tags||[]).some(x=>String(x).toLowerCase()==='stablecoin');}
export function stableLast(a,b){return Number(isStableAsset(a))-Number(isStableAsset(b));}
