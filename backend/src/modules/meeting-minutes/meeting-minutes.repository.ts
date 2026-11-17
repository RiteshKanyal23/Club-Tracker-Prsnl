import { prisma } from "../../config/database";
export const MeetingMinutesRepository = {
  list(query:any){ return prisma.meetingMinutes.findMany({ where: query.meetingId ? { meetingId: String(query.meetingId) } : undefined, include: { meeting: true } }); },
  getById(id:string){ return prisma.meetingMinutes.findUnique({ where: { id }, include: { meeting: true } }); },
  upsert(meetingId:string, content:string, recordedBy?:string){ return prisma.meetingMinutes.upsert({ where: { meetingId }, update: { content, recordedBy }, create: { meetingId, content, recordedBy } }); },
  remove(id:string){ return prisma.meetingMinutes.delete({ where: { id } }); },
};
