# 📋 Planner Minimalista (PC + iPhone)

Um planejador diário minimalista de alta performance focado em clareza mental, execução diária e progresso contínuo em metas de vida de longo prazo.

---

## ✨ Funcionalidades Principais

1. **☀️ Hoje (Daily Planner)**:
   - Foco nas tarefas essenciais do dia com marcação de horários/prazos.
   - Divisão automática por prioridade (**P1 Alta**, **P2 Média**, **P3 Baixa**).
   - Checkbox tátil com animação suave, efeito sonoro e confete sutil ao concluir.
   - Barra de progresso diário em tempo real.
   - Ação rápida de 1 clique para adiar tarefas pendentes para o dia seguinte.

2. **🧭 Metas de Vida & Roadmap (Backlog Priorizado)**:
   - Para projetos sem data fixa (ex: *Aprender Swift*, *Certificação AWS*, *Reserva de Emergência*).
   - Checklist de subtarefas / marcos (*milestones*).
   - Botão **"⚡ Fazer Hoje"**: Transfere o próximo passo da sua meta diretamente para o planejamento do dia com um clique!

3. **📅 Calendário Mensal**:
   - Navegue por qualquer dia do mês e agende compromissos e tarefas futuras.
   - Indicadores visuais de dias com tarefas pendentes ou concluídas.

4. **💧 Hábitos & Rotinas Diárias**:
   - Rastreamento de hábitos recorrentes diários (ex: *Beber 2.5L de água*, *Treinar*, *Leitura*).
   - Contador de ofensiva (*streak* de dias seguidos).
   - Mini-histórico dos últimos 7 dias.

5. **⏳ Modo Foco (Pomodoro)**:
   - Timer minimalista integrado (Foco 25m, Pausa Curta 5m, Pausa Longa 15m).
   - Possibilidade de vincular o timer diretamente à tarefa que você está executando.

6. **🔔 Sistema de Lembretes & Alerta Limite (Cutoff Alert)**:
   - Alerta diário configurável (ex: 21:00) avisando se você ainda possui tarefas não marcadas no dia.
   - Avisos prévios de tarefas agendadas com horário.

7. **⚡ Sincronização em Tempo Real (PC ↔ iPhone)**:
   - Banco de dados em nuvem em tempo real (Supabase).
   - Qualquer alteração feita no iPhone aparece no mesmo segundo no PC e vice-versa.
   - Funciona 100% offline com persistência local e sincronização automática.

---

## 🚀 Como Rodar no seu PC

No terminal, dentro da pasta do projeto:

```bash
# Iniciar o servidor de desenvolvimento
npm run dev
```

Abra no navegador em: `http://localhost:5173`

> **Dica**: No Chrome ou Edge, clique no ícone de instalar na barra de endereços para ter uma janela de aplicativo dedicada com ícone na sua barra de tarefas do Windows!

---

## 📱 Como Usar e Instalar no iPhone

### Opção 1: Rede Local Wi-Fi (Sem deploy)
1. Inicie o app com o comando:
   ```bash
   npm run dev -- --host
   ```
2. O terminal mostrará o IP de rede (ex: `http://192.168.1.15:5173`).
3. No iPhone conectado ao mesmo Wi-Fi, abra o **Safari** e acesse esse endereço.
4. Toque no ícone de **Compartilhar** (quadrado com seta para cima) -> **"Adicionar à Tela de Início"**.

### Opção 2: Deploy Gratuito na Nuvem (Vercel) - Acesso de Qualquer Lugar (4G/5G)
1. Suba o projeto no GitHub ou use o CLI da Vercel:
   ```bash
   npx vercel
   ```
2. Acesse a URL gerada (ex: `https://meu-planner.vercel.app`) no Safari do iPhone e selecione **"Adicionar à Tela de Início"**.

---

## ☁️ Configuração da Sincronização em Nuvem (Supabase)

1. Crie uma conta gratuita em [supabase.com](https://supabase.com) e crie um novo projeto.
2. Vá no **SQL Editor** do Supabase e cole o seguinte script para criar as tabelas:

```sql
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

ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE life_goals;
ALTER PUBLICATION supabase_realtime ADD TABLE habits;
```

3. No app, vá na aba **Ajustes** -> cole a **URL do Projeto** e a **Anon Public Key**.
4. Pronto! O mesmo código de pareamento no PC e no iPhone manterá todos os seus dados perfeitamente sincronizados em tempo real.

---

## ⌨️ Atalhos de Teclado no PC

| Tecla | Ação |
| :--- | :--- |
| `N` | Abrir modal de Nova Tarefa |
| `1` | Ir para a visão "Hoje" |
| `2` | Ir para "Metas de Vida" |
| `3` | Ir para "Calendário" |
| `4` | Ir para "Hábitos" |
| `5` | Ir para "Modo Foco" |
| `Esc` | Fechar modal aberto |
