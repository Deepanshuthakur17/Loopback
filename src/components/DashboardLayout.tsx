import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { Navbar } from "./Navbar";

export function DashboardLayout() {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 px-4 md:px-8 py-6 md:py-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
