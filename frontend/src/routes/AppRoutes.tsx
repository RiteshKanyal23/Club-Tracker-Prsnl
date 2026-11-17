import { Navigate, Route, Routes } from "react-router-dom";
import { LandingPage } from "../pages/public/LandingPage";
import { LoginSelection } from "../pages/auth/LoginSelection";
import { AdminLogin } from "../pages/auth/AdminLogin";
import { CeoLogin } from "../pages/auth/CeoLogin";
import { MemberLogin } from "../pages/auth/MemberLogin";
import { AdminSignup } from "../pages/auth/AdminSignup";
import { MemberSignup } from "../pages/auth/MemberSignup";
import { AdminVerifyEmail } from "../pages/auth/AdminVerifyEmail";
import { MemberVerifyEmail } from "../pages/auth/MemberVerifyEmail";
import { AdminForgotPassword } from "../pages/auth/AdminForgotPassword";
import { MemberForgotPassword } from "../pages/auth/MemberForgotPassword";
import { AdminResetPassword } from "../pages/auth/AdminResetPassword";
import { MemberResetPassword } from "../pages/auth/MemberResetPassword";
import { AdminProtectedRoute } from "../components/auth/AdminProtectedRoute";
import { MemberProtectedRoute } from "../components/auth/MemberProtectedRoute";
import { AdminDashboard } from "../pages/admin/AdminDashboard";
import { CoordinatorDashboard } from "../pages/coordinator/CoordinatorDashboard";
import { ProjectManagerDashboard } from "../pages/project-manager/ProjectManagerDashboard";
import { TeamLeaderDashboard } from "../pages/team-leader/TeamLeaderDashboard";
import { MemberDashboard } from "../pages/member/MemberDashboard";
import { CeoDashboard } from "../pages/ceo/CeoDashboard";
import { ProjectsPage } from "../pages/admin/ProjectsPage";
import { TeamsPage } from "../pages/admin/TeamsPage";
import { MembersPage } from "../pages/admin/MembersPage";
import { TasksPage } from "../pages/admin/TasksPage";
import { AttendancePage } from "../pages/admin/AttendancePage";
import { LeavePage } from "../pages/admin/LeavePage";
import { MeetingsPage } from "../pages/admin/MeetingsPage";
import { DocumentsPage } from "../pages/admin/DocumentsPage";
import { CommunicationPage } from "../pages/common/CommunicationPage";
import { AnnouncementsPage } from "../pages/common/AnnouncementsPage";
import { KnowledgePage } from "../pages/common/KnowledgePage";
import { NotificationsPage } from "../pages/common/NotificationsPage";
import { AnalyticsPage } from "../pages/common/AnalyticsPage";
import { AchievementsPage } from "../pages/common/AchievementsPage";
import { FeedbackPage } from "../pages/common/FeedbackPage";
import { AuditPage } from "../pages/common/AuditPage";
import { MemberAttendancePage } from "../pages/member/MemberAttendancePage";
import { OrganizationPage } from "../pages/common/OrganizationPage";
import { AttendanceRosterPage } from "../pages/common/AttendanceRosterPage";
import { AttendanceReportsPage } from "../pages/common/AttendanceReportsPage";
import { MyProfilePage } from "../pages/common/MyProfilePage";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleRoute } from "./RoleRoute";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginSelection />} />

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/ceo/login" element={<CeoLogin />} />
      <Route path="/admin/signup" element={<AdminSignup />} />
      <Route path="/admin/verify-email" element={<AdminVerifyEmail />} />
      <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
      <Route path="/admin/reset-password" element={<AdminResetPassword />} />

      <Route path="/member/login" element={<MemberLogin />} />
      <Route path="/member/signup" element={<MemberSignup />} />
      <Route path="/member/verify-email" element={<MemberVerifyEmail />} />
      <Route path="/member/forgot-password" element={<MemberForgotPassword />} />
      <Route path="/member/reset-password" element={<MemberResetPassword />} />

      <Route element={<AdminProtectedRoute />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/projects" element={<ProjectsPage />} />
        <Route path="/admin/teams" element={<TeamsPage />} />
        <Route path="/admin/members" element={<MembersPage />} />
        <Route path="/admin/tasks" element={<TasksPage />} />
        <Route path="/admin/attendance" element={<AttendancePage />} />
        <Route path="/admin/organization" element={<OrganizationPage />} />
        <Route path="/admin/attendance/roster" element={<AttendanceRosterPage />} />
        <Route path="/admin/attendance/reports" element={<AttendanceReportsPage />} />
        <Route path="/admin/profile" element={<MyProfilePage />} />
        <Route path="/admin/leave" element={<LeavePage />} />
        <Route path="/admin/meetings" element={<MeetingsPage />} />
        <Route path="/admin/documents" element={<DocumentsPage />} />
        <Route path="/admin/communication" element={<CommunicationPage />} />
        <Route path="/admin/announcements" element={<AnnouncementsPage />} />
        <Route path="/admin/knowledge" element={<KnowledgePage />} />
        <Route path="/admin/notifications" element={<NotificationsPage />} />
        <Route path="/admin/analytics" element={<AnalyticsPage />} />
        <Route path="/admin/achievements" element={<AchievementsPage />} />
        <Route path="/admin/feedback" element={<FeedbackPage />} />
        <Route path="/admin/audit" element={<AuditPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute roles={["COORDINATOR"]} />}>
          <Route path="/coordinator" element={<CoordinatorDashboard />} />
          <Route path="/coordinator/projects" element={<ProjectsPage />} />
          <Route path="/coordinator/teams" element={<TeamsPage />} />
          <Route path="/coordinator/members" element={<MembersPage />} />
          <Route path="/coordinator/tasks" element={<TasksPage />} />
          <Route path="/coordinator/attendance" element={<AttendancePage />} />
          <Route path="/coordinator/organization" element={<OrganizationPage />} />
          <Route path="/coordinator/attendance/roster" element={<AttendanceRosterPage />} />
          <Route path="/coordinator/attendance/reports" element={<AttendanceReportsPage />} />
          <Route path="/coordinator/profile" element={<MyProfilePage />} />
          <Route path="/coordinator/leave" element={<LeavePage />} />
          <Route path="/coordinator/meetings" element={<MeetingsPage />} />
          <Route path="/coordinator/documents" element={<DocumentsPage />} />
          <Route path="/coordinator/communication" element={<CommunicationPage />} />
          <Route path="/coordinator/announcements" element={<AnnouncementsPage />} />
          <Route path="/coordinator/knowledge" element={<KnowledgePage />} />
          <Route path="/coordinator/notifications" element={<NotificationsPage />} />
          <Route path="/coordinator/analytics" element={<AnalyticsPage />} />
          <Route path="/coordinator/achievements" element={<AchievementsPage />} />
          <Route path="/coordinator/feedback" element={<FeedbackPage />} />
          <Route path="/coordinator/audit" element={<AuditPage />} />
        </Route>
        <Route element={<RoleRoute roles={["PROJECT_MANAGER"]} />}>
          <Route path="/project-manager" element={<ProjectManagerDashboard />} />
          <Route path="/project-manager/projects" element={<ProjectsPage />} />
          <Route path="/project-manager/tasks" element={<TasksPage />} />
          <Route path="/project-manager/attendance/roster" element={<AttendanceRosterPage />} />
          <Route path="/project-manager/attendance/reports" element={<AttendanceReportsPage />} />
          <Route path="/project-manager/profile" element={<MyProfilePage />} />
          <Route path="/project-manager/meetings" element={<MeetingsPage />} />
          <Route path="/project-manager/documents" element={<DocumentsPage />} />
          <Route path="/project-manager/communication" element={<CommunicationPage />} />
          <Route path="/project-manager/announcements" element={<AnnouncementsPage />} />
          <Route path="/project-manager/knowledge" element={<KnowledgePage />} />
          <Route path="/project-manager/notifications" element={<NotificationsPage />} />
          <Route path="/project-manager/analytics" element={<AnalyticsPage />} />
          <Route path="/project-manager/achievements" element={<AchievementsPage />} />
          <Route path="/project-manager/feedback" element={<FeedbackPage />} />
        </Route>
        <Route element={<RoleRoute roles={["TEAM_LEADER"]} />}>
          <Route path="/team-leader" element={<TeamLeaderDashboard />} />
          <Route path="/team-leader/tasks" element={<TasksPage />} />
          <Route path="/team-leader/attendance" element={<AttendancePage />} />
          <Route path="/team-leader/attendance/roster" element={<AttendanceRosterPage />} />
          <Route path="/team-leader/attendance/reports" element={<AttendanceReportsPage />} />
          <Route path="/team-leader/profile" element={<MyProfilePage />} />
          <Route path="/team-leader/leave" element={<LeavePage />} />
          <Route path="/team-leader/meetings" element={<MeetingsPage />} />
          <Route path="/team-leader/documents" element={<DocumentsPage />} />
          <Route path="/team-leader/communication" element={<CommunicationPage />} />
          <Route path="/team-leader/announcements" element={<AnnouncementsPage />} />
          <Route path="/team-leader/knowledge" element={<KnowledgePage />} />
          <Route path="/team-leader/notifications" element={<NotificationsPage />} />
          <Route path="/team-leader/analytics" element={<AnalyticsPage />} />
          <Route path="/team-leader/achievements" element={<AchievementsPage />} />
          <Route path="/team-leader/feedback" element={<FeedbackPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute roles={["CEO"]} />}>
          <Route path="/ceo" element={<CeoDashboard />} />
          <Route path="/ceo/organization" element={<OrganizationPage />} />
          <Route path="/ceo/attendance/roster" element={<AttendanceRosterPage />} />
          <Route path="/ceo/attendance/reports" element={<AttendanceReportsPage />} />
          <Route path="/ceo/profile" element={<MyProfilePage />} />
        </Route>
      </Route>

      <Route element={<MemberProtectedRoute />}>
        <Route path="/member" element={<MemberDashboard />} />
        <Route path="/member/dashboard" element={<MemberDashboard />} />
        <Route path="/member/tasks" element={<TasksPage />} />
        <Route path="/member/attendance" element={<MemberAttendancePage />} />
        <Route path="/member/profile" element={<MyProfilePage />} />
        <Route path="/member/leave" element={<LeavePage />} />
        <Route path="/member/meetings" element={<MeetingsPage />} />
        <Route path="/member/documents" element={<DocumentsPage />} />
        <Route path="/member/communication" element={<CommunicationPage />} />
        <Route path="/member/announcements" element={<AnnouncementsPage />} />
        <Route path="/member/knowledge" element={<KnowledgePage />} />
        <Route path="/member/notifications" element={<NotificationsPage />} />
        <Route path="/member/analytics" element={<AnalyticsPage />} />
        <Route path="/member/achievements" element={<AchievementsPage />} />
        <Route path="/member/feedback" element={<FeedbackPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
