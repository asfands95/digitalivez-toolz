'use client'

import { useId, useState } from 'react'
import { Minus, Plus } from 'lucide-react'

type FAQItem = { question: string; answer: string }

export function FAQAccordion({ items, className = '' }: { items: FAQItem[]; className?: string }) {
  const id = useId().replace(/:/g, '')
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  return (
    <div className={`faq-accordion ${className}`.trim()}>
      {items.map((item, index) => {
        const expanded = expandedIndex === index
        const answerId = `${id}-answer-${index}`
        return (
          <article className={`faq-accordion-item${expanded ? ' is-open' : ''}`} key={item.question}>
            <h3 className="faq-accordion-heading">
              <button type="button" aria-expanded={expanded} aria-controls={answerId} onClick={() => setExpandedIndex(expanded ? null : index)}>
                <span>{item.question}</span>
                {expanded ? <Minus size={17} aria-hidden="true" /> : <Plus size={17} aria-hidden="true" />}
              </button>
            </h3>
            <div className="faq-accordion-answer" id={answerId} aria-hidden={!expanded}>
              <div className="faq-accordion-answer-inner"><p>{item.answer}</p></div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
