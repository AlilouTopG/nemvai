// ArenaX — Auth (XSS-safe, no innerHTML for user data)
const API = "";
function toast(msg, ok=true){
  const t=document.getElementById("toast");
  t.textContent=msg;
  t.style.borderColor= ok ? "rgba(6,214,160,.4)" : "rgba(239,68,68,.4)";
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),2800);
}
function switchTab(which){
  document.getElementById("form-login").style.display = which==="login" ? "" : "none";
  document.getElementById("form-register").style.display = which==="register" ? "" : "none";
  document.getElementById("tab-login").classList.toggle("active", which==="login");
  document.getElementById("tab-register").classList.toggle("active", which==="register");
}
function pwdMeter(v){
  let s=0;
  if(v.length>=8)s++;
  if(/[A-Z]/.test(v))s++;
  if(/[a-z]/.test(v))s++;
  if(/\d/.test(v))s++;
  if(/[^A-Za-z0-9]/.test(v))s++;
  const pct = (s/5)*100;
  const bar=document.getElementById("pwdBar");
  const hint=document.getElementById("pwdHint");
  bar.style.width=pct+"%";
  bar.style.background = s<3 ? "#ef4444" : s<4 ? "#f59e0b" : "#06d6a0";
  const labels=["ضعيفة جداً","ضعيفة","متوسطة","قوية","ممتازة"];
  hint.textContent = v ? `القوة: ${labels[Math.max(0,s-1)]}` : "قوة كلمة المرور تظهر هنا";
}
async function api(path, opts={}){
  // CSRF: fetch csrf token from cookies automatically via Flask-JWT
  // Include credentials for HttpOnly cookies
  opts.credentials="include";
  opts.headers = opts.headers||{};
  if(opts.body && !(opts.body instanceof FormData)){
    opts.headers["Content-Type"]="application/json";
  }
  // Try read csrf token from cookie for double-submit (Flask-JWT sets csrf_access_token)
  const m=document.cookie.match(/csrf_access_token=([^;]+)/);
  if(m) opts.headers["X-CSRF-TOKEN"]=decodeURIComponent(m[1]);
  const res= await fetch(path, opts);
  let data=null;
  try{ data= await res.json(); }catch{}
  if(!res.ok) throw new Error((data && (data.error||data.msg)) || `خطأ ${res.status}`);
  return data;
}
async function handleRegister(e){
  e.preventDefault();
  const payload={
    username: document.getElementById("reg_user").value.trim(),
    email: document.getElementById("reg_email").value.trim(),
    password: document.getElementById("reg_pwd").value
  };
  try{
    const data= await api("/api/auth/register",{method:"POST", body: JSON.stringify(payload)});
    if(data.access_token) localStorage.setItem("ax_token", data.access_token);
    toast("تم إنشاء الحساب بنجاح ✨");
    setTimeout(()=> location.href="/dashboard", 700);
  }catch(err){ toast(err.message,false); }
}
async function handleLogin(e){
  e.preventDefault();
  const payload={
    identifier: document.getElementById("login_id").value.trim(),
    password: document.getElementById("login_pwd").value
  };
  try{
    const data= await api("/api/auth/login",{method:"POST", body: JSON.stringify(payload)});
    if(data.access_token) localStorage.setItem("ax_token", data.access_token);
    toast("مرحباً بعودتك 🔥");
    setTimeout(()=> location.href="/dashboard", 600);
  }catch(err){ toast(err.message,false); }
}
// If already authenticated, redirect
(async()=>{
  try{
    const r= await fetch("/api/auth/me",{credentials:"include"});
    const j= await r.json();
    if(j.authenticated) location.href="/dashboard";
  }catch{}
})();
