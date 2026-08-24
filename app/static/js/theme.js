// Nemvai Theme Switcher — Dark/Light, localStorage, smooth
const THEME_KEY = 'nemvai_theme';
function getPreferredTheme(){
  const saved = localStorage.getItem(THEME_KEY);
  if(saved === 'light' || saved === 'dark') return saved;
  // system preference fallback
  if(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
  localStorage.setItem(THEME_KEY, theme);
  const btn = document.getElementById('themeToggle');
  if(btn){
    // XSS-safe textContent
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    btn.title = theme === 'dark' ? 'Switch to Light' : 'Switch to Dark';
    btn.setAttribute('aria-label', btn.title);
  }
  // update meta
  const meta = document.querySelector('meta[name="color-scheme"]');
  if(meta) meta.content = theme;
}
function toggleTheme(){
  const cur = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
  const next = cur === 'dark' ? 'light' : 'dark';
  applyTheme(next);
}
// Early apply to prevent flash — called immediately
(function(){
  const t = getPreferredTheme();
  document.documentElement.setAttribute('data-theme', t);
  document.documentElement.style.colorScheme = t;
})();
document.addEventListener('DOMContentLoaded', ()=>{
  applyTheme(getPreferredTheme());
  const btn = document.getElementById('themeToggle');
  if(btn) btn.addEventListener('click', toggleTheme);
});
