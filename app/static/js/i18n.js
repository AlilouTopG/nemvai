// Nemvai i18n — lightweight, XSS-safe, Latin numerals enforced
const NEMVAI_I18N = {
  en: {
    "app.name": "Nemvai",
    "app.tagline": "SECURE BY DESIGN • CLOUD READY",
    "nav.todos": "📋 Tasks",
    "nav.calendar": "🗓️ Calendar",
    "nav.habits": "🔥 Habits",
    "nav.refresh": "Refresh",
    "nav.logout": "Logout",
    "nav.checking": "Checking...",
    "toast.unauth": "Session expired — please login again",
    "toast.error": "Error",
    // Todos
    "todos.title": "📋 Smart Tasks — Exclusive Page",
    "todos.stats": "{total} tasks • {done} done • {left} remaining",
    "todos.suggestionsTitle": "✨ Smart Suggestions",
    "todos.suggestionsSubtitle": "Based on your tasks context • auto-updates",
    "todos.suggestionsLoading": "Analyzing your tasks context...",
    "todos.suggestionsEmpty": "No suggestions now — you're on track ✨",
    "todos.suggestionsError": "Could not load suggestions",
    "todos.manageTitle": "Manage Tasks",
    "todos.filterAll": "All",
    "todos.filterTodo": "Pending",
    "todos.filterInProgress": "In Progress",
    "todos.filterDone": "Done",
    "todos.filterPrioAll": "All priorities",
    "todos.titlePlaceholder": "Task title — e.g., Finish Nemvai design",
    "todos.descPlaceholder": "Description (optional)",
    "todos.catWork": "Work", "todos.catPersonal": "Personal", "todos.catStudy": "Study", "todos.catHealth": "Health", "todos.catOther": "Other",
    "todos.prioLow": "Low", "todos.prioMedium": "Medium", "todos.prioHigh": "High", "todos.prioUrgent": "Urgent",
    "todos.addButton": "Add task +",
    "todos.empty": "No tasks — add your first ✨",
    "todos.noOverdue": "No overdue tasks 🎉",
    "todos.deleteConfirm": "Delete task?",
    "todos.added": "Task added ✅",
    "todos.updated": "Updated",
    "todos.deleted": "Deleted",
    "todos.statusTodo": "Pending", "todos.statusInProgress": "In Progress", "todos.statusDone": "Done",
    "todos.priorityLow": "Low", "todos.priorityMedium": "Medium", "todos.priorityHigh": "High", "todos.priorityUrgent": "Urgent",
    // Suggestions — dynamic keys (backend sends keys, frontend translates)
    "suggestions.overdue.title": "You have {count} overdue tasks",
    "suggestions.overdue.reason": "Focus on overdue dates first",
    "suggestions.overdue.action": "Show overdue",
    "suggestions.high.title": "{count} high-priority tasks waiting",
    "suggestions.high.reason": "Start with the most important — 80/20 rule",
    "suggestions.high.action": "Focus high",
    "suggestions.starter.title": "Start your day — 3 suggested tasks",
    "suggestions.starter.reason": "Quick templates to add",
    "suggestions.starter.action": "Add: Morning planning",
    "suggestions.starter.taskTitle": "Morning planning • Goal review",
    "suggestions.quick_health.title": "Quick suggestion: health",
    "suggestions.quick_health.reason": "Small habit makes a difference",
    "suggestions.quick_health.action": "Add: 15-min walk",
    "suggestions.quick_health.taskTitle": "15-min walk",
    "suggestions.morning.title": "Morning productivity",
    "suggestions.morning.reason": "Use first 2 hours for your top task",
    "suggestions.morning.action": "Add: Deep focus 50m",
    "suggestions.morning.taskTitle": "Deep focus — no distractions",
    "suggestions.evening.title": "Evening review",
    "suggestions.evening.reason": "Review what you did and plan tomorrow",
    "suggestions.evening.action": "Add: Daily review",
    "suggestions.evening.taskTitle": "Daily review — 3 wins",
    "suggestions.celebrate.title": "Great job — 80% done",
    "suggestions.celebrate.reason": "Reward yourself and add weekly review",
    "suggestions.celebrate.action": "Add: Weekly review",
    "suggestions.celebrate.taskTitle": "Weekly review — lessons",
    // Calendar
    "calendar.title": "🗓️ Calendar — Dedicated View",
    "calendar.today": "Today",
    "calendar.legendToday": "Today",
    "calendar.legendHigh": "High/Urgent",
    "calendar.legendDone": "Done",
    "calendar.tasksFor": "Tasks for",
    "calendar.noTasks": "No tasks on this day",
    "calendar.weekdays": "Sun,Mon,Tue,Wed,Thu,Fri,Sat",
    // Habits
    "habits.title": "🔥 Habits — Rich Dashboard",
    "habits.subtitle": "Deep tracking: streaks, completion rates, daily log",
    "habits.statsTotal": "Total habits",
    "habits.statsToday": "Done today",
    "habits.statsAvg": "Avg streak",
    "habits.statsBest": "Best streak 🔥",
    "habits.statsRate": "7-day rate",
    "habits.statsLogs": "Total logs",
    "habits.addTitle": "Add new habit",
    "habits.namePlaceholder": "e.g., Read 20 minutes",
    "habits.descPlaceholder": "Description (optional)",
    "habits.addButton": "Add",
    "habits.empty": "No habits yet — start with one daily",
    "habits.completedToday": "Done today",
    "habits.notCompleted": "Not done",
    "habits.streak": "Streak",
    "habits.deleteConfirm": "Delete habit?",
    "habits.added": "Habit added 🔥",
    "habits.updated": "Updated",
    "habits.deleted": "Deleted",
    // Auth
    "auth.checking": "... Checking",
  },
  fr: {
    "app.name": "Nemvai",
    "app.tagline": "SÉCURISÉ PAR CONCEPTION • CLOUD READY",
    "nav.todos": "📋 Tâches",
    "nav.calendar": "🗓️ Calendrier",
    "nav.habits": "🔥 Habitudes",
    "nav.refresh": "Actualiser",
    "nav.logout": "Déconnexion",
    "nav.checking": "Vérification...",
    "toast.unauth": "Session expirée — veuillez vous reconnecter",
    "todos.title": "📋 Tâches Intelligentes — Page Exclusive",
    "todos.stats": "{total} tâches • {done} terminées • {left} restantes",
    "todos.suggestionsTitle": "✨ Suggestions Intelligentes",
    "todos.suggestionsSubtitle": "Basé sur le contexte de vos tâches • auto",
    "todos.suggestionsLoading": "Analyse du contexte...",
    "todos.suggestionsEmpty": "Pas de suggestions — vous êtes sur la bonne voie ✨",
    "todos.suggestionsError": "Impossible de charger",
    "todos.manageTitle": "Gérer les tâches",
    "todos.filterAll": "Toutes", "todos.filterTodo": "En attente", "todos.filterInProgress": "En cours", "todos.filterDone": "Terminées",
    "todos.filterPrioAll": "Toutes priorités",
    "todos.titlePlaceholder": "Titre — ex: Finir design Nemvai",
    "todos.descPlaceholder": "Description (optionnel)",
    "todos.catWork": "Travail", "todos.catPersonal": "Personnel", "todos.catStudy": "Étude", "todos.catHealth": "Santé", "todos.catOther": "Autre",
    "todos.prioLow": "Faible", "todos.prioMedium": "Moyenne", "todos.prioHigh": "Élevée", "todos.prioUrgent": "Urgente",
    "todos.addButton": "Ajouter +",
    "todos.empty": "Aucune tâche — ajoutez la première ✨",
    "todos.noOverdue": "Pas de retard 🎉",
    "todos.deleteConfirm": "Supprimer la tâche ?",
    "todos.added": "Tâche ajoutée ✅",
    "todos.updated": "Mis à jour",
    "todos.deleted": "Supprimée",
    "todos.statusTodo": "En attente", "todos.statusInProgress": "En cours", "todos.statusDone": "Terminée",
    "todos.priorityLow": "Faible", "todos.priorityMedium": "Moyenne", "todos.priorityHigh": "Élevée", "todos.priorityUrgent": "Urgente",
    "suggestions.overdue.title": "Vous avez {count} tâches en retard",
    "suggestions.overdue.reason": "Concentrez-vous d'abord sur les retards",
    "suggestions.overdue.action": "Voir en retard",
    "suggestions.high.title": "{count} tâches haute priorité en attente",
    "suggestions.high.reason": "Commencez par l'essentiel — règle 80/20",
    "suggestions.high.action": "Focus haute",
    "suggestions.starter.title": "Commencez votre journée — 3 tâches suggérées",
    "suggestions.starter.reason": "Modèles rapides à ajouter",
    "suggestions.starter.action": "Ajouter: Planning matinal",
    "suggestions.starter.taskTitle": "Planning matinal • Revue objectifs",
    "suggestions.quick_health.title": "Suggestion rapide: santé",
    "suggestions.quick_health.reason": "Petite habitude, grand effet",
    "suggestions.quick_health.action": "Ajouter: Marche 15 min",
    "suggestions.quick_health.taskTitle": "Marche 15 minutes",
    "suggestions.morning.title": "Productivité matinale",
    "suggestions.morning.reason": "Utilisez 2h pour votre tâche principale",
    "suggestions.morning.action": "Ajouter: Focus profond 50m",
    "suggestions.morning.taskTitle": "Focus profond — sans distraction",
    "suggestions.evening.title": "Revue du soir",
    "suggestions.evening.reason": "Faites le bilan et planifiez demain",
    "suggestions.evening.action": "Ajouter: Revue quotidienne",
    "suggestions.evening.taskTitle": "Revue quotidienne — 3 victoires",
    "suggestions.celebrate.title": "Bravo — 80% terminé",
    "suggestions.celebrate.reason": "Récompensez-vous et ajoutez une revue hebdo",
    "suggestions.celebrate.action": "Ajouter: Revue hebdo",
    "suggestions.celebrate.taskTitle": "Revue hebdo — leçons",
    "calendar.title": "🗓️ Calendrier — Vue Dédiée",
    "calendar.today": "Aujourd'hui",
    "calendar.legendToday": "Aujourd'hui",
    "calendar.legendHigh": "Élevée/Urgente",
    "calendar.legendDone": "Terminée",
    "calendar.tasksFor": "Tâches du",
    "calendar.noTasks": "Pas de tâches ce jour",
    "calendar.weekdays": "Dim,Lun,Mar,Mer,Jeu,Ven,Sam",
    "habits.title": "🔥 Habitudes — Tableau Riche",
    "habits.subtitle": "Suivi profond : séries, taux, journal quotidien",
    "habits.statsTotal": "Total habitudes",
    "habits.statsToday": "Faites aujourd'hui",
    "habits.statsAvg": "Moy. série",
    "habits.statsBest": "Meilleure 🔥",
    "habits.statsRate": "Taux 7j",
    "habits.statsLogs": "Logs totaux",
    "habits.addTitle": "Ajouter une habitude",
    "habits.namePlaceholder": "ex: Lire 20 minutes",
    "habits.descPlaceholder": "Description (optionnel)",
    "habits.addButton": "Ajouter",
    "habits.empty": "Pas d'habitudes — commencez par une",
    "habits.completedToday": "Fait aujourd'hui",
    "habits.notCompleted": "Non fait",
    "habits.streak": "Série",
    "habits.deleteConfirm": "Supprimer ?",
    "habits.added": "Habitude ajoutée 🔥",
    "habits.updated": "Mis à jour",
    "habits.deleted": "Supprimée",
  },
  ar: {
    "app.name": "Nemvai",
    "app.tagline": "آمن بالتصميم • جاهز للسحابة",
    "nav.todos": "📋 المهام",
    "nav.calendar": "🗓️ التقويم",
    "nav.habits": "🔥 العادات",
    "nav.refresh": "تحديث",
    "nav.logout": "خروج",
    "nav.checking": "... جاري التحقق",
    "toast.unauth": "انتهت الجلسة — سجل الدخول مجدداً",
    "todos.title": "📋 المهام الذكية — صفحة حصرية",
    "todos.stats": "{total} مهمة • {done} مكتملة • {left} متبقية",
    "todos.suggestionsTitle": "✨ اقتراحات ذكية",
    "todos.suggestionsSubtitle": "مبنية على سياق مهامك • تتحدث تلقائياً",
    "todos.suggestionsLoading": "جاري تحليل سياق مهامك...",
    "todos.suggestionsEmpty": "لا اقتراحات حالياً — أنت على المسار الصحيح ✨",
    "todos.suggestionsError": "تعذر تحميل الاقتراحات",
    "todos.manageTitle": "إدارة المهام",
    "todos.filterAll": "الكل", "todos.filterTodo": "قيد الانتظار", "todos.filterInProgress": "قيد التنفيذ", "todos.filterDone": "مكتملة",
    "todos.filterPrioAll": "كل الأولويات",
    "todos.titlePlaceholder": "عنوان المهمة — مثال: إنهاء تصميم Nemvai",
    "todos.descPlaceholder": "وصف (اختياري)",
    "todos.catWork": "عمل", "todos.catPersonal": "شخصي", "todos.catStudy": "دراسة", "todos.catHealth": "صحة", "todos.catOther": "أخرى",
    "todos.prioLow": "منخفض", "todos.prioMedium": "متوسط", "todos.prioHigh": "مرتفع", "todos.prioUrgent": "عاجل",
    "todos.addButton": "إضافة مهمة +",
    "todos.empty": "لا مهام — أضف أول مهمة ✨",
    "todos.noOverdue": "لا مهام متأخرة 🎉",
    "todos.deleteConfirm": "حذف المهمة؟",
    "todos.added": "تمت إضافة المهمة ✅",
    "todos.updated": "تم التحديث",
    "todos.deleted": "تم الحذف",
    "todos.statusTodo": "انتظار", "todos.statusInProgress": "تنفيذ", "todos.statusDone": "مكتمل",
    "todos.priorityLow": "منخفض", "todos.priorityMedium": "متوسط", "todos.priorityHigh": "مرتفع", "todos.priorityUrgent": "عاجل",
    "suggestions.overdue.title": "لديك {count} مهام متأخرة",
    "suggestions.overdue.reason": "ركز على المهام ذات التواريخ المتجاوزة أولاً",
    "suggestions.overdue.action": "عرض المتأخرة",
    "suggestions.high.title": "{count} مهام عالية الأولوية بانتظارك",
    "suggestions.high.reason": "ابدأ بالأهم — قاعدة 80/20",
    "suggestions.high.action": "تركيز عالي",
    "suggestions.starter.title": "ابدأ بيومك — 3 مهام مقترحة",
    "suggestions.starter.reason": "قوالب جاهزة للإضافة السريعة",
    "suggestions.starter.action": "إضافة: تخطيط الصباح",
    "suggestions.starter.taskTitle": "تخطيط الصباح • مراجعة الأهداف",
    "suggestions.quick_health.title": "اقتراح سريع: صحة",
    "suggestions.quick_health.reason": "عادة صغيرة تصنع فرقاً",
    "suggestions.quick_health.action": "إضافة: مشي 15 دقيقة",
    "suggestions.quick_health.taskTitle": "مشي 15 دقيقة",
    "suggestions.morning.title": "صباح الإنتاجية",
    "suggestions.morning.reason": "خصص أول ساعتين لأهم مهمة",
    "suggestions.morning.action": "إضافة: تركيز عميق 50د",
    "suggestions.morning.taskTitle": "تركيز عميق — بدون مشتتات",
    "suggestions.evening.title": "مراجعة مسائية",
    "suggestions.evening.reason": "راجع ما أنجزت وخطط للغد",
    "suggestions.evening.action": "إضافة: مراجعة يومية",
    "suggestions.evening.taskTitle": "مراجعة يومية — 3 إنجازات",
    "suggestions.celebrate.title": "أداء رائع — 80% مكتمل",
    "suggestions.celebrate.reason": "كافئ نفسك وأضف مراجعة أسبوعية",
    "suggestions.celebrate.action": "إضافة: مراجعة أسبوعية",
    "suggestions.celebrate.taskTitle": "مراجعة أسبوعية — دروس الأسبوع",
    "calendar.title": "🗓️ التقويم — عرض مستقل",
    "calendar.today": "اليوم",
    "calendar.legendToday": "اليوم",
    "calendar.legendHigh": "عاجل/مرتفع",
    "calendar.legendDone": "مكتمل",
    "calendar.tasksFor": "مهام",
    "calendar.noTasks": "لا مهام في هذا اليوم",
    "calendar.weekdays": "أحد,اثنين,ثلاثاء,أربعاء,خميس,جمعة,سبت",
    "habits.title": "🔥 العادات — لوحة غنية ومستقلة",
    "habits.subtitle": "تتبع عميق: سلاسل الإنجاز، نسب الإتمام، وسجل يومي مفصل",
    "habits.statsTotal": "إجمالي العادات",
    "habits.statsToday": "مكتملة اليوم",
    "habits.statsAvg": "متوسط السلسلة",
    "habits.statsBest": "أفضل سلسلة 🔥",
    "habits.statsRate": "نسبة إتمام 7 أيام",
    "habits.statsLogs": "إجمالي السجلات",
    "habits.addTitle": "إضافة عادة جديدة",
    "habits.namePlaceholder": "مثال: قراءة 20 دقيقة",
    "habits.descPlaceholder": "وصف (اختياري)",
    "habits.addButton": "إضافة",
    "habits.empty": "لا عادات بعد — ابدأ بعادة واحدة يومية",
    "habits.completedToday": "مكتملة اليوم",
    "habits.notCompleted": "غير مكتملة",
    "habits.streak": "سلسلة",
    "habits.deleteConfirm": "حذف العادة؟",
    "habits.added": "تمت إضافة العادة 🔥",
    "habits.updated": "تم التحديث",
    "habits.deleted": "تم الحذف",
  }
};

// Latin numerals enforcement helpers
function fmtNum(n){
  // Always Western 0-9, regardless of locale
  const num = Number(n);
  if(Number.isNaN(num)) return String(n);
  return num.toLocaleString('en-US');
}
function fmtDateLatin(dateStr){
  // dateStr YYYY-MM-DD -> keep Latin, return as is (already Latin)
  return dateStr;
}
function fmtMonthYearLatin(dateObj, lang){
  // Month name via i18n, year via Latin
  const year = dateObj.getFullYear().toLocaleString('en-US');
  // Use en-US for month name base, but translate via dictionary for AR/FR
  const monthEn = dateObj.toLocaleString('en-US', {month:'long'});
  // Map monthEn to translated if needed — for now we use en-US month + Latin year, but for AR/FR we translate
  const monthMap = {
    en: {January:"January",February:"February",March:"March",April:"April",May:"May",June:"June",July:"July",August:"August",September:"September",October:"October",November:"November",December:"December"},
    fr: {January:"janvier",February:"février",March:"mars",April:"avril",May:"mai",June:"juin",July:"juillet",August:"août",September:"septembre",October:"octobre",November:"novembre",December:"décembre"},
    ar: {January:"يناير",February:"فبراير",March:"مارس",April:"أبريل",May:"مايو",June:"يونيو",July:"يوليو",August:"أغسطس",September:"سبتمبر",October:"أكتوبر",November:"نوفمبر",December:"ديسمبر"}
  };
  const dict = monthMap[lang] || monthMap.en;
  const month = dict[monthEn] || monthEn;
  return `${month} ${year}`;
}

let currentLang = localStorage.getItem('nemvai_lang') || 'ar';
function t(key, params={}){
  const lang = currentLang;
  const dict = NEMVAI_I18N[lang] || NEMVAI_I18N.en;
  let val = dict[key] || NEMVAI_I18N.en[key] || key;
  // simple interpolation {total}
  Object.keys(params).forEach(k=>{
    const v = params[k];
    // ensure numbers are Latin
    const latin = (typeof v === 'number') ? fmtNum(v) : String(v);
    val = val.replaceAll(`{${k}}`, latin);
  });
  return val;
}
function setLang(lang){
  if(!['en','fr','ar'].includes(lang)) lang='en';
  currentLang = lang;
  localStorage.setItem('nemvai_lang', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  // update switcher UI
  document.querySelectorAll('.lang-btn').forEach(b=> b.classList.toggle('btn-primary', b.dataset.lang===lang));
  document.querySelectorAll('.lang-btn').forEach(b=> b.classList.toggle('btn-ghost', b.dataset.lang!==lang));
  applyTranslations();
}
function applyTranslations(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    // XSS-safe: textContent only
    el.textContent = val;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });
  // Update dynamic counters if functions exist
  if(typeof window.onLangChange === 'function') window.onLangChange(currentLang);
}
// Early apply on load
document.addEventListener('DOMContentLoaded', ()=>{
  setLang(currentLang);
});
