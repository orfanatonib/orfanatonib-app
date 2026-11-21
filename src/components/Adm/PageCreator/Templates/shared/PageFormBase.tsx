import AdminPageShell from '@/components/common/admin-shell/AdminPageShell';
import type { PageFormBaseProps } from './types';
import { useUnsavedChangesWarning } from './useUnsavedChangesWarning';

/** Casca dos criadores de página: usa a mesma AdminPageShell das listagens. */
export default function PageFormBase({
  heading,
  onBack,
  testId,
  fluid = true,
  warnOnUnsavedChanges = false,
  isDirty = false,
  children,
}: PageFormBaseProps) {
  useUnsavedChangesWarning(warnOnUnsavedChanges, isDirty);

  return (
    <AdminPageShell testId={testId} title={heading} onBack={onBack} fluid={fluid}>
      {children}
    </AdminPageShell>
  );
}
