export function previewCount(heights,budget,{min=1,max=12}={}){const limit=Math.min(heights.length,max);let count=Math.min(min,limit),used=heights.slice(0,count).reduce((a,b)=>a+b,0);while(count<limit&&used+heights[count]<=budget){used+=heights[count++];}return count;}
export function mountOverviewLayout(root){
 const main=root.querySelector('.overview-main'),side=root.querySelector('.overview-sidebar'),watch=root.querySelector('#overview-watch-panel'),calendar=root.querySelector('#calendar-preview')?.closest('.panel'),news=root.querySelector('#overview-news-panel');if(!main||!side||!watch||!calendar||!news)return {balance(){},dispose(){}};
 let disposed=false,queued=false;
 function apply(){
  queued=false;if(disposed||!side.isConnected)return;const items=[...news.querySelectorAll('.news-item')];if(!items.length)return;
  if(innerWidth<=1100){items.forEach((x,i)=>x.hidden=i>=5);return;}
  items.forEach(x=>x.hidden=false);
  const sideHeight=side.getBoundingClientRect().height,gap=parseFloat(getComputedStyle(side).gap)||16;
  const watchHead=watch.querySelector('.panel-head').getBoundingClientRect().height;
  const content=watch.querySelector('#watch-body')?.firstElementChild?.getBoundingClientRect().height||180;
  const desiredWatch=Math.min(sideHeight*.4,Math.max(12*parseFloat(getComputedStyle(document.documentElement).fontSize),watchHead+content+2));
  const budget=Math.max(0,sideHeight-desiredWatch-calendar.getBoundingClientRect().height-gap*2-news.querySelector('.panel-head').getBoundingClientRect().height-2);
  const count=previewCount(items.map(x=>x.getBoundingClientRect().height),budget);items.forEach((x,i)=>x.hidden=i>=count);
 }
 function balance(){if(disposed||queued)return;queued=true;requestAnimationFrame(apply);}
 const observer=new ResizeObserver(balance);observer.observe(main);observer.observe(side);observer.observe(calendar);observer.observe(news);balance();
 return {balance,dispose(){disposed=true;observer.disconnect();}};
}
