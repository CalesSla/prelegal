"use client";

import { TemplateVariable } from "@/lib/template";

interface NdaFormProps {
  variables: TemplateVariable[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

export default function NdaForm({ variables, values, onChange }: NdaFormProps) {
  return (
    <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
      <h2 className="text-lg font-semibold text-gray-900">
        Document Details
      </h2>
      {variables.map((variable) => (
        <div key={variable.key}>
          <label
            htmlFor={variable.key}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {variable.label}
            {variable.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {variable.type === "select" && variable.options ? (
            <select
              id={variable.key}
              value={values[variable.key] || ""}
              onChange={(e) => onChange(variable.key, e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              {variable.options.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          ) : variable.type === "date" ? (
            <input
              id={variable.key}
              type="date"
              value={values[variable.key] || ""}
              onChange={(e) => onChange(variable.key, e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          ) : variable.type === "number" ? (
            <input
              id={variable.key}
              type="number"
              min={1}
              value={values[variable.key] || ""}
              onChange={(e) => onChange(variable.key, e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          ) : (
            <input
              id={variable.key}
              type="text"
              value={values[variable.key] || ""}
              onChange={(e) => onChange(variable.key, e.target.value)}
              placeholder={variable.label}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          )}
        </div>
      ))}
    </form>
  );
}
