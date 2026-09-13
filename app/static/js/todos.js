// Nemvai — Todos (Smart Suggestions + RLS, XSS-safe)

// إعادة ضبط الفلاتر لتظهر كافة المهام
function resetTaskFilters() {
  const statusEl = document.getElementById("filterStatus");
  const prioEl = document.getElementById("filterPrio");
  if (statusEl) statusEl.value = "";
  if (prioEl) prioEl.value = "";
}

async function loadSuggestions(){
  const box = document.getElementById("suggestions");
  if (!box) return;
  try {
    const data = await api("/api/tasks/suggestions");
    box.replaceChildren();
    if (!data.length) {
      const empty = document.createElement("div");
      empty.className = "muted";
      empty.textContent = t("todos.suggestionsEmpty");
      empty.style.padding = "12px";
      empty.style.textAlign = "center";
      box.appendChild(empty);
      return;
    }
    data.forEach(s => {
      const card = document.createElement("div");
      card.className = "sug";
      const icon = document.createElement("div");
      icon.textContent = s.icon || "💡";
      icon.style.fontSize = "1.2rem";

      // Dynamic i18n — backend sends keys, frontend translates (XSS-safe via textContent)
      const title = s.titleKey ? t(s.titleKey, s.titleParams || {}) : (s.title || "");
      const reason = s.reasonKey ? t(s.reasonKey, s.reasonParams || {}) : (s.reason || "");
      const h4 = document.createElement("h4");
      h4.textContent = title;
      const p = document.createElement("p");
      p.textContent = reason;
      const act = document.createElement("div");
      act.className = "act";
      const btn = document.createElement("button");
      btn.className = "btn btn-primary";
      btn.style.padding = "8px 12px";
      btn.style.fontSize = ".8rem";
      const label = s.action.labelKey ? t(s.action.labelKey) : (s.action.label || t("todos.addButton"));
      btn.textContent = label;

      btn.onclick = () => {
        const quickTitleKey = s.action.titleKey;
        const quickTitle = quickTitleKey ? t(quickTitleKey) : s.action.title;
        if (quickTitle) {
          api("/api/tasks", {
            method: "POST",
            body: JSON.stringify({
              title: quickTitle,
              category: s.action.category || "personal",
              priority: s.action.priority || "medium"
            })
          })
          .then(() => {
            resetTaskFilters(); // تصفير الفلتر لتظهر المهمة المقترحة فوراً
            toast(t("todos.added"));
            loadSuggestions();
            loadTasks();
          })
          .catch(e => toast(e.message, false));
        } else if (s.action.filter === "overdue") {
          const statusEl = document.getElementById("filterStatus");
          if (statusEl) statusEl.value = "";
          loadTasks({ overdue: true });
        } else if (s.action.filter === "high") {
          const prioEl = document.getElementById("filterPrio");
          if (prioEl) prioEl.value = "high";
          loadTasks();
        }
      };

      act.appendChild(btn);
      card.append(icon, h4, p, act);
      box.appendChild(card);
    });
  } catch(e) {
    box.replaceChildren();
    const err = document.createElement("div");
    err.className = "muted";
    err.textContent = t("todos.suggestionsError");
    err.style.padding = "10px";
    box.appendChild(err);
  }
}

async function loadTasks(extra = {}){
  const statusEl = document.getElementById("filterStatus");
  const prioEl = document.getElementById("filterPrio");
  const status = statusEl ? statusEl.value : "";
  const prio = prioEl ? prioEl.value : "";

  let q = "";
  const params = [];
  if (status) params.push(`status=${encodeURIComponent(status)}`);
  if (prio) params.push(`priority=${encodeURIComponent(prio)}`);
  if (params.length) q = "?" + params.join("&");

  try {
    const tasks = await api(`/api/tasks${q}`);
    const list = document.getElementById("tasksList");
    if (!list) return;
    list.replaceChildren();

    // إحصائيات المهام
    const total = tasks.length;
    const done = tasks.filter(t => t.status === "done").length;
    const statsEl = document.getElementById("todosStats");
    if (statsEl) {
      statsEl.textContent = t("todos.stats", { total, done, left: total - done });
    }

    let filtered = tasks;
    if (extra.overdue) {
      const today = new Date().toISOString().slice(0, 10);
      filtered = tasks.filter(t => t.due_date && t.due_date < today && t.status !== "done");
      if (!filtered.length) {
        const empty = document.createElement("div");
        empty.className = "muted";
        empty.textContent = t("todos.noOverdue");
        empty.style.textAlign = "center";
        empty.style.padding = "12px";
        list.appendChild(empty);
        return;
      }
    }

    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "muted";
      empty.textContent = t("todos.empty");
      empty.style.textAlign = "center";
      empty.style.padding = "12px";
      list.appendChild(empty);
      return;
    }

    filtered.forEach(task => {
      const row = document.createElement("div");
      row.className = "task" + (task.status === "done" ? " done" : "");

      const left = document.createElement("div");
      left.style.flex = "1";

      const h4 = document.createElement("h4");
      h4.textContent = task.title;

      const p = document.createElement("p");
      p.textContent = task.description || "—";

      const meta = document.createElement("div");
      meta.style.display = "flex";
      meta.style.gap = "6px";
      meta.style.marginTop = "6px";
      meta.style.flexWrap = "wrap";

      const badgeP = document.createElement("span");
      badgeP.className = "badge badge-" + task.priority;
      const prioKey = { low: "todos.priorityLow", medium: "todos.priorityMedium", high: "todos.priorityHigh", urgent: "todos.priorityUrgent" }[task.priority] || task.priority;
      badgeP.textContent = t(prioKey);

      const badgeC = document.createElement("span");
      badgeC.className = "badge";
      const catKey = { work: "todos.catWork", personal: "todos.catPersonal", study: "todos.catStudy", health: "todos.catHealth", other: "todos.catOther" }[task.category] || task.category;
      badgeC.textContent = t(catKey);

      meta.append(badgeP, badgeC);

      if (task.due_date) {
        const b = document.createElement("span");
        b.className = "badge";
        b.textContent = "📅 " + (typeof fmtDateLatin === "function" ? fmtDateLatin(task.due_date) : task.due_date);
        meta.append(b);
      }

      left.append(h4, p, meta);

      const actions = document.createElement("div");
      actions.className = "task-actions";

      const sel = document.createElement("select");
      sel.className = "select-sm";
      [
        ["todo", t("todos.statusTodo")],
        ["in_progress", t("todos.statusInProgress")],
        ["done", t("todos.statusDone")]
      ].forEach(([v, l]) => {
        const o = document.createElement("option");
        o.value = v;
        o.textContent = l;
        if (v === task.status) o.selected = true;
        sel.appendChild(o);
      });
      sel.onchange = () => updateTask(task.id, { status: sel.value });

      const del = document.createElement("button");
      del.className = "btn btn-ghost";
      del.textContent = (typeof currentLang !== "undefined" && currentLang === "en") ? "Delete" : (typeof currentLang !== "undefined" && currentLang === "fr") ? "Supprimer" : "حذف";
      del.onclick = () => deleteTask(task.id);

      actions.append(sel, del);
      row.append(left, actions);
      list.appendChild(row);
    });
  } catch(err) {
    toast(err.message, false);
  }
}

async function createTask(e){
  e.preventDefault();
  const titleEl = document.getElementById("t_title");
  const descEl = document.getElementById("t_desc");
  const catEl = document.getElementById("t_cat");
  const prioEl = document.getElementById("t_prio");
  const dueEl = document.getElementById("t_due");

  const payload = {
    title: titleEl ? titleEl.value.trim() : "",
    description: descEl ? descEl.value.trim() : "",
    category: catEl ? catEl.value : "personal",
    priority: prioEl ? prioEl.value : "medium",
    due_date: (dueEl && dueEl.value) ? dueEl.value : null
  };

  try {
    await api("/api/tasks", { method: "POST", body: JSON.stringify(payload) });
    if (e.target && typeof e.target.reset === "function") {
      e.target.reset();
    }
    // ✅ تصفير الفلاتر لضمان ظهور المهمة الجديدة مباشرة
    resetTaskFilters();
    toast(t("todos.added"));
    loadTasks();
    loadSuggestions();
  } catch(err) {
    toast(err.message || "فشل إنشاء المهمة", false);
  }
}

async function updateTask(id, patch){
  try {
    await api(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    toast(t("todos.updated"));
    loadTasks();
    loadSuggestions();
  } catch(err) {
    toast(err.message, false);
  }
}

async function deleteTask(id){
  if (!confirm(t("todos.deleteConfirm"))) return;
  try {
    await api(`/api/tasks/${id}`, { method: "DELETE" });
    toast(t("todos.deleted"));
    loadTasks();
    loadSuggestions();
  } catch(err) {
    toast(err.message, false);
  }
}

function refreshAll(){
  loadTasks();
  loadSuggestions();
}

// ربط الفلاتر بالتحميل عند التغيير
const filterStatusEl = document.getElementById("filterStatus");
const filterPrioEl = document.getElementById("filterPrio");
if (filterStatusEl) filterStatusEl.onchange = () => loadTasks();
if (filterPrioEl) filterPrioEl.onchange = () => loadTasks();

window.onLangChange = () => {
  loadTasks();
  loadSuggestions();
};

// التحميل المبدئي
loadSuggestions();
loadTasks();