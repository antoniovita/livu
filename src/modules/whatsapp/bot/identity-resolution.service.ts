import { Injectable } from '@nestjs/common';
import { normalizePhone } from 'src/common/utils/phone.util';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { CandidateCondominium, ResolvedChatIdentity } from './types/resolved-chat-identity';

@Injectable()
export class IdentityResolutionService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(
    phone: string,
    currentContext?: {
      userId?: string | null;
      condominiumId?: string | null;
      selectedUnitId?: string | null;
    },
  ): Promise<ResolvedChatIdentity> {
    const normalizedPhone = normalizePhone(phone);

    const user = await this.prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (!user) {
      return {
        status: 'UNIDENTIFIED',
        normalizedPhone,
      };
    }

    const userResidences = await this.prisma.userCondominium.findMany({
      where: {
        userId: user.id,
      },
      select: {
        condominiumId: true,
        unitId: true,
        isPrimary: true,
        createdAt: true,
        condominium: {
          select: {
            name: true,
          },
        },
        unit: {
          select: {
            code: true,
          },
        },
      },
      orderBy: [
        {
          isPrimary: 'desc',
        },
        {
          createdAt: 'asc',
        },
      ],
    });

    if (userResidences.length === 0) {
      return {
        status: 'NO_RESIDENCE',
        normalizedPhone,
        userId: user.id,
      };
    }

    const candidateCondominiums: CandidateCondominium[] = Array.from(
      new Map(
        userResidences.map((userResidence) => [
          userResidence.condominiumId,
          {
            condominiumId: userResidence.condominiumId,
            name: userResidence.condominium.name,
          },
        ]),
      ).values(),
    );

    let resolvedCondominiumId: string | undefined = currentContext?.condominiumId ?? undefined;

    if (!resolvedCondominiumId) {
      if (candidateCondominiums.length > 1) {
        return {
          status: 'NEEDS_CONDOMINIUM_SELECTION',
          normalizedPhone,
          userId: user.id,
          candidateCondominiums,
        };
      }

      resolvedCondominiumId = candidateCondominiums[0]?.condominiumId;
    }

    const userResidencesForCondominium = userResidences.filter(
      (userResidence) => userResidence.condominiumId === resolvedCondominiumId,
    );

    if (!resolvedCondominiumId || userResidencesForCondominium.length === 0) {
      return {
        status: 'NO_RESIDENCE',
        normalizedPhone,
        userId: user.id,
      };
    }

    if (currentContext?.selectedUnitId) {
      const selectedResidence = userResidencesForCondominium.find(
        (userResidence) => userResidence.unitId === currentContext.selectedUnitId,
      );

      if (selectedResidence) {
        return {
          status: 'RESOLVED',
          normalizedPhone,
          userId: user.id,
          condominiumId: resolvedCondominiumId,
          unitId: selectedResidence.unitId,
        };
      }
    }

    if (userResidencesForCondominium.length === 1) {
      return {
        status: 'RESOLVED',
        normalizedPhone,
        userId: user.id,
        condominiumId: resolvedCondominiumId,
        unitId: userResidencesForCondominium[0].unitId,
      };
    }

    const primaryResidences = userResidencesForCondominium.filter(
      (userResidence) => userResidence.isPrimary,
    );

    if (primaryResidences.length === 1) {
      return {
        status: 'RESOLVED',
        normalizedPhone,
        userId: user.id,
        condominiumId: resolvedCondominiumId,
        unitId: primaryResidences[0].unitId,
      };
    }

    return {
      status: 'NEEDS_UNIT_SELECTION',
      normalizedPhone,
      userId: user.id,
      condominiumId: resolvedCondominiumId,
      candidateUnits: userResidencesForCondominium.map((userResidence) => ({
        unitId: userResidence.unitId,
        unitCode: userResidence.unit.code,
        isPrimary: userResidence.isPrimary,
      })),
    };
  }
}
