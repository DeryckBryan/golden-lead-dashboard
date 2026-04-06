import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

type Step = "credentials" | "mfa-enroll" | "mfa-verify";

const Login: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("credentials");

  // MFA state
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      toast.error("Usuário não encontrado.");
      setLoading(false);
      return;
    }

    // Check existing MFA factors
    const { data: factorsData } = await supabase.auth.mfa.listFactors();
    const totpFactors = factorsData?.totp ?? [];

    if (totpFactors.length === 0) {
      // First login: enroll MFA
      const { data: enrollData, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "SDR Bryan's & Co",
        friendlyName: "Google Authenticator",
      });

      if (enrollError || !enrollData) {
        toast.error("Erro ao configurar autenticador: " + enrollError?.message);
        setLoading(false);
        return;
      }

      setFactorId(enrollData.id);
      setQrCode(enrollData.totp.qr_code);
      setTotpSecret(enrollData.totp.secret);
      setStep("mfa-enroll");
    } else {
      // Already enrolled: go straight to verification
      setFactorId(totpFactors[0].id);
      setStep("mfa-verify");
    }

    setLoading(false);
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });

    if (challengeError || !challengeData) {
      toast.error("Erro ao gerar desafio MFA: " + challengeError?.message);
      setLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code: otpCode.replace(/\s/g, ""),
    });

    if (verifyError) {
      toast.error("Código inválido. Tente novamente.");
      setOtpCode("");
      setLoading(false);
      return;
    }

    toast.success("Acesso autorizado!");
    navigate("/admin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative">
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2 rounded-lg bg-card border border-border hover:bg-accent transition-colors"
      >
        {theme === "dark" ? (
          <Sun className="h-5 w-5 text-accent-foreground" />
        ) : (
          <Moon className="h-5 w-5 text-accent-foreground" />
        )}
      </button>

      <div className="w-full max-w-md px-6 animate-fade-in">
        <div className="text-center mb-10">
          <h1 className="font-heading text-4xl font-bold text-primary mb-2">
            SDR · Bryan's & Co
          </h1>
          <p className="font-body text-muted-foreground text-lg">Painel Administrativo</p>
        </div>

        {/* Step 1: Email + Senha */}
        {step === "credentials" && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="bg-card border-input focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Senha</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-card border-input focus:border-primary pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-11 font-body font-semibold" disabled={loading}>
              {loading ? "Verificando..." : "Entrar"}
            </Button>
          </form>
        )}

        {/* Step 2: Enroll MFA (primeira vez) */}
        {step === "mfa-enroll" && (
          <form onSubmit={handleVerifyMfa} className="space-y-5">
            <div className="text-center space-y-3">
              <ShieldCheck className="h-10 w-10 text-primary mx-auto" />
              <p className="font-body font-semibold text-foreground">Configure o Autenticador</p>
              <p className="font-body text-sm text-muted-foreground">
                Escaneie o QR Code com o <strong>Google Authenticator</strong> e depois insira o código de 6 dígitos.
              </p>
            </div>

            {qrCode && (
              <div className="flex justify-center">
                <img src={qrCode} alt="QR Code MFA" className="w-48 h-48 rounded-lg border border-border" />
              </div>
            )}

            {totpSecret && (
              <div className="bg-card border border-border rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1 font-body">Código manual (se não conseguir escanear):</p>
                <p className="font-mono text-sm text-primary tracking-widest break-all">{totpSecret}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Código do Autenticador</label>
              <Input
                type="text"
                inputMode="numeric"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="000 000"
                maxLength={7}
                required
                className="bg-card border-input focus:border-primary text-center text-2xl tracking-widest font-mono"
              />
            </div>

            <Button type="submit" className="w-full h-11 font-body font-semibold" disabled={loading}>
              {loading ? "Verificando..." : "Confirmar e Entrar"}
            </Button>
          </form>
        )}

        {/* Step 3: Verify MFA (logins seguintes) */}
        {step === "mfa-verify" && (
          <form onSubmit={handleVerifyMfa} className="space-y-5">
            <div className="text-center space-y-3">
              <ShieldCheck className="h-10 w-10 text-primary mx-auto" />
              <p className="font-body font-semibold text-foreground">Verificação em 2 Etapas</p>
              <p className="font-body text-sm text-muted-foreground">
                Abra o <strong>Google Authenticator</strong> e insira o código de 6 dígitos.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Código do Autenticador</label>
              <Input
                type="text"
                inputMode="numeric"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="000 000"
                maxLength={7}
                required
                className="bg-card border-input focus:border-primary text-center text-2xl tracking-widest font-mono"
              />
            </div>

            <Button type="submit" className="w-full h-11 font-body font-semibold" disabled={loading}>
              {loading ? "Verificando..." : "Entrar"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
