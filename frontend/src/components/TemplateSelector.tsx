"use client";

import { useState, useEffect } from "react";
import { Template, TemplateSummary, CategoryInfo } from "@/lib/template";

interface TemplateSelectorProps {
  onSelect: (template: Template) => void;
}

export default function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/templates")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => {
        setCategories(data.categories);
        setTemplates(data.templates);
      })
      .catch(() => setError("Failed to load templates. Please refresh the page."))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/templates/${id}`);
      if (!res.ok) {
        setError("Failed to load template. Please try again.");
        return;
      }
      const template: Template = await res.json();
      onSelect(template);
    } catch {
      setError("Failed to load template. Please try again.");
    } finally {
      setLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading templates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold" style={{ color: "#032147" }}>
            Prelegal
          </h1>
          <p className="mt-2 text-gray-500">
            Choose a legal document template to get started
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {categories.map((category) => {
          const categoryTemplates = templates.filter(
            (t) => t.category === category.id
          );
          if (categoryTemplates.length === 0) return null;

          return (
            <section key={category.id} className="mb-10">
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: "#032147" }}
              >
                {category.label}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryTemplates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelect(t.id)}
                    disabled={loadingId !== null}
                    className="text-left bg-white rounded-lg border border-gray-200 p-5 transition-all hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      borderColor: loadingId === t.id ? "#209dd7" : undefined,
                    }}
                  >
                    <h3 className="font-medium text-gray-900">{t.name}</h3>
                    {loadingId === t.id && (
                      <p className="mt-2 text-xs text-gray-400">Loading...</p>
                    )}
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
