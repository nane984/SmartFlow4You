import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <h3>SmartFlow</h3>
      <ul>
        <li>
          <Link to="/">Dashboard</Link>
        </li>
        <li>
          <Link to="/interior">Interior Design</Link>
        </li>
        <li>
          <Link to="/time-tracking">Time Tracking</Link>
        </li>
        <li>
          <Link to="/hr">HR</Link>
        </li>
        <li>
          <Link to="/tenders">Tenders</Link>
        </li>
        <li>
          <Link to="/companies">Companies</Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;