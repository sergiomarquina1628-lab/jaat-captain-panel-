const SOURCE="https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json";

function pick(obj, keys){
  for(const k of keys){
    if(obj && obj[k]!==undefined && obj[k]!==null && String(obj[k]).trim()!=="") return obj[k];
  }
  return null;
}
function parseResult(item){
  const period=pick(item,["issueNumber","issue","period","periodNumber","code","numberIssue"]);
  let result=pick(item,["number","result","openNumber","winningNumber","winNumber"]);
  if(result!==null){
    const m=String(result).match(/[0-9]/); result=m?Number(m[0]):null;
  }
  return period!==null&&result!==null?{period:String(period),result}:null;
}
export async function onRequestGet(){
  try{
    const r=await fetch(SOURCE,{headers:{"Accept":"application/json","User-Agent":"Mozilla/5.0"}});
    if(!r.ok) throw new Error("Source HTTP "+r.status);
    const j=await r.json();
    const arr=Array.isArray(j?.data)?j.data:Array.isArray(j?.data?.list)?j.data.list:Array.isArray(j?.result?.data)?j.result.data:Array.isArray(j)?j:[];
    const parsed=arr.map(parseResult).filter(Boolean);
    if(parsed.length<2) throw new Error("Source returned fewer than two usable results");
    // The first item is normally the newest settled period. The second item
    // is therefore the previous period, matching the requested one-period delay.
    const delayed=parsed[1];
    return Response.json({live:true,latest:delayed,history:parsed.slice(1,31),source:"WinGo_1M"},{
      headers:{"Cache-Control":"no-store","Access-Control-Allow-Origin":"*"}
    });
  }catch(e){
    return Response.json({live:false,latest:null,history:[],error:e.message},{
      status:502,headers:{"Cache-Control":"no-store","Access-Control-Allow-Origin":"*"}
    });
  }
}