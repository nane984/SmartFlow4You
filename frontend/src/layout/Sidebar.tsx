import { Link } from "react-router-dom"

const Sidebar = () => {
    return (
        <div className="sidebar">
            <h3>SmartFlow</h3>

            <ul>
                <li><Link to="/dashboard">Dashboard</Link></li>
                <li><Link to="/interior">Interior Design</Link></li>
                <li><Link to="/timetracking">Time Tracking</Link></li>
                <li><Link to="/hr">HR</Link></li>
                <li><Link to="/tender">Tender</Link></li>
            </ul>
        </div>
    );
};

export default Sidebar;