/**
 * Utilitários para manipulação de tokens JWT
 */
export class JwtHelper {
  /**
   * Decodifica um token JWT
   * @param token Token JWT
   * @returns Payload decodificado ou null em caso de erro
   */
  static decodeToken(token: string): any {
    try {
      // Token JWT tem formato: header.payload.signature
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Erro ao decodificar token JWT:', e);
      return null;
    }
  }

  /**
   * Verifica se um token JWT está expirado
   * @param token Token JWT
   * @returns true se expirado, false caso contrário
   */
  static isTokenExpired(token: string): boolean {
    if (!token) return true;

    try {
      const decoded = this.decodeToken(token);
      if (!decoded) return true;

      // Obter data atual em segundos (o mesmo formato do token)
      const currentTime = Math.floor(Date.now() / 1000);

      // Se o token não tiver campo exp, considera expirado
      if (!decoded.exp) return true;

      // Verifica se expirou
      return decoded.exp < currentTime;
    } catch (e) {
      console.error('Erro ao verificar expiração do token:', e);
      return true;
    }
  }

  /**
   * Obtém informações do usuário a partir do token JWT
   * @param token Token JWT
   * @returns Informações do usuário ou null em caso de erro
   */
  static getUserInfo(token: string): any {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded) return null;

      // Retorna apenas as informações relacionadas ao usuário
      // Isso vai depender de como seu backend estrutura o token
      return {
        id: decoded.sub,
        email: decoded.email,
        roles: decoded.roles || [],
      };
    } catch (e) {
      console.error('Erro ao obter informações do usuário do token:', e);
      return null;
    }
  }

  /**
   * Obtém o tempo restante de validade do token em segundos
   * @param token Token JWT
   * @returns Tempo restante em segundos ou 0 se expirado/inválido
   */
  static getTokenRemainingTime(token: string): number {
    if (!token) return 0;

    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) return 0;

      const currentTime = Math.floor(Date.now() / 1000);
      const remainingTime = decoded.exp - currentTime;

      return remainingTime > 0 ? remainingTime : 0;
    } catch (e) {
      console.error('Erro ao calcular tempo restante do token:', e);
      return 0;
    }
  }
}
