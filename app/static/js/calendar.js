// Nemvai — Calendar Journal (dedicated, RLS, XSS-safe, Latin, i18n)
let cur = new Date();
let tasksCache=[];
let selectedIso=null;

async function fetchTasks(){
  tasksCache = await api("/api/tasks");
}
function fmtDate(d){ return d.toISOString().slice(0,10); }

function calcDayDiff(targetIso){
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(targetIso+"T00:00:00");
  target.setHours(0,0,0,0);
  const diffMs = target - today;
  const diffDays = Math.round(diffMs / (1000*60*60*24));
  return diffDays;
}
function renderDiff(targetIso){
  const box=document.getElementById("dateDiff");
  if(!targetIso){ box.style.display="none"; return; }
  const diff = calcDayDiff(targetIso);
  box.replaceChildren();
  box.style.display="inline-flex";
  const icon=document.createElement("span"); icon.textContent="📅";
  const text=document.createElement("span");
  if(diff===0){
    text.textContent = t("calendar.diffToday");
    box.style.borderColor="var(--primary)";
  } else if(diff>0){
    text.textContent = t("calendar.diffIn", {count: diff});
    box.style.borderColor="var(--accent)";
  } else {
    text.textContent = t("calendar.diffAgo", {count: Math.abs(diff)});
    box.style.borderColor="var(--warn)";
  }
  // Latin numerals already via t() fmtNum
  const badge=document.createElement("span"); badge.className="badge"; badge.textContent=fmtDateLatin(targetIso);
  box.append(icon,text,badge);
}

function render(){
  const y=cur.getFullYear(), m=cur.getMonth();
  // Latin year fix — no grouping
  document.getElementById("calTitle").textContent = fmtMonthYearLatin(cur, currentLang);
  // subtitle: e.g., 2026 • 30 days — Latin
  const daysInMonth=new Date(y,m+1,0).getDate();
  document.getElementById("calSubtitle").textContent = `${fmtNum(daysInMonth)} ${currentLang==="en"?"days":currentLang==="fr"?"jours":"يوم"} • ${fmtNum(y)}`;
  const first=new Date(y,m,1), last=new Date(y,m+1,0);
  const startIdx = first.getDay();
  const grid=document.getElementById("calGrid");
  grid.replaceChildren();
  const weekdaysStr = t("calendar.weekdays");
  const weekdays = weekdaysStr.split(",");
  weekdays.forEach(w=>{
    const h=document.createElement("div"); h.className="cal-head-week"; h.textContent=w; grid.appendChild(h);
  });
  for(let i=0;i<startIdx;i++){ const blank=document.createElement("div"); blank.className="cal-cell"; blank.style.opacity=".25"; blank.style.cursor="default"; grid.appendChild(blank); }
  for(let d=1; d<=daysInMonth; d++){
    const cell=document.createElement("div"); cell.className="cal-cell";
    const dateObj=new Date(y,m,d);
    const iso=fmtDate(dateObj);
    if(iso===fmtDate(new Date())) cell.classList.add("today");
    if(iso===selectedIso) cell.classList.add("selected");
    const day=document.createElement("div"); day.className="day"+(iso===fmtDate(new Date())?" today-num":""); day.textContent=fmtNum(d);
    const count=document.createElement("div"); count.className="muted"; count.style.fontSize=".7rem";
    const dayTasks=tasksCache.filter(t=> t.due_date===iso);
    const tasksLabel = currentLang==="en" ? "tasks" : currentLang==="fr" ? "tâches" : "مهام";
    count.textContent = dayTasks.length? `${fmtNum(dayTasks.length)} ${tasksLabel}` : "";
    cell.append(day,count);
    dayTasks.slice(0,3).forEach(t=>{
      const el=document.createElement("div"); el.className="cal-task"+(t.priority==="high"||t.priority==="urgent"?" high":"");
      el.textContent=t.title; // XSS-safe textContent
      if(t.status==="done") el.style.opacity=".6";
      cell.appendChild(el);
    });
    if(dayTasks.length>3){ const more=document.createElement("div"); more.className="muted"; more.style.fontSize=".7rem"; const moreLabel = currentLang==="en" ? "more" : currentLang==="fr" ? "autres" : "أخرى"; more.textContent=`+${fmtNum(dayTasks.length-3)} ${moreLabel}`; cell.appendChild(more); }
    cell.onclick=()=> { selectedIso=iso; render(); showDay(iso); renderDiff(iso); };
    grid.appendChild(cell);
  }
  // keep diff in sync
  if(selectedIso) renderDiff(selectedIso);
  // update add form title
  const addTitle=document.getElementById("calAddTitle");
  if(selectedIso && addTitle){
    addTitle.textContent = t("calendar.addForDate", {date: fmtDateLatin(selectedIso)});
  }
}

function showDay(iso){
  selectedIso = iso;
  document.getElementById("calDayLabel").textContent=fmtDateLatin(iso);
  renderDiff(iso);
  // highlight selected
  document.querySelectorAll(".cal-cell").forEach(c=> c.classList.remove("selected"));
  // re-render to apply selected class (simple)
  render();
  const box=document.getElementById("calDayTasks");
  box.replaceChildren();
  const dayTasks=tasksCache.filter(t=> t.due_date===iso);
  if(!dayTasks.length){
    const empty=document.createElement("div"); empty.textContent=t("calendar.noTasks"); empty.className="muted"; box.appendChild(empty);
  } else {
    dayTasks.forEach(t=>{
      const row=document.createElement("div"); row.className="task-row-mini";
      const left=document.createElement("div"); left.style.flex="1";
      const h4=document.createElement("div"); h4.textContent=t.title; h4.style.fontWeight="800";
      const meta=document.createElement("div"); meta.className="muted"; meta.style.fontSize=".75rem";
      const catKey={work:"todos.catWork",personal:"todos.catPersonal",study:"todos.catStudy",health:"todos.catHealth",other:"todos.catOther"}[t.category]||t.category;
      const prioKey={low:"todos.priorityLow",medium:"todos.priorityMedium",high:"todos.priorityHigh",urgent:"todos.priorityUrgent"}[t.priority]||t.priority;
      meta.textContent=`${t(catKey)} • ${t(prioKey)} • ${t("todos.status"+t.status.charAt(0).toUpperCase()+t.status.slice(1)) || t.status}`;
      // quick status
      left.append(h4,meta);
      const actions=document.createElement("div"); actions.style.display="flex"; actions.style.gap="6px";
      const sel=document.createElement("select"); sel.className="select-sm";
      [["todo",t("todos.statusTodo")],["in_progress",t("todos.statusInProgress")],["done",t("todos.statusDone")]].forEach(([v,l])=>{
        const o=document.createElement("option"); o.value=v; o.textContent=l; if(v===t.status) o.selected=true; sel.appendChild(o);
      });
      sel.onchange=()=> api(`/api/tasks/${t.id}`,{method:"PATCH", body: JSON.stringify({status: sel.value})}).then(()=>{ toast(t("todos.updated")); fetchTasks().then(()=>{ render(); showDay(iso); }); }).catch(e=> toast(e.message,false));
      const del=document.createElement("button"); del.className="btn btn-ghost"; del.textContent="✕"; del.onclick=()=>{ if(!confirm(t("todos.deleteConfirm"))) return; api(`/api/tasks/${t.id}`,{method:"DELETE"}).then(()=>{ toast(t("todos.deleted")); fetchTasks().then(()=>{ render(); showDay(iso); }); }).catch(e=> toast(e.message,false)); };
      actions.append(sel,del);
      row.append(left,actions);
      box.appendChild(row);
    });
  }
  // update add form title
  const addTitle=document.getElementById("calAddTitle");
  if(addTitle) addTitle.textContent = t("calendar.addForDate", {date: fmtDateLatin(iso)});
}

async function addTaskForDate(e){
  e.preventDefault();
  if(!selectedIso){ toast(t("calendar.noTasks"), false); return; }
  const titleEl=document.getElementById("cal_task_title");
  const title=titleEl.value.trim();
  if(!title) return;
  const prio=document.getElementById("cal_task_prio").value;
  const cat=document.getElementById("cal_task_cat").value;
  try{
    await api("/api/tasks",{method:"POST", body: JSON.stringify({title, category:cat, priority:prio, due_date: selectedIso})});
    titleEl.value="";
    toast(t("todos.added"));
    await fetchTasks(); render(); showDay(selectedIso);
  }catch(err){ toast(err.message,false); }
}

function shiftMonth(d){ cur.setMonth(cur.getMonth()+d); render(); }
function goToday(){ cur=new Date(); selectedIso=fmtDate(new Date()); render(); showDay(selectedIso); }
function refreshAll(){ fetchTasks().then(()=>{ render(); if(selectedIso) showDay(selectedIso); }); }
window.onLangChange = ()=>{ render(); if(selectedIso) showDay(selectedIso); };
fetchTasks().then(()=>{ selectedIso=fmtDate(new Date()); render(); showDay(selectedIso); });
