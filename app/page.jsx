'use client';

import { useEffect, useState } from 'react';
import { requestRepairs, requestSuggestions, supabase } from '../lib/repair-client';

const fields = [
  ['reporterName', '姓名'],
  ['officeArea', '办公区'],
  ['deviceType', '设备'],
  ['description', '故障描述'],
];

const statuses = ['待处理', '处理中', '已完成'];
const card = 'rounded-xl border border-slate-200 bg-white p-5';
const inputStyle = 'mt-1 w-full rounded-md border border-slate-400 px-3 py-2';

export default function RepairPage() {
  const [userId, setUserId] = useState(undefined);

  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return <main className="mx-auto max-w-lg p-8">Supabase 尚未配置，请检查 Vercel 预览环境变量。</main>;
  }
  if (userId === undefined) return <main className="p-8">正在检查登录状态…</main>;
  return userId ? <Reports key={userId} /> : <SignIn />;
}

function SignIn() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function signIn(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const fields = new FormData(event.currentTarget);
    try {
      const result = await supabase.auth.signInWithPassword({
        email: String(fields.get('email')).trim(),
        password: String(fields.get('password')),
      });
      if (result.error) setError('登录失败，请检查邮箱和密码。');
    } catch {
      setError('暂时无法登录，请重试。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg p-6">
      <h1 className="mb-5 text-3xl font-semibold">智能报修小助手</h1>
      <form onSubmit={signIn} className={card + ' space-y-4'}>
        <label className="block">邮箱<input name="email" type="email" autoComplete="username" required className={inputStyle} /></label>
        <label className="block">密码<input name="password" type="password" autoComplete="current-password" required className={inputStyle} /></label>
        {error && <p role="alert" className="text-red-700">{error}</p>}
        <button disabled={busy} className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50">登录</button>
      </form>
    </main>
  );
}

function Reports() {
  const [reports, setReports] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    requestRepairs().then(({ repairs }) => {
      if (!active) return;
      setReports(repairs);
      setSelectedId(current => repairs.some(report => report.id === current) ? current : repairs[0]?.id ?? null);
      setLoaded(true);
    }).catch(error => {
      if (active) setError(error.message);
    });
    return () => { active = false; };
  }, [refresh]);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [notice, setNotice] = useState('');
  const visibleReports = statusFilter
    ? reports.filter(report => report.status === statusFilter)
    : reports;
  const selected = reports.find(report => report.id === selectedId);

  async function addReport(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const values = Object.fromEntries(fields.map(([key]) => [key, String(formData.get(key) ?? '').trim()]));
    if (fields.some(([key]) => !values[key])) {
      setError('请填写所有字段。');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const { repair } = await requestRepairs('', 'POST', values);
      setReports(current => [repair, ...current]);
      setSelectedId(repair.id);
      setStatusFilter('');
      setNotice('报修已添加，初始状态为待处理。');
      form.reset();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(status) {
    setBusy(true);
    setError('');
    try {
      const { repair } = await requestRepairs('/' + selectedId, 'PATCH', { status });
      setReports(current => current.map(report => report.id === repair.id ? repair : report));
      setNotice('报修状态已更新为' + repair.status + '。');
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function suggest() {
    const { id, deviceType, description } = selected;
    setBusy(true);
    setError('');
    setNotice('正在生成排查建议…');
    try {
      const { suggestions } = await requestSuggestions({ repairId: id, deviceType, description });
      setReports(current => current.map(report => report.id === id ? { ...report, suggestions } : report));
      setNotice('排查建议已保存。');
    } catch (error) {
      setNotice('');
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
    } catch {
      setError('退出失败，请重试。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <header>
        <h1 className="text-3xl font-semibold">智能报修小助手</h1>
        <div className="mt-3 flex gap-4 text-sm">
          <button disabled={busy} className="underline" onClick={() => {
            setError('');
            setLoaded(false);
            setRefresh(value => value + 1);
          }}>刷新报修</button>
          <button disabled={busy} className="underline" onClick={signOut}>退出登录</button>
        </div>
      </header>
      <p role="status" className="text-sm text-slate-700">{notice}</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {!loaded && !error && <p role="status">正在读取报修…</p>}
      <div className="grid gap-6 md:grid-cols-2">
        <section className={card} aria-labelledby="new-report">
          <h2 id="new-report" className="text-xl font-semibold">提交报修</h2>
          <form onSubmit={addReport} className="mt-4 space-y-4">
            {fields.map(([key, label]) => (
              <label key={key} className="block text-sm font-medium">
                {label}
                {key === 'description'
                  ? <textarea name={key} required rows={4} className={inputStyle} />
                  : <input name={key} required className={inputStyle} />}
              </label>
            ))}
            <button disabled={busy || !loaded} className="disabled:opacity-50 rounded-md bg-slate-900 px-4 py-2 font-medium text-white">提交报修</button>
          </form>
        </section>
        <div className="space-y-6">
          <section className={card} aria-labelledby="report-list">
            <h2 id="report-list" className="text-xl font-semibold">报修列表</h2>
            <label className="mt-3 block text-sm font-medium">
              按状态筛选
              <select className={inputStyle} value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
                <option value="">全部状态</option>
                {statuses.map(status => <option key={status}>{status}</option>)}
              </select>
            </label>
            {loaded && visibleReports.length === 0 && <p className="mt-3 text-sm text-slate-600">此状态下暂无报修。</p>}
            <ul className="mt-3 divide-y divide-slate-200">
              {visibleReports.map(report => (
                <li key={report.id}>
                  <button type="button" aria-pressed={report.id === selectedId}
                    className="flex w-full flex-wrap items-center justify-between gap-2 rounded px-2 py-3 text-left hover:bg-slate-50 aria-pressed:bg-slate-100"
                    onClick={() => setSelectedId(report.id)}>
                    <span>{report.deviceType} · {report.officeArea}</span>
                    <span className="text-sm text-slate-600">{report.status}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          {selected && (
            <section className={card} aria-labelledby="report-detail">
              <h2 id="report-detail" className="text-xl font-semibold">报修详情</h2>
              <dl className="my-4 space-y-2 text-sm">
                {fields.map(([key, label]) => (
                  <div key={key}>
                    <dt className="font-medium">{label}</dt>
                    <dd className="whitespace-pre-wrap break-words text-slate-700">{selected[key]}</dd>
                  </div>
                ))}
              </dl>
              <label className="block text-sm font-medium">
                处理状态
                <select className={inputStyle} value={selected.status} disabled={busy || !loaded} onChange={event => changeStatus(event.target.value)}>
                  {statuses.map(status => <option key={status}>{status}</option>)}
                </select>
              </label>
              <div className="mt-5">
                <h3 className="font-semibold">AI 排查建议</h3>
                {selected.suggestions.length ? (
                  <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
                    {selected.suggestions.map((suggestion, index) => <li key={index}>{suggestion}</li>)}
                  </ol>
                ) : (
                  <>
                    <p className="mt-2 text-sm text-slate-600">生成建议会把设备和故障描述发送给 DeepSeek。</p>
                    <button type="button" disabled={busy || !loaded} onClick={suggest}
                      className="mt-2 rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-50">
                      生成排查建议
                    </button>
                  </>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
