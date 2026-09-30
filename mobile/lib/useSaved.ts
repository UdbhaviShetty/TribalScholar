import { useCallback, useState } from 'react';
import { useLoad, useRepo } from './repo';

/** Saved-scholarship ids with optimistic toggling that rolls back if the write fails. */
export function useSaved() {
  const repo = useRepo();
  const [ids, setIds] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { error: loadError, reload } = useLoad(async () => { const x = await repo.listSavedIds(); setIds(x); return x; }, [repo]);

  const toggle = useCallback(async (id: string) => {
    const wasSaved = ids.includes(id);
    setActionError(null); setBusyId(id);
    setIds((p) => (wasSaved ? p.filter((x) => x !== id) : [...p, id]));
    try { await repo.setSaved(id, !wasSaved); }
    catch (e) { setIds((p) => (wasSaved ? [...p, id] : p.filter((x) => x !== id))); setActionError((e as Error).message); }
    finally { setBusyId(null); }
  }, [ids, repo]);

  return { ids, busyId, error: actionError ?? loadError, toggle, reload };
}
