// Nemvai — Todos (Smart Suggestions + RLS, XSS-safe)
async function loadSuggestions(){
  const box=document.getElementById("suggestions");
  try{
    const data= await api("/api/tasks/suggestions");
    box.replaceChildren();
    if(!data.length){
      const empty=document.createElement("div");
      empty.className="muted"; empty.textContent="لا اقتراحات حالياً — أنت على المسار الصحيح ✨";
      empty.style.padding="12px"; empty.style.textAlign="center";
      box.appendChild(empty); return;
    }
    data.forEach(s=>{
      const card=document.createElement("div"); card.className="sug";
      const icon=document.createElement("div"); icon.textContent=s.icon||"💡"; icon.style.fontSize="1.2rem";
      const h4=document.createElement("h4"); h4.textContent=s.title;
      const p=document.createElement("p"); p.textContent=s.reason;
      const act=document.createElement("div"); act.className="act";
      const btn=document.createElement("button"); btn.className="btn btn-primary"; btn.style.padding="8px 12px"; btn.style.fontSize=".8rem";
      btn.textContent=s.action.label||"تطبيق";
      btn.onclick=()=>{
        if(s.action.title){
          // quick-add
          api("/api/tasks",{method:"POST", body: JSON.stringify({title:s.action.title, category:s.action.category||"personal", priority:s.action.priority||"medium"})})
            .then(()=>{ toast("تمت إضافة اقتراح ✓"); loadSuggestions(); loadTasks(); })
            .catch(e=> toast(e.message,false));
        } else if(s.action.filter==="overdue"){
          document.getElementById("filterStatus").value=""; loadTasks({overdue:true});
        } else if(s.action.filter==="high"){
          document.getElementById("filterPrio").value="high"; loadTasks();
        }
      };
      act.appendChild(btn);
      card.append(icon,h4,p,act);
      box.appendChild(card);
    });
  }catch(e){
    box.replaceChildren();
    const err=document.createElement("div"); err.className="muted"; err.textContent="تعذر تحميل الاقتراحات";
    err.style.padding="10px"; box.appendChild(err);
  }
}

async function loadTasks(extra={}){
  const status=document.getElementById("filterStatus").value;
  const prio=document.getElementById("filterPrio").value;
  let q="";
  const params=[];
  if(status) params.push(`status=${encodeURIComponent(status)}`);
  if(prio) params.push(`priority=${encodeURIComponent(prio)}`);
  // note: overdue is client-side filter
  if(params.length) q="?"+params.join("&");
  const tasks= await api(`/api/tasks${q}`);
  const list=document.getElementById("tasksList");
  list.replaceChildren();
  // stats
  const total=tasks.length, done=tasks.filter(t=>t.status==="done").length;
  document.getElementById("todosStats").textContent = `${total} مهمة • ${done} مكتملة • ${total-done} متبقية`;
  let filtered=tasks;
  if(extra.overdue){
    const today=new Date().toISOString().slice(0,10);
    filtered=tasks.filter(t=> t.due_date && t.due_date < today && t.status!=="done");
    if(!filtered.length){ const empty=document.createElement("div"); empty.className="muted"; empty.textContent="لا مهام متأخرة 🎉"; empty.style.textAlign="center"; empty.style.padding="12px"; list.appendChild(empty); return; }
  }
  if(!filtered.length){
    const empty=document.createElement("div"); empty.className="muted"; empty.textContent="لا مهام — أضف أول مهمة ✨"; empty.style.textAlign="center"; empty.style.padding="12px"; list.appendChild(empty); return;
  }
  filtered.forEach(t=>{
    const row=document.createElement("div"); row.className="task"+(t.status==="done"?" done":"");
    const left=document.createElement("div"); left.style.flex="1";
    const h4=document.createElement("h4"); h4.textContent=t.title;
    const p=document.createElement("p"); p.textContent=t.description||"—";
    const meta=document.createElement("div"); meta.style.display="flex"; meta.style.gap="6px"; meta.style.marginTop="6px"; meta.style.flexWrap="wrap";
    const badgeP=document.createElement("span"); badgeP.className="badge badge-"+t.priority; badgeP.textContent={low:"منخفض",medium:"متوسط",high:"مرتفع",urgent:"عاجل"}[t.priority]||t.priority;
    const badgeC=document.createElement("span"); badgeC.className="badge"; badgeC.textContent={work:"عمل",personal:"شخصي",study:"دراسة",health:"صحة",other:"أخرى"}[t.category]||t.category;
    meta.append(badgeP,badgeC);
    if(t.due_date){ const b=document.createElement("span"); b.className="badge"; b.textContent="📅 "+t.due_date; meta.append(b); }
    left.append(h4,p,meta);
    const actions=document.createElement("div"); actions.className="task-actions";
    const sel=document.createElement("select"); sel.className="select-sm";
    [["todo","انتظار"],["in_progress","تنفيذ"],["done","مكتمل"]].forEach(([v,l])=>{ const o=document.createElement("option"); o.value=v; o.textContent=l; if(v===t.status) o.selected=true; sel.appendChild(o); });
    sel.onchange=()=> updateTask(t.id,{status:sel.value});
    const del=document.createElement("button"); del.className="btn btn-ghost"; del.textContent="حذف"; del.onclick=()=> deleteTask(t.id);
    actions.append(sel,del);
    row.append(left,actions);
    list.appendChild(row);
  });
}
async function createTask(e){
  e.preventDefault();
  const payload={ title: document.getElementById("t_title").value.trim(), description: document.getElementById("t_desc").value.trim(), category: document.getElementById("t_cat").value, priority: document.getElementById("t_prio").value, due_date: document.getElementById("t_due").value || null };
  try{ await api("/api/tasks",{method:"POST", body: JSON.stringify(payload)}); e.target.reset(); toast("تمت إضافة المهمة ✅"); loadTasks(); loadSuggestions(); }catch(err){ toast(err.message,false); }
}
async function updateTask(id,patch){ try{ await api(`/api/tasks/${id}`,{method:"PATCH", body: JSON.stringify(patch)}); toast("تم التحديث"); loadTasks(); loadSuggestions(); }catch(err){ toast(err.message,false); } }
async function deleteTask(id){ if(!confirm("حذف المهمة؟"))return; try{ await api(`/api/tasks/${id}`,{method:"DELETE"}); toast("تم الحذف"); loadTasks(); loadSuggestions(); }catch(err){ toast(err.message,false); } }
function refreshAll(){ loadTasks(); loadSuggestions(); }
loadSuggestions(); loadTasks();
