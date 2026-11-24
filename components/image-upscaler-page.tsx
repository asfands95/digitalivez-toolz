import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { FAQAccordion } from '@/components/faq-accordion'
import { Footer, Header } from '@/components/site-shell'
import { ImageUpscalerWorkspace } from '@/components/image-upscaler-workspace'

const site = 'https://tools.digitalivez.com'
const questions = [
  { question: 'What is an AI image upscaler?', answer: 'An AI image upscaler uses a trained model to infer plausible image detail while enlarging an image. It can improve the appearance of some small images, but it cannot recover details that were never captured and may produce artifacts.' },
  { question: 'How can I upscale an image online?', answer: 'Choose a JPG, PNG, WebP, or browser-supported AVIF image, select 2× or 4×, then start enhancement. The Real-ESRGAN model and your image are processed in this browser; download the generated result when it is ready.' },
  { question: 'What is the difference between 2× and 4× upscaling?', answer: '2× doubles the width and height. This tool derives 2× from the model’s native 4× output using high-quality browser downsampling. 4× uses the model’s native output dimensions and creates four times as many pixels in each direction.' },
  { question: 'Can I upscale a low-resolution photo?', answer: 'Yes, if it is a supported image and its output stays within the 24-megapixel safety limit. Enhancement is an estimate, not a guarantee of sharper or more faithful details.' },
  { question: 'Does AI upscaling improve image quality?', answer: 'The model reconstructs likely detail and can make some images look clearer at a larger size. Results depend on the source; faces, text, compression artifacts, and fine patterns can be changed or misinterpreted.' },
  { question: 'Which image formats are supported?', answer: 'JPG, PNG, and WebP are supported, along with AVIF when this browser can decode it. The output can be PNG, JPG, or WebP when the browser supports the selected encoder.' },
  { question: 'Are my images uploaded to a server?', answer: 'No. The selected image is decoded and enhanced locally in your browser and is not sent to Digitalivez or an image-processing service. The ONNX Runtime engine is loaded from jsDelivr and the model is downloaded from Hugging Face only when first needed; both may be cached by your browser. Neither receives your image.' },
  { question: 'Can I upscale PNG images without losing transparency?', answer: 'Yes. The model enhances RGB detail and the source alpha channel is retained in the output. Choose PNG to keep transparent pixels; JPG does not support transparency.' },
]

function Breadcrumbs() {
  const items = [{ name: 'Home', url: `${site}/` }, { name: 'Image Tools', url: `${site}/image-tools` }, { name: 'AI Image Upscaler', url: `${site}/image-upscaler` }]
  const schema = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: item.url })) }
  return <><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span className="crumb-item"><span aria-hidden="true">›</span><Link href="/image-tools">Image Tools</Link></span><span className="crumb-item"><span aria-hidden="true">›</span><span aria-current="page">AI Image Upscaler</span></span></nav><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} /></>
}

function StructuredData() {
  const software = { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Digitalivez AI Image Upscaler', applicationCategory: 'MultimediaApplication', operatingSystem: 'Any', description: 'Upscale supported images locally in a browser with the Real-ESRGAN x4v3 super-resolution model.', url: `${site}/image-upscaler` }
  const faq = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: questions.map(item => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) }
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(software).replace(/</g, '\\u003c') }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq).replace(/</g, '\\u003c') }} /></>
}

export function ImageUpscalerPage() {
  return <><Header /><main className="inner-main ai-upscaler-page"><Breadcrumbs /><StructuredData />
    <header className="tool-page-head ai-upscaler-head"><span className="eyebrow">IMAGE TOOLS · LOCAL AI ENHANCEMENT</span><h1>AI Image Upscaler Online</h1><p>Enlarge supported images 2× or 4× with Real-ESRGAN super-resolution in your browser. Compare the generated image and download the actual result; your photo stays on your device.</p></header>
    <ImageUpscalerWorkspace />
    <article className="prose-block ai-upscaler-content">
      <section><h2>Upscale Images to Higher Resolution with AI</h2><p>An AI image upscaler applies a trained super-resolution model to estimate detail while increasing image dimensions. Digitalivez uses the compact, general-purpose Real-ESRGAN x4v3 ONNX model. The model runs locally with ONNX Runtime Web, using WebGPU when available and a WebAssembly fallback otherwise. AI enhancement can change fine details, so inspect the comparison before using an image for print, product listings, or important documents.</p></section>
      <section><h2>How to Upscale an Image Online</h2><ol><li>Choose a JPG, PNG, WebP, or AVIF image from your device.</li><li>Select 2× or the model&apos;s native 4× output.</li><li>Start processing and allow the model to load the first time.</li><li>Compare the original and enhanced versions with the accessible slider.</li><li>Choose PNG, JPG, or WebP and set output compression quality for lossy formats.</li><li>Download the processed image. The original file remains unchanged.</li></ol></section>
      <section><h2>Available Image Upscaling Options</h2><p>The Real-ESRGAN model natively creates an image four times wider and four times taller. The 2× option runs that same super-resolution model, then downsamples its output to twice the source width and height. For example, a 640 × 480 image becomes 1,280 × 960 at 2× or 2,560 × 1,920 at 4×. An output-pixel safety limit may make 4× unavailable for larger originals.</p><p>This model has one enhancement configuration, so the tool does not present a decorative Standard/High quality control. The quality slider applies only to JPG or WebP file encoding, not to the AI model.</p></section>
      <section><h2>Why Use the Digitalivez AI Image Upscaler?</h2><p>The model runs in a dedicated browser worker so the interface can remain responsive during inference. Model downloads are lazy and the browser can cache the model for later visits. The workspace includes a before-and-after comparison, actual output dimensions and file sizes, and a local download. Processing requires no account or software installation.</p></section>
      <section><h2>Supported Image Formats and Limits</h2><p>Upload JPG, PNG, and WebP files; AVIF is accepted when the browser can decode it. Download PNG, JPG, or WebP where the browser supports the selected encoder. PNG preserves the source alpha channel; JPG does not support transparency. Files are limited to 25 MB and 20 megapixels, and generated output is limited to 24 megapixels to reduce the risk of exhausting device memory.</p></section>
      <section><h2>AI Image Upscaling vs. Standard Image Resizing</h2><p>Standard resizing interpolates pixels from the existing image and is useful when exact dimensions are the goal. Super-resolution uses patterns learned during training to infer plausible detail while enlarging the source. Inferred detail is not guaranteed to match the original scene, and neither method can restore information that the source never contained.</p></section>
      <section><h2>Privacy and Model License</h2><p>Your images are processed directly in your browser. Your original images are not uploaded to our servers. The model is downloaded on demand from <a href="https://huggingface.co/Heliosoph/realesrgan-onnx" target="_blank" rel="noopener noreferrer">Heliosoph&apos;s Real-ESRGAN ONNX model card</a>, which identifies the model as BSD-3-Clause licensed and credits Xintao Wang et al. See the <a href="https://github.com/xinntao/Real-ESRGAN/blob/master/LICENSE" target="_blank" rel="noopener noreferrer">upstream Real-ESRGAN license</a>.</p></section>
      <section className="ai-upscaler-faq"><h2>Frequently Asked Questions</h2><FAQAccordion items={questions} /></section>
    </article>
    <section className="supporting ai-upscaler-related"><h2>Explore related tools</h2><div className="related-links"><Link href="/image-tools">Browse Image Tools <ArrowRight size={15} /></Link><Link href="/image-tools/image-resizer">Resize an image to exact dimensions <ArrowRight size={15} /></Link><Link href="/video-upscaler">Upscale a video on a PC <ArrowRight size={15} /></Link></div></section>
  </main><Footer /></>
}
