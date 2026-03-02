import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { ResolvedChatIdentity } from './types/resolved-chat-identity';

interface DispatchParams {
  channelDisplayName: string;
  condominiumId: string;
  inboundText?: string;
  interactiveReplyId?: string;
  contextState: string;
  contextJson?: Record<string, any>;
  identity: ResolvedChatIdentity;
}

@Injectable()
export class IntentDispatcherService {
  constructor(private readonly prisma: PrismaService) {}

  async dispatch(params: DispatchParams) {
    if (params.identity.status === 'UNIDENTIFIED') {
      return {
        state: 'IDLE',
        text: `Seu numero nao esta cadastrado no ${params.channelDisplayName}. Fale com a administracao.`,
        contextJson: {},
      };
    }

    if (params.identity.status === 'NO_MEMBERSHIP') {
      return {
        state: 'IDLE',
        text: `Seu numero nao possui residencia ativa neste condominio. Fale com a administracao.`,
        contextJson: {},
      };
    }

    if (params.identity.status === 'NEEDS_UNIT_SELECTION') {
      const selectedUnit = this.tryResolveUnitSelection(
        params.inboundText ?? params.interactiveReplyId,
        params.identity.candidateUnits ?? [],
      );

      if (selectedUnit) {
        return {
          state: 'AWAITING_MAIN_MENU_SELECTION',
          text: this.buildMenuMessage(params.channelDisplayName, selectedUnit.unitCode),
          selectedUnitId: selectedUnit.unitId,
          userId: params.identity.userId!,
          contextJson: {
            selectedUnitCode: selectedUnit.unitCode,
          },
        };
      }

      return {
        state: 'AWAITING_UNIT_SELECTION',
        text: this.buildUnitSelectionMessage(
          params.channelDisplayName,
          params.identity.candidateUnits ?? [],
        ),
        userId: params.identity.userId!,
        contextJson: {
          candidateUnits: params.identity.candidateUnits,
        },
      };
    }

    const command = this.extractCommand(params.inboundText, params.interactiveReplyId);

    if (command === 'reiniciar') {
      return {
        state: 'IDLE',
        text: 'Contexto reiniciado. Envie "menu" para continuar.',
        userId: params.identity.userId!,
        selectedUnitId: null,
        contextJson: {},
      };
    }

    if (command === 'trocar unidade') {
      const userResidences = await this.prisma.userCondominium.findMany({
        where: {
          userId: params.identity.userId!,
          condominiumId: params.condominiumId,
        },
        include: {
          unit: true,
        },
      });

      return {
        state: 'AWAITING_UNIT_SELECTION',
        text: this.buildUnitSelectionMessage(
          params.channelDisplayName,
          userResidences.map((userResidence) => ({
            condominiumId: userResidence.condominiumId,
            unitId: userResidence.unitId,
            unitCode: userResidence.unit.code,
            isPrimary: userResidence.isPrimary,
          })),
        ),
        userId: params.identity.userId!,
        contextJson: {},
      };
    }

    if (params.contextState === 'AWAITING_OCCURRENCE_INPUT' && params.inboundText) {
      await this.prisma.occurrence.create({
        data: {
          condominiumId: params.condominiumId,
          unitId: params.identity.unitId!,
          createdById: params.identity.userId!,
          description: params.inboundText,
        },
      });

      return {
        state: 'AWAITING_MAIN_MENU_SELECTION',
        text: 'Ocorrencia registrada com sucesso.\n\n' + this.buildMenuMessage(params.channelDisplayName),
        userId: params.identity.userId!,
        selectedUnitId: params.identity.unitId,
        contextJson: {},
      };
    }

    switch (command) {
      case 'menu':
        return {
          state: 'AWAITING_MAIN_MENU_SELECTION',
          text: this.buildMenuMessage(params.channelDisplayName),
          userId: params.identity.userId!,
          selectedUnitId: params.identity.unitId,
          contextJson: {},
        };
      case 'consultar boletos':
        return {
          state: 'AWAITING_MAIN_MENU_SELECTION',
          text: await this.buildInvoicesMessage(params.condominiumId, params.identity.unitId!),
          userId: params.identity.userId!,
          selectedUnitId: params.identity.unitId,
          contextJson: {},
        };
      case 'consultar documentos':
        return {
          state: 'AWAITING_MAIN_MENU_SELECTION',
          text: await this.buildDocumentsMessage(params.condominiumId),
          userId: params.identity.userId!,
          selectedUnitId: params.identity.unitId,
          contextJson: {},
        };
      case 'listar espacos':
        return {
          state: 'AWAITING_MAIN_MENU_SELECTION',
          text: await this.buildSpacesMessage(params.condominiumId),
          userId: params.identity.userId!,
          selectedUnitId: params.identity.unitId,
          contextJson: {},
        };
      case 'ver minhas encomendas':
        return {
          state: 'AWAITING_MAIN_MENU_SELECTION',
          text: await this.buildPackagesMessage(params.condominiumId, params.identity.unitId!),
          userId: params.identity.userId!,
          selectedUnitId: params.identity.unitId,
          contextJson: {},
        };
      case 'abrir ocorrencia':
        return {
          state: 'AWAITING_OCCURRENCE_INPUT',
          text: 'Descreva a ocorrencia em uma mensagem.',
          userId: params.identity.userId!,
          selectedUnitId: params.identity.unitId,
          contextJson: {},
        };
      default:
        return {
          state: 'AWAITING_MAIN_MENU_SELECTION',
          text:
            'Nao entendi sua solicitacao.\n\n' + this.buildMenuMessage(params.channelDisplayName),
          userId: params.identity.userId!,
          selectedUnitId: params.identity.unitId,
          contextJson: {},
        };
    }
  }

  private extractCommand(inboundText?: string, interactiveReplyId?: string) {
    const rawValue = (interactiveReplyId ?? inboundText ?? '').trim().toLowerCase();

    if (!rawValue) {
      return 'menu';
    }

    if (['1', 'menu'].includes(rawValue)) return 'menu';
    if (['2', 'consultar boletos', 'boletos'].includes(rawValue)) return 'consultar boletos';
    if (['3', 'consultar documentos', 'documentos'].includes(rawValue)) return 'consultar documentos';
    if (['4', 'listar espacos', 'espacos', 'espaços'].includes(rawValue)) return 'listar espacos';
    if (['5', 'ver minhas encomendas', 'encomendas'].includes(rawValue)) return 'ver minhas encomendas';
    if (['6', 'abrir ocorrencia', 'ocorrencia', 'ocorrência'].includes(rawValue)) return 'abrir ocorrencia';
    if (['7', 'trocar unidade'].includes(rawValue)) return 'trocar unidade';
    if (['8', 'reiniciar'].includes(rawValue)) return 'reiniciar';

    return rawValue;
  }

  private tryResolveUnitSelection(rawValue: string | undefined, candidateUnits: Array<{ unitId: string; unitCode: string }>) {
    if (!rawValue) {
      return null;
    }

    const normalized = rawValue.trim().toLowerCase();
    const index = Number(normalized);

    if (!Number.isNaN(index) && candidateUnits[index - 1]) {
      return candidateUnits[index - 1];
    }

    return candidateUnits.find(
      (candidate) =>
        candidate.unitId === normalized ||
        candidate.unitCode.toLowerCase() === normalized,
    ) ?? null;
  }

  private buildMenuMessage(channelDisplayName: string, unitCode?: string) {
    const unitSuffix = unitCode ? `\nUnidade atual: ${unitCode}` : '';

    return `Voce esta falando com ${channelDisplayName}.${unitSuffix}

1. Menu
2. Consultar boletos
3. Consultar documentos
4. Listar espacos
5. Ver minhas encomendas
6. Abrir ocorrencia
7. Trocar unidade
8. Reiniciar`;
  }

  private buildUnitSelectionMessage(
    channelDisplayName: string,
    candidateUnits: Array<{ unitCode: string; isPrimary: boolean }>,
  ) {
    const options = candidateUnits
      .map((unit, index) => `${index + 1}. ${unit.unitCode}${unit.isPrimary ? ' (principal)' : ''}`)
      .join('\n');

    return `Voce esta falando com ${channelDisplayName}.\nEscolha a unidade:\n${options}`;
  }

  private async buildInvoicesMessage(condominiumId: string, unitId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        condominiumId,
        unitId,
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: 5,
    });

    if (invoices.length === 0) {
      return 'Nenhum boleto encontrado para sua unidade.';
    }

    const lines = invoices.map(
      (invoice) => `- ${invoice.type} | ${invoice.status} | venc. ${invoice.dueDate.toISOString().slice(0, 10)}`,
    );

    return `Boletos encontrados:\n${lines.join('\n')}`;
  }

  private async buildDocumentsMessage(condominiumId: string) {
    const documents = await this.prisma.document.findMany({
      where: {
        condominiumId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    if (documents.length === 0) {
      return 'Nenhum documento disponivel no momento.';
    }

    return `Documentos recentes:\n${documents
      .map((document) => `- ${document.title}`)
      .join('\n')}`;
  }

  private async buildSpacesMessage(condominiumId: string) {
    const spaces = await this.prisma.space.findMany({
      where: {
        condominiumId,
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
      take: 10,
    });

    if (spaces.length === 0) {
      return 'Nenhum espaco cadastrado no momento.';
    }

    return `Espacos disponiveis:\n${spaces
      .map((space) => `- ${space.name}`)
      .join('\n')}`;
  }

  private async buildPackagesMessage(condominiumId: string, unitId: string) {
    const packages = await this.prisma.package.findMany({
      where: {
        condominiumId,
        unitId,
      },
      orderBy: {
        receivedAt: 'desc',
      },
      take: 5,
    });

    if (packages.length === 0) {
      return 'Nenhuma encomenda encontrada para sua unidade.';
    }

    return `Encomendas recentes:\n${packages
      .map((item) => `- ${item.status} em ${item.receivedAt.toISOString().slice(0, 10)}`)
      .join('\n')}`;
  }
}
