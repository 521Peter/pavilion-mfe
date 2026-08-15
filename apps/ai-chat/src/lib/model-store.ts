import { useState } from "react";

export type ModelId = "gpt-5" | "gpt-5-mini" | "claude-opus";

export type ModelOption = {
  id: ModelId;
  name: string;
  description: string;
};

export const MODELS: ModelOption[] = [
  { id: "gpt-5", name: "GPT-5", description: "智能、快速，适合日常任务" },
  { id: "gpt-5-mini", name: "GPT-5 mini", description: "更轻量，响应更快" },
  { id: "claude-opus", name: "Claude Opus", description: "最强推理能力" },
];

/**
 * Module-level model state. The demo adapter reads this directly (no React),
 * the UI reads/writes it via useState.
 */
let modelState: ModelId = "gpt-5";

/** Non-hook accessor for the adapter (runs outside React render). */
export const getCurrentModel = (): ModelId => modelState;
export const getModelOption = (id: ModelId) =>
  MODELS.find((m) => m.id === id) ?? MODELS[0];

function setModelState(id: ModelId) {
  modelState = id;
}

/**
 * Hook for the ModelPicker. Uses plain useState to stay compatible with
 * assistant-ui's internal React shim.
 */
export function useModelStore() {
  const [current, setCurrent] = useState<ModelId>(modelState);
  const select = (id: ModelId) => {
    setModelState(id);
    setCurrent(id);
  };
  return { current, setCurrent: select };
}
