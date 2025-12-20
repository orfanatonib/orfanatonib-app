export type Pagela = {
  id: string;
  createdAt: string;
  updatedAt: string;
  sheltered: {
    id: string;
    name: string;
  };
  teacher: {
    id: string;
    user: Record<string, any>; // O backend está retornando user: {} vazio
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
  page: string; // O backend está retornando page como string
  limit: string; // O backend está retornando limit como string
};


export type CreatePagelaPayload = {
  shelteredId: string;
  teacherProfileId?: string | null;
  referenceDate: string;
  visit: number;
  year?: number;
  present: boolean;
  notes?: string | null;
};

export type UpdatePagelaPayload = Partial<Omit<CreatePagelaPayload, "shelteredId">>;
