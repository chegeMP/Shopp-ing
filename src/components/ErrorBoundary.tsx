"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="max-w-5xl mx-auto px-4 py-12 text-center">
            <h2 className="text-lg font-bold text-[#222] mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-[#666] mb-4">
              An unexpected error occurred. Please refresh the page.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="text-sm text-[#1a5dab] hover:underline cursor-pointer"
            >
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
