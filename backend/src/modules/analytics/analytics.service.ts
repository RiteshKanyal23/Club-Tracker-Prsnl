import { AnalyticsRepository } from "./analytics.repository";

export const AnalyticsService = {
  overview: () => AnalyticsRepository.overview(),
  workload: (params?: { range?: string; days?: number; from?: string; to?: string }) => AnalyticsRepository.workload(params),
  trends: (params?: { days?: number; range?: string; from?: string; to?: string }) => AnalyticsRepository.trends(params),
  // legacy
  list: () => AnalyticsRepository.overview(),
  getById: (_id: string) => AnalyticsRepository.overview(),
  create: (_p: unknown) => ({ message: "Analytics are computed" }),
  update: (_id: string, _p: unknown) => ({ message: "Analytics are computed" }),
  remove: (_id: string) => ({ message: "Analytics are computed" }),
};
