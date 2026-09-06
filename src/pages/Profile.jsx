import React, { useState, useEffect } from "react";
import api from "@/api/mentalistClient";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/PageHeader";
import Insignias from "@/pages/profile/Insignias";
import Statistics from "@/pages/profile/Statistics";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Camera,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  Trash2,
  BarChart3,
  Trophy,
  Loader2,
  Save,
  Settings,
  Activity,
  Award,
  Users,
  Check,
  X,
} from "lucide-react";

const initials = (name) => (name || "?").trim().slice(0, 2).toUpperCase();

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const isOwnProfile = !username || username === currentUser?.username;

  const [activeTab, setActiveTab] = useState("visao-geral");
  const [profileData, setProfileData] = useState(null);
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Estados de Amizade
  const [friendshipStatus, setFriendshipStatus] = useState("none"); // none, pending_sent, pending_received, accepted
  const [friendshipId, setFriendshipId] = useState(null);
  const [friendsList, setFriendsList] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [username]);

  // Executa o fetchFriends após o perfil carregar (ou mudar de usuário)
  useEffect(() => {
    if (profileData) {
      fetchFriends();
    }
  }, [profileData?.id, username]);

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

      if (!isOwnProfile) {
        checkFriendshipStatus(data.id);
      }
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

  const fetchFriends = async () => {
    try {
      // 1. Define qual ID de usuário devemos buscar os amigos:
      // Se for o próprio perfil, podemos omitir o ID (ou usar profileData?.id).
      // Se for outro perfil, passamos o ID do usuário que veio do fetchProfile.
      const targetId = isOwnProfile
        ? ""
        : profileData?.id
          ? `${profileData.id}/`
          : "";

      // 2. Faz as chamadas em paralelo
      const [friendsRes, requestsRes] = await Promise.all([
        api.get(`friendship/friends/${targetId}`),
        isOwnProfile
          ? api.get("friendship/requests/pending/")
          : Promise.resolve({ data: [] }),
      ]);

      setFriendsList(friendsRes.data || []);
      setPendingRequests(requestsRes.data || []);
    } catch (err) {
      console.error("Erro ao carregar lista de amigos:", err);
    }
  };

  const checkFriendshipStatus = async (targetUserId) => {
    try {
      const res = await api.get(`friendship/status/${targetUserId}/`);
      setFriendshipStatus(res.data.status); // backend retorna: 'none', 'pending_sent', 'pending_received', ou 'accepted'
      setFriendshipId(res.data.friendship_id || null);
    } catch (err) {
      console.error("Erro ao verificar status de amizade:", err);
    }
  };

  // Funções de Ação de Amizade
  const handleSendRequest = async () => {
    setActionLoading(true);
    try {
      const res = await api.post("friendship/requests/send/", {
        target_user_id: profileData.id,
      });
      setFriendshipStatus("pending_sent");
      setFriendshipId(res.data.id);
    } catch (err) {
      alert(err.response?.data?.detail || "Erro ao enviar solicitação.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async (id = friendshipId) => {
    setActionLoading(true);
    try {
      await api.post(`friendship/requests/${id}/accept/`);
      setFriendshipStatus("accepted");
      fetchFriends();
    } catch (err) {
      alert("Erro ao aceitar solicitação.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectOrCancelRequest = async (id = friendshipId) => {
    setActionLoading(true);
    try {
      await api.post(`friendship/requests/${id}/reject/`);
      setFriendshipStatus("none");
      fetchFriends();
    } catch (err) {
      alert("Erro ao processar solicitação.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    const confirm = window.confirm(
      `Deseja remover @${profileData.username} dos seus amigos?`,
    );
    if (!confirm) return;

    setActionLoading(true);
    try {
      await api.delete(`friendship/friends/${profileData.id}/remove/`);
      setFriendshipStatus("none");
      fetchFriends();
    } catch (err) {
      alert("Erro ao remover amigo.");
    } finally {
      setActionLoading(false);
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
    if (selectedFile) formData.append("avatar", selectedFile);

    try {
      await api.patch("entities/User/update-profile/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Perfil atualizado com sucesso!");
    } catch (err) {
      alert("Erro ao atualizar perfil.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tabs = [
    { id: "visao-geral", label: "Visão Geral", icon: Activity },
    { id: "amigos", label: "Amigos", icon: Users },
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

          {/* Botão Dinâmico de Amizade */}
          {!isOwnProfile && (
            <div>
              {actionLoading ? (
                <Button disabled size="sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </Button>
              ) : friendshipStatus === "none" ? (
                <Button onClick={handleSendRequest} size="sm">
                  <UserPlus className="mr-2 h-4 w-4" /> Adicionar Amigo
                </Button>
              ) : friendshipStatus === "pending_sent" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRejectOrCancelRequest()}
                >
                  <Clock className="mr-2 h-4 w-4" /> Cancelar Solicitação
                </Button>
              ) : friendshipStatus === "pending_received" ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-emerald text-white hover:bg-emerald/90"
                    onClick={() => handleAcceptRequest()}
                  >
                    <Check className="mr-1 h-4 w-4" /> Aceitar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRejectOrCancelRequest()}
                  >
                    <X className="mr-1 h-4 w-4" /> Recusar
                  </Button>
                </div>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveFriend}
                >
                  <UserX className="mr-2 h-4 w-4" /> Desfaire Amizade
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navegação por Abas */}
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
              {tab.id === "amigos" &&
                isOwnProfile &&
                pendingRequests.length > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                    {pendingRequests.length}
                  </span>
                )}
            </button>
          );
        })}
      </div>

      {/* Conteúdo das Abas */}
      <div className="rounded-b-xl border border-t-0 border-border bg-card p-6 shadow-sm">
        {/* ABA: Visão Geral */}
        {activeTab === "visao-geral" && (
          <div className="space-y-6">
            <PageHeader
              eyebrow=""
              icon={BarChart3}
              title="Estatísticas"
              subtitle="Métricas de foco, consistência e evolução."
            />
            <Statistics />
          </div>
        )}

        {/* ABA: Amigos */}
        {activeTab === "amigos" && (
          <div className="space-y-6">
            {/* Solicitações Pendentes (visível apenas no próprio perfil) */}
            {isOwnProfile && pendingRequests.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                  Solicitações Pendentes ({pendingRequests.length})
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3 bg-card"
                    >
                      <Link
                        to={`/perfil/${req.sender_username}`}
                        className="flex items-center gap-3"
                      >
                        <Avatar className="h-8 w-8 rounded-full border border-border">
                          <AvatarFallback className="text-xs">
                            {initials(req.sender_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-medium text-foreground">
                            {req.sender_name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            @{req.sender_username}
                          </p>
                        </div>
                      </Link>
                      <div className="flex gap-1.5">
                        <Button
                          size="icon"
                          className="h-7 w-7 bg-emerald text-white"
                          onClick={() => handleAcceptRequest(req.id)}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => handleRejectOrCancelRequest(req.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de Amigos */}
            <div>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                Amigos ({friendsList.length})
              </h3>

              {friendsList.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4">
                  Nenhum amigo adicionado ainda.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {friendsList.map((friend) => (
                    <Link
                      key={friend.id}
                      to={`/perfil/${friend.username}`}
                      className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-sm"
                    >
                      <div className="relative">
                        {friend.avatar_url ? (
                          <img
                            src={friend.avatar_url}
                            alt={friend.username}
                            referrerPolicy="no-referrer"
                            className="h-12 w-12 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <Avatar className="h-12 w-12 rounded-full border border-border">
                            <AvatarFallback className="rounded-full bg-secondary text-xs text-foreground font-medium">
                              {initials(friend.full_name || friend.username)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                      <div className="text-center w-full">
                        <p className="truncate text-xs font-medium text-foreground group-hover:text-primary">
                          {friend.full_name || friend.username}
                        </p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          @{friend.username}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA: Conquistas */}
        {activeTab === "conquistas" && (
          <div className="space-y-4">
            <PageHeader
              eyebrow=""
              icon={Trophy}
              title="Nível e Medalhas"
              subtitle="Seu nível evolui conforme o tempo de foco é acumulado."
            />
            <div className="grid gap-4">
              <>
                <Insignias />
              </>
            </div>
          </div>
        )}

        {/* ABA: Configurações */}
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
              />
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
          </form>
        )}
      </div>
    </div>
  );
}
