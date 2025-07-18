import { Suspense } from 'react';

// Loading spinner component
const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ethiopian-green"></div>
    <span className="ml-3 text-gray-600">{message}</span>
  </div>
);

// Error boundary for lazy components
class LazyErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center text-red-600">
          <p>Something went wrong loading this component.</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component for lazy loading with error boundary
const LazyWrapper = ({ 
  children, 
  fallback = <LoadingSpinner />, 
  errorFallback 
}) => {
  return (
    <LazyErrorBoundary>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </LazyErrorBoundary>
  );
};

export default LazyWrapper;
