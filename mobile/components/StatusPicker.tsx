import { useState } from 'react';
import { View } from 'react-native';
import { STUDENT_SETTABLE_STATUSES, type ApplicationStatus } from '../lib/core';
import { useRepo } from '../lib/repo';
import { Badge, Notice, Segmented } from './ui';

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  not_applied: 'Not applied', started: 'Started', submitted: 'Submitted', under_verification: 'Under verification', approved: 'Approved', rejected: 'Rejected',
};

/** Students record their own progress (not applied / started / submitted). Later stages come from a reviewer. */
export function StatusPicker({ scholarshipId, status, onChanged }: { scholarshipId: string; status: ApplicationStatus | null; onChanged: (s: ApplicationStatus) => void }) {
  const repo = useRepo();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  if (status && !STUDENT_SETTABLE_STATUSES.includes(status)) {
    return (
      <View style={{ gap: 6 }}>
        <Badge label={`Status: ${STATUS_LABEL[status]}`} tone={status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info'} />
        <Notice>This status was set by a reviewer, so you can't change it here.</Notice>
      </View>
    );
  }
  return (
    <View style={{ gap: 8 }}>
      <Segmented<ApplicationStatus>
        label="My progress" value={status ?? 'not_applied'}
        options={STUDENT_SETTABLE_STATUSES.map((v) => ({ label: STATUS_LABEL[v], value: v }))}
        onChange={async (next) => {
          setError(null); setSaved(false);
          try { await repo.setApplicationStatus(scholarshipId, next); onChanged(next); setSaved(true); }
          catch (e) { setError((e as Error).message); }
        }}
      />
      {error ? <Notice kind="error">{error}</Notice> : null}
      {saved ? <Notice kind="success">Progress saved.</Notice> : null}
    </View>
  );
}
