// Migrate earlier local installations without exporting any browser records.
try{for(const key of ["zeki.alerts", "zeki.holdings", "zeki.interval", "zeki.symbol", "zeki.watch"]){const next=key.replace('zeki.','clarity.');if(localStorage.getItem(next)===null&&localStorage.getItem(key)!==null)localStorage.setItem(next,localStorage.getItem(key));}}catch{}
