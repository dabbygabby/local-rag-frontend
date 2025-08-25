import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  App,
  CreateAppRequest,
  UpdateAppRequest,
  RunAppRequest,
  RunAppResponse,
  AppRun,
} from "@/types/app";

// API functions
const appsApi = {
  getAll: async (): Promise<{ apps: App[]; total: number; page: number; limit: number }> => {
    const response = await fetch("/api/apps");
    if (!response.ok) throw new Error("Failed to fetch apps");
    return response.json();
  },

  getById: async (id: string): Promise<App> => {
    const response = await fetch(`/api/apps/${id}`);
    if (!response.ok) throw new Error("Failed to fetch app");
    return response.json();
  },

  create: async (data: CreateAppRequest): Promise<App> => {
    const response = await fetch("/api/apps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create app");
    return response.json();
  },

  update: async (id: string, data: UpdateAppRequest): Promise<App> => {
    const response = await fetch(`/api/apps/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update app");
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`/api/apps/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete app");
  },

  run: async (id: string, data: RunAppRequest): Promise<RunAppResponse> => {
    const response = await fetch(`/api/apps/${id}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to run app");
    return response.json();
  },

  getRuns: async (id: string): Promise<{ runs: AppRun[]; total: number }> => {
    const response = await fetch(`/api/apps/${id}/history`);
    if (!response.ok) throw new Error("Failed to fetch app runs");
    return response.json();
  },
};

// React Query hooks
export const useApps = () => {
  return useQuery({
    queryKey: ["apps"],
    queryFn: appsApi.getAll,
  });
};

export const useApp = (id: string) => {
  return useQuery({
    queryKey: ["app", id],
    queryFn: () => appsApi.getById(id),
    enabled: !!id,
  });
};

export const useAppRuns = (id: string) => {
  return useQuery({
    queryKey: ["app-runs", id],
    queryFn: () => appsApi.getRuns(id),
    enabled: !!id,
  });
};

export const useCreateApp = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: appsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
  });
};

export const useUpdateApp = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAppRequest }) =>
      appsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      queryClient.invalidateQueries({ queryKey: ["app", id] });
    },
  });
};

export const useDeleteApp = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: appsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
  });
};

export const useRunApp = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RunAppRequest }) =>
      appsApi.run(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["app-runs", id] });
    },
  });
};
