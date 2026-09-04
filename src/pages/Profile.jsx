import React, { useState, useEffect } from "react";
import api from "@/api/mentalistClient";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Insignias from "@/pages/profile/Insignias";
import {
  Camera,
  UserPlus,
  UserCheck,
  Trash2,
  Loader2,
  Save,
  User,
  Settings,
  Activity,
  Award,
} from "lucide-react";

const initials = (name) => (name || "?").trim().slice(0, 2).toUpperCase();

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const isOwnProfile = !username || username === currentUser?.username;

  const [activeTab, setActiveTab] = useState("visao-geral"); // Controle da aba ativa
  const [profileData, setProfileData] = useState(null);
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFriend, setIsFriend] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const endpoint = isOwnProfile
        ? `users/me/`
        : `users/by-username/${username}/`;
      const res = await api.get(endpoint);
      const data = res.data;

      setProfileData(data);
      setFullName(data.full_name || "");
      setCpf(data.cpf || "");
      setBirthDate(data.birth_date || "");
      setAvatarPreview(data.avatar_url || data.avatar || null);
    } catch (err) {
      console.error("Erro ao carregar perfil:", err);
      if (err.response?.status === 404) {
        alert("Usuário não encontrado!");
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData();
    formData.append("full_name", fullName);
    formData.append("cpf", cpf);
    formData.append("birth_date", birthDate);
    if (selectedFile) {
      formData.append("avatar", selectedFile);
    }

    try {
      const res = await api.patch("entities/User/update-profile/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Perfil atualizado com sucesso!");
    } catch (err) {
      alert("Erro ao atualizar o perfil.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivateAccount = async () => {
    const confirm = window.confirm(
      "Tem certeza de que deseja desativar sua conta? Esta ação não poderá ser desfeita.",
    );
    if (!confirm) return;

    try {
      await api.post("entities/User/deactivate-account/");
      logout();
      navigate("/login");
    } catch (err) {
      alert("Erro ao desativar conta.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Abas disponíveis
  const tabs = [
    { id: "visao-geral", label: "Visão Geral", icon: Activity },
    { id: "conquistas", label: "Conquistas", icon: Award },
    ...(isOwnProfile
      ? [{ id: "configuracoes", label: "Configurações", icon: Settings }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Cabeçalho do Perfil */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm mb-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="relative h-24 w-24">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar"
                referrerPolicy="no-referrer"
                className="h-24 w-24 rounded-full object-cover border border-border"
              />
            ) : (
              <Avatar className="h-24 w-24 rounded-full border border-border">
                <AvatarFallback className="rounded-full bg-secondary text-xl font-medium text-foreground">
                  {initials(fullName)}
                </AvatarFallback>
              </Avatar>
            )}

            {isOwnProfile && (
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
              >
                <Camera className="h-4 w-4" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">
              {profileData?.full_name || "Usuário Sem Nome"}
            </h1>
            <p className="text-sm text-muted-foreground">
              @{profileData?.username}
            </p>
          </div>

          {!isOwnProfile && (
            <Button
              onClick={() => setIsFriend(!isFriend)}
              variant={isFriend ? "outline" : "default"}
            >
              {isFriend ? (
                <>
                  <UserCheck className="mr-2 h-4 w-4" /> Amigos
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" /> Adicionar Amigo
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Navegação Estilo Abas do Navegador Chrome */}
      <div className="flex items-center gap-1 border-b border-border bg-muted/30 p-1.5 rounded-t-xl overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group relative flex items-center gap-2 px-4 py-2 text-xs font-medium transition-all duration-200 rounded-lg ${
                isActive
                  ? "bg-card text-foreground shadow-sm border border-border/50"
                  : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo das Abas */}
      <div className="rounded-b-xl border border-t-0 border-border bg-card p-6 shadow-sm">
        {/* ABA: Visão Geral */}
        {activeTab === "visao-geral" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">
              Estatísticas e Foco
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">
                  Tempo Total de Hiperfoco
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald">
                  {profileData?.total_focus_minutes || 0} min
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">
                  Sessões Concluídas
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground">12</p>
              </div>
            </div>
          </div>
        )}

        {/* ABA: Conquistas */}
        {activeTab === "conquistas" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Nível e Medalhas
            </h2>
            <div className="grid gap-4">
              <>
                <Insignias />
              </>
              {/*<div className="flex flex-col items-center gap-2 rounded-lg border border-border p-4 text-center">
                <Award className="h-8 w-8 text-amber-500" />
                <span className="text-xs font-medium">Primeiro Hiperfoco</span>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-lg border border-border p-4 text-center opacity-50">
                <Award className="h-8 w-8 text-muted-foreground" />
                <span className="text-xs font-medium">10 Horas de Foco</span>
              </div>*/}
            </div>
          </div>
        )}

        {/* ABA: Configurações (Apenas no próprio perfil) */}
        {activeTab === "configuracoes" && isOwnProfile && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Dados Pessoais
            </h2>

            <div className="space-y-1.5">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar Alterações
              </Button>
            </div>

            <div className="mt-10 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <h3 className="text-sm font-semibold text-destructive">
                Zona de Perigo
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Ao desativar sua conta, seus dados não estarão mais visíveis.
              </p>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="mt-3"
                onClick={handleDeactivateAccount}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Desativar Minha Conta
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
