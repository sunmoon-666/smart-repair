import { authorize, columns, databaseError, failure, statuses, toRepair } from '../../../../lib/repairs';

const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

function reportResponse({ data, error }) {
  if (error) return databaseError();
  if (!data) return failure(404, 'NOT_FOUND', '找不到这条报修。');
  return Response.json({ repair: toRepair(data) }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(request, { params }) {
  const client = await authorize(request);
  if (client instanceof Response) return client;
  const { id } = await params;
  if (!uuid.test(id)) return failure(404, 'NOT_FOUND', '找不到这条报修。');
  return reportResponse(await client.from('smart_repair_reports').select(columns).eq('id', id).maybeSingle());
}

export async function PATCH(request, { params }) {
  const client = await authorize(request);
  if (client instanceof Response) return client;
  const { id } = await params;
  if (!uuid.test(id)) return failure(404, 'NOT_FOUND', '找不到这条报修。');
  const body = await request.json().catch(() => null);
  if (!statuses.includes(body?.status)) return failure(400, 'INVALID_STATUS', '请选择有效状态。');
  return reportResponse(await client.from('smart_repair_reports')
    .update({ status: body.status }).eq('id', id).select(columns).maybeSingle());
}
