import { PrismaClient, RoleName, ProjectStatus, TaskStatus, TaskPriority } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const roleNames = [RoleName.ADMIN, RoleName.COORDINATOR, RoleName.PROJECT_MANAGER, RoleName.TEAM_LEADER, RoleName.MEMBER];
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

  const project = await prisma.project.create({
    data: { name: "Sample Project Alpha", description: "Initial sample project", status: ProjectStatus.ACTIVE, deadline: new Date(Date.now() + 30*24*60*60*1000) },
  });

  const task = await prisma.task.create({
    data: { projectId: project.id, title: "Sample Task", description: "Seeded task", status: TaskStatus.TODO, priority: TaskPriority.MEDIUM },
  });

  const member = await prisma.member.findFirst();
  if (member) {
    await prisma.attendanceRecord.create({ data: { memberId: member.id, date: new Date(), status: "PRESENT" } }).catch(() => {});
    await prisma.taskAssignee.create({ data: { taskId: task.id, memberId: member.id } }).catch(() => {});
  }

  await prisma.meeting.create({ data: { title: "Kickoff Meeting", agenda: "Project kickoff", scheduledAt: new Date(Date.now() + 2*24*60*60*1000) } });
  await prisma.announcement.create({ data: { title: "Welcome", content: "Welcome to Team Algebra Club Tracker", pinned: true, targetRoles: [], targetTeams: [] } });

  // Phase 5 sample collaboration/knowledge/notifications
  const admin = createdUsers.find((u: any) => u.role === RoleName.ADMIN) || createdUsers[0];
  if (admin) {
    const channel = await prisma.channel.create({
      data: { name: "General", type: "GENERAL", createdBy: admin.id, members: { create: createdUsers.slice(0, 5).map((u: any) => ({ userId: u.id })) } },
    }).catch(() => null);
    if (channel) {
      await prisma.message.create({ data: { channelId: channel.id, senderId: admin.id, content: "Welcome to the Team Algebra general channel!" } }).catch(() => {});
    }
    await prisma.knowledgeArticle.create({
      data: { title: "Getting Started", content: "# Getting Started\n\nWelcome to Team Algebra Club Tracker.\n\n- Check your tasks\n- Join a channel\n- Read announcements", category: "Onboarding", tags: ["intro", "guide"], authorId: admin.id, published: true },
    }).catch(() => {});
    await prisma.notification.create({ data: { userId: admin.id, type: "SYSTEM", title: "Seed complete", body: "Phase 5 sample data has been initialized." } }).catch(() => {});
  }

  // Phase 6 sample achievements/feedback
  const firstAchievement = await prisma.achievement.upsert({ where: { name: "Early Contributor" }, update: {}, create: { name: "Early Contributor", description: "Joined and contributed to Team Algebra", criteriaKey: "seed_early", points: 10 } }).catch(() => null);
  const sampleMember = await prisma.member.findFirst();
  if (firstAchievement && sampleMember) {
    await prisma.memberAchievement.upsert({ where: { memberId_achievementId: { memberId: sampleMember.id, achievementId: firstAchievement.id } }, update: {}, create: { memberId: sampleMember.id, achievementId: firstAchievement.id, note: "Seed award" } }).catch(() => {});
  }
  const memberUser = createdUsers.find((u: any) => u.role === RoleName.MEMBER) || createdUsers[createdUsers.length - 1];
  if (admin && memberUser) {
    await prisma.feedback.create({ data: { fromUserId: admin.id, toUserId: memberUser.id, rating: 5, comment: "Great start! Keep up the good work.", status: "REVIEWED", response: "Thank you!", reviewedBy: admin.id } }).catch(() => {});
  }

  console.log(`Seed complete. Users: ${createdUsers.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
