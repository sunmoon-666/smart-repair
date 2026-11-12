import { createSupabase } from './supabase';

export const supabase = typeof window === 'undefined' ? null : createSupabase();

export async function requestRepairs(path = '', method = 'GET', body) {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error('请重新登录。');

  const response = await fetch('/api/repairs' + path, {
    method,
    cache: 'no-store',
    headers: {
      Authorization: 'Bearer ' + data.session.access_token,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message ?? '操作失败，请重试。');
  return payload;
}
