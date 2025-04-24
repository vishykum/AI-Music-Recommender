import Navbar from "./components/Navbar";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <div className="flex flex-col h-screen">
      <div className="h-15">
          <Navbar />
      </div>
      <main className="flex-grow bg-neutral-900">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;