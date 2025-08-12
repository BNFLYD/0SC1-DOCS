import React from 'react'

export default class DevErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 m-6 rounded-lg border-2 border-red-400 bg-red-50 text-red-800 font-mono">
          <h2 className="font-bold mb-2">Algo se rompió en esta vista</h2>
          <p className="text-sm mb-2">Se capturó un error para evitar pantalla en blanco.</p>
          <pre className="text-xs whitespace-pre-wrap">
            {String(this.state.error)}
          </pre>
          <button
            className="mt-3 px-3 py-2 rounded border border-red-300"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Reintentar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
