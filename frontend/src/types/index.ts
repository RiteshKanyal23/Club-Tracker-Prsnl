export type Role = "CEO" | "ADMIN" | "COORDINATOR" | "PROJECT_MANAGER" | "TEAM_LEADER" | "MEMBER";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors: any;
}
