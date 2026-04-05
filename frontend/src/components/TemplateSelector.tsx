"use client";

import { useState, useEffect } from "react";
import { Template, TemplateSummary, CategoryInfo } from "@/lib/template";
import { User, SavedDoc, DocumentSummary, listDocuments } from "@/lib/api";

interface TemplateSelectorProps {
  onSelect: (template: Template, savedDoc?: SavedDoc) => void;
  user: User;
  onSignout: () => void;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function TemplateSelector({ onSelect, user, onSignout }: TemplateSelectorProps) {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [savedDocs, setSavedDocs] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/templates").then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      }),
      listDocuments().catch(() => []),
    ])
      .then(([templateData, docs]) => {
        setCategories(templateData.categories);
        setTemplates(templateData.templates);
        setSavedDocs(docs);
      })
      .catch(() => setError("Failed to load templates. Please refresh the page."))
      .finally(() => setLoading(false));
  }, []);

  const loadTemplate = async (templateId: string, loadingKey: string, savedDoc?: SavedDoc) => {
    setLoadingId(loadingKey);
    try {
      const res = await fetch(`/api/templates/${templateId}`);
      if (!res.ok) {
        setError("Failed to load template. Please try again.");
        return;
      }
      const template: Template = await res.json();
      onSelect(template, savedDoc);
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: "#032147" }}>
            Prelegal
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user.email}</span>
            <button
              onClick={onSignout}
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: "#209dd7" }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 flex-1 w-full">
        <p className="text-center text-gray-500 mb-10">
          Choose a legal document template to get started
        </p>

        {savedDocs.length > 0 && (
          <section className="mb-10">
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: "#032147" }}
            >
              My Documents
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => loadTemplate(doc.template_id, `doc-${doc.id}`, { id: doc.id, values: doc.values })}
                  disabled={loadingId !== null}
                  className="text-left bg-white rounded-lg border border-gray-200 p-5 transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    borderColor: loadingId === `doc-${doc.id}` ? "#209dd7" : undefined,
                  }}
                >
                  <h3 className="font-medium text-gray-900 truncate">{doc.title}</h3>
                  <p className="mt-1 text-xs text-gray-400">{timeAgo(doc.updated_at)}</p>
                  {loadingId === `doc-${doc.id}` && (
                    <p className="mt-2 text-xs text-gray-400">Loading...</p>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

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
                    onClick={() => loadTemplate(t.id, t.id)}
                    disabled={loadingId !== null}
                    className="text-left bg-white rounded-lg border border-gray-200 p-5 transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
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

      <footer className="py-6 text-center text-xs text-gray-400 px-6">
        Documents generated by Prelegal are drafts for informational purposes
        only and are subject to professional legal review. They do not
        constitute legal advice.
      </footer>
    </div>
  );
}
