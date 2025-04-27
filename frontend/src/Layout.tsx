import Navbar from "./components/Navbar";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <div className="flex flex-col h-screen w-screen max-h-screen max-w-screen">
      <div className="h-[3.75rem] w-screen">
          <Navbar />
      </div>
      <main className="h-[calc(100vh)-3.75rem] w-screen flex-grow">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;