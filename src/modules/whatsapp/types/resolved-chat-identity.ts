export type IdentityResolutionStatus =
  | 'UNIDENTIFIED'
  | 'NO_RESIDENCE'
  | 'NEEDS_CONDOMINIUM_SELECTION'
  | 'NEEDS_UNIT_SELECTION'
  | 'RESOLVED';

export interface CandidateCondominium {
  condominiumId: string;
  name: string;
}

export interface CandidateUnit {
  unitId: string;
  unitCode: string;
  isPrimary: boolean;
}

export interface ResolvedChatIdentity {
  status: IdentityResolutionStatus;
  normalizedPhone: string;
  userId?: string;
  condominiumId?: string;
  unitId?: string;
  candidateCondominiums?: CandidateCondominium[];
  candidateUnits?: CandidateUnit[];
}
