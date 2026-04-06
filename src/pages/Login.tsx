import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const Login: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulated login — will connect to Supabase later
    setTimeout(() => {
      setLoading(false);
      toast.success("Login realizado com sucesso!");
      navigate("/admin");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative">
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2 rounded-lg bg-card border border-border hover:bg-accent transition-colors"
      >
        {theme === "dark" ? <Sun className="h-5 w-5 text-accent-foreground" /> : <Moon className="h-5 w-5 text-accent-foreground" />}
      </button>

      <div className="w-full max-w-md px-6 animate-fade-in">
        <div className="text-center mb-10">
          <h1 className="font-heading text-4xl font-bold text-primary mb-2">
            SDR · Bryan's & Co
          </h1>
          <p className="font-body text-muted-foreground text-lg">
            Painel Administrativo
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Email</label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
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
                onChange={e => setPassword(e.target.value)}
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
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
