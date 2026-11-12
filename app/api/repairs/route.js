import { authorize, columns, databaseError, failure, toRepair } from '../../../lib/repairs';

export async function GET(request) {
  const client = await authorize(request);
  if (client instanceof Response) return client;
  const { data, error } = await client.from('smart_repair_reports')
    .select(columns).order('created_at', { ascending: false }).order('id');
  if (error) return databaseError();
  return Response.json({ repairs: data.map(toRepair) }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request) {
  const client = await authorize(request);
  if (client instanceof Response) return client;
  const body = await request.json().catch(() => null);
  const fields = [
    ['reporterName', 'reporter_name', 100],
    ['officeArea', 'office_area', 100],
    ['deviceType', 'device_type', 100],
    ['description', 'description', 2000],
  ];
  const row = {};
  for (const [field, column, limit] of fields) {
    const value = typeof body?.[field] === 'string' ? body[field].trim() : '';
    if (!value || value.length > limit) {
      return failure(400, 'INVALID_REPORT', '请填写所有字段并检查输入长度。');
    }
    row[column] = value;
  }
  const { data, error } = await client.from('smart_repair_reports')
    .insert(row).select(columns).single();
  if (error) return databaseError();
  return Response.json({ repair: toRepair(data) }, { status: 201 });
}
