import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  retryLabel?: string;
}

interface State {
  error: Error | null;
}

/**
 * Reusable error boundary. Renders a readable fallback that displays the
 * actual error.message + a short stack, so testers on native (where the app
 * would otherwise white-screen) can screenshot the real error.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const stackLines = (error.stack ?? "")
      .split("\n")
      .slice(0, 5)
      .join("\n");

    return (
      <div
        className="min-h-[100dvh] bg-background text-foreground p-4 pt-safe pb-safe overflow-auto"
        role="alert"
      >
        <div className="max-w-lg mx-auto space-y-3">
          <h1 className="text-lg font-bold text-destructive">
            Der opstod en fejl
          </h1>
          <div className="rounded-md border border-border bg-card p-3 text-xs font-mono break-words whitespace-pre-wrap">
            <div className="font-semibold mb-1">{error.name}: {error.message}</div>
            {stackLines && (
              <pre className="text-[10px] leading-tight opacity-70 whitespace-pre-wrap break-words">
                {stackLines}
              </pre>
            )}
          </div>
          <div className="flex gap-2">
            {this.props.onBack && (
              <button
                onClick={() => {
                  this.reset();
                  this.props.onBack?.();
                }}
                className="flex-1 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                {this.props.backLabel ?? "Back"}
              </button>
            )}
            <button
              onClick={this.reset}
              className="flex-1 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90"
            >
              {this.props.retryLabel ?? "Retry"}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
