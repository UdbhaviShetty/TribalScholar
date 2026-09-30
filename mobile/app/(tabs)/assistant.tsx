import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Field, Notice, Screen } from '../../components/ui';
import { askServerAssistant, demoAnswer } from '../../lib/assistant';
import { appMode, assistantMode } from '../../lib/config';
import { useProfile, useRepo } from '../../lib/repo';
import { supabase } from '../../lib/supabase';
import { c } from '../../lib/theme';

type Msg = { role: 'you' | 'assistant'; text: string };

export default function Assistant() {
  const repo = useRepo();
  const { profile } = useProfile();
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const server = assistantMode === 'server' && !!supabase;

  const ask = async () => {
    const q = input.trim();
    if (!q || busy) return;
    setInput(''); setError(null); setBusy(true);
    setMsgs((m) => [...m, { role: 'you', text: q }]);
    try {
      const text = server ? await askServerAssistant(supabase!, q) : demoAnswer(q, await repo.listScholarships(), profile);
      setMsgs((m) => [...m, { role: 'assistant', text }]);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <Screen title="AI Scholar Assistant" subtitle="Ask any question about scholarships, eligibility and benefits">
      <Notice>AI answers are based on published scholarship records and your profile. Always confirm eligibility with the official scholarship provider.</Notice>
      {msgs.map((m, i) => (
        <Card key={i}>
          <Text style={{ color: c.muted, fontWeight: '700', fontSize: 13 }}>{m.role === 'you' ? 'You' : 'AI Assistant'}</Text>
          <Text selectable style={{ color: c.ink, fontSize: 15, lineHeight: 22 }}>{m.text}</Text>
        </Card>
      ))}
      {error ? <Notice kind="error">{error}</Notice> : null}
      <View style={{ gap: 8 }}>
        <Field label="Your question" value={input} onChangeText={setInput} multiline maxLength={1000} placeholder="e.g. Which scholarships am I eligible for?" />
        <Button label="Ask" loading={busy} disabled={!input.trim()} onPress={ask} />
      </View>
    </Screen>
  );
}
