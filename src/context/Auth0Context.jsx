import { Auth0Provider as Auth0ProviderBase } from '@auth0/auth0-react'
import PropTypes from 'prop-types'

export const Auth0Provider = ({ children }) => {
  return (
    <Auth0ProviderBase
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
      }}
    >
      {children}
    </Auth0ProviderBase>
  )
}

Auth0Provider.propTypes = {
  children: PropTypes.node.isRequired
}
