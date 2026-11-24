import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ChevronRight, LockKeyhole, ShieldCheck, UserRoundX } from 'lucide-react'
import { Footer, Header } from '@/components/site-shell'
import { VideoTrimmer } from '@/components/video-trimmer'
import { FAQAccordion } from '@/components/faq-accordion'
import type { Tool } from '@/lib/tools'

const site = 'https://tools.digitalivez.com'

const questions = [
  { question: 'How can I trim a video online for free?', answer: 'Choose a video, preview it, set the start and end with the timeline or exact time fields, preview the selection, then choose Trim Video and download the completed clip.' },
  { question: 'Can I trim MP4 videos online?', answer: 'Yes, when your browser can decode the video and encode H.264. MP4 is offered only when this device reports compatible encoder support.' },
  { question: 'Can I trim MOV and WebM videos?', answer: 'MOV and WebM containers can be read when the browser and Mediabunny support their codecs. Container names alone do not guarantee codec compatibility.' },
  { question: 'Does this video trimmer upload my files?', answer: 'No. The original file is read from your device and processed in your browser; it is not sent to Digitalivez servers.' },
  { question: 'Can I trim a video without installing software?', answer: 'Yes. Use a current browser with compatible media decoding and encoding support. No separate editing application is required.' },
  { question: 'Will trimming a video reduce its quality?', answer: 'Exact cuts may require re-encoding. The tool keeps the original dimensions and aims to retain the source frame rate with high-quality encoding, but re-encoding can change image or audio quality.' },
  { question: 'Can I trim a video without a watermark?', answer: 'Yes. This tool does not add a watermark to the exported clip.' },
  { question: 'Can I trim videos on my mobile phone?', answer: 'You can try on a modern mobile browser, but available codecs, memory, processing speed, and direct file saving vary by device. Large videos may work better on a desktop.' },
  { question: 'Does the trimmed video retain its original audio?', answer: 'The primary audio track is included by default when present and when the selected output encoder supports it. The tool will report unsupported combinations rather than silently dropping audio.' },
  { question: 'How do I select an exact start and end time?', answer: 'Type each timestamp in HH:MM:SS.mmm format, or use the two timeline handles. The selected range is checked before export.' },
  { question: 'Why is my video not supported?', answer: 'A file container can hold different codecs. Your browser may lack a decoder or encoder for the codec, or the file may be damaged. Try a commonly encoded MP4 or another current browser.' },
  { question: 'Does this tool have a video file size limit?', answer: 'There is no universal size guarantee. Browser memory and device capability vary. Large exports use direct-to-disk saving when available; otherwise, the tool warns when an estimated in-memory export may be too large.' },
  { question: 'Can I download the trimmed video as MP4?', answer: 'MP4 is available when H.264 and any required AAC audio encoding are supported. WebM is offered as an alternative only when the browser can encode the required VP8 and Opus tracks.' },
  { question: 'Can I remove a section from the middle of a video?', answer: 'This tool exports one continuous selected clip. It does not join separate segments or remove a middle section while preserving both surrounding sections.' },
]

function Breadcrumbs() {
  const items = [
    { label: 'Home', href: `${site}/` },
    { label: 'Video Tools', href: `${site}/video-tools` },
    { label: 'Video Trimmer', href: `${site}/video-tools/video-trimmer` },
  ]
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.label, item: item.href })),
  }
  return <><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span className="crumb-item"><ChevronRight size={14} /><Link href="/video-tools">Video Tools</Link></span><span className="crumb-item"><ChevronRight size={14} /><span aria-current="page">Video Trimmer</span></span></nav><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} /></>
}

function WebPageSchema({ tool }: { tool: Tool }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Free Online Video Trimmer',
    description: 'Trim videos online for free. Cut supported MP4, MOV and WebM clips, preview your selection and download the result. Processing happens in your browser.',
    url: `${site}${tool.route}`,
    isPartOf: { '@type': 'WebSite', name: 'Digitalivez Tools', url: site },
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
}

export function VideoTrimmerPage({ tool }: { tool: Tool }) {
  return <><Header /><main className="inner-main video-page"><Breadcrumbs /><WebPageSchema tool={tool} /><header className="tool-page-head video-page-head"><span className="eyebrow">VIDEO TOOLS · FREE BROWSER TOOL</span><h1>Free Online Video Trimmer</h1><p>Trim a video online, choose precise start and end times, preview the clip, and download it. Your video is processed in your browser—not uploaded to a server.</p><div className="video-page-promises"><span><ShieldCheck size={15} /> Processed on your device</span><span><LockKeyhole size={15} /> Your file stays private</span><span><UserRoundX size={15} /> No registration</span></div></header>
      <VideoTrimmer />
      <div className="video-page-content prose-block">
        <section><h2>How to Trim a Video Online for Free</h2><ol><li>Upload a video from your device.</li><li>Preview it and identify the clip you want to keep.</li><li>Set the start and end times with the timeline handles or exact time fields.</li><li>Choose <strong>Preview selected clip</strong> to check the range.</li><li>Select a supported export format, click <strong>Trim Video</strong>, and download the finished file.</li></ol></section>
        <section><h2>What Is an Online Video Trimmer?</h2><p>Video trimming creates a shorter clip by removing unwanted footage from the beginning or end of a recording. It can help shorten social media clips, remove an introduction, cut a long recording into a shareable excerpt, prepare a video for sharing, or remove an unnecessary ending from a presentation.</p></section>
        <section><h2>Supported Video Formats</h2><p>The trimmer can inspect common containers such as MP4, MOV, WebM, M4V, and MKV when the file structure is supported. A container is only a wrapper: the video and audio codecs inside it must also be decodable and the browser must support the required output encoders. MP4 (H.264 video and AAC audio when present) is preferred; WebM (VP8 video and Opus audio when present) is offered when the current browser supports it. The interface checks actual encoder support and only offers viable formats.</p></section>
        <section><h2>How Does Video Trimming Work?</h2><p>The selected start and end times define one continuous section of the source. To honor arbitrary boundaries instead of extending or shortening a cut to nearby keyframes, this tool uses Mediabunny&apos;s trim option and disables packet copying, sending the selected media through the encoding path. This takes longer than copying existing encoded data but avoids presenting a keyframe-expanded range as an exact cut.</p></section>
        <section><h2>Does This Video Trimmer Upload My Videos?</h2><p>No. The source is read from a local browser file and processed on your device. It is not uploaded to Digitalivez servers or sent to a third-party video-processing service. This avoids transmitting the original footage for trimming; use a private device if the video itself is sensitive.</p></section>
        <section><h2>Can I Trim Videos Without Losing Quality?</h2><p>The export aims to preserve the original displayed dimensions and frame rate and uses a high-quality encoder setting. Precise trimming may require re-encoding, so a small quality change is possible; lossless output cannot be guaranteed. Your original file remains unchanged.</p></section>
        <section><h2>When Should You Use a Video Trimmer?</h2><p>Creators can cut a clean excerpt from a recording, freelancers can prepare a short client preview, businesses can remove dead time from a presentation, and students can keep only the relevant part of a lecture. Always preview the selected range and confirm that the chosen output plays correctly on the device or service where you plan to share it.</p></section>
        <section className="faq-list video-faq"><h2>Frequently Asked Questions</h2><FAQAccordion items={questions} /></section>
      </div>
      <section className="supporting"><h2>Explore more tools</h2><div className="related-links"><Link href="/video-tools">Browse Video Tools <ArrowRight size={15} /></Link><Link href="/image-tools/social-media-resizer">Prepare an image for social media <ArrowRight size={15} /></Link><Link href="/marketing-tools/utm-builder">Build campaign tracking links <ArrowRight size={15} /></Link></div></section>
    </main><Footer /></>
}
