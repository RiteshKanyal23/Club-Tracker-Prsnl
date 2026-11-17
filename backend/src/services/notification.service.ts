export const notificationService = {
  async notifyUser(_userId: string, _payload: { title: string; body?: string; type?: string }) {
    return { delivered: true };
  },
};
