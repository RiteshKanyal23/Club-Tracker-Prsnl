import { PrismaClient, RoleName, ProjectStatus, TaskStatus, TaskPriority, TeamCategory } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const roleNames = [RoleName.CEO, RoleName.ADMIN, RoleName.COORDINATOR, RoleName.PROJECT_MANAGER, RoleName.TEAM_LEADER, RoleName.MEMBER];
  for (const rn of roleNames) {
    await prisma.role.upsert({ where: { name: rn }, update: {}, create: { name: rn, description: `${rn} role` } });
  }

  const users: Array<{ email: string; name: string; role: RoleName }> = [
    { email: "admin@teamalgebra.local", name: "Admin User", role: RoleName.ADMIN },
    { email: "coordinator@teamalgebra.local", name: "Coordinator User", role: RoleName.COORDINATOR },
    { email: "pm1@teamalgebra.local", name: "Project Manager One", role: RoleName.PROJECT_MANAGER },
    { email: "pm2@teamalgebra.local", name: "Project Manager Two", role: RoleName.PROJECT_MANAGER },
    { email: "lead1@teamalgebra.local", name: "Team Leader One", role: RoleName.TEAM_LEADER },
    { email: "lead2@teamalgebra.local", name: "Team Leader Two", role: RoleName.TEAM_LEADER },
    { email: "lead3@teamalgebra.local", name: "Team Leader Three", role: RoleName.TEAM_LEADER },
  ];
  for (let i = 1; i <= 15; i++) users.push({ email: `member${i}@teamalgebra.local`, name: `Member ${i}`, role: RoleName.MEMBER });

  const createdUsers = [] as any[];
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, passwordHash, isActive: true, emailVerified: true },
      create: { email: u.email, name: u.name, role: u.role, passwordHash, isActive: true, emailVerified: true },
    });
    createdUsers.push(user);
    const role = await prisma.role.findUnique({ where: { name: u.role } });
    if (role) await prisma.userRole.upsert({ where: { userId_roleId: { userId: user.id, roleId: role.id } }, update: {}, create: { userId: user.id, roleId: role.id } });
    if (u.role === RoleName.MEMBER || u.role === RoleName.TEAM_LEADER) {
      await prisma.member.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });
    }
  }

  // Built-in designations used by the lab member hierarchy.
  const designations = [
    { key: "CEO", name: "CEO" },
    { key: "PROJECT_MANAGER", name: "Project Manager" },
    { key: "FRONTEND_TEAM_LEAD", name: "Frontend Team Lead" },
    { key: "BACKEND_TEAM_LEAD", name: "Backend Team Lead" },
    { key: "DATABASE_TEAM_LEAD", name: "Database Team Lead" },
    { key: "FRONTEND_DEVELOPER", name: "Frontend Developer" },
    { key: "BACKEND_DEVELOPER", name: "Backend Developer" },
    { key: "DATABASE_DEVELOPER", name: "Database Developer" },
  ];
  for (const designation of designations) {
    await prisma.designation.upsert({
      where: { key: designation.key },
      update: { name: designation.name, isBuiltIn: true },
      create: { ...designation, isBuiltIn: true },
    });
  }

  // Exactly six organizational projects, each with Frontend/Backend/Database teams.
  const teamCategoryLabels: Record<TeamCategory, string> = {
    FRONTEND: "Frontend",
    BACKEND: "Backend",
    DATABASE: "Database",
  };
  for (let slot = 1; slot <= 6; slot++) {
    const orgProject = await prisma.project.upsert({
      where: { orgSlot: slot },
      update: { name: `Project ${slot}`, status: ProjectStatus.ACTIVE, deletedAt: null },
      create: { name: `Project ${slot}`, status: ProjectStatus.ACTIVE, orgSlot: slot },
    });
    for (const category of Object.values(TeamCategory)) {
      const team = await prisma.team.upsert({
        where: { projectId_category: { projectId: orgProject.id, category } },
        update: { name: `Project ${slot} ${teamCategoryLabels[category]} Team`, deletedAt: null },
        create: { name: `Project ${slot} ${teamCategoryLabels[category]} Team`, projectId: orgProject.id, category },
      });
      await prisma.projectTeam.upsert({
        where: { projectId_teamId: { projectId: orgProject.id, teamId: team.id } },
        update: {},
        create: { projectId: orgProject.id, teamId: team.id },
      });
    }
  }

  let project = await prisma.project.findFirst({ where: { name: "Sample Project Alpha" } });
  if (!project) {
    project = await prisma.project.create({
      data: { name: "Sample Project Alpha", description: "Initial sample project", status: ProjectStatus.ACTIVE, deadline: new Date(Date.now() + 30*24*60*60*1000) },
    });
  }

  let task = await prisma.task.findFirst({ where: { projectId: project.id, title: "Sample Task" } });
  if (!task) {
    task = await prisma.task.create({
      data: { projectId: project.id, title: "Sample Task", description: "Seeded task", status: TaskStatus.TODO, priority: TaskPriority.MEDIUM },
    });
  }

  const member = await prisma.member.findFirst();
  if (member) {
    const existingAttendance = await prisma.attendanceRecord.findFirst({ where: { memberId: member.id } });
    if (!existingAttendance) {
      await prisma.attendanceRecord.create({ data: { memberId: member.id, date: new Date(), status: "PRESENT" } }).catch(() => {});
    }
    await prisma.taskAssignee.upsert({
      where: { taskId_memberId: { taskId: task.id, memberId: member.id } },
      update: {},
      create: { taskId: task.id, memberId: member.id },
    }).catch(() => {});
  }

  if (!(await prisma.meeting.findFirst({ where: { title: "Kickoff Meeting" } }))) {
    await prisma.meeting.create({ data: { title: "Kickoff Meeting", agenda: "Project kickoff", scheduledAt: new Date(Date.now() + 2*24*60*60*1000) } });
  }
  if (!(await prisma.announcement.findFirst({ where: { title: "Welcome" } }))) {
    await prisma.announcement.create({ data: { title: "Welcome", content: "Welcome to Team Algebra Club Tracker", pinned: true, targetRoles: [], targetTeams: [] } });
  }

  // Phase 5 sample collaboration/knowledge/notifications
  const admin = createdUsers.find((u: any) => u.role === RoleName.ADMIN) || createdUsers[0];
  if (admin) {
    let channel = await prisma.channel.findFirst({ where: { name: "General", type: "GENERAL" } });
    if (!channel) {
      channel = await prisma.channel.create({
        data: { name: "General", type: "GENERAL", createdBy: admin.id, members: { create: createdUsers.slice(0, 5).map((u: any) => ({ userId: u.id })) } },
      }).catch(() => null);
    }
    if (channel && !(await prisma.message.findFirst({ where: { channelId: channel.id, senderId: admin.id } }))) {
      await prisma.message.create({ data: { channelId: channel.id, senderId: admin.id, content: "Welcome to the Team Algebra general channel!" } }).catch(() => {});
    }
    if (!(await prisma.knowledgeArticle.findFirst({ where: { title: "Getting Started" } }))) {
      await prisma.knowledgeArticle.create({
        data: { title: "Getting Started", content: "# Getting Started\n\nWelcome to Team Algebra Club Tracker.\n\n- Check your tasks\n- Join a channel\n- Read announcements", category: "Onboarding", tags: ["intro", "guide"], authorId: admin.id, published: true },
      }).catch(() => {});
    }
    if (!(await prisma.notification.findFirst({ where: { userId: admin.id, title: "Seed complete" } }))) {
      await prisma.notification.create({ data: { userId: admin.id, type: "SYSTEM", title: "Seed complete", body: "Phase 5 sample data has been initialized." } }).catch(() => {});
    }
  }

  // Phase 6 sample achievements/feedback
  const firstAchievement = await prisma.achievement.upsert({ where: { name: "Early Contributor" }, update: {}, create: { name: "Early Contributor", description: "Joined and contributed to Team Algebra", criteriaKey: "seed_early", points: 10 } }).catch(() => null);
  const sampleMember = await prisma.member.findFirst();
  if (firstAchievement && sampleMember) {
    await prisma.memberAchievement.upsert({ where: { memberId_achievementId: { memberId: sampleMember.id, achievementId: firstAchievement.id } }, update: {}, create: { memberId: sampleMember.id, achievementId: firstAchievement.id, note: "Seed award" } }).catch(() => {});
  }
  const memberUser = createdUsers.find((u: any) => u.role === RoleName.MEMBER) || createdUsers[createdUsers.length - 1];
  if (admin && memberUser && !(await prisma.feedback.findFirst({ where: { fromUserId: admin.id, toUserId: memberUser.id } }))) {
    await prisma.feedback.create({ data: { fromUserId: admin.id, toUserId: memberUser.id, rating: 5, comment: "Great start! Keep up the good work.", status: "REVIEWED", response: "Thank you!", reviewedBy: admin.id } }).catch(() => {});
  }

  console.log(`Seed complete. Users: ${createdUsers.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
