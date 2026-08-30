import { create } from "zustand";
import type { VirtualModelOption } from "@/api/chat";

export type ModelOption = VirtualModelOption;

type ModelState = {
  models: ModelOption[];
  currentId?: string;
  error?: string;
  setModels: (models: ModelOption[]) => void;
  setCurrent: (id: string) => void;
  setError: (error?: string) => void;
};

export const useModelStore = create<ModelState>(set => ({
  models: [],
  setModels: models =>
    set(state => ({
      models,
      currentId: models.some(model => model.id === state.currentId) ? state.currentId : models[0]?.id,
      error: models.length ? undefined : "后端尚未配置可用模型"
    })),
  setCurrent: currentId => set({ currentId }),
  setError: error => set({ error })
}));

export const getCurrentModel = () => {
  const { models, currentId } = useModelStore.getState();
  return models.find(model => model.id === currentId);
};
