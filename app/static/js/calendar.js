// Nemvai — Calendar (dedicated, RLS, XSS-safe)
let cur = new Date();
let tasksCache=[];
async function fetchTasks(){
  tasksCache = await api("/api/tasks");
}
function fmtDate(d){ return d.toISOString().slice(0,10); }
function render(){
  const y=cur.getFullYear(), m=cur.getMonth();
  // Latin numerals enforced — month name via i18n, year via en-US
  document.getElementById("calTitle").textContent = fmtMonthYearLatin(cur, currentLang);
  const first=new Date(y,m,1), last=new Date(y,m+1,0);
  const startIdx = first.getDay();
  const daysInMonth=last.getDate();
  const grid=document.getElementById("calGrid");
  grid.replaceChildren();
  // headers — translated weekdays via i18n, Latin not needed for names
  const weekdaysStr = t("calendar.weekdays");
  const weekdays = weekdaysStr.split(",");
  weekdays.forEach(w=>{
    const h=document.createElement("div"); h.className="muted"; h.style.textAlign="center"; h.style.fontSize=".75rem"; h.textContent=w; grid.appendChild(h);
  });
  // blanks
  for(let i=0;i<startIdx;i++){ const blank=document.createElement("div"); blank.className="cal-cell"; blank.style.opacity=".35"; grid.appendChild(blank); }
  for(let d=1; d<=daysInMonth; d++){
    const cell=document.createElement("div"); cell.className="cal-cell";
    const dateObj=new Date(y,m,d);
    const iso=fmtDate(dateObj);
    if(iso===fmtDate(new Date())) cell.classList.add("today");
    const day=document.createElement("div"); day.className="day"; day.textContent=fmtNum(d);
    const count=document.createElement("div"); count.className="muted";
    const dayTasks=tasksCache.filter(t=> t.due_date===iso);
    const tasksLabel = currentLang==="en" ? "tasks" : currentLang==="fr" ? "tâches" : "مهام";
    count.textContent = dayTasks.length? `${fmtNum(dayTasks.length)} ${tasksLabel}` : "";
    cell.append(day,count);
    dayTasks.slice(0,3).forEach(t=>{
      const el=document.createElement("div"); el.className="cal-task"+(t.priority==="high"||t.priority==="urgent"?" high":"");
      el.textContent=t.title;
      if(t.status==="done") el.style.opacity=".6";
      cell.appendChild(el);
    });
    if(dayTasks.length>3){ const more=document.createElement("div"); more.className="muted"; more.style.fontSize=".7rem"; const moreLabel = currentLang==="en" ? "more" : currentLang==="fr" ? "autres" : "أخرى"; more.textContent=`+${fmtNum(dayTasks.length-3)} ${moreLabel}`; cell.appendChild(more); }
    cell.style.cursor="pointer";
    cell.onclick=()=> showDay(iso);
    grid.appendChild(cell);
  }
}
function showDay(iso){
  document.getElementById("calDayLabel").textContent=fmtDateLatin(iso);
  const box=document.getElementById("calDayTasks");
  box.replaceChildren();
  const dayTasks=tasksCache.filter(t=> t.due_date===iso);
  if(!dayTasks.length){ const empty=document.createElement("div"); empty.textContent=t("calendar.noTasks"); empty.className="muted"; box.appendChild(empty); return; }
  dayTasks.forEach(t=>{
    const row=document.createElement("div"); row.style.padding="8px"; row.style.border="1px solid var(--border)"; row.style.borderRadius="10px"; row.style.marginTop="6px"; row.style.background="#0f0f17";
    const h4=document.createElement("div"); h4.textContent=t.title; h4.style.fontWeight="800";
    const meta=document.createElement("div"); meta.className="muted"; meta.style.fontSize=".75rem"; meta.textContent=`${t.category} • ${t.priority} • ${t.status}`;
    row.append(h4,meta);
    box.appendChild(row);
  });
}
function shiftMonth(d){ cur.setMonth(cur.getMonth()+d); render(); }
function goToday(){ cur=new Date(); render(); }
function refreshAll(){ fetchTasks().then(render); }
window.onLangChange = ()=>{ render(); };
fetchTasks().then(()=>{ render(); showDay(fmtDate(new Date())); });
