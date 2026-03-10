import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
          <h2 style={{ color: "#b91c1c" }}>Si è verificato un errore</h2>
          <pre style={{ fontSize: "12px", color: "#334155", whiteSpace: "pre-wrap" }}>
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ marginTop: "1rem", padding: "0.5rem 1rem", cursor: "pointer" }}
          >
            Riprova
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
