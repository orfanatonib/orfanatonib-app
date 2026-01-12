export type Pagela = {
  id: string;
  createdAt: string;
  updatedAt: string;
  sheltered: {
    id: string;
    name: string;
  };
  member: {
    id: string;
    user: Record<string, any>; 
  };
  referenceDate: string;
  year: number;
  visit: number;
  present: boolean;
  notes: string | null;
};

export type PageDto<T> = { 
  items: T[]; 
  total: number; 
  page: string; 
  limit: string; 
};

export type CreatePagelaPayload = {
  shelteredId: string;
  memberProfileId?: string | null;
  leaderProfileId?: string | null;
  referenceDate: string;
  visit: number;
  year?: number;
  present: boolean;
  notes?: string | null;
};

export type UpdatePagelaPayload = Partial<Omit<CreatePagelaPayload, "shelteredId">>;
