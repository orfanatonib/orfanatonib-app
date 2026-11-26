import React from "react";
import {
  WifiOff,
  RefreshCcw,
  AlertTriangle,
  Home,
  ArrowLeft,
} from "lucide-react";
import type { AppError } from "@/types/error";

export type ErrorScreenType =
  | "network"
  | "server"
  | "not-found"
  | "forbidden"
  | "generic"
  | "validation";

export interface ErrorScreenAction {
  label: string;
  onClick: () => void;
  variant?: "contained" | "outlined" | "text";
  color?: "primary" | "secondary" | "error" | "info" | "success" | "warning";
  icon?: React.ReactNode;
}

export interface ErrorScreenProps {
  type?: ErrorScreenType;
  title?: string;
  message?: string;
  description?: string;
  error?: AppError;
  actions?: ErrorScreenAction[];
  showDetails?: boolean;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  showRefreshButton?: boolean;
  autoRetry?: boolean;
  retryDelay?: number;
  maxRetries?: number;
  onRetry?: () => void;
  onHome?: () => void;
  onBack?: () => void;
}

interface ErrorConfig {
  icon: React.ElementType;
  title: string;
  message: string;
  description?: string;
  color: string;
  gradient: string;
  actions: {
    label: string;
    variant: "contained" | "outlined" | "text";
    color?: "primary" | "secondary" | "error" | "info" | "success" | "warning";
    icon?: React.ReactNode;
  }[];
}

export const errorConfigs: Record<ErrorScreenType, ErrorConfig> = {
  network: {
    icon: WifiOff,
    title: "Ops! Sem conexão",
    message: "Verifique sua internet e tente novamente",
    color: "#2196F3",
    gradient: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
    actions: [{ label: "Tentar novamente", variant: "contained" as const }],
  },
  server: {
    icon: AlertTriangle,
    title: "Estamos com instabilidade",
    message: "Nosso time já foi avisado e está resolvendo",
    color: "#FF9800",
    gradient: "linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%)",
    actions: [{ label: "Tentar novamente", variant: "contained" as const }],
  },
  "not-found": {
    icon: AlertTriangle,
    title: "Página não encontrada",
    message: "Esta página não existe ou foi movida",
    color: "#9C27B0",
    gradient: "linear-gradient(135deg, #f3e5f5 0%, #ce93d8 100%)",
    actions: [
      { label: "Voltar", variant: "outlined" as const },
      { label: "Página inicial", variant: "contained" as const },
    ],
  },
  forbidden: {
    icon: AlertTriangle,
    title: "Acesso não permitido",
    message: "Você não tem permissão para ver esta página",
    color: "#F44336",
    gradient: "linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)",
    actions: [{ label: "Voltar", variant: "contained" as const }],
  },
  generic: {
    icon: AlertTriangle,
    title: "Algo deu errado",
    message: "Tente novamente em alguns instantes",
    color: "#607D8B",
    gradient: "linear-gradient(135deg, #eceff1 0%, #b0bec5 100%)",
    actions: [{ label: "Tentar novamente", variant: "contained" as const }],
  },
  validation: {
    icon: AlertTriangle,
    title: "Erro de validação",
    message: "Verifique os dados informados e tente novamente",
    color: "#F57C00",
    gradient: "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)",
    actions: [{ label: "Voltar", variant: "contained" as const }],
  },
};
