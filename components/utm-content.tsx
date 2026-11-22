import Link from 'next/link'

const parameters = [
  { name: 'utm_source', purpose: 'Identifies the platform, publisher, or source sending a visit.', example: 'instagram' },
  { name: 'utm_medium', purpose: 'Describes the marketing channel or traffic type.', example: 'paid_social' },
  { name: 'utm_campaign', purpose: 'Names the promotion, launch, or campaign.', example: 'black-friday-2026' },
  { name: 'utm_term', purpose: 'Optionally identifies a paid-search term or keyword.', example: 'running-shoes' },
  { name: 'utm_content', purpose: 'Optionally distinguishes links, ads, or creative variations.', example: 'story-ad' },
]

export function UtmEducationalContent() {
  return (
    <section className="prose-block utm-education">
      <span className="eyebrow">CAMPAIGN TRACKING BASICS</span>
      <h2>What Is a UTM Link?</h2>
      <p>A UTM link is a destination URL with campaign parameters added to its query string. Analytics tools can use these labels to identify the traffic source, marketing channel, and campaign that brought a visit. UTM tags describe a visit; they do not change the page a visitor opens.</p>

      <h2>How to Create a UTM Link</h2>
      <ol>
        <li>Enter the full destination URL, including its existing query parameters if it has any.</li>
        <li>Choose consistent campaign source and medium values, or start with a platform preset.</li>
        <li>Add a meaningful campaign name. Use the optional term and content fields when they help distinguish traffic or creative.</li>
        <li>Review any advanced values you need, then check the generated URL and test that it opens the intended page.</li>
        <li>Copy the link and use it in the matching campaign placement. Keep a distinct source and medium for each channel you want to compare.</li>
      </ol>

      <h2>Understanding UTM Parameters</h2>
      <p>Source, medium, and campaign are the core labels for campaign attribution. Term and content are optional; use them only when they answer a reporting question.</p>
      <div className="utm-table-wrap">
        <table className="utm-parameter-table">
          <thead><tr><th scope="col">Parameter</th><th scope="col">Purpose</th><th scope="col">Example</th></tr></thead>
          <tbody>{parameters.map(parameter => <tr key={parameter.name}><th scope="row"><code>{parameter.name}</code></th><td>{parameter.purpose}</td><td><code>{parameter.example}</code></td></tr>)}</tbody>
        </table>
      </div>

      <h2>UTM Naming Best Practices</h2>
      <ul>
        <li>Use lowercase values and a consistent separator, such as hyphens.</li>
        <li>Agree on source and medium names across your team; avoid multiple spellings for the same channel.</li>
        <li>Choose campaign names that are descriptive and easy to recognize later.</li>
        <li>Avoid unnecessary special characters and never put personal or confidential information in a URL.</li>
      </ul>

      <h2>How to Track UTM Campaigns in Google Analytics 4</h2>
      <p>After people visit the tagged link and GA4 has processed the data, open <strong>Reports → Acquisition → Traffic acquisition</strong>. Review session-scoped dimensions such as Session source / medium and Session campaign. Report availability can vary with your GA4 property, report configuration, and processing delay; use Explore or customize a report if you need a different comparison.</p>

      <h2>Common UTM Mistakes to Avoid</h2>
      <ul>
        <li>Changing capitalization or spelling between links for the same source, medium, or campaign.</li>
        <li>Using an unclear or inconsistent source/medium pair, or leaving a required value blank.</li>
        <li>Appending a second copy of a UTM parameter instead of replacing the existing value.</li>
        <li>Sharing a broken destination URL or tagging routine internal links, which can overwrite campaign attribution.</li>
        <li>Including email addresses, customer names, or other confidential information in URL parameters.</li>
      </ul>
      <p>For a deeper walkthrough, read <Link href="/guides/utm-parameters-campaign-tracking">How to Build UTM Campaign URLs for Tracking</Link>.</p>
    </section>
  )
}

export function UtmFaq() {
  return (
    <section className="faq-list tool-faq utm-faq">
      <h2>Frequently asked questions</h2>
      <details><summary>What are UTM parameters used for?</summary><p>They label campaign traffic so analytics can group visits by source, medium, campaign, and optional details such as term or content.</p></details>
      <details><summary>What is the difference between UTM source and medium?</summary><p>Source names who sent the visit, such as google or a newsletter. Medium describes the channel, such as cpc, email, or social.</p></details>
      <details><summary>Which UTM parameters are required?</summary><p>Use utm_source, utm_medium, and utm_campaign for clear campaign attribution. Term and content are optional.</p></details>
      <details><summary>Are UTM parameters case-sensitive?</summary><p>Yes. Analytics reports can treat differently capitalized values as separate labels, so use one casing convention consistently.</p></details>
      <details><summary>Can I add UTM parameters to an existing URL?</summary><p>Yes. This builder preserves unrelated query parameters and fragments, replaces existing UTM values, and places the new parameters before the fragment.</p></details>
      <details><summary>Do UTM links work with Google Analytics 4?</summary><p>Yes. GA4 recognizes standard campaign parameters. After data processing, review acquisition reports and the session source, medium, and campaign dimensions.</p></details>
      <details><summary>Should I use UTM parameters on internal links?</summary><p>Usually not. Internal UTM tags can overwrite the original campaign attribution and make reports harder to interpret.</p></details>
      <details><summary>What is a UTM campaign ID?</summary><p>utm_id is an optional identifier that can distinguish a campaign using a stable ID, especially when campaign names vary or connect to an external ad platform.</p></details>
      <details><summary>Can I use the same UTM link across multiple platforms?</summary><p>You can, but separate links with accurate source and medium values make it possible to compare platforms. Reuse one link only when you intentionally want combined reporting.</p></details>
      <details><summary>Does this UTM builder store campaign information?</summary><p>Links are generated locally and are not sent to a server. Recent-link history is off by default; if you enable it, saved links stay in this browser until you clear them.</p></details>
      <details><summary>Can I use UTM parameters for email marketing?</summary><p>Yes. Use a consistent email source and medium, then use campaign names to distinguish newsletters, automations, or promotions.</p></details>
      <details><summary>Do UTM links affect SEO?</summary><p>UTM parameters do not directly improve search rankings. They are for attribution; avoid unnecessary URL variants and keep your canonical URL pointed at the clean page when appropriate.</p></details>
    </section>
  )
}
