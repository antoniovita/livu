export type IdentityResolutionStatus =
  | 'UNIDENTIFIED'
  | 'NO_MEMBERSHIP'
  | 'NEEDS_UNIT_SELECTION'
  | 'RESOLVED';

export interface CandidateUnit {
  condominiumId: string;
  unitId: string;
  unitCode: string;
  isPrimary: boolean;
}

export interface ResolvedChatIdentity {
  status: IdentityResolutionStatus;
  normalizedPhone: string;
  userId?: string;
  condominiumId: string;
  unitId?: string;
  candidateUnits?: CandidateUnit[];
}
