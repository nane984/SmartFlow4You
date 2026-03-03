import { Link, Routes, Route } from "react-router-dom"

export default function Dashboard() {
    return (
        <>
            <h1>SmartFlow Dashboard</h1>
            <ul>
                <li><Link to="/tenders">Tenderi</Link></li>
                <li><Link to="/hr">HR</Link></li>
                <li><Link to="/time-tracking">Evidencija rada</Link></li>
                <li><Link to="/interior">Enterijer</Link></li>
            </ul>

            <Routes>
                <Route path="/tenders" element={<div>Tender Page</div>} />
                <Route path="/hr" element={<div>HR Page</div>} />
                <Route path="/time-tracking" element={<div>Time Tracking</div>} />
                <Route path="/interior" element={<div>Interior</div>} />
            </Routes>
        </>
    );
}