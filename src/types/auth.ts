export interface AuthState {
  user: import('./database').User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface CadastroStep1 {
  nome_completo: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface CadastroStep2 {
  phone: string;
  cep: string;
}

