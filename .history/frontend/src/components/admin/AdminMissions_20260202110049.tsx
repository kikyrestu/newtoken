import React, { useState } from 'react';
import { useAdminMissions, AdminMission } from '../../hooks/useMissions';
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X, AlertCircle, Loader2 } from 'lucide-react';

interface MissionFormData {
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    rewards: string;
    mission_points: string;
    participants_limit: number;
    start_in: string;
    description: string;
    requirements: string;
    status: 'draft' | 'upcoming' | 'active' | 'completed';
    is_visible: boolean;
}

const defaultFormData: MissionFormData = {
    title: '',
    difficulty: 'Easy',
    rewards: '0%',
    mission_points: '0',
    participants_limit: 1000,
    start_in: '30 days',
    description: '',
    requirements: '',
    status: 'upcoming',
    is_visible: true,
};

export const AdminMissions: React.FC = () => {
    const { missions, loading, error, createMission, updateMission, deleteMission, refetch } = useAdminMissions();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<MissionFormData>(defaultFormData);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    const handleEdit = (mission: AdminMission) => {
        setEditingId(mission.id);
        setFormData({
            title: mission.title,
            difficulty: mission.difficulty,
            rewards: mission.rewards,
            mission_points: mission.mission_points,
            participants_limit: mission.participants_limit,
            start_in: mission.start_in || '',
            description: mission.description || '',
            requirements: mission.requirements || '',
            status: mission.status,
            is_visible: mission.is_visible,
        });
        setShowForm(true);
    };

    const handleCreate = () => {
        setEditingId(null);
        setFormData(defaultFormData);
        setShowForm(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editingId) {
                await updateMission(editingId, formData);
            } else {
                await createMission(formData);
            }
            setShowForm(false);
            setEditingId(null);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        await deleteMission(id);
        setDeleteConfirm(null);
    };

    const handleToggleVisibility = async (mission: AdminMission) => {
        await updateMission(mission.id, { is_visible: !mission.is_visible });
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Easy': return 'text-green-400 bg-green-400/10';
            case 'Medium': return 'text-yellow-400 bg-yellow-400/10';
            case 'Hard': return 'text-red-400 bg-red-400/10';
            default: return 'text-gray-400 bg-gray-400/10';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-green-400 bg-green-400/10';
            case 'upcoming': return 'text-blue-400 bg-blue-400/10';
            case 'completed': return 'text-gray-400 bg-gray-400/10';
            case 'draft': return 'text-yellow-400 bg-yellow-400/10';
            default: return 'text-gray-400 bg-gray-400/10';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#00ff41] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Mission Management</h2>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-[#00ff41]/20 text-[#00ff41] rounded-lg hover:bg-[#00ff41]/30 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Mission
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white">
                                {editingId ? 'Edit Mission' : 'Create Mission'}
                            </h3>
                            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Title */}
                            <div className="col-span-2">
                                <label className="block text-sm text-gray-400 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                                />
                            </div>

                            {/* Difficulty */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Difficulty</label>
                                <select
                                    value={formData.difficulty}
                                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard' })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                                >
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                </select>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'upcoming' | 'active' | 'completed' })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="upcoming">Upcoming</option>
                                    <option value="active">Active</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>

                            {/* Rewards */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Rewards</label>
                                <input
                                    type="text"
                                    value={formData.rewards}
                                    onChange={(e) => setFormData({ ...formData, rewards: e.target.value })}
                                    placeholder="e.g., 3%"
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                                />
                            </div>

                            {/* Mission Points */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Mission Points</label>
                                <input
                                    type="text"
                                    value={formData.mission_points}
                                    onChange={(e) => setFormData({ ...formData, mission_points: e.target.value })}
                                    placeholder="e.g., 10 - 60 - 100"
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                                />
                            </div>

                            {/* Participants Limit */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Participants Limit</label>
                                <input
                                    type="number"
                                    value={formData.participants_limit}
                                    onChange={(e) => setFormData({ ...formData, participants_limit: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                                />
                            </div>

                            {/* Start In */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Start In</label>
                                <input
                                    type="text"
                                    value={formData.start_in}
                                    onChange={(e) => setFormData({ ...formData, start_in: e.target.value })}
                                    placeholder="e.g., 30 days"
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                                />
                            </div>

                            {/* Requirements */}
                            <div className="col-span-2">
                                <label className="block text-sm text-gray-400 mb-1">Requirements</label>
                                <input
                                    type="text"
                                    value={formData.requirements}
                                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                    placeholder="e.g., Minimum Observer tier required"
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                                />
                            </div>

                            {/* Description */}
                            <div className="col-span-2">
                                <label className="block text-sm text-gray-400 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                                />
                            </div>

                            {/* Visible Toggle */}
                            <div className="col-span-2 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.is_visible}
                                    onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <label className="text-sm text-gray-400">Visible to users</label>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !formData.title}
                                className="flex items-center gap-2 px-4 py-2 bg-[#00ff41] text-black rounded hover:bg-[#00dd35] disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {editingId ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteConfirm !== null && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold text-white mb-4">Confirm Delete</h3>
                        <p className="text-gray-400 mb-6">Are you sure you want to delete this mission? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Missions Table */}
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-700 text-left">
                            <th className="px-4 py-3 text-sm text-gray-400">Title</th>
                            <th className="px-4 py-3 text-sm text-gray-400">Difficulty</th>
                            <th className="px-4 py-3 text-sm text-gray-400">Status</th>
                            <th className="px-4 py-3 text-sm text-gray-400">Rewards</th>
                            <th className="px-4 py-3 text-sm text-gray-400">Participants</th>
                            <th className="px-4 py-3 text-sm text-gray-400">Start In</th>
                            <th className="px-4 py-3 text-sm text-gray-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {missions.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                    No missions found. Click "Add Mission" to create one.
                                </td>
                            </tr>
                        ) : (
                            missions.map((mission) => (
                                <tr key={mission.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                                    <td className="px-4 py-3 text-white font-medium">{mission.title}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(mission.difficulty)}`}>
                                            {mission.difficulty}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(mission.status)}`}>
                                            {mission.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-[#00ff41]">{mission.rewards}</td>
                                    <td className="px-4 py-3 text-gray-300">
                                        {mission.current_participants}/{mission.participants_limit}
                                    </td>
                                    <td className="px-4 py-3 text-gray-400">{mission.start_in || '-'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleToggleVisibility(mission)}
                                                className={`p-1.5 rounded ${mission.is_visible ? 'text-green-400 hover:bg-green-400/20' : 'text-gray-500 hover:bg-gray-700'}`}
                                                title={mission.is_visible ? 'Hide' : 'Show'}
                                            >
                                                {mission.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleEdit(mission)}
                                                className="p-1.5 text-blue-400 hover:bg-blue-400/20 rounded"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(mission.id)}
                                                className="p-1.5 text-red-400 hover:bg-red-400/20 rounded"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
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
    );
};

export default AdminMissions;
