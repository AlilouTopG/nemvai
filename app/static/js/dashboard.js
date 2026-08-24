// ArenaX — Dashboard (Secure, textContent only, no innerHTML injection)
function toast(msg, ok=true){
  const t=document.getElementById("toast");
  t.textContent=msg;
  t.style.borderColor= ok ? "rgba(6,214,160,.4)" : "rgba(239,68,68,.4)";
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),2600);
}
function authHeaders(){
  const h={};
  const tok=localStorage.getItem("ax_token");
  if(tok) h["Authorization"]="Bearer "+tok;
  const m=document.cookie.match(/csrf_access_token=([^;]+)/);
  if(m) h["X-CSRF-TOKEN"]=decodeURIComponent(m[1]);
  return h;
}
async function api(path, opts={}){
  opts.credentials="include";
  opts.headers={...(opts.headers||{}), ...authHeaders()};
  if(opts.body && typeof opts.body==="string") opts.headers["Content-Type"]="application/json";
  const res= await fetch(path, opts);
  let data=null;
  try{ data= await res.json(); }catch{}
  if(res.status===401){
    toast("انتهت الجلسة — سجل الدخول مجدداً",false);
    setTimeout(()=> location.href="/",1200);
    throw new Error("unauth");
  }
  if(!res.ok) throw new Error((data&&(data.error||data.msg))||`خطأ ${res.status}`);
  return data;
}

// ——— Auth check ———
async function loadMe(){
  try{
    const me= await api("/api/auth/me");
    if(!me.authenticated) throw new Error();
    document.getElementById("userLine").textContent = `مرحباً ${me.user.username} • ${me.user.email}`;
  }catch{
    location.href="/";
  }
}

// ——— Tasks ———
async function loadTasks(){
  const status=document.getElementById("filterStatus").value;
  const q=status?`?status=${encodeURIComponent(status)}`:"";
  const tasks= await api(`/api/tasks${q}`);
  const list=document.getElementById("tasksList");
  list.replaceChildren();
  document.getElementById("statTasks").textContent = tasks.length;
  const done=tasks.filter(t=>t.status==="done").length;
  const pct= tasks.length? Math.round(done/tasks.length*100):0;
  document.getElementById("progTasks").style.width=pct+"%";

  if(!tasks.length){
    const empty=document.createElement("div");
    empty.className="hint";
    empty.textContent="لا توجد مهام — أضف أول مهمة فاخرة ✨";
    empty.style.textAlign="center";
    empty.style.padding="12px";
    list.appendChild(empty);
    return;
  }
  tasks.forEach(t=>{
    const row=document.createElement("div");
    row.className="task"+(t.status==="done"?" done":"");
    const left=document.createElement("div");
    left.style.flex="1";
    const h4=document.createElement("h4");
    h4.textContent=t.title;
    const p=document.createElement("p");
    p.textContent=t.description||"—";
    const meta=document.createElement("div");
    meta.style.display="flex";meta.style.gap="6px";meta.style.marginTop="6px";meta.style.flexWrap="wrap";
    const badgeP=document.createElement("span");
    badgeP.className="badge badge-"+t.priority;
    badgeP.textContent={low:"منخفض",medium:"متوسط",high:"مرتفع",urgent:"عاجل"}[t.priority]||t.priority;
    const badgeC=document.createElement("span");
    badgeC.className="badge";
    badgeC.textContent={work:"عمل",personal:"شخصي",study:"دراسة",health:"صحة",other:"أخرى"}[t.category]||t.category;
    if(t.due_date){
      const badgeD=document.createElement("span");
      badgeD.className="badge";
      badgeD.textContent="📅 "+t.due_date;
      meta.append(badgeP,badgeC,badgeD);
    } else meta.append(badgeP,badgeC);
    left.append(h4,p,meta);

    const actions=document.createElement("div");
    actions.className="task-actions";
    const sel=document.createElement("select");
    sel.className="select-sm";
    [["todo","انتظار"],["in_progress","تنفيذ"],["done","مكتمل"]].forEach(([v,l])=>{
      const o=document.createElement("option");
      o.value=v;o.textContent=l;
      if(v===t.status) o.selected=true;
      sel.appendChild(o);
    });
    sel.onchange=()=> updateTask(t.id,{status:sel.value});
    const del=document.createElement("button");
    del.className="btn btn-ghost";
    del.textContent="حذف";
    del.onclick=()=> deleteTask(t.id);
    actions.append(sel,del);
    row.append(left,actions);
    list.appendChild(row);
  });
}
async function createTask(e){
  e.preventDefault();
  const payload={
    title: document.getElementById("t_title").value.trim(),
    description: document.getElementById("t_desc").value.trim(),
    category: document.getElementById("t_cat").value,
    priority: document.getElementById("t_prio").value,
    due_date: document.getElementById("t_due").value || null
  };
  try{
    await api("/api/tasks",{method:"POST", body: JSON.stringify(payload)});
    e.target.reset();
    toast("تمت إضافة المهمة ✅");
    loadTasks();
  }catch(err){ toast(err.message,false); }
}
async function updateTask(id, patch){
  try{
    await api(`/api/tasks/${id}`,{method:"PATCH", body: JSON.stringify(patch)});
    toast("تم التحديث");
    loadTasks();
  }catch(err){ toast(err.message,false); }
}
async function deleteTask(id){
  if(!confirm("حذف المهمة؟")) return;
  try{
    await api(`/api/tasks/${id}`,{method:"DELETE"});
    toast("تم الحذف");
    loadTasks();
  }catch(err){ toast(err.message,false); }
}

// ——— Habits ———
async function loadHabits(){
  const habits= await api("/api/habits");
  const list=document.getElementById("habitsList");
  list.replaceChildren();
  document.getElementById("statHabits").textContent=habits.length;
  const totalStreak=habits.reduce((a,h)=>a+(h.streak||0),0);
  document.getElementById("statStreak").textContent = habits.length? `إجمالي الستريك: ${totalStreak} 🔥` : "";

  if(!habits.length){
    const empty=document.createElement("div");
    empty.className="hint";
    empty.textContent="لا عادات بعد — ابدأ بعادة واحدة يومية";
    empty.style.textAlign="center";empty.style.padding="10px";
    list.appendChild(empty);
    return;
  }
  habits.forEach(h=>{
    const row=document.createElement("div");
    row.className="habit";
    const iconBox=document.createElement("div");
    iconBox.className="iconBox";
    iconBox.style.background=h.color+"22";
    iconBox.style.borderColor=h.color+"55";
    iconBox.textContent=h.icon||"🔥";
    const info=document.createElement("div");
    info.style.flex="1";
    const b=document.createElement("div");
    b.style.fontWeight="900";
    b.textContent=h.name;
    const desc=document.createElement("div");
    desc.className="muted";
    desc.style.fontSize=".8rem";
    desc.textContent=h.description||"—";
    info.append(b,desc);
    const streak=document.createElement("div");
    streak.className="streak";
    const bv=document.createElement("b");
    bv.textContent=(h.streak||0)+" 🔥";
    const sv=document.createElement("span");
    sv.textContent=h.completed_today?"مكتملة اليوم":"غير مكتملة";
    streak.append(bv,sv);
    const check=document.createElement("button");
    check.className="check"+(h.completed_today?" done":"");
    check.textContent= h.completed_today? "✓":"○";
    check.title="تبديل إنجاز اليوم";
    check.onclick=()=> toggleHabit(h.id);
    const del=document.createElement("button");
    del.className="btn btn-ghost";
    del.textContent="✕";
    del.style.marginInlineStart="6px";
    del.onclick=()=> deleteHabit(h.id);
    const actions=document.createElement("div");
    actions.style.display="flex";actions.style.alignItems="center";
    actions.append(check,del);
    row.append(iconBox,info,streak,actions);
    list.appendChild(row);
  });
}
async function createHabit(e){
  e.preventDefault();
  const payload={
    name: document.getElementById("h_name").value.trim(),
    icon: document.getElementById("h_icon").value.trim()||"🔥",
    color: document.getElementById("h_color").value
  };
  try{
    await api("/api/habits",{method:"POST", body: JSON.stringify(payload)});
    e.target.reset();
    document.getElementById("h_icon").value="🔥";
    document.getElementById("h_color").value="#8b5cf6";
    toast("تمت إضافة العادة 🔥");
    loadHabits();
  }catch(err){ toast(err.message,false); }
}
async function toggleHabit(id){
  try{
    await api(`/api/habits/${id}/toggle`,{method:"POST", body: JSON.stringify({})});
    toast("تم التحديث");
    loadHabits();
  }catch(err){ toast(err.message,false); }
}
async function deleteHabit(id){
  if(!confirm("حذف العادة وكل سجلاتها؟")) return;
  try{
    await api(`/api/habits/${id}`,{method:"DELETE"});
    toast("تم الحذف");
    loadHabits();
  }catch(err){ toast(err.message,false); }
}

async function logout(){
  try{ await api("/api/auth/logout",{method:"POST", body:"{}"}); }catch{}
  localStorage.removeItem("ax_token");
  location.href="/";
}
function refreshAll(){ loadTasks(); loadHabits(); }

// init
loadMe().then(()=>{ loadTasks(); loadHabits(); });
