import { useState, useEffect } from 'react';
import { projectApi } from '../../api/projectApi';

const PROJECT_COLORS = [
  '#7c6af7', '#10d9a0', '#f59e0b', '#f43f5e',
  '#38bdf8', '#a78bfa', '#fb923c', '#34d399',
  '#e879f9', '#818cf8',
];

export default function ProjectFormModal({ project, onClose, onSaved }) {
  const isEdit = !!project;
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'active',
    priority: project?.priority || 'medium',
    dueDate: project?.dueDate ? project.dueDate.split('T')[0] : '',
    color: project?.color || '#7c6af7',
    tags: project?.tags?.join(', ') || '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 3) errs.name = 'Project name must be at least 3 characters';
    if (form.description && form.description.length > 500) errs.description = 'Description max 500 characters';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);

    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        dueDate: form.dueDate || undefined,
      };
      const res = isEdit
        ? await projectApi.update(project._id, payload)
        : await projectApi.create(payload);
      onSaved(res.data.project, isEdit);
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Failed to save project' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Project' : 'New Project'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {errors.general && <div className="alert alert-error mb-4">{errors.general}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input
              type="text"
              name="name"
              className={`form-input ${errors.name ? 'error' : ''}`}
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Website Redesign"
              autoFocus
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className={`form-input ${errors.description ? 'error' : ''}`}
              value={form.description}
              onChange={handleChange}
              placeholder="Brief project description…"
              rows={3}
            />
            {errors.description && <span className="form-error">{errors.description}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select name="status" className="form-select" value={form.status} onChange={handleChange}>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select name="priority" className="form-select" value={form.priority} onChange={handleChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input
              type="date"
              name="dueDate"
              className="form-input"
              value={form.dueDate}
              onChange={handleChange}
              style={{ colorScheme: 'dark' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Project Color</label>
            <div className="flex gap-2 flex-wrap mt-1">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, color: c }))}
                  className={`w-7 h-7 rounded-full transition-all duration-150 flex items-center justify-center ${form.color === c ? 'ring-2 ring-offset-2 ring-offset-elevated scale-110' : 'hover:scale-110'}`}
                  style={{ background: c, ringColor: c }}
                >
                  {form.color === c && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tags (comma separated)</label>
            <input
              type="text"
              name="tags"
              className="form-input"
              value={form.tags}
              onChange={handleChange}
              placeholder="design, frontend, urgent"
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><div className="spinner" style={{ width: 14, height: 14 }} />{isEdit ? 'Saving…' : 'Creating…'}</> : isEdit ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}