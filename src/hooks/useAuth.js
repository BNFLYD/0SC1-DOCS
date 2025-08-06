import { useAuth0 } from '@auth0/auth0-react'

export const useAuth = () => {
  const {
    isAuthenticated,
    user,
    loginWithRedirect: auth0Login,
    logout,
    isLoading,
    error
  } = useAuth0()

  // Función personalizada para cambiar de cuenta
  const switchAccount = async (options = {}) => {
    // Primero cerramos la sesión actual
    await logout({
      returnTo: window.location.origin + window.location.pathname,
      federated: true // Esto fuerza a cerrar la sesión también en el IdP
    });

    // Luego iniciamos una nueva autenticación
    return auth0Login({
      ...options,
      prompt: 'login', // Fuerza a mostrar la pantalla de login
      display: 'popup', // Usa un popup en lugar de redirección
    });
  };

  return {
    isAuthenticated,
    user,
    loginWithRedirect: auth0Login,
    switchAccount, // Exportamos la nueva función
    logout,
    isLoading,
    error
  }
}
