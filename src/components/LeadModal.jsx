import { useState } from 'react';

function LeadModal({ lead, isOpen, onClose, onSave }) {
    const [editedLead, setEditedLead] = useState(lead);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(editedLead);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Lead Details</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Basic Info Section */}
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                value={editedLead.name}
                                onChange={(e) => setEditedLead({ ...editedLead, name: e.target.value })}
                                className="mt-1 w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                            <input
                                type="tel"
                                value={editedLead.phone}
                                onChange={(e) => setEditedLead({ ...editedLead, phone: e.target.value })}
                                className="mt-1 w-full p-2 border rounded"
                            />
                        </div>
                    </div>



                    <div>
                        <label className="block text-sm font-medium text-gray-700">Number of Occupants</label>
                        <input
                            type="number"
                            min="1"
                            value={editedLead.occupants || 1}
                            onChange={(e) => setEditedLead({ ...editedLead, occupants: parseInt(e.target.value) })}
                            className="mt-1 w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Pets</label>
                        <input
                            type="text"
                            value={editedLead.pets || "None"}
                            onChange={(e) => setEditedLead({ ...editedLead, pets: e.target.value })}
                            className="mt-1 w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Notes</label>
                        <textarea
                            value={editedLead.notes}
                            onChange={(e) => setEditedLead({ ...editedLead, notes: e.target.value })}
                            className="mt-1 w-full p-2 border rounded"
                            rows={3}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <input
                            type="text"
                            value={editedLead.address}
                            onChange={(e) => setEditedLead({ ...editedLead, address: e.target.value })}
                            className="mt-1 w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Employer</label>
                        <input
                            type="text"
                            value={editedLead.employer}
                            onChange={(e) => setEditedLead({ ...editedLead, employer: e.target.value })}
                            className="mt-1 w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Move Reason</label>
                        <select
                            value={editedLead.moveReason || "Other"}
                            onChange={(e) => setEditedLead({ ...editedLead, moveReason: e.target.value })}
                            className="w-full p-2 border rounded mb-2"
                        >
                            <option value="Job Relocation">Job Relocation</option>
                            <option value="Upsizing">Upsizing</option>
                            <option value="Downsizing">Downsizing</option>
                            <option value="First Time Renter">First Time Renter</option>
                            <option value="Closer to Work">Closer to Work</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LeadModal;