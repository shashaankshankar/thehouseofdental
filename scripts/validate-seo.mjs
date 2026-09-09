import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export function validateSeo({ documents, site, blog, treatments, sitemap, robots }) {
  const errors = [];
  const expected = new Map([
    ...Object.entries(site.pages).filter(([, p]) => p.path).map(([file,p]) => [p.path,{...p,file}]),
    ...blog.articles.map(a=>[`/blog/${a.slug}`,{file:`blog/${a.slug}.html`,robots:'index',sitemap:true}]),
    ...treatments.map(t=>[t.path,{file:`${t.path.slice(1)}.html`,robots:'index',sitemap:true}])
  ]);
  const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
  const incoming = new Set(['/']);
  const titles = new Set(), descriptions = new Set();
  if (new Set(sitemapUrls).size !== sitemapUrls.length) errors.push('duplicate sitemap URL');
  if (!robots.includes(`Sitemap: ${site.baseUrl}/sitemap.xml`) || /Disallow:\s*\/\s*$/m.test(robots)) errors.push('robots must allow public crawling and declare the canonical sitemap');
  for (const html of Object.values(documents)) for (const m of html.matchAll(/href="(\/[^"?#]*)/g)) incoming.add(m[1]);
  for (const [path, page] of expected) {
    const html = documents[page.file] || '';
    const canonical = `${site.baseUrl}${path}`;
    const title = html.match(/<title>(.*?)<\/title>/)?.[1];
    const description = html.match(/name="description" content="([^"]*)"/)?.[1];
    const canonicals = [...html.matchAll(/rel="canonical" href="([^"]+)"/g)].map(m=>m[1]);
    if (canonicals.length !== 1 || canonicals[0] !== canonical) errors.push(`${path}: incorrect canonical`);
    if (!title || titles.has(title) || /&amp;(?:amp|mdash|ndash);/.test(title)) errors.push(`${path}: missing, duplicate, or double-escaped title`);
    if (!description || descriptions.has(description)) errors.push(`${path}: missing or duplicate description`);
    titles.add(title); descriptions.add(description);
    if (!incoming.has(path)) errors.push(`${path}: orphan page`);
    const shouldIndex = page.sitemap !== false && !page.robots.includes('noindex');
    if (sitemapUrls.includes(canonical) !== shouldIndex) errors.push(`${path}: sitemap inclusion mismatch`);
    if (shouldIndex && /name="robots" content="[^"]*noindex/.test(html)) errors.push(`${path}: indexable page has noindex`);
    if (!html.includes(`<meta property="og:url" content="${canonical}">`)) errors.push(`${path}: social URL mismatch`);
    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try {
        const schema=JSON.parse(m[1]);
        if (/"aggregateRating"/.test(m[1])) errors.push(`${path}: self-serving rating markup`);
        const nodes=schema['@graph'] || [schema];
        for (const node of nodes) {
          if (node['@type']==='Dentist' && (node.url!==`${site.baseUrl}/` || node['@id']!==`${site.baseUrl}/#practice`)) errors.push(`${path}: inconsistent practice identity`);
          if (node['@type']==='BreadcrumbList') node.itemListElement.forEach((item,i)=>{
            if(item.position!==i+1 || !expected.has(item.item?.replace(site.baseUrl,''))) errors.push(`${path}: invalid breadcrumb destination`);
          });
        }
      } catch { errors.push(`${path}: malformed structured data`); }
    }
    for (const m of html.matchAll(/<img\b[^>]*\ssrc="[^" ]+"[^>]*>/g)) if (!/\swidth="[1-9]\d*"/.test(m[0]) || !/\sheight="[1-9]\d*"/.test(m[0])) {
      // SVG logos scale through the existing fixed-height logo rule.
      if (!/\.svg"/.test(m[0])) errors.push(`${path}: image missing intrinsic dimensions`);
    }
  }
  for (const url of sitemapUrls) if (!url.startsWith(site.baseUrl) || !expected.has(url.slice(site.baseUrl.length))) errors.push(`unknown sitemap URL: ${url}`);
  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10)===value;
  for (const article of blog.articles) {
    if (!validDate(article.publishedAt) || (article.modifiedAt && (!validDate(article.modifiedAt) || article.modifiedAt < article.publishedAt))) errors.push(`${article.slug}: invalid editorial dates`);
    for (const person of [article.author, article.reviewer].filter(Boolean)) if (!person.name || !expected.has(person.path?.split('#')[0])) errors.push(`${article.slug}: invalid attribution`);
    if (article.reviewer && !validDate(article.reviewer.reviewedAt)) errors.push(`${article.slug}: reviewer needs a real review date`);
    if (!expected.has(article.serviceHref)) errors.push(`${article.slug}: related care does not link to a page`);
  }
  const paths=new Set();
  for (const treatment of treatments) {
    if(paths.has(treatment.path)) errors.push(`${treatment.path}: duplicate treatment path`);
    paths.add(treatment.path);
    if(!/^\/(services|facial-aesthetics)\/[a-z0-9-]+$/.test(treatment.path)) errors.push(`${treatment.path}: invalid treatment route`);
    if(treatment.related.some(id=>!treatments.some(t=>t.id===id))) errors.push(`${treatment.path}: unknown related treatment`);
    const html=documents[`${treatment.path.slice(1)}.html`] || '';
    if(!html.includes('aria-label="Breadcrumb"') || !html.includes('"@type":"BreadcrumbList"')) errors.push(`${treatment.path}: missing breadcrumbs`);
  }
  if (!documents['404.html']?.includes('content="noindex"')) errors.push('404 must remain noindex');
  return errors;
}

export async function readSeoInput() {
  const json=async path=>JSON.parse(await readFile(path,'utf8'));
  const documents={};
  async function scan(dir,prefix='') { for (const entry of await readdir(dir,{withFileTypes:true})) {
    if(entry.isDirectory()) await scan(join(dir,entry.name),`${prefix}${entry.name}/`);
    else if(entry.name.endsWith('.html')) documents[`${prefix}${entry.name}`]=await readFile(join(dir,entry.name),'utf8');
  }}
  await scan('dist');
  return {documents,site:await json('src/data/site.json'),blog:await json('src/data/blog.json'),treatments:await json('src/data/treatments.json'),sitemap:await readFile('dist/sitemap.xml','utf8'),robots:await readFile('dist/robots.txt','utf8')};
}
if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const input=await readSeoInput(); const errors=validateSeo(input);
  if(errors.length) { console.error(errors.join('\n')); process.exitCode=1; }
  else console.log(`Validated SEO metadata, discovery, dates, images, and schema across ${Object.keys(input.documents).length} pages.`);
}
