import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader.jsx';

/**
 * Primary layout that keeps the header and container consistent.
 */
export function AppLayout() {
  return (
    <div>
      <AppHeader />
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
