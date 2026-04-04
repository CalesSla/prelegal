"use client";

import { fillTemplate, TemplateSection } from "@/lib/template";

interface NdaPreviewProps {
  title: string;
  sections: TemplateSection[];
  values: Record<string, string>;
  previewRef: React.RefObject<HTMLDivElement | null>;
}

function highlightUnfilled(text: string): React.ReactNode[] {
  const parts = text.split(/(\{\{\w+\}\})/g);
  return parts.map((part, i) => {
    if (/^\{\{\w+\}\}$/.test(part)) {
      return (
        <span key={`${i}-${part}`} style={{ backgroundColor: "#fef08a", color: "#854d0e" }} className="px-1 rounded text-sm">
          {part}
        </span>
      );
    }
    return part;
  });
}

function renderContent(
  content: string,
  values: Record<string, string>
): React.ReactNode {
  const filled = fillTemplate(content, values);
  const paragraphs = filled.split("\n\n");
  return paragraphs.map((para, i) => {
    const lines = para.split("\n");
    return (
      <p key={`p-${i}`} className="mb-3 leading-relaxed">
        {lines.map((line, j) => (
          <span key={`${i}-${j}-${line.slice(0, 20)}`}>
            {j > 0 && <br />}
            {highlightUnfilled(line)}
          </span>
        ))}
      </p>
    );
  });
}

export default function NdaPreview({
  title,
  sections,
  values,
  previewRef,
}: NdaPreviewProps) {
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
            {renderContent(section.content, values)}
          </div>
        </div>
      ))}
    </div>
  );
}
