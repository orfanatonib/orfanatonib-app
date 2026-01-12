import { UserRole } from "@/store/slices/auth/authSlice";

export type ProfileImage = {
  id: string;
  title: string;
  description: string;
  url: string;
  uploadType: string;
  mediaType: string;
  isLocalFile: boolean;
  platformType: string | null;
  originalName: string;
  size: number;
  createdAt: string;
  updatedAt: string;
};

export type Profile = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  active: boolean;
  completed: boolean;
  commonUser: boolean;
  createdAt: string;
  updatedAt: string;
  image: ProfileImage | null;
  memberProfile?: {
    id: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    team?: {
      id: string;
      numberTeam: number;
      description: string | null;
      createdAt: string;
      updatedAt: string;
      shelter?: {
        id: string;
        name: string;
        description: string;
        teamsQuantity: number;
        createdAt: string;
        updatedAt: string;
        address?: {
          id: string;
          street: string;
          number: string;
          district: string;
          city: string;
          state: string;
          postalCode: string;
          createdAt: string;
          updatedAt: string;
        };
      };
    };
  } | null;
  leaderProfile?: any | null;
};

export type UpdateProfileDto = {
  name?: string;
  email?: string;
  phone?: string;
};

export type ChangePasswordDto = {
  currentPassword?: string;
  newPassword: string;
};

export type UpdateProfileImageDto = {
  uploadType: 'UPLOAD' | 'LINK';
  url?: string;
  title?: string;
  description?: string;
  isLocalFile?: boolean;
};

export type PersonalData = {
  birthDate?: string;        
  gender?: string;           
  gaLeaderName?: string;     
  gaLeaderContact?: string;  
};

export type UserPreferences = {
  loveLanguages?: string;      
  temperaments?: string;       
  favoriteColor?: string;      
  favoriteFood?: string;       
  favoriteMusic?: string;      
  whatMakesYouSmile?: string;  
  skillsAndTalents?: string;   
};

export type CompleteProfile = {
  id: string;                    
  email: string;
  phone: string;
  name: string;
  role?: string;                 
  personalData?: PersonalData;
  preferences?: UserPreferences;
};

export type CompleteProfileListItem = CompleteProfile & {
  role: string;                  
};

export type CreatePersonalDataDto = {
  birthDate?: string;        
  gender?: string;           
  gaLeaderName?: string;
  gaLeaderContact?: string;
};

export type UpdatePersonalDataDto = CreatePersonalDataDto;

export type CreateUserPreferencesDto = {
  loveLanguages?: string;
  temperaments?: string;
  favoriteColor?: string;
  favoriteFood?: string;
  favoriteMusic?: string;
  whatMakesYouSmile?: string;
  skillsAndTalents?: string;
};

export type UpdateUserPreferencesDto = CreateUserPreferencesDto;

export type CreateCompleteProfileDto = {
  personalData?: CreatePersonalDataDto;
  preferences?: CreateUserPreferencesDto;
};

export type UpdateCompleteProfileDto = {
  personalData?: UpdatePersonalDataDto;
  preferences?: UpdateUserPreferencesDto;
};

export type QueryProfilesDto = {
  
  page?: number;                 
  limit?: number;                

  q?: string;                    
  name?: string;                 
  email?: string;                
  role?: string;                 

  loveLanguages?: string;        
  temperaments?: string;         
  favoriteColor?: string;        

  sortBy?: 'name' | 'email' | 'createdAt' | 'birthDate';  
  order?: 'ASC' | 'DESC';        
};

export type PaginationMeta = {
  currentPage: number;           
  itemsPerPage: number;          
  totalItems: number;            
  totalPages: number;            
  hasNextPage: boolean;          
  hasPreviousPage: boolean;      
};

export type PaginatedProfilesResponse = {
  items: CompleteProfileListItem[];  
  meta: PaginationMeta;              
};
