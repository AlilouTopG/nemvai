// ArenaX — Pomodoro (local, secure, no server needed)
let totalSec = 25*60;
let leftSec = totalSec;
let timer=null;
let sessionsToday=0;

function fmt(s){
  const m=Math.floor(s/60).toString().padStart(2,"0");
  const sc=(s%60).toString().padStart(2,"0");
  return `${m}:${sc}`;
}
function render(){
  document.getElementById("timerTime").textContent=fmt(leftSec);
  const pct = totalSec? ((totalSec-leftSec)/totalSec*360):0;
  document.getElementById("timerRing").style.background=`conic-gradient(#7c3aed ${pct}deg, #2a2a3a ${pct}deg)`;
  // update page title
  if(timer) document.title=`${fmt(leftSec)} — ArenaX Focus`;
}
function pomSwitch(mins){
  const v=parseInt(mins,10);
  totalSec=v*60; leftSec=totalSec;
  document.getElementById("timerLabel").textContent= v<=15? "استراحة":"تركيز";
  clearInterval(timer); timer=null;
  render();
}
function pomStart(){
  if(timer) return;
  document.getElementById("timerLabel").textContent="يركّز الآن...";
  timer=setInterval(()=>{
    leftSec--;
    render();
    if(leftSec<=0){
      clearInterval(timer); timer=null;
      sessionsToday++;
      document.getElementById("statPom").textContent=sessionsToday;
      document.getElementById("timerLabel").textContent="انتهت الجلسة! 🎉";
      // beep via WebAudio (no external file)
      try{
        const ctx=new (window.AudioContext||window.webkitAudioContext)();
        const o=ctx.createOscillator(); const g=ctx.createGain();
        o.type="sine"; o.frequency.value=880; o.connect(g); g.connect(ctx.destination);
        g.gain.value=0.2; o.start(); setTimeout(()=>{o.stop(); ctx.close();},600);
      }catch{}
      if("Notification" in window && Notification.permission==="granted"){
        new Notification("ArenaX Pomodoro",{body:"انتهت جلسة التركيز — خذ استراحة!"});
      }
      // auto switch to break suggestion
      leftSec= totalSec;
      document.title="ArenaX — انتهى الوقت";
    }
  },1000);
}
function pomPause(){
  if(timer){ clearInterval(timer); timer=null; document.getElementById("timerLabel").textContent="متوقف مؤقتاً"; document.title="ArenaX — متوقف"; }
}
function pomReset(){
  clearInterval(timer); timer=null;
  leftSec=totalSec;
  document.getElementById("timerLabel").textContent="جاهز للتركيز";
  document.title="ArenaX — لوحة التحكم";
  render();
}
if("Notification" in window && Notification.permission==="default"){
  Notification.requestPermission().catch(()=>{});
}
render();
