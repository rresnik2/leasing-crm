import { useState } from 'react';

import PhoneInput from './PhoneInput';
import { formatForDisplay } from '../utils/phoneUtils';

function LeadModal({ lead, isOpen, onClose, onSave, onDelete }) {
    const [editedLead, setEditedLead] = useState({
        ...lead,
        phone: lead?.phone ? formatForDisplay(lead.phone) : "",
        occupants: lead?.occupants || 1,
        pets: lead?.pets || "",
        notes: lead?.notes || "",
        address: lead?.address || "",
        employer: lead?.employer || "",
        moveReason: lead?.moveReason || "",
        email: lead?.email || "",
        status: lead?.status || "New Inquiry",
        moveInDate: lead?.moveInDate || "",
        unitType: lead?.unitType || ""
    });

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(editedLead);  // Pass the editedLead state
        onClose();           // Close the modal after saving
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
                            <PhoneInput
                                value={editedLead.phone}
                                onChange={(e) => setEditedLead({ ...editedLead, phone: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                value={editedLead.email || ''}
                                onChange={(e) => setEditedLead({ ...editedLead, email: e.target.value })}
                                className="mt-1 w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Status</label>
                            <select
                                value={editedLead.status || 'New Inquiry'}
                                onChange={(e) => setEditedLead({ ...editedLead, status: e.target.value })}
                                className="mt-1 w-full p-2 border rounded"
                            >
                                <option value="New Inquiry">New Inquiry</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Tour Scheduled">Tour Scheduled</option>
                                <option value="Tour Completed">Tour Completed</option>
                                <option value="Application Submitted">Application Submitted</option>
                                <option value="Approved">Approved</option>
                                <option value="Leased">Leased</option>
                                <option value="Not Interested">Not Interested</option>
                                <option value="Search Hold">Search Hold</option>
                                <option value="Leased Elsewhere">Leased Elsewhere</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Move-In Date</label>
                            <input
                                type="date"
                                value={editedLead.moveInDate || ''}
                                onChange={(e) => setEditedLead({ ...editedLead, moveInDate: e.target.value })}
                                className="mt-1 w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Unit Type</label>
                            <select
                                value={editedLead.unitType || '1 Bedroom'}
                                onChange={(e) => setEditedLead({ ...editedLead, unitType: e.target.value })}
                                className="mt-1 w-full p-2 border rounded"
                            >
                                <option value="Studio">Studio</option>
                                <option value="1 Bedroom">1 Bedroom</option>
                                <option value="2 Bedroom">2 Bedroom</option>
                                <option value="3 Bedroom">3 Bedroom</option>
                            </select>
                        </div>
                    </div>


                    <div>
                        <label className="block text-sm font-medium text-gray-700">Number of Occupants</label>
                        <input
                            type="number"
                            min="1"
                            value={editedLead.occupants || ''}
                            onChange={(e) => setEditedLead({ ...editedLead, occupants: e.target.value ? parseInt(e.target.value) : '' })}
                            placeholder="1"
                            className="mt-1 w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Pets</label>
                        <input
                            type="text"
                            value={editedLead.pets || ''}
                            onChange={(e) => setEditedLead({ ...editedLead, pets: e.target.value })}
                            placeholder="None"
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
                        onClick={() => {
                            onDelete();
                            onClose();
                        }}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                        Delete
                    </button>
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