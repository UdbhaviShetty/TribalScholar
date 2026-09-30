// Minimal recording stand-in for a Supabase client: every chained call is logged; awaiting resolves via `respond`.
export type Op = { m: string; args: any[] };
export type Call = { table: string; ops: Op[] };
export type Reply = { data?: any; error?: { message: string } | null; count?: number };

export function mockClient(respond: (c: Call) => Reply) {
  const calls: Call[] = [];
  const client: any = {
    from(table: string) {
      const call: Call = { table, ops: [] };
      calls.push(call);
      const p: any = new Proxy({}, {
        get(_t, prop) {
          if (prop === 'then') return (res: any, rej: any) => Promise.resolve({ data: null, error: null, ...respond(call) }).then(res, rej);
          return (...args: any[]) => { call.ops.push({ m: String(prop), args }); return p; };
        },
      });
      return p;
    },
  };
  return { client, calls };
}
export const has = (c: Call, m: string, ...args: any[]) =>
  c.ops.some((o) => o.m === m && args.every((a, i) => JSON.stringify(o.args[i]) === JSON.stringify(a)));
