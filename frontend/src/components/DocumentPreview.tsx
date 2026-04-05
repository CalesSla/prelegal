"use client";

import { fillTemplate, TemplateSection, TemplateVariable } from "@/lib/template";

interface DocumentPreviewProps {
  title: string;
  sections: TemplateSection[];
  variables: TemplateVariable[];
  values: Record<string, string>;
  previewRef: React.RefObject<HTMLDivElement | null>;
}

function highlightUnfilled(text: string): React.ReactNode[] {
  const parts = text.split(/(\{\{\w+\}\})/g);
  return parts.map((part, i) => {
    if (/^\{\{\w+\}\}$/.test(part)) {
      return (
        <span key={i} style={{ backgroundColor: "#fef08a", color: "#854d0e" }} className="px-1 rounded text-sm">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function renderContent(
  content: string,
  values: Record<string, string>,
  variables: TemplateVariable[]
): React.ReactNode {
  const filled = fillTemplate(content, values, variables);
  const paragraphs = filled.split("\n\n");
  return paragraphs.map((para, i) => {
    const lines = para.split("\n");
    return (
      <p key={`p-${i}`} className="mb-3 leading-relaxed">
        {lines.map((line, j) => (
          <span key={j}>
            {j > 0 && <br />}
            {highlightUnfilled(line)}
          </span>
        ))}
      </p>
    );
  });
}

export default function DocumentPreview({
  title,
  sections,
  variables,
  values,
  previewRef,
}: DocumentPreviewProps) {
  return (
    <div
      ref={previewRef}
      className="p-10 max-w-[800px] mx-auto"
      style={{
        fontFamily: "'Georgia', 'Times New Roman', serif",
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        color: "#1f2937",
      }}
    >
      <h1 className="text-2xl font-bold text-center mb-8 tracking-wide uppercase">
        {title}
      </h1>
      {sections.map((section, index) => (
        <div key={section.title} className="mb-6">
          <h2 className="text-base font-bold mb-2 uppercase tracking-wide">
            {index + 1}. {section.title}
          </h2>
          <div className="text-sm" style={{ color: "#1f2937" }}>
            {renderContent(section.content, values, variables)}
          </div>
        </div>
      ))}
    </div>
  );
}
