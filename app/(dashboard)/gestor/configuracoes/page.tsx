import { loadCommissionSettings } from '@/lib/sales/data';
import CommissionSettingsForm from '@/components/settings/commission-settings-form';

export const dynamic = 'force-dynamic';

export default async function ConfiguracoesPage() {
  const settings = await loadCommissionSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-ink">Configurações</h1>
        <p className="mt-1 text-sm text-ink-dim">Somente o gestor altera estes valores.</p>
      </div>
      <CommissionSettingsForm initialSettings={settings} />
    </div>
  );
}
