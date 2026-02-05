import axiosConfig from "../../config/axiosConfig";
import { CreateVisitReportDto, UpdateVisitReportDto, VisitReport, VisitReportFilters } from "./types";

export const getVisitReports = async (filters?: VisitReportFilters): Promise<VisitReport[]> => {
    const params = new URLSearchParams();
    if (filters?.scheduleId) params.append("scheduleId", filters.scheduleId);
    if (filters?.teamId) params.append("teamId", filters.teamId);
    if (filters?.shelterId) params.append("shelterId", filters.shelterId);

    const response = await axiosConfig.get<VisitReport[]>(`/visit-reports`, { params });
    return response.data;
};

export const getVisitReportById = async (id: string): Promise<VisitReport> => {
    const response = await axiosConfig.get<VisitReport>(`/visit-reports/${id}`);
    return response.data;
};

export const createVisitReport = async (data: CreateVisitReportDto): Promise<VisitReport> => {
    const response = await axiosConfig.post<VisitReport>("/visit-reports", data);
    return response.data;
};

export const updateVisitReport = async (id: string, data: UpdateVisitReportDto): Promise<VisitReport> => {
    const response = await axiosConfig.put<VisitReport>(`/visit-reports/${id}`, data);
    return response.data;
};

export const deleteVisitReport = async (id: string): Promise<void> => {
    await axiosConfig.delete(`/visit-reports/${id}`);
};
