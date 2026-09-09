import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateSeo, readSeoInput } from '../scripts/validate-seo.mjs';
const input=await readSeoInput();

test('all generated pages satisfy the SEO contract',()=>assert.deepEqual(validateSeo(input),[]));
test('SEO validation rejects canonical drift, noindex, broken breadcrumbs, and self-serving ratings',()=>{
 for(const [from,to,expected] of [
  ['rel="canonical" href="https://thehouseofdentalwp.com/services/dental-implants"','rel="canonical" href="https://thehouseofdentalwp.com/services"','incorrect canonical'],
  ['content="index, follow, max-image-preview:large"','content="noindex"','has noindex'],
  ['"item":"https://thehouseofdentalwp.com/services"','"item":"https://thehouseofdentalwp.com/missing"','invalid breadcrumb'],
  ['"@type":"WebPage"','"@type":"WebPage","aggregateRating":{}','self-serving rating']
 ]) {
  const altered=structuredClone(input);const key='services/dental-implants.html';
  assert.ok(altered.documents[key].includes(from));
  altered.documents[key]=altered.documents[key].replace(from,to);
  assert.ok(validateSeo(altered).some(e=>e.includes(expected)),expected);
 }
});
test('sitemap validation rejects a missing treatment and a redirect alias',()=>{
 const altered=structuredClone(input);
 altered.sitemap=altered.sitemap.replace('<loc>https://thehouseofdentalwp.com/services/dental-implants</loc>','<loc>https://thehouseofdentalwp.com/services.html</loc>');
 assert.ok(validateSeo(altered).some(e=>e.includes('sitemap inclusion mismatch')));
 assert.ok(validateSeo(altered).some(e=>e.includes('unknown sitemap URL')));
});
test('reviewed treatment routes are approved while unknown routes remain blocked',async()=>{
 const policy=JSON.parse(await readFile('measurement/eligibility/routes.json','utf8'));
 assert.equal(policy.default,'prohibited');
 for(const t of input.treatments) assert.equal(policy.routes[t.path],'approved',t.path);
});
test('treatment cards are real links and preserve every legacy fragment',()=>{
 const html=input.documents['services.html'];
 for(const t of input.treatments) assert.ok(html.includes(`id="${t.id}" class="svc-card" data-treatment="${t.id}" href="${t.path}"`),t.id);
 assert.doesNotMatch(html,/data-svc=|id="svcmodal"/);
});
test('article dates and attribution are rendered from each article rather than global defaults',()=>{
 for(const a of input.blog.articles) {
  const html=input.documents[`blog/${a.slug}.html`];
  assert.ok(html.includes(`"datePublished":"${a.publishedAt}"`));
  assert.ok(html.includes(`"dateModified":"${a.modifiedAt || a.publishedAt}"`));
  if(!a.reviewer)assert.doesNotMatch(html,/Reviewed by/);
 }
});
