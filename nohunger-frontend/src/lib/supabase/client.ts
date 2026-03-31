/**
 * This file is kept for backward compatibility during migration.
 * All pages should use src/lib/api/* instead.
 * The returned object is a no-op stub.
 */
export function createClient() {
  const noOp = () => Promise.resolve({ data: null, error: null, count: 0 });
  const builder: any = {
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    delete: () => builder,
    eq: () => builder,
    neq: () => builder,
    gte: () => builder,
    lte: () => builder,
    in: () => builder,
    order: () => builder,
    limit: () => builder,
    single: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: (v: any) => any) => Promise.resolve({ data: [], error: null, count: 0 }).then(resolve),
  };
  return {
    from: (_table: string) => ({ ...builder }),
    auth: {
      resetPasswordForEmail: noOp,
      signOut: noOp,
    },
  };
}
