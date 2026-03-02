import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { ResolvedChatIdentity } from './types/resolved-chat-identity';

@Injectable()
export class IdentityResolutionService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(
    condominiumId: string,
    phone: string,
    currentSelection?: { userId?: string | null; unitId?: string | null },
  ): Promise<ResolvedChatIdentity> {
    const normalizedPhone = this.normalizePhone(phone);

    const user = await this.prisma.user.findFirst({
      where: {
        phone: {
          in: [phone, normalizedPhone],
        },
        deletedAt: null,
      },
    });

    if (!user) {
      return {
        status: 'UNIDENTIFIED',
        normalizedPhone,
        condominiumId,
      };
    }

    const memberships = await this.prisma.userCondominium.findMany({
      where: {
        userId: user.id,
        condominiumId,
      },
      include: {
        unit: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (memberships.length === 0) {
      return {
        status: 'NO_MEMBERSHIP',
        normalizedPhone,
        userId: user.id,
        condominiumId,
      };
    }

    if (currentSelection?.unitId) {
      const selectedMembership = memberships.find(
        (membership) => membership.unitId === currentSelection.unitId,
      );

      if (selectedMembership) {
        return {
          status: 'RESOLVED',
          normalizedPhone,
          userId: user.id,
          condominiumId,
          unitId: selectedMembership.unitId,
        };
      }
    }

    if (memberships.length === 1) {
      const [membership] = memberships;

      return {
        status: 'RESOLVED',
        normalizedPhone,
        userId: user.id,
        condominiumId,
        unitId: membership.unitId,
      };
    }

    return {
      status: 'NEEDS_UNIT_SELECTION',
      normalizedPhone,
      userId: user.id,
      condominiumId,
      candidateUnits: memberships.map((membership) => ({
        condominiumId: membership.condominiumId,
        unitId: membership.unitId,
        unitCode: membership.unit.code,
        isPrimary: membership.isPrimary,
      })),
    };
  }

  normalizePhone(phone: string) {
    const digits = phone.replace(/\D/g, '');

    if (!digits) {
      return phone;
    }

    return digits.startsWith('55') ? `+${digits}` : `+55${digits}`;
  }
}
