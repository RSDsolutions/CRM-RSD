'use client';

import { useState } from 'react';
import { QATestCase, QATestStatus } from '@/types/database.types';
import { createTestCaseAction, updateTestCaseResultAction } from '@/app/actions/qa';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Plus,
  Loader2,
  FileCheck,
  ExternalLink,
} from 'lucide-react';

interface QASectionProps {
  projectId: string;
  testCases: QATestCase[];
  isLocked?: boolean;
}

export function QASection({ projectId, testCases, isLocked }: QASectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [moduleName, setModuleName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expectedResult, setExpectedResult] = useState('');

  // Execution edit states
  const [actualResult, setActualResult] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [observations, setObservations] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<QATestStatus>('Aprobado');

  const approvedCount = testCases.filter(t => t.status === 'Aprobado').length;
  const failedCount = testCases.filter(t => t.status === 'Fallido').length;
  const passRate = testCases.length > 0 ? Math.round((approvedCount / testCases.length) * 100) : 0;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleName.trim() || !title.trim() || !expectedResult.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await createTestCaseAction({
        project_id: projectId,
        module_name: moduleName,
        test_case_title: title,
        description,
        expected_result: expectedResult,
      });
      if (res.success) {
        setModuleName('');
        setTitle('');
        setDescription('');
        setExpectedResult('');
        setShowAddForm(false);
      } else {
        alert('Error: ' + res.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveResult = async (testId: string) => {
    setIsSubmitting(true);
    try {
      const res = await updateTestCaseResultAction({
        test_id: testId,
        project_id: projectId,
        status: selectedStatus,
        actual_result: actualResult,
        evidence_url: evidenceUrl,
        observations: observations,
      });
      if (res.success) {
        setEditingTestId(null);
        setActualResult('');
        setEvidenceUrl('');
        setObservations('');
      } else {
        alert('Error: ' + res.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* QA Header & Pass Rate */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-400" /> Control de Calidad & Checklist de Pruebas
            </h3>
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
              {approvedCount}/{testCases.length} Aprobadas
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ningún proyecto se entrega sin validación formal de casos de prueba por módulo.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-28 bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                passRate === 100 ? 'bg-emerald-500' : failedCount > 0 ? 'bg-amber-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${passRate}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-200">{passRate}% OK</span>
          {!isLocked && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" /> Caso de Prueba
            </button>
          )}
        </div>
      </div>

      {/* Formulario nuevo caso de prueba */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-5 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Nuevo Caso de Prueba QA</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Módulo del Sistema *</label>
              <input
                type="text"
                required
                value={moduleName}
                onChange={e => setModuleName(e.target.value)}
                placeholder="Ej. Autenticación / Facturación"
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Título del Caso de Prueba *</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ej. Registro de lead con correo duplicado debe mostrar alerta amigable"
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-semibold">Resultado Esperado *</label>
            <textarea
              required
              rows={2}
              value={expectedResult}
              onChange={e => setExpectedResult(e.target.value)}
              placeholder="El sistema debe impedir el guardado y señalar el campo en rojo sin recargar la página..."
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Guardar Caso QA
            </button>
          </div>
        </form>
      )}

      {/* Lista de Casos de Prueba */}
      {testCases.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
          <FileCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400">No hay casos de prueba registrados para este proyecto.</p>
          <p className="text-[11px] text-slate-500 mt-1">Registra los casos de prueba para certificar el software antes de la entrega.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {testCases.map(test => {
            const isApproved = test.status === 'Aprobado';
            const isFailed = test.status === 'Fallido';
            const isBlocked = test.status === 'Bloqueado';

            return (
              <div
                key={test.id}
                className={`bg-slate-900 border rounded-xl p-4 space-y-3 transition ${
                  isApproved
                    ? 'border-emerald-500/20 bg-emerald-950/5'
                    : isFailed
                    ? 'border-red-500/30 bg-red-950/5'
                    : isBlocked
                    ? 'border-amber-500/30 bg-amber-950/5'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded uppercase">
                      {test.module_name}
                    </span>
                    <h4 className="text-xs font-bold text-white">{test.test_case_title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        isApproved
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : isFailed
                          ? 'bg-red-500/10 text-red-400'
                          : isBlocked
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {test.status}
                    </span>
                    <button
                      onClick={() => {
                        setEditingTestId(test.id);
                        setSelectedStatus(test.status);
                        setActualResult(test.actual_result || '');
                        setEvidenceUrl(test.evidence_url || '');
                        setObservations(test.observations || '');
                      }}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      Ejecutar / Editar
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-300 bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Resultado Esperado:</span>
                  {test.expected_result}
                </div>

                {test.actual_result && (
                  <div className="text-xs text-slate-300 bg-slate-800/20 p-2.5 rounded-lg border border-slate-700/40">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Resultado Obtenido:</span>
                    {test.actual_result}
                  </div>
                )}

                {test.evidence_url && (
                  <div className="text-xs">
                    <a
                      href={test.evidence_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-400 hover:underline text-[11px]"
                    >
                      <ExternalLink className="w-3 h-3" /> Ver Evidencia / Captura
                    </a>
                  </div>
                )}

                {/* Formulario Inline de Ejecución */}
                {editingTestId === test.id && (
                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 mt-3 space-y-3">
                    <h5 className="text-[11px] font-bold text-indigo-300 uppercase">Registrar Ejecución de Prueba</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400">Estado de la Prueba</label>
                        <select
                          value={selectedStatus}
                          onChange={e => setSelectedStatus(e.target.value as QATestStatus)}
                          className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="Aprobado">Aprobado</option>
                          <option value="Fallido">Fallido</option>
                          <option value="Bloqueado">Bloqueado</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400">URL de Evidencia / Captura</label>
                        <input
                          type="url"
                          value={evidenceUrl}
                          onChange={e => setEvidenceUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400">Resultado Obtenido Real</label>
                      <textarea
                        rows={2}
                        value={actualResult}
                        onChange={e => setActualResult(e.target.value)}
                        placeholder="Comportamiento observado durante la prueba..."
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400">Observaciones Técnicas</label>
                      <input
                        type="text"
                        value={observations}
                        onChange={e => setObservations(e.target.value)}
                        placeholder="Notas adicionales o incidencia relacionada..."
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingTestId(null)}
                        className="px-3 py-1 bg-slate-800 text-slate-300 rounded text-xs"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleSaveResult(test.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                      >
                        {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Guardar Resultado
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
