import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[kiosk] uncaught error", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-neutral-950 px-8 text-center text-neutral-100">
          <h1 className="text-3xl font-bold text-orange-400">Something went wrong</h1>
          <p className="max-w-md text-neutral-400">
            The kiosk hit an unexpected error. Reloading should recover it.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="rounded-2xl bg-orange-500 px-8 py-4 text-lg font-bold uppercase tracking-widest text-black shadow-[0_0_30px_rgba(249,115,22,0.35)]"
          >
            Reload
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
