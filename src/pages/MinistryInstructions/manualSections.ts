import { MANUAL_GRADIENTS } from './constants';
import { ManualSectionVariant, type ManualSectionDefinition } from './types';
import IdentitySection from './components/IdentitySection';
import WhyEvangelizeSection from './components/WhyEvangelizeSection';
import DressCodeSection from './components/DressCodeSection';
import CommitmentSection from './components/CommitmentSection';
import FrequencySection from './components/FrequencySection';
import SafetySection from './components/SafetySection';
import LimitsSection from './components/LimitsSection';
import FinancialSection from './components/FinancialSection';
import CommunicationSection from './components/CommunicationSection';
import AdministrativeSection from './components/AdministrativeSection';
import PrioritiesSection from './components/PrioritiesSection';
import PlanningMeetingsSection from './components/PlanningMeetingsSection';
import VisitDaySection from './components/VisitDaySection';
import ShelterSectorsSection from './components/ShelterSectorsSection';
import VisitTimeline from './components/VisitTimeline';
import ChecklistSection from './components/ChecklistSection';

const { Gradient, Light } = ManualSectionVariant;

/** Ordem do manual. Seções em gradiente e claras se alternam, todas no mesmo cartão. */
export const MANUAL_SECTIONS: readonly ManualSectionDefinition[] = [
  {
    id: 'identity',
    title: 'Identidade do Ministério',
    subtitle: 'Todos que chegam ao ministério são resposta de oração',
    variant: Gradient,
    gradient: MANUAL_GRADIENTS.indigoRose,
    Content: IdentitySection,
  },
  {
    id: 'why-evangelize',
    title: 'Por que Evangelizar Crianças?',
    subtitle: 'Dados da APEC (Aliança Pró Evangelização de Crianças)',
    variant: Light,
    Content: WhyEvangelizeSection,
  },
  {
    id: 'dress-code',
    title: 'Padrões e Vestimenta',
    subtitle: 'Unidade de padrão - Todos seguem o mesmo padrão de conduta',
    variant: Gradient,
    gradient: MANUAL_GRADIENTS.tealIndigo,
    Content: DressCodeSection,
  },
  {
    id: 'commitment',
    title: 'Compromisso e Vida Espiritual',
    subtitle: 'Nossa eficácia externa depende da nossa vida interna com Deus.',
    variant: Light,
    Content: CommitmentSection,
  },
  {
    id: 'frequency',
    title: 'Frequência e Organização',
    subtitle: "O ministério não é 'ir quando der' - Exige organização",
    variant: Gradient,
    gradient: MANUAL_GRADIENTS.indigoRose,
    Content: FrequencySection,
  },
  {
    id: 'safety',
    title: 'Segurança e Conduta',
    subtitle: 'Regras INEGOCIÁVEIS para proteção de todos.',
    variant: Light,
    Content: SafetySection,
  },
  {
    id: 'limits',
    title: 'Limites do Ministério',
    subtitle: 'O que NÃO fazemos - Foco em Evangelização',
    variant: Gradient,
    gradient: MANUAL_GRADIENTS.slateIndigo,
    Content: LimitsSection,
  },
  {
    id: 'financial',
    title: 'Organização Financeira',
    subtitle: 'Transparência e cuidado com os recursos.',
    variant: Light,
    Content: FinancialSection,
  },
  {
    id: 'communication',
    title: 'Comunicação Oficial',
    subtitle: 'Grupos de WhatsApp - Uso adequado e respeitoso',
    variant: Gradient,
    gradient: MANUAL_GRADIENTS.tealIndigo,
    Content: CommunicationSection,
  },
  {
    id: 'administrative',
    title: 'Administrativo e Segurança',
    variant: Light,
    Content: AdministrativeSection,
  },
  {
    id: 'priorities',
    title: 'Hierarquia de Prioridades',
    subtitle: 'Deus primeiro, Ministério com Excelência',
    variant: Gradient,
    gradient: MANUAL_GRADIENTS.indigoRose,
    Content: PrioritiesSection,
  },
  {
    id: 'planning-meetings',
    title: 'Encontros de Planejamento',
    variant: Light,
    Content: PlanningMeetingsSection,
  },
  {
    id: 'visit-day',
    title: 'No Dia da Visita',
    subtitle: 'Procedimentos e regras para o dia',
    variant: Gradient,
    gradient: MANUAL_GRADIENTS.tealIndigo,
    Content: VisitDaySection,
  },
  {
    id: 'shelter-sectors',
    title: 'Setores do Abrigo',
    variant: Light,
    Content: ShelterSectorsSection,
  },
  {
    id: 'visit-structure',
    title: 'Roteiro Padrão da Visita',
    subtitle: 'Estrutura essencial de 6 momentos',
    variant: Gradient,
    gradient: MANUAL_GRADIENTS.indigoRose,
    Content: VisitTimeline,
  },
  {
    id: 'checklist',
    title: 'Checklist do Membro',
    variant: Light,
    Content: ChecklistSection,
  },
];
