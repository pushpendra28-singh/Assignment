import { useState } from 'react';
import { taskApi } from '../../api/taskApi';
import { getInitials, getAvatarColor } from '../../utils/helpers';

export default function TaskFormModal({ task, projectId, members = [], onClose, onSaved }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assignedTo: task?.assignedTo?._id || task?.assignedTo || '',
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
    estimatedHours: task?.estimatedHours || '',
    tags: task?.tags?.join(', ') || '',
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
    if (!form.title.trim() || form.title.trim().length < 3) errs.title = 'Title must be at least 3 characters';
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
        assignedTo: form.assignedTo || null,
        dueDate: form.dueDate || undefined,
        estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };
      const res = isEdit
        ? await taskApi.update(task._id, payload)
        : await taskApi.create(projectId, payload);
      onSaved(res.data.task, isEdit);
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Failed to save task' });
    } finally {
      setLoading(false);
    }
  };

  const validMembers = members?.filter((m) => m.user) || [];

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {errors.general && <div className="alert alert-error mb-4">{errors.general}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input
              type="text"
              name="title"
              className={`form-input ${errors.title ? 'error' : ''}`}
              value={form.title}
              onChange={handleChange}
              placeholder="What needs to be done?"
              autoFocus
            />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-input"
              value={form.description}
              onChange={handleChange}
              placeholder="Provide more context…"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select name="status" className="form-select" value={form.status} onChange={handleChange}>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="review">In Review</option>
                <option value="done">Done</option>
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
            <label className="form-label">Assign To</label>
            <select name="assignedTo" className="form-select" value={form.assignedTo} onChange={handleChange}>
              <option value="">Unassigned</option>
              {validMembers.map((m) => (
                <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
              ))}
            </select>
            {form.assignedTo && (
              <div className="flex items-center gap-2 mt-2">
                {(() => {
                  const m = validMembers.find((x) => x.user._id === form.assignedTo);
                  if (!m) return null;
                  return (
                    <>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[0.6rem] font-bold text-white" style={{ background: getAvatarColor(m.user.name) }}>
                        {getInitials(m.user.name)}
                      </div>
                      <span className="text-xs text-text-secondary">{m.user.name}</span>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <label className="form-label">Est. Hours</label>
              <input
                type="number"
                name="estimatedHours"
                className="form-input"
                value={form.estimatedHours}
                onChange={handleChange}
                placeholder="e.g. 8"
                min="0"
                max="1000"
              />
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
              placeholder="bug, feature, ui"
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><div className="spinner" style={{ width: 14, height: 14 }} />{isEdit ? 'Saving…' : 'Creating…'}</> : isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}