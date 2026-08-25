import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/api/mentalistClient";
import { ArrowLeft, Download, Trash2, LogOut } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import SettingsGroup from "@/components/settings/SettingsGroup";
import SettingRow from "@/components/settings/SettingRow";
import { mergeSettings } from "@/lib/settings";

const ALARMS = [
  { value: "end", label: "Tom Suave (padrão)" },
  { value: "chime", label: "Campainula" },
  { value: "bell", label: "Sino Tibetano" },
  { value: "digital", label: "Digital" },
];
const AMBIENTS = [
  { value: "none", label: "Nenhum" },
  { value: "white", label: "White Noise" },
  { value: "rain", label: "Chuva" },
  { value: "binaural", label: "Binaural" },
];
const AIS = [
  { value: "chatgpt", label: "ChatGPT" },
  { value: "claude", label: "Claude" },
  { value: "gemini", label: "Gemini" },
  { value: "perplexity", label: "Perplexity" },
  { value: "notebooklm", label: "NotebookLM" },
];

const switchCls =
  "data-[state=checked]:bg-emerald data-[state=unchecked]:bg-secondary";

function download(name, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function NumField({ value, onChange, min = 1, max = 180 }) {
  return (
    <Input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => {
        const n = parseInt(e.target.value, 10);
        if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
      }}
      className="h-8 w-16 bg-transparent text-center font-mono-timer text-[13px]"
    />
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: me, error } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await api.get("/users/me/");
      return res.data;
    },
    retry: false,
  });

  // Opção 2: Redireciona para o login caso ocorra 401 ou 403 (token expirado ou ausente)
  useEffect(() => {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      navigate("/login");
    }
  }, [error, navigate]);

  const [s, setS] = useState(() => mergeSettings(me?.settings));
  const [avatar, setAvatar] = useState(() => me?.avatar_url || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (me) {
      setS(mergeSettings(me.settings));
      setAvatar(me.avatar_url || "");
    }
  }, [me]);

  const set = (group, key, value) =>
    setS((p) => ({ ...p, [group]: { ...p[group], [key]: value } }));

  const save = async () => {
    setSaving(true);
    try {
      await api.patch("/users/me/", { settings: s, avatar_url: avatar });
      await qc.invalidateQueries({ queryKey: ["user"] });
      toast({ title: "Configurações salvas" });
    } catch (e) {
      toast({
        title: "Erro ao salvar",
        description: e.response?.data?.detail || e.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const exportAnki = async () => {
    try {
      const res = await api.get("/techniques/");
      const techs = Array.isArray(res.data) ? res.data : res.data.results || [];

      const rows = ["front\tback\ttags"];
      techs.forEach((t) => {
        const back = (t.what_it_is || "")
          .replace(/\t/g, " ")
          .replace(/\n/g, " ");
        rows.push(`${t.title}\t${back}\tmentalista::tecnica`);
      });
      download("mentalista-tecnicas-anki.txt", rows.join("\n"));
      toast({
        title: "Cartões exportados",
        description: `${techs.length} técnicas no formato Anki`,
      });
    } catch (e) {
      toast({
        title: "Erro ao exportar",
        description: e.response?.data?.detail || e.message,
        variant: "destructive",
      });
    }
  };

  const backup = async () => {
    try {
      const res = await api.get("/study-sessions/");
      const sessions = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];

      const payload = JSON.stringify(
        {
          user: me?.email,
          exported_at: new Date().toISOString(),
          total_focus_minutes: me?.total_focus_minutes || 0,
          sessions,
        },
        null,
        2,
      );
      download("mentalista-backup.json", payload, "application/json");
      toast({
        title: "Backup gerado",
        description: `${sessions.length} sessões exportadas`,
      });
    } catch (e) {
      toast({
        title: "Erro ao gerar backup",
        description: e.response?.data?.detail || e.message,
        variant: "destructive",
      });
    }
  };

  const wipe = async () => {
    if (
      !confirm(
        "Apagar todas as suas sessões de estudo? Esta ação não pode ser desfeita.",
      )
    )
      return;
    try {
      await api.delete("/study-sessions/clear_all/");
      await api.patch("/users/me/", { total_focus_minutes: 0 });
      await qc.invalidateQueries({ queryKey: ["user"] });
      toast({ title: "Dados de estudo apagados" });
    } catch (e) {
      toast({
        title: "Erro ao apagar",
        description: e.response?.data?.detail || e.message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    qc.clear();
    navigate("/login");
  };

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Conta
            </p>
            <h1 className="text-xl font-medium tracking-tight">
              Configurações
            </h1>
          </div>
        </div>
        <Button
          size="sm"
          onClick={save}
          disabled={saving}
          className="bg-emerald text-black hover:opacity-90"
        >
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      {/* 1 — Sessões & Cronômetros */}
      <SettingsGroup title="Sessões & Cronômetros">
        <SettingRow
          label="Foco Pomodoro"
          desc="Minutos padrão de foco"
          control={
            <NumField
              value={s.sessions.pomodoroFocus}
              onChange={(v) => set("sessions", "pomodoroFocus", v)}
            />
          }
        />
        <SettingRow
          label="Pausa Pomodoro"
          desc="Minutos padrão de pausa"
          control={
            <NumField
              value={s.sessions.pomodoroBreak}
              onChange={(v) => set("sessions", "pomodoroBreak", v)}
              min={1}
              max={60}
            />
          }
        />
        <SettingRow
          label="Foco Flow 90"
          desc="Minutos do bloco ultradiano"
          control={
            <NumField
              value={s.sessions.flowFocus}
              onChange={(v) => set("sessions", "flowFocus", v)}
              max={180}
            />
          }
        />
        <SettingRow
          label="Pausa Flow"
          desc="Minutos de descanso biológico"
          control={
            <NumField
              value={s.sessions.flowBreak}
              onChange={(v) => set("sessions", "flowBreak", v)}
              min={1}
              max={60}
            />
          }
        />
        <SettingRow
          label="Início automático"
          desc="Avançar para a próxima fase sem clique"
          control={
            <Switch
              checked={s.sessions.autoStart}
              onCheckedChange={(v) => set("sessions", "autoStart", v)}
              className={switchCls}
            />
          }
        />
        <SettingRow
          label="Tela cheia no Deep Work"
          desc="Ocultar navegação durante o bloco profundo"
          control={
            <Switch
              checked={s.sessions.deepworkFullscreen}
              onCheckedChange={(v) => set("sessions", "deepworkFullscreen", v)}
              className={switchCls}
            />
          }
        />
      </SettingsGroup>

      {/* 2 — Áudio & Sons de Foco */}
      <SettingsGroup title="Áudio & Sons de Foco">
        <SettingRow
          label="Som de alarme"
          control={
            <Select
              value={s.audio.alarmSound}
              onValueChange={(v) => set("audio", "alarmSound", v)}
            >
              <SelectTrigger className="h-8 w-[160px] text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALARMS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
        <SettingRow
          label="Volume"
          control={
            <div className="flex items-center gap-3">
              <Slider
                value={[s.audio.volume]}
                onValueChange={([v]) => set("audio", "volume", v)}
                min={0}
                max={100}
                step={5}
                className="w-32 [&_.bg-primary]:bg-emerald"
              />
              <span className="w-9 text-right font-mono-timer text-[12px] text-muted-foreground">
                {s.audio.volume}
              </span>
            </div>
          }
        />
        <SettingRow
          label="Áudio ambiente"
          control={
            <Select
              value={s.audio.ambient}
              onValueChange={(v) => set("audio", "ambient", v)}
            >
              <SelectTrigger className="h-8 w-[160px] text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AMBIENTS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      </SettingsGroup>

      {/* 3 — IAs & Prompts */}
      <SettingsGroup title="IAs & Prompts">
        <SettingRow
          label="IA padrão"
          desc="Assistente preferido para os prompts"
          control={
            <Select
              value={s.ai.defaultAssistant}
              onValueChange={(v) => set("ai", "defaultAssistant", v)}
            >
              <SelectTrigger className="h-8 w-[160px] text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AIS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
        <SettingRow
          label="Exportar cartões para o Anki"
          desc="Baixa as técnicas em formato TSV importável"
          control={
            <Button
              size="sm"
              variant="outline"
              onClick={exportAnki}
              className="h-8 gap-1.5 text-[12px]"
            >
              <Download className="h-3.5 w-3.5" /> Exportar
            </Button>
          }
        />
      </SettingsGroup>

      {/* 4 — Salas & Privacidade */}
      <SettingsGroup title="Salas & Privacidade">
        <SettingRow
          label="Modo invisível"
          desc="Não aparecer como online nas salas"
          control={
            <Switch
              checked={s.rooms.invisible}
              onCheckedChange={(v) => set("rooms", "invisible", v)}
              className={switchCls}
            />
          }
        />
        <SettingRow
          label="Amigos online"
          desc="Notificar quando amigos entrarem em foco"
          control={
            <Switch
              checked={s.rooms.friendsOnline}
              onCheckedChange={(v) => set("rooms", "friendsOnline", v)}
              className={switchCls}
            />
          }
        />
      </SettingsGroup>

      {/* 5 — Conta & Dados */}
      <SettingsGroup title="Conta & Dados">
        <SettingRow
          label="E-mail"
          control={
            <span className="font-mono-timer text-[12px] text-muted-foreground">
              {me?.email || "—"}
            </span>
          }
        />
        <SettingRow
          label="URL do avatar"
          control={
            <Input
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://..."
              className="h-8 w-[180px] bg-transparent text-[12px]"
            />
          }
        />
        <SettingRow
          label="Backup de horas estudadas"
          desc="Exporta todo o seu histórico em JSON"
          control={
            <Button
              size="sm"
              variant="outline"
              onClick={backup}
              className="h-8 gap-1.5 text-[12px]"
            >
              <Download className="h-3.5 w-3.5" /> Backup
            </Button>
          }
        />
        <SettingRow
          label="Sair da conta"
          control={
            <Button
              size="sm"
              variant="outline"
              onClick={handleLogout}
              className="h-8 gap-1.5 text-[12px]"
            >
              <LogOut className="h-3.5 w-3.5" /> Sair
            </Button>
          }
        />
        <SettingRow
          label="Excluir dados de estudo"
          desc="Apaga suas sessões e zera o total de horas"
          control={
            <Button
              size="sm"
              variant="outline"
              onClick={wipe}
              className="h-8 gap-1.5 text-[12px] text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> Excluir
            </Button>
          }
        />
      </SettingsGroup>

      <p className="px-1 text-[11px] text-dim">O Estudante Mentalista · v1.0</p>
    </div>
  );
}
