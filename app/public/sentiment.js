export function fearState(value){
 if(value==null||value===''||!Number.isFinite(+value)||+value<0||+value>100)return {zone:'unavailable',label:'Veri Bekleniyor'};
 const n=+value;return n<25?{zone:'extreme-fear',label:'Aşırı Korku'}:n<45?{zone:'fear',label:'Korku'}:n<55?{zone:'neutral',label:'Nötr'}:n<75?{zone:'greed',label:'Açgözlülük'}:{zone:'extreme-greed',label:'Aşırı Açgözlülük'};
}
