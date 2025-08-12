import { useAuth0 } from '@auth0/auth0-react'

export const useAuth = () => {
  const {
    isAuthenticated,
    user,
    loginWithRedirect: auth0Login,
    loginWithPopup,
    logout,
    isLoading,
    error,
    getIdTokenClaims,
    getAccessTokenSilently
  } = useAuth0()

  // Función personalizada para cambiar de cuenta
  const switchAccount = async (options = {}) => {
    // Primero cerramos la sesión actual
    await logout({
      logoutParams: {
        returnTo: window.location.origin + window.location.pathname,
        federated: true // Esto fuerza a cerrar la sesión también en el IdP
      }
    });

    // Luego iniciamos una nueva autenticación vía popup
    return loginWithPopup({
      ...options,
      authorizationParams: {
        prompt: 'login',
        ...(options.authorizationParams || {})
      }
    });
  };

  return {
    isAuthenticated,
    user,
    loginWithRedirect: auth0Login,
    loginWithPopup,
    switchAccount, // Exportamos la nueva función
    logout,
    isLoading,
    error,
    getIdTokenClaims,
    getAccessTokenSilently
  }
}
