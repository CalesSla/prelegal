"use client";

import { useRef, useState, useCallback } from "react";
import { Template, getDefaultValues } from "@/lib/template";
import { SavedDoc, createDocument, updateDocument } from "@/lib/api";
import DocumentForm from "./DocumentForm";
import DocumentPreview from "./DocumentPreview";
import ChatPanel from "./ChatPanel";

interface DocumentPageProps {
  template: Template;
  savedDoc: SavedDoc | null;
  onSaved: (id: number, values: Record<string, string>) => void;
  onBack: () => void;
}

export default function DocumentPage({ template, savedDoc, onSaved, onBack }: DocumentPageProps) {
  const [values, setValues] = useState<Record<string, string>>(() => ({
    ...getDefaultValues(template),
    ...(savedDoc?.values || {}),
  }));
  const [savedDocId, setSavedDocId] = useState<number | null>(savedDoc?.id ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const handleChange = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleFieldsExtracted = useCallback(
    (fields: Record<string, string>) => {
      setValues((prev) => ({ ...prev, ...fields }));
    },
    [],
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      if (savedDocId) {
        await updateDocument(savedDocId, valuesRef.current);
      } else {
        const doc = await createDocument(template.id, template.name, valuesRef.current);
        setSavedDocId(doc.id);
        onSaved(doc.id, valuesRef.current);
      }
      setSaveStatus("Saved");
      setTimeout(() => setSaveStatus(null), 2000);
    } catch {
      setSaveStatus("Save failed");
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setIsSaving(false);
    }
  }, [savedDocId, template, onSaved]);

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
      const safeName = template.name.replace(/\s+/g, "_");
      const firstTextValue = template.variables
        .filter((v) => v.type === "text")
        .map((v) => values[v.key])
        .find((v) => v?.trim());
      const suffix = firstTextValue
        ? `_${firstTextValue.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "")}`
        : "";
      const filename = `${safeName}${suffix}.pdf`;

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
  }, [values, template]);

  const allRequiredFilled = template.variables
    .filter((v) => v.required)
    .every((v) => values[v.key]?.trim());

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: "#209dd7" }}
            >
              &larr; Back
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Prelegal</h1>
              <p className="text-sm text-gray-500">
                {template.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 text-white text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ backgroundColor: "#209dd7" }}
            >
              {isSaving ? "Saving..." : saveStatus || "Save Document"}
            </button>
            <button
              onClick={handleDownload}
              disabled={!allRequiredFilled || isDownloading}
              className="px-5 py-2 text-white text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ backgroundColor: "#753991" }}
            >
              {isDownloading ? "Generating..." : "Download PDF"}
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_minmax(0,1fr)] gap-6">
          <aside className="bg-white rounded-lg border border-gray-200 p-6 h-fit lg:sticky lg:top-8">
            <DocumentForm
              variables={template.variables}
              values={values}
              onChange={handleChange}
            />
          </aside>
          <div className="lg:h-[calc(100vh-140px)] lg:sticky lg:top-8">
            <ChatPanel
              templateId={template.id}
              fieldValues={values}
              onFieldsExtracted={handleFieldsExtracted}
            />
          </div>
          <section>
            <DocumentPreview
              title={template.name}
              sections={template.sections}
              variables={template.variables}
              values={values}
              previewRef={previewRef}
              showDisclaimer
            />
          </section>
        </div>
      </main>
    </div>
  );
}
