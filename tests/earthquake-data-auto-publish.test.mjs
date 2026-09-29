import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflows=[
  '.github/workflows/update-earthquake-catalog.yml',
  '.github/workflows/update-earthquake-thermal-public-data.yml'
];

for(const path of workflows){
  const workflow=await readFile(new URL(`../${path}`,import.meta.url),'utf8');
  assert.match(workflow,/permissions:\s+[\s\S]*actions: write[\s\S]*contents: write[\s\S]*pull-requests: write/);
  assert.match(workflow,/git switch -c "\$branch"/,'updates must use an isolated branch');
  assert.match(workflow,/gh pr create --base main --head "\$branch"/,'verified data must enter main through a PR');
  assert.match(workflow,/gh pr merge "\$pr_url" --squash --delete-branch/,'verified PR must not remain waiting indefinitely');
  assert.match(workflow,/gh workflow run pages-production\.yml --ref main/,'a successful merge must request production publication');
  assert.doesNotMatch(workflow,/git push origin main/,'automation must never push directly to main');
  const validateIndex=Math.max(workflow.indexOf('Validate generated assets'),workflow.indexOf('Validate thermal model'));
  const createIndex=workflow.indexOf('gh pr create');
  const mergeIndex=workflow.indexOf('gh pr merge');
  const deployIndex=workflow.indexOf('gh workflow run pages-production.yml');
  assert.ok(validateIndex>=0&&validateIndex<createIndex&&createIndex<mergeIndex&&mergeIndex<deployIndex,'validation, PR, merge, and deployment must remain fail-closed and ordered');
}

console.log('Earthquake data auto-publish workflow passed');
