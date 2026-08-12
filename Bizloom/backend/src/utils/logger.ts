import prisma from '../config/db';

export interface LogActionParams {
  userId?: string;
  userEmail?: string;
  action: string;
  module: string;
  description?: string;
  ipAddress?: string;
  severity?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
}

export const logAction = async (params: LogActionParams) => {
  try {
    await prisma.systemLog.create({
      data: {
        userId: params.userId,
        userEmail: params.userEmail,
        action: params.action,
        module: params.module,
        description: params.description,
        ipAddress: params.ipAddress,
        severity: params.severity || 'INFO',
      }
    });
  } catch (error) {
    console.error('Failed to write to SystemLog:', error);
  }
};
