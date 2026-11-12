'use client';

import { useState } from 'react';

const fields = [
  ['reporterName', '姓名'],
  ['officeArea', '办公区'],
  ['deviceType', '设备'],
  ['description', '故障描述'],
];

const statuses = ['待处理', '处理中', '已完成'];
const demoReports = [{
  id: 'demo-1',
  reporterName: '测试用户',
  officeArea: '二楼办公室',
  deviceType: '打印机',
  description: '已发送打印任务，设备没有响应。',
  status: '待处理',
}];
const card = 'rounded-xl border border-slate-200 bg-white p-5';
const inputStyle = 'mt-1 w-full rounded-md border border-slate-400 px-3 py-2';

export default function RepairPage() {
  const [reports, setReports] = useState(demoReports);
  const [selectedId, setSelectedId] = useState(demoReports[0].id);
  const [error, setError] = useState('');
  const selected = reports.find(report => report.id === selectedId);

  function addReport(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const values = Object.fromEntries(fields.map(([key]) => [key, String(formData.get(key) ?? '').trim()]));
    if (fields.some(([key]) => !values[key])) {
      setError('请填写所有字段。');
      return;
    }

    const report = { ...values, id: crypto.randomUUID(), status: statuses[0] };
    setReports(current => [report, ...current]);
    setSelectedId(report.id);
    setError('');
    form.reset();
  }

  function changeStatus(status) {
    setReports(current => current.map(report =>
      report.id === selectedId ? { ...report, status } : report
    ));
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <header>
        <h1 className="text-3xl font-semibold">智能报修小助手</h1>
        <p className="mt-2 text-sm text-slate-600">演示数据仅保留在当前页面，刷新后重置。</p>
      </header>
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
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <button className="rounded-md bg-slate-900 px-4 py-2 font-medium text-white">提交报修</button>
          </form>
        </section>
        <div className="space-y-6">
          <section className={card} aria-labelledby="report-list">
            <h2 id="report-list" className="text-xl font-semibold">报修列表</h2>
            <ul className="mt-3 divide-y divide-slate-200">
              {reports.map(report => (
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
                <select className={inputStyle} value={selected.status} onChange={event => changeStatus(event.target.value)}>
                  {statuses.map(status => <option key={status}>{status}</option>)}
                </select>
              </label>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
