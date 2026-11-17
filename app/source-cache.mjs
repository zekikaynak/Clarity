// HTTP source health records the last real attempt. Failed jobs are retried with bounded backoff.
export function createSourceCache({now=()=>Date.now(),retryBase=30000,retryMax=300000,maxJobs=256}={}){
 const values=new Map(),jobs=new Map(),inflight=new Map(),diagnostics=new Map();let sweeping=false;
 async function execute(key,job){
  if(inflight.has(key))return inflight.get(key);
  if(diagnostics.has(key))diagnostics.set(key,{...diagnostics.get(key),retrying:true});
  const promise=Promise.resolve().then(async()=>{
   try{const data=await job.fn(),at=now(),value={data,fetchedAt:at,stale:false};values.set(key,value);diagnostics.set(key,{ok:true,at,lastSuccess:at,failures:0,nextRetry:null,retrying:false});return value;}
   catch(e){const previous=diagnostics.get(key),failures=(previous?.failures||0)+1,at=now();diagnostics.set(key,{ok:false,error:String(e.message||e),at,lastSuccess:previous?.lastSuccess??values.get(key)?.fetchedAt??null,failures,retrying:false,nextRetry:at+Math.min(retryMax,retryBase*2**Math.min(failures-1,8))});const old=values.get(key);if(old)return {...old,stale:true,error:String(e.message||e)};throw e;}
   finally{inflight.delete(key);}
  });inflight.set(key,promise);return promise;
 }
 async function cached(key,ttl,fn){
  jobs.set(key,{ttl,fn});if(jobs.size>maxJobs){for(const oldKey of jobs.keys()){if(oldKey!==key&&!inflight.has(oldKey)){jobs.delete(oldKey);values.delete(oldKey);diagnostics.delete(oldKey);break;}}}
  const old=values.get(key),health=diagnostics.get(key);
  if(inflight.has(key))return inflight.get(key);
  if(health?.ok===false&&health.nextRetry>now()){if(old)return {...old,stale:true,error:health.error};throw Error(health.error);}
  if(old&&health?.ok!==false&&now()-old.fetchedAt<ttl)return {...old,stale:false};
  return execute(key,jobs.get(key));
 }
 async function retryFailed({force=false}={}){
  if(sweeping)return {started:0};sweeping=true;
  try{const pending=[...diagnostics].filter(([key,d])=>!d.ok&&jobs.has(key)&&!inflight.has(key)&&(force||d.nextRetry<=now())).slice(0,8);let started=0;for(let i=0;i<pending.length;i+=2){await Promise.allSettled(pending.slice(i,i+2).map(([key])=>{started++;return execute(key,jobs.get(key));}));}return {started};}finally{sweeping=false;}
 }
 return {cached,diagnostics,retryFailed};
}
