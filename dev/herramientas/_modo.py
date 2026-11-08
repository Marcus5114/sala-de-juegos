# Modo claro/oscuro común: se inserta en todas las páginas al armar.
MODO_HEAD="""<script>
(function(){var K='sala.modo',r=document.documentElement;
window.__salaModo=function(m){if(m==='claro')r.setAttribute('data-theme','light');else if(m==='oscuro')r.setAttribute('data-theme','dark');else r.removeAttribute('data-theme');
  try{dispatchEvent(new Event('salamodo'))}catch(e){}};
var m;try{m=localStorage.getItem(K)}catch(e){}__salaModo(m);
addEventListener('storage',function(e){if(e.key===K)__salaModo(e.newValue)});})();
</script>
"""
# Selector "Modo" que se agrega arriba del panel de colores/temas de cada juego.
MODO_UI="""<style>
.sala-modo{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.sala-modo b{font:700 .72rem var(--font,Arial,sans-serif);text-transform:uppercase;letter-spacing:.08em;color:var(--muted,#888)}
.sala-seg{display:flex;gap:3px;padding:3px;border-radius:10px;background:rgba(127,127,127,.16)}
.sala-seg button{border:0;background:transparent;color:var(--fg,inherit);font:700 .78rem var(--font,Arial,sans-serif);height:32px;padding:0 10px;border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:5px}
.sala-seg button[aria-checked="true"]{background:var(--fg,#111);color:var(--bg,#fff)}
.sala-seg svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
</style>
<script>
(function(){var K='sala.modo',pane=document.querySelector('[data-pane="colors"]');if(!pane)return;
var I={auto:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>',
 claro:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
 oscuro:'<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>'};
var N={auto:'Auto',claro:'Claro',oscuro:'Oscuro'};
var box=document.createElement('div');box.className='sala-modo';
box.innerHTML='<b>Modo</b><div class="sala-seg" role="radiogroup" aria-label="Modo claro u oscuro">'+['auto','claro','oscuro'].map(function(m){return '<button type="button" role="radio" data-m="'+m+'">'+I[m]+N[m]+'</button>'}).join('')+'</div>';
var ph=pane.querySelector('.ph');if(ph)ph.after(box);else pane.prepend(box);
function get(){try{return localStorage.getItem(K)||'auto'}catch(e){return 'auto'}}
function paint(){var m=get();box.querySelectorAll('[data-m]').forEach(function(b){b.setAttribute('aria-checked',b.dataset.m===m)})}
box.addEventListener('click',function(e){var b=e.target.closest('[data-m]');if(!b)return;try{localStorage.setItem(K,b.dataset.m)}catch(x){}window.__salaModo(b.dataset.m);paint();});
addEventListener('salamodo',paint);paint();})();
</script>
"""

