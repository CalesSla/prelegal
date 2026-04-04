"use client";

import { useRef, useState, useCallback } from "react";
import { getTemplate, getDefaultValues, fillTemplate } from "@/lib/template";
import NdaForm from "./NdaForm";
import NdaPreview from "./NdaPreview";

export default function NdaPage() {
  const [template] = useState(() => getTemplate());
  const [values, setValues] = useState<Record<string, string>>(() =>
    getDefaultValues(template)
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleChange = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleDownload = useCallback(async () => {
    const element = previewRef.current;
    if (!element) {
      alert("Unable to generate PDF. Please refresh the page and try again.");
      return;
    }

    const missingRequired = template.variables.filter(
      (v) => v.required && !values[v.key]?.trim()
    );
    if (missingRequired.length > 0) {
      alert(
        `Please fill in all required fields: ${missingRequired.map((v) => v.label).join(", ")}`
      );
      return;
    }

    setIsDownloading(true);

    let html2pdf;
    try {
      html2pdf = (await import("html2pdf.js")).default;
    } catch (err) {
      console.error("Failed to load PDF library:", err);
      alert("The PDF library could not be loaded. Check your connection and try again.");
      setIsDownloading(false);
      return;
    }

    try {
      const partyName = values.disclosing_party_name || "NDA";
      const typeLabel = values.nda_type === "one-way" ? "OneWay" : "Mutual";
      const filename = `${typeLabel}_NDA_${partyName.replace(/\s+/g, "_")}.pdf`;

      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(element)
        .save();
    } catch (err) {
      console.error("PDF rendering failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }, [values, template.variables]);

  const allRequiredFilled = template.variables
    .filter((v) => v.required)
    .every((v) => values[v.key]?.trim());

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Prelegal</h1>
            <p className="text-sm text-gray-500">
              Non-Disclosure Agreement Generator
            </p>
          </div>
          <button
            onClick={handleDownload}
            disabled={!allRequiredFilled || isDownloading}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isDownloading ? "Generating..." : "Download PDF"}
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">
          <aside className="bg-white rounded-lg border border-gray-200 p-6 h-fit lg:sticky lg:top-8">
            <NdaForm
              variables={template.variables}
              values={values}
              onChange={handleChange}
            />
          </aside>
          <section>
            <NdaPreview
              title={template.name}
              sections={template.sections}
              values={values}
              previewRef={previewRef}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
