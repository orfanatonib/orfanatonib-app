export interface VisitReportSchedule {
    id: string;
    visitNumber: number;
    visitDate?: string;
    meetingDate?: string;
    lessonContent: string;
    observation?: string;
}

export interface VisitReportTeamLeader {
    id: string;
    name: string;
    email: string;
}

export interface VisitReportTeam {
    id: string;
    numberTeam: number;
    description?: string;
    leaders: VisitReportTeamLeader[];
}

export interface VisitReportShelterAddress {
    street?: string;
    number?: string;
    district?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    complement?: string;
}

export interface VisitReportShelter {
    id: string;
    name: string;
    description?: string;
    address?: VisitReportShelterAddress;
}

export interface VisitReport {
    id: string;
    teamMembersPresent: number;
    shelteredHeardMessage: number;
    caretakersHeardMessage: number;
    shelteredDecisions: number;
    caretakersDecisions: number;
    observation?: string;
    schedule: VisitReportSchedule;
    team: VisitReportTeam;
    shelter: VisitReportShelter;
    createdAt: string;
    updatedAt: string;
}

export interface CreateVisitReportDto {
    scheduleId: string;
    teamMembersPresent: number;
    shelteredHeardMessage: number;
    caretakersHeardMessage: number;
    shelteredDecisions: number;
    caretakersDecisions: number;
    observation?: string;
}

export interface UpdateVisitReportDto {
    teamMembersPresent?: number;
    shelteredHeardMessage?: number;
    caretakersHeardMessage?: number;
    shelteredDecisions?: number;
    caretakersDecisions?: number;
    observation?: string;
}

export interface VisitReportFilters {
    scheduleId?: string;
    teamId?: string;
    shelterId?: string;
}
