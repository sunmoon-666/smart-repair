import { createSupabase } from './supabase';

export const columns = 'id,reporter_name,office_area,device_type,description,status,created_at,suggestions';
export const statuses = ['待处理', '处理中', '已完成'];

export function failure(status, code, message) {
  return Response.json({ error: { code, message } }, { status });
}

export async function authorize(request) {
  const token = /^Bearer (\S+)$/.exec(request.headers.get('authorization') ?? '')?.[1];
  if (!token) return failure(401, 'SIGN_IN', '请先登录。');
  const client = createSupabase({
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: 'Bearer ' + token } },
  });
  if (!client) return failure(503, 'CONFIG', 'Supabase 尚未配置。');
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return failure(401, 'SIGN_IN', '登录已失效，请重新登录。');

  const membership = await client.from('smart_repair_members')
    .select('user_id').eq('user_id', data.user.id).maybeSingle();
  if (membership.error) return databaseError();
  if (!membership.data) return failure(403, 'MEMBERS_ONLY', '此账号尚未加入报修小组。');
  return client;
}

export function databaseError() {
  return failure(502, 'DATABASE', '暂时无法访问报修数据，请重试。');
}

export function toRepair(row) {
  return {
    id: row.id,
    reporterName: row.reporter_name,
    officeArea: row.office_area,
    deviceType: row.device_type,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    suggestions: row.suggestions,
  };
}
