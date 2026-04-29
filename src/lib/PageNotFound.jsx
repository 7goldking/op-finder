import { useLocation } from 'react-router-dom';
export default function PageNotFound() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center space-y-4">
        <h1 className="text-7xl font-light text-muted-foreground">404</h1>
        <h2 className="text-2xl font-medium">Страница не найдена</h2>
        <p className="text-muted-foreground">«{pathname}» не существует.</p>
        <button onClick={() => window.location.href = '/'}
          className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm">
          На главную
        </button>
      </div>
    </div>
  );
}
