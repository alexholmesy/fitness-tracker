import { getProfile } from '@/lib/data'
import { SettingsClient } from './settings-client'
import { PageHeader } from '@/components/ui-kit'

export default async function SettingsPage() {
  const profile = await getProfile()
  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="Settings" subtitle="Personalise your goals" />
      <div className="px-4">
        <SettingsClient profile={profile} />
      </div>
    </div>
  )
}
