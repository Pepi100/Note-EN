"use client"

import katex from "katex"

const mathPattern = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g
const mathFragmentPattern = /^(?:\$\$[\s\S]+\$\$|\$[^$\n]+\$|\\\[[\s\S]+\\\]|\\\([\s\S]+\\\))$/

function normalizeLatex(expression: string): string {
  return expression
    .replaceAll("√", "\\sqrt")
    .replace(/\\sqrt([0-9A-Za-z])/g, "\\sqrt{$1}")
    .replaceAll("−", "-")
    .replaceAll("×", "\\times ")
    .replaceAll("÷", "\\div ")
}

export function MathText({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  const parts = children.split(mathPattern)

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (!mathFragmentPattern.test(part)) return <span key={index}>{part}</span>

        const displayMode = part.startsWith("$$") || part.startsWith("\\[")
        const expression = displayMode
          ? part.slice(2, -2)
          : part.startsWith("\\(")
            ? part.slice(2, -2)
            : part.slice(1, -1)

        return (
          <span
            key={index}
            className={displayMode ? "my-2 block overflow-x-auto" : "inline"}
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(normalizeLatex(expression), {
                displayMode,
                throwOnError: false,
                trust: false,
              }),
            }}
          />
        )
      })}
    </span>
  )
}
