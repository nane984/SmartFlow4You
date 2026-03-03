import type{ ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface Mops {
    children: ReactNode;   //ReactNode je TypeScript tip koji predstavlja sve što može da se renderuje u React-u.
}

const Layout = ({children}: Mops) =>{
    return(
        <div className="layout">
            <Sidebar />
            <div className="main">
                <Topbar />
                <div className="content">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Layout;