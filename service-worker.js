const C='koyomi-bazi-practical-tuning-20260717-1';
const A=[
  './','./index.html','./today.html','./app.html','./smoke-test.html','./manifest.webmanifest','./icon.svg',
  './src/bazi/index.js','./src/bazi/data.js','./src/bazi/astronomy/index.js','./src/bazi/calendar/index.js','./src/bazi/chart/index.js','./src/bazi/relations/index.js','./src/bazi/strength/index.js','./src/bazi/patterns/index.js','./src/bazi/yongshen/index.js','./src/bazi/luck/index.js','./src/bazi/interpretation/index.js','./src/bazi/reading/index.js','./src/bazi/schools/index.js','./src/bazi/evidence/index.js','./src/bazi/validation/index.js','./src/bazi/validation/bazi-test.html',
  './data/bazi/stems.json','./data/bazi/branches.json','./data/bazi/elements.json','./data/bazi/yin-yang.json','./data/bazi/hidden-stems.json','./data/bazi/ten-gods.json','./data/bazi/twelve-stages.json','./data/bazi/stem-relations.json','./data/bazi/branch-relations.json','./data/bazi/combinations.json','./data/bazi/clashes.json','./data/bazi/punishments.json','./data/bazi/harms.json','./data/bazi/destructions.json','./data/bazi/voids.json','./data/bazi/tomb-storage.json','./data/bazi/seasonal-strength.json','./data/bazi/month-command.json','./data/bazi/root-strength.json','./data/bazi/exposed-stems.json','./data/bazi/element-flow.json','./data/bazi/climate-rules.json','./data/bazi/strength-rules.json','./data/bazi/pattern-catalog.json','./data/bazi/pattern-rules.json','./data/bazi/pattern-rescue-rules.json','./data/bazi/follow-pattern-rules.json','./data/bazi/transformation-pattern-rules.json','./data/bazi/yongshen-methods.json','./data/bazi/yongshen-rules.json','./data/bazi/favorable-unfavorable.json','./data/bazi/luck-cycle-rules.json','./data/bazi/classical-index.json','./data/bazi/classical-excerpts.json','./data/bazi/interpretation-rules.json','./data/bazi/luck-interpretation-rules.json','./data/bazi/example-cases.json','./data/bazi/explanation-templates.json','./data/bazi/mitsunome-input-schema.json','./data/bazi/schools.json','./data/bazi/school-settings.json','./data/bazi/solar-term-rules.json','./data/bazi/rule-catalog.json','./data/bazi/classical-sources.json','./data/bazi/terminology.json','./data/bazi/test-cases.json','./data/bazi/phase2-test-cases.json','./data/bazi/quality-audit.json','./data/bazi/rule-consolidation.json','./data/bazi/contradiction-report.json','./data/bazi/source-coverage-report.json','./data/bazi/low-confidence-report.json','./data/bazi/review-status-report.json','./data/bazi/implementation-rate-report.json','./data/bazi/case-classification.json','./data/bazi/phase4-test-cases.json','./data/bazi/final-rule-audit.json','./data/bazi/final-classical-audit.json','./data/bazi/final-example-cases.json','./data/bazi/final-test-cases.json','./data/bazi/final-quality-score.json','./data/bazi/final-ai-review.json','./data/bazi/practical-audit-cases.json'
];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(C).then(c=>c.addAll(A)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(x=>x!==C).map(x=>caches.delete(x))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const isHtml=e.request.mode==='navigate'||e.request.headers.get('accept')?.includes('text/html');
  if(isHtml){
    e.respondWith(
      fetch(e.request)
        .then(res=>{
          const copy=res.clone();
          caches.open(C).then(c=>c.put(e.request,copy)).catch(()=>{});
          return res;
        })
        .catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request)
      .then(r=>r||fetch(e.request).then(res=>{
        const copy=res.clone();
        caches.open(C).then(c=>c.put(e.request,copy)).catch(()=>{});
        return res;
      }).catch(()=>caches.match('./index.html')))
  );
});
