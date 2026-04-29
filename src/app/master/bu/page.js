"use client";

import { useState, useEffect } from "react";

export default function BusinessUnitManagement() {
  const [bus, setBus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    bu_code: "",
    bu_name: "",
    bu_description: "",
    is_active: true,
  });
  const [editingId, setEditingId] = useState(null);

  // Fetch Business Units
  const fetchBUs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/master/bu");
      const data = await res.json();
      setBus(data);
    } catch (error) {
      console.error("Failed to fetch BUs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBUs();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/master/bu/${editingId}` : "/api/master/bu";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({ bu_code: "", bu_name: "", bu_description: "", is_active: true });
        setEditingId(null);
        fetchBUs();
      } else {
        alert("Operation failed.");
      }
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  const handleEdit = (bu) => {
    setEditingId(bu.bu_id);
    setFormData({
      bu_code: bu.bu_code,
      bu_name: bu.bu_name,
      bu_description: bu.bu_description || "",
      is_active: bu.is_active,
    });
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this Business Unit?")) return;
    try {
      const res = await fetch(`/api/master/bu/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchBUs();
      } else {
        alert("Failed to delete. It might be in use.");
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            {editingId ? "Edit Business Unit" : "Add New Business Unit"}
          </h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>BU Code <span className="req">*</span></label>
                <input
                  type="text"
                  name="bu_code"
                  value={formData.bu_code}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="e.g. IT"
                  required
                />
              </div>
              <div className="form-group">
                <label>BU Name <span className="req">*</span></label>
                <input
                  type="text"
                  name="bu_name"
                  value={formData.bu_name}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="e.g. Information Technology"
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="bu_description"
                  value={formData.bu_description}
                  onChange={handleInputChange}
                  className="form-control"
                  rows="2"
                  placeholder="Optional description"
                ></textarea>
              </div>
            </div>
            <div className="form-row" style={{ alignItems: 'center', marginBottom: '20px' }}>
              <div className="form-group flex gap-2" style={{ flexDirection: 'row', width: 'auto', flex: 'none' }}>
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="is_active" style={{ marginBottom: 0, cursor: 'pointer' }}>Active</label>
              </div>
            </div>
            <div>
              <button type="submit" className="btn btn-primary">
                <i className="fa-solid fa-save"></i> {editingId ? "Update BU" : "Save BU"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ bu_code: "", bu_name: "", bu_description: "", is_active: true });
                  }}
                  style={{ marginLeft: '10px' }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Business Unit List</h2>
        </div>
        <div className="card-body p-0">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted">Loading...</td>
                  </tr>
                ) : bus.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted">No records found.</td>
                  </tr>
                ) : (
                  bus.map((bu) => (
                    <tr key={bu.bu_id}>
                      <td>{bu.bu_id}</td>
                      <td className="font-mono">{bu.bu_code}</td>
                      <td>{bu.bu_name}</td>
                      <td>
                        {bu.is_active ? (
                          <span className="badge badge-success">Active</span>
                        ) : (
                          <span className="badge badge-danger">Inactive</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleEdit(bu)}
                          >
                            <i className="fa-solid fa-edit"></i> Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(bu.bu_id)}
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
