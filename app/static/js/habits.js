// Nemvai — Habits Rich Page (RLS, XSS-safe, Latin numerals)
async function loadStats(){
  const s= await api("/api/habits/stats");
  document.getElementById("st_total").textContent=fmtNum(s.total);
  document.getElementById("st_today").textContent=fmtNum(s.completed_today);
  document.getElementById("st_avg").textContent=fmtNum(s.avg_streak);
  document.getElementById("st_best").textContent=fmtNum(s.best_streak)+" 🔥";
  document.getElementById("st_rate").textContent=fmtNum(s.completion_rate)+"%";
  document.getElementById("st_logs").textContent=fmtNum(s.total_logs);
}
async function loadHabits(){
  const habits= await api("/api/habits");
  const list=document.getElementById("habitsList");
  list.replaceChildren();
  if(!habits.length){
    const empty=document.createElement("div"); empty.className="muted"; empty.textContent=t("habits.empty"); empty.style.textAlign="center"; empty.style.padding="12px"; list.appendChild(empty); return;
  }
  for(const h of habits){
    const card=document.createElement("div"); card.className="habit-detailed";
    const top=document.createElement("div"); top.className="habit-top";
    const iconBox=document.createElement("div"); iconBox.style.width="48px"; iconBox.style.height="48px"; iconBox.style.borderRadius="12px"; iconBox.style.display="grid"; iconBox.style.placeItems="center"; iconBox.style.fontSize="1.4rem"; iconBox.style.border="1px solid var(--border)"; iconBox.style.background=h.color+"22"; iconBox.textContent=h.icon||"🔥";
    const info=document.createElement("div"); info.style.flex="1";
    const name=document.createElement("div"); name.style.fontWeight="900"; name.textContent=h.name;
    const desc=document.createElement("div"); desc.className="muted"; desc.style.fontSize=".8rem"; desc.textContent=h.description||"—";
    info.append(name,desc);
    const streak=document.createElement("div"); streak.style.textAlign="center";
    const b=document.createElement("b"); b.textContent=fmtNum(h.streak||0)+" 🔥"; b.style.fontSize="1.1rem";
    const span=document.createElement("span"); span.className="muted"; span.style.fontSize=".7rem"; span.textContent=h.completed_today?t("habits.completedToday"):t("habits.notCompleted");
    streak.append(b,span);
    const check=document.createElement("button"); check.className="check"+(h.completed_today?" done":""); check.textContent=h.completed_today?"✓":"○"; check.title=t("habits.completedToday"); check.onclick=()=> toggleHabit(h.id);
    const del=document.createElement("button"); del.className="btn btn-ghost"; del.textContent="✕"; del.onclick=()=> deleteHabit(h.id);
    const actions=document.createElement("div"); actions.style.display="flex"; actions.style.gap="8px"; actions.style.alignItems="center"; actions.append(check,del);
    top.append(iconBox,info,streak,actions);
    // meta — rich details (frequency, duration, target) + i18n Latin
    const meta=document.createElement("div"); meta.className="habit-meta";
    const badge1=document.createElement("span"); badge1.className="badge"; badge1.textContent=`${t("habits.streak")} ${fmtNum(h.streak)}`;
    const badge2=document.createElement("span"); badge2.className="badge"; badge2.textContent=`${fmtNum(h.frequency_per_week||7)}/7 ${currentLang==="en"?"per week":currentLang==="fr"?"par sem.":"في الأسبوع"}`;
    const badge3=document.createElement("span"); badge3.className="badge"; badge3.textContent=`${fmtNum(h.duration_minutes||30)}m`;
    const badge4=document.createElement("span"); badge4.className="badge"; badge4.textContent=`${fmtNum(h.target_months||1)} ${currentLang==="en"?"mo":currentLang==="fr"?"mois":"شهر"}`;
    const badgeColor=document.createElement("span"); badgeColor.className="badge"; badgeColor.textContent=`${h.color}`;
    meta.append(badge1,badge2,badge3,badge4,badgeColor);
    // mini heatmap
    const heat=document.createElement("div"); heat.className="log-grid";
    try{
      const logs= await api(`/api/habits/logs?habit_id=${h.id}`);
      const map=new Set(logs.filter(l=>l.completed).map(l=>l.log_date));
      for(let i=13;i>=0;i--){
        const d=new Date(); d.setDate(d.getDate()-i);
        const iso=d.toISOString().slice(0,10);
        const cell=document.createElement("div"); cell.className="log-cell"+(map.has(iso)?" done":""); cell.title=iso;
        heat.appendChild(cell);
      }
    }catch{}
    card.append(top,meta,heat);
    list.appendChild(card);
  }
}
function openHabitModal(){
  const m=document.getElementById("habitModal");
  if(m) m.classList.add("open");
  // re-apply i18n for modal
  if(typeof applyTranslations==='function') applyTranslations();
}
function closeHabitModal(){
  const m=document.getElementById("habitModal");
  if(m) m.classList.remove("open");
}
async function submitHabitModal(e){
  e.preventDefault();
  const payload={
    name: document.getElementById("m_name").value.trim(),
    description: document.getElementById("m_desc").value.trim(),
    icon: document.getElementById("m_icon").value.trim()||"🔥",
    color: document.getElementById("m_color").value,
    frequency_per_week: parseInt(document.getElementById("m_freq").value,10),
    duration_minutes: parseInt(document.getElementById("m_duration").value,10),
    target_months: parseInt(document.getElementById("m_target").value,10)
  };
  try{
    await api("/api/habits",{method:"POST", body: JSON.stringify(payload)});
    closeHabitModal();
    e.target.reset();
    // reset defaults
    document.getElementById("m_icon").value="🔥";
    document.getElementById("m_color").value="#8b5cf6";
    document.getElementById("m_freq").value="3";
    document.getElementById("m_duration").value="30";
    document.getElementById("m_target").value="1";
    toast(t("habits.added"));
    loadStats(); loadHabits();
  }catch(err){ toast(err.message,false); }
}
// Legacy alias for old inline form (if any)
async function createHabit(e){ return submitHabitModal(e); }
async function toggleHabit(id){ try{ await api(`/api/habits/${id}/toggle`,{method:"POST", body: JSON.stringify({})}); toast(t("habits.updated")); loadStats(); loadHabits(); }catch(err){ toast(err.message,false); } }
async function deleteHabit(id){ if(!confirm(t("habits.deleteConfirm")))return; try{ await api(`/api/habits/${id}`,{method:"DELETE"}); toast(t("habits.deleted")); loadStats(); loadHabits(); }catch(err){ toast(err.message,false); } }
function refreshAll(){ loadStats(); loadHabits(); }
window.onLangChange = ()=>{ loadStats(); loadHabits(); };
loadStats(); loadHabits();
