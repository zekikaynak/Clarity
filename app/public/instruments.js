export const indices=[
 ['BTC.D','Bitcoin Dominansı','Bitcoin’in toplam piyasa değerindeki payı.','dominance'],
 ['ETH.D','Ethereum Dominansı','Ethereum’un toplam piyasa değerindeki payı.','dominance'],
 ['USDT.D','USDT Dominansı','Tether’in toplam piyasa değerindeki payı.','dominance'],
 ['USDC.D','USDC Dominansı','USDC’nin toplam piyasa değerindeki payı.','dominance'],
 ['OTHERS.D','OTHERS Dominansı','OTHERS grubunun toplam piyasa değerindeki payı.','dominance'],
 ['TOTAL','Toplam Piyasa Değeri','İlk 125 kripto varlığın toplam piyasa değeri.','cap'],
 ['TOTAL2','Bitcoin Hariç Piyasa','İlk 125 varlık içinde Bitcoin hariç toplam piyasa değeri.','cap'],
 ['TOTAL3','BTC Ve ETH Hariç Piyasa','İlk 125 varlık içinde Bitcoin ve Ethereum hariç piyasa değeri.','cap'],
 ['OTHERS','Diğer Kripto Varlıklar','İlk 125 varlık içinde büyük varlıklar dışındaki grubun piyasa değeri; TOTAL3 ile aynı kapsam değildir.','cap'],
 ['TOTALES','Stablecoin Hariç Piyasa','İlk 125 varlık içinde stablecoin hariç piyasa değeri.','cap'],
 ['TOTAL2ES','BTC Ve Stablecoin Hariç','İlk 125 varlık içinde Bitcoin ve stablecoin hariç piyasa değeri.','cap'],
 ['TOTAL3ES','Altcoin Piyasa Değeri','İlk 125 varlık içinde Bitcoin, Ethereum ve stablecoin hariç piyasa değeri.','cap']
].map(([code,name,description,kind])=>({symbol:'CRYPTOCAP:'+code,code,name,description,kind}));
export const indexInstrument=symbol=>indices.find(x=>x.symbol===symbol);
export const isIndex=symbol=>!!indexInstrument(symbol);
export const chartSymbol=symbol=>isIndex(symbol)?symbol:'BINANCE:'+symbol;
export const streamSymbol=symbol=>isIndex(symbol)?'BTCUSDT':symbol;
