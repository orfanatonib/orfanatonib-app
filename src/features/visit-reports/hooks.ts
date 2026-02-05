import { useState, useCallback, useEffect } from "react";
import { VisitReport, VisitReportFilters } from "./types";
import { getVisitReports, createVisitReport, updateVisitReport, deleteVisitReport } from "./api";
import { CreateVisitReportDto, UpdateVisitReportDto } from "./types";

export const useVisitReports = () => {
    const [reports, setReports] = useState<VisitReport[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchReports = useCallback(async (filters?: VisitReportFilters) => {
        setLoading(true);
        setError(null);
        try {
            const data = await getVisitReports(filters);
            setReports(data);
        } catch (err) {
            setError("Erro ao carregar Relatórios das Visitas");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const createReport = async (data: CreateVisitReportDto) => {
        try {
            const newReport = await createVisitReport(data);
            setReports((prev) => [newReport, ...prev]);
            return newReport;
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const updateReport = async (id: string, data: UpdateVisitReportDto) => {
        try {
            const updatedReport = await updateVisitReport(id, data);
            setReports((prev) => prev.map((r) => (r.id === id ? updatedReport : r)));
            return updatedReport;
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const deleteReport = async (id: string) => {
        try {
            await deleteVisitReport(id);
            setReports((prev) => prev.filter((r) => r.id !== id));
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    return {
        reports,
        loading,
        error,
        refetch: fetchReports,
        createReport,
        updateReport,
        deleteReport,
    };
};
