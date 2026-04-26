import { Outlet } from "react-router";
import NavBar from "../components/NavBar";
import SideBar from "../components/SideBar";

function DashboardLayout() {
  return (
    <div className="drawer lg:drawer-open">
      <input
        id="my-drawer"
        type="checkbox"
        className="drawer-toggle"
        defaultChecked
      />

      <div className="drawer-content">
        <NavBar />

        <main className="p-6">
          <Outlet />
        </main>
      </div>

      <SideBar />
    </div>
  );
}

export default DashboardLayout;
