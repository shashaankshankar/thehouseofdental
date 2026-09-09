// Reuse the site's article layout for complete, crawlable treatment pages.
export function renderTreatment(treatment, { treatments, articles, site, escapeText: text, escapeAttribute: attr }) {
  const aesthetic = treatment.category === "Facial Aesthetics";
  const parent = aesthetic ? "/facial-aesthetics" : "/services";
  const parentName = aesthetic ? "Facial Aesthetics" : "Dental Services";
  const canonical = `${site.baseUrl}${treatment.path}`;
  const related = treatment.related.map((id) => treatments.find((item) => item.id === id));
  const reading = articles.filter((article) => article.serviceHref === treatment.path);
  const html = `<main id="main-content" class="treatment-page">
  <header class="page-hero sec-noir article-hero"><div class="wrap">
    <nav class="crumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="${parent}">${parentName}</a><span>/</span><span aria-current="page">${text(treatment.title)}</span></nav>
    <p class="eyebrow u-inline-001">${text(treatment.category)} · Winter Park, FL</p>
    <h1>${text(treatment.title)} in Winter Park</h1>
    <p class="article-dek">${text(treatment.intro)}</p>
    <div class="treatment-actions"><a class="btn btn-solid" href="/contact#request">Request a Consultation</a><a class="btn" href="tel:${attr(site.phone)}">Call ${text(site.phoneDisplay)}</a></div>
  </div></header>
  <div class="sec sec-ivory article-shell"><div class="wrap article-layout">
    <div class="article-body">
      <figure class="treatment-image"><img src="${attr(treatment.image)}" alt="${attr(treatment.imageAlt)}" decoding="async" loading="lazy"></figure>
      ${treatment.sections.map((section) => `<section><h2>${text(section.heading)}</h2><p>${text(section.body)}</p></section>`).join("\n")}
      <section><h2>Questions About ${text(treatment.title)}</h2>${treatment.questions.map((item) => `<h3>${text(item.question)}</h3><p>${text(item.answer)}</p>`).join("\n")}</section>
      ${reading.length ? `<section><h2>Further Reading</h2><ul>${reading.map((article) => `<li><a href="/blog/${attr(article.slug)}">${text(article.title)}</a></li>`).join("")}</ul></section>` : ""}
      ${treatment.sources?.length ? `<section class="article-sources"><h2>Sources</h2><ul>${treatment.sources.map((source) => `<li><a href="${attr(source.url)}" target="_blank" rel="noopener noreferrer">${text(source.label)}</a></li>`).join("")}</ul></section>` : ""}
      <p class="article-disclaimer">This information explains treatment options and does not replace an individual assessment. Your treating clinician’s instructions take priority.</p>
    </div>
    <aside class="article-aside treatment-aside" aria-label="Plan your visit"><h2>Visit The House of Dental</h2><p>${text(site.address)}</p><p>Monday–Thursday, 8am–3pm.</p><a href="/contact#request">Request an appointment</a><a href="/about#dr-patel">Meet Dr. Mainak Patel</a><a href="/new-patients#insurance">Insurance and payment options</a>${treatment.careAnchor ? `<a href="/pre-post-op#${attr(treatment.careAnchor)}">Treatment care instructions</a>` : ""}<h2>Related Care</h2>${related.map((item) => `<a href="${attr(item.path)}">${text(item.title)}</a>`).join("")}</aside>
  </div></div>
  </main>`;
  return {
    html,
    page: { path: treatment.path, title: `${treatment.title} in Winter Park, FL | ${site.name}`, description: treatment.description, shell: "full", robots: "index, follow, max-image-preview:large" },
    schema: {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "WebPage", "@id": `${canonical}#webpage`, url: canonical, name: `${treatment.title} in Winter Park`, description: treatment.description, about: { "@id": `${site.baseUrl}/#practice` }, breadcrumb: { "@id": `${canonical}#breadcrumb` } },
        { "@type": "BreadcrumbList", "@id": `${canonical}#breadcrumb`, itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${site.baseUrl}/` },
          { "@type": "ListItem", position: 2, name: parentName, item: `${site.baseUrl}${parent}` },
          { "@type": "ListItem", position: 3, name: treatment.title, item: canonical }
        ] }
      ]
    }
  };
}
