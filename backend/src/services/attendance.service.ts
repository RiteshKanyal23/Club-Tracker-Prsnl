export const attendanceService = {
  calculateSummary(records: Array<{ status: string }>) {
    const total = records.length;
    const present = records.filter(r => r.status === "PRESENT").length;
    return { total, present, rate: total ? present / total : 0 };
  },
};
