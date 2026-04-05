"use client";

import { useState } from "react";
import { Template } from "@/lib/template";
import TemplateSelector from "@/components/TemplateSelector";
import DocumentPage from "@/components/DocumentPage";

export default function Home() {
  const [template, setTemplate] = useState<Template | null>(null);

  if (!template) {
    return <TemplateSelector onSelect={setTemplate} />;
  }

  return <DocumentPage template={template} onBack={() => setTemplate(null)} />;
}
