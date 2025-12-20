export type DecisionType = "ACCEPTED" | "RECONCILED";

export type CreateAcceptedChristDto = {
  shelteredId: string;
  decision?: DecisionType | null;
  notes?: string | null;
};

export type AcceptedChristResponseDto = {
  id: string;
  decision: DecisionType | null;
  notes?: string | null;
  sheltered: {
    id: string;
    name: string;
    gender: "M" | "F";
    birthDate: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type AcceptedChristShortDto = {
  id: string;
  decision: DecisionType | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

