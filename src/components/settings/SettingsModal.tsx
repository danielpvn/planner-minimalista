import React, { useState } from 'react';
import { 
  Bell, 
  Smartphone, 
  Cloud, 
  Moon, 
  Sun, 
  Volume2, 
  Download, 
  Upload, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck 
} from 'lucide-react';
import type { UserSettings } from '../../types';
import { NotificationManager } from '../../lib/notifications';
import { Storage } from '../../lib/storage';

interface SettingsModalProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onDataImported: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onDataImported,
}) => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedSyncCode, setCopiedSyncCode] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabase_url || '');
  const [supabaseKey, setSupabaseKey] = useState(settings.supabase_key || '');
  const [cutoffTime, setCutoffTime] = useState(settings.daily_cutoff_time || '21:00');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleTestNotification = async () => {
    const granted = await NotificationManager.requestPermission();
    if (granted || Notification.permission === 'granted') {
      NotificationManager.notify(
        '🔔 Teste de Notificação — Planner',
        'Seu sistema de avisos e lembretes está funcionando com sucesso no seu dispositivo!'
      );
    } else {
      alert('Por favor, permita as notificações nas configurações do seu navegador.');
    }
  };

  const handleSaveSettings = () => {
    onUpdateSettings({
      ...settings,
      daily_cutoff_time: cutoffTime,
      supabase_url: supabaseUrl.trim() || undefined,
      supabase_key: supabaseKey.trim() || undefined,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExport = () => {
    const json = Storage.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planner-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (Storage.importData(content)) {
        alert('Backup importado com sucesso!');
        onDataImported();
      } else {
        alert('Arquivo inválido. Por favor, selecione um backup JSON válido.');
      }
    };
    reader.readAsText(file);
  };

  const sqlSchema = `-- Schema Supabase para Sincronização em Tempo Real (PC ↔ iPhone)
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  time TEXT,
  priority TEXT NOT NULL,
  category TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS life_goals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL,
  category TEXT,
  milestones JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  icon TEXT,
  streak INT DEFAULT 0,
  completed_dates TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT NOT NULL
);

-- Ativar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE life_goals;
ALTER PUBLICATION supabase_realtime ADD TABLE habits;
`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const copySyncCode = () => {
    navigator.clipboard.writeText(settings.user_id);
    setCopiedSyncCode(true);
    setTimeout(() => setCopiedSyncCode(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-20">
      {/* Title */}
      <div>
        <h3 className="text-2xl font-bold text-foreground">Configurações & Sincronização</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Personalize horários de alertas, notificações, tema visual e conexão com seu iPhone.
        </p>
      </div>

      {/* iPhone Setup Guide */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-accent/15 via-surface to-surface border border-accent/20 space-y-4 shadow-lg">
        <div className="flex items-center gap-2.5 text-accent-text font-bold text-sm">
          <Smartphone className="w-5 h-5" />
          <span>Como Usar no seu iPhone (Passo a Passo)</span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Você não precisa de App Store! Esta aplicação é um <b>PWA de alta performance</b>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-background/80 border border-surface-border space-y-1.5">
            <span className="text-xs font-bold text-accent-text flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center text-[10px]">1</span>
              Abra no Safari
            </span>
            <p className="text-[11px] text-muted-foreground">
              Abra o link do seu Planner no Safari do seu iPhone.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-background/80 border border-surface-border space-y-1.5">
            <span className="text-xs font-bold text-accent-text flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center text-[10px]">2</span>
              Compartilhar
            </span>
            <p className="text-[11px] text-muted-foreground">
              Toque no ícone de <b>Compartilhar</b> (o quadrado com a seta para cima no Safari).
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-background/80 border border-surface-border space-y-1.5">
            <span className="text-xs font-bold text-accent-text flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center text-[10px]">3</span>
              Tela de Início
            </span>
            <p className="text-[11px] text-muted-foreground">
              Selecione <b>"Adicionar à Tela de Início"</b>. Pronto! Ele abrirá em tela cheia como um app nativo.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Notifications & Cutoff Time */}
      <div className="p-6 rounded-3xl bg-surface border border-surface-border space-y-5">
        <div className="flex items-center gap-2.5 text-foreground font-bold text-base">
          <Bell className="w-5 h-5 text-accent-text" />
          <span>Avisos & Lembretes Diários</span>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-background border border-surface-border">
            <div>
              <h5 className="text-xs font-bold text-foreground">
                Horário Limite do Dia (Cutoff Alert)
              </h5>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                O Planner avisará se ainda houver tarefas pendentes para hoje neste horário.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="time"
                value={cutoffTime}
                onChange={(e) => setCutoffTime(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-surface border border-surface-border text-xs text-foreground font-semibold focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-background border border-surface-border">
            <div>
              <h5 className="text-xs font-bold text-foreground">Testar Notificação</h5>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Dispara um alerta imediato para verificar a permissão no seu navegador/iPhone.
              </p>
            </div>
            <button
              onClick={handleTestNotification}
              className="px-3.5 py-1.5 rounded-xl bg-surface-hover hover:bg-muted text-foreground text-xs font-medium border border-surface-border transition-all"
            >
              Disparar Teste
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Realtime Cloud Sync (Supabase) */}
      <div className="p-6 rounded-3xl bg-surface border border-surface-border space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-foreground font-bold text-base">
            <Cloud className="w-5 h-5 text-accent-text" />
            <span>Sincronização em Nuvem (PC ↔ iPhone)</span>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
            Tempo Real Ativo
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Para sincronizar suas tarefas entre seu PC e iPhone através de um banco de dados gratuito e privado na nuvem (Supabase):
        </p>

        {/* Sync Pairing ID */}
        <div className="p-4 rounded-2xl bg-background border border-surface-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-muted-foreground font-medium">Seu Código de Pareamento</span>
            <div className="text-base font-mono font-bold text-accent-text tracking-wider mt-0.5">
              {settings.user_id}
            </div>
          </div>
          <button
            onClick={copySyncCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-hover hover:bg-muted text-foreground text-xs font-medium border border-surface-border transition-all"
          >
            {copiedSyncCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSyncCode ? 'Copiado!' : 'Copiar Código'}</span>
          </button>
        </div>

        {/* Advanced Developer Settings (Collapsed) */}
        <details className="group pt-2">
          <summary className="text-xs text-muted-foreground hover:text-foreground cursor-pointer font-medium select-none flex items-center gap-1.5 transition-colors">
            <span>⚙️ Configuração Avançada (Banco Supabase Próprio)</span>
          </summary>
          
          <div className="mt-3 space-y-3 p-3.5 rounded-2xl bg-background/50 border border-surface-border/60">
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3 py-1.5 rounded-xl bg-background border border-surface-border text-foreground text-xs font-mono focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                Supabase Anon Public Key
              </label>
              <input
                type="password"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-1.5 rounded-xl bg-background border border-surface-border text-foreground text-xs font-mono focus:outline-none focus:border-accent"
              />
            </div>

            <div className="pt-1 flex items-center justify-between">
              <button
                type="button"
                onClick={copySql}
                className="text-[11px] text-accent-text hover:underline font-medium flex items-center gap-1.5"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedSql ? 'SQL Copiado com Sucesso!' : 'Copiar SQL das Tabelas'}</span>
              </button>
            </div>
          </div>
        </details>
      </div>

      {/* Section 3: Appearance & Sound */}
      <div className="p-6 rounded-3xl bg-surface border border-surface-border space-y-5">
        <div className="flex items-center gap-2.5 text-foreground font-bold text-base">
          <Sparkles className="w-5 h-5 text-accent-text" />
          <span>Aparência & Sons</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Tema Visual
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-medium transition-all ${
                  settings.theme === 'dark'
                    ? 'bg-accent-soft border-accent text-accent-text font-bold'
                    : 'border-surface-border text-muted-foreground hover:bg-surface-hover'
                }`}
              >
                <Moon className="w-4 h-4 mb-1" />
                <span>Slate Dark</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, theme: 'oled' })}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-medium transition-all ${
                  settings.theme === 'oled'
                    ? 'bg-white/10 border-white text-white font-bold'
                    : 'border-surface-border text-muted-foreground hover:bg-surface-hover'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-black border border-white/40 mb-1" />
                <span>OLED Pure</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-medium transition-all ${
                  settings.theme === 'light'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-600 font-bold'
                    : 'border-surface-border text-muted-foreground hover:bg-surface-hover'
                }`}
              >
                <Sun className="w-4 h-4 mb-1" />
                <span>Paper Light</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-background border border-surface-border">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-accent-text" />
              <div>
                <h5 className="text-xs font-bold text-foreground">Sons Táteis</h5>
                <p className="text-[11px] text-muted-foreground">
                  Feedback sonoro suave ao marcar e desmarcar tarefas.
                </p>
              </div>
            </div>
            <button
              onClick={() => onUpdateSettings({ ...settings, sound_enabled: !settings.sound_enabled })}
              className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                settings.sound_enabled
                  ? 'bg-accent/20 border-accent/40 text-accent-text'
                  : 'bg-surface border-surface-border text-muted-foreground'
              }`}
            >
              {settings.sound_enabled ? 'Ativado' : 'Desativado'}
            </button>
          </div>
        </div>
      </div>

      {/* Section 4: Backup Data (Export / Import) */}
      <div className="p-6 rounded-3xl bg-surface border border-surface-border space-y-4">
        <div className="flex items-center gap-2.5 text-foreground font-bold text-base">
          <ShieldCheck className="w-5 h-5 text-accent-text" />
          <span>Backup & Segurança</span>
        </div>

        <p className="text-xs text-muted-foreground">
          Seus dados pertencem a você. Exporte ou importe um backup completo em JSON a qualquer momento.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-hover hover:bg-muted text-foreground text-xs font-semibold border border-surface-border transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Backup (JSON)</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-hover hover:bg-muted text-foreground text-xs font-semibold border border-surface-border transition-all cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Restaurar Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Save Settings Button */}
      <div className="sticky bottom-20 sm:bottom-4 bg-surface/90 backdrop-blur-md p-4 rounded-2xl border border-surface-border flex items-center justify-between shadow-2xl">
        <span className="text-xs text-muted-foreground font-medium">
          {saveSuccess ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Check className="w-4 h-4" /> Configurações salvas com sucesso!
            </span>
          ) : (
            'Não se esqueça de salvar suas alterações.'
          )}
        </span>

        <button
          onClick={handleSaveSettings}
          className="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-lg shadow-accent/25 transition-all"
        >
          Salvar Alterações
        </button>
      </div>
    </div>
  );
};
