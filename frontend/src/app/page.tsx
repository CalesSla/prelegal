"use client";

import { useState, useEffect, useCallback } from "react";
import { Template } from "@/lib/template";
import { User, SavedDoc, getMe, signOut as apiSignOut } from "@/lib/api";
import AuthScreen from "@/components/AuthScreen";
import TemplateSelector from "@/components/TemplateSelector";
import DocumentPage from "@/components/DocumentPage";

type View = "checking" | "auth" | "selector" | "document";

export default function Home() {
  const [view, setView] = useState<View>("checking");
  const [user, setUser] = useState<User | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [savedDoc, setSavedDoc] = useState<SavedDoc | null>(null);

  useEffect(() => {
    getMe()
      .then((u) => { setUser(u); setView("selector"); })
      .catch(() => setView("auth"));
  }, []);

  const handleAuth = useCallback((u: User) => {
    setUser(u);
    setView("selector");
  }, []);

  const handleSignout = useCallback(async () => {
    await apiSignOut();
    setUser(null);
    setTemplate(null);
    setSavedDoc(null);
    setView("auth");
  }, []);

  const handleSelectTemplate = useCallback(
    (t: Template, doc?: SavedDoc) => {
      setTemplate(t);
      setSavedDoc(doc || null);
      setView("document");
    },
    [],
  );

  const handleBack = useCallback(() => {
    setTemplate(null);
    setSavedDoc(null);
    setView("selector");
  }, []);

  if (view === "checking") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (view === "auth") {
    return <AuthScreen onAuth={handleAuth} />;
  }

  if (view === "selector" || !template) {
    return (
      <TemplateSelector
        onSelect={handleSelectTemplate}
        user={user!}
        onSignout={handleSignout}
      />
    );
  }

  return (
    <DocumentPage
      template={template}
      savedDoc={savedDoc}
      onSaved={(id, values) => setSavedDoc({ id, values })}
      onBack={handleBack}
    />
  );
}
