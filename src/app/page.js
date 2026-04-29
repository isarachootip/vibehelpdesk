export default function Dashboard() {
  return (
    <>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <i className="fa-solid fa-ticket"></i>
          </div>
          <div>
            <div className="stat-number">24</div>
            <div className="stat-label">Total Tickets</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon yellow">
            <i className="fa-solid fa-clock"></i>
          </div>
          <div>
            <div className="stat-number">5</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <i className="fa-solid fa-check-circle"></i>
          </div>
          <div>
            <div className="stat-number">18</div>
            <div className="stat-label">Resolved</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div>
            <div className="stat-number">1</div>
            <div className="stat-label">SLA Breach</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Tickets</h2>
          <button className="btn btn-primary btn-sm">
            <i className="fa-solid fa-plus"></i> New Ticket
          </button>
        </div>
        <div className="card-body p-0">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket No.</th>
                  <th>Subject</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-mono">HD-202604-00001</td>
                  <td>Computer cannot boot up</td>
                  <td><span className="badge badge-danger">High</span></td>
                  <td><span className="badge badge-warning">In Progress</span></td>
                  <td>2026-04-29 10:30</td>
                  <td>
                    <button className="btn btn-outline btn-sm">View</button>
                  </td>
                </tr>
                <tr>
                  <td className="font-mono">HD-202604-00002</td>
                  <td>Request access to ERP</td>
                  <td><span className="badge badge-primary">Medium</span></td>
                  <td><span className="badge badge-success">Resolved</span></td>
                  <td>2026-04-28 14:15</td>
                  <td>
                    <button className="btn btn-outline btn-sm">View</button>
                  </td>
                </tr>
                <tr>
                  <td className="font-mono">HD-202604-00003</td>
                  <td>Printer paper jam</td>
                  <td><span className="badge badge-gray">Low</span></td>
                  <td><span className="badge badge-gray">Closed</span></td>
                  <td>2026-04-27 09:00</td>
                  <td>
                    <button className="btn btn-outline btn-sm">View</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
