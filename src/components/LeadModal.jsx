import { useState } from 'react';

import PhoneInput from './PhoneInput';
import PipelineProgress from './PipelineProgress';
import Button from './ui/Button';
import ConfirmDialog from './ui/ConfirmDialog';
import Input from './ui/Input';
import Modal from './ui/Modal';
import Select from './ui/Select';
import Textarea from './ui/Textarea';
import { LEAD_STATUSES, MOVE_REASONS, UNIT_TYPES } from '../constants/leadOptions';
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
    // delete asks for confirmation first
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    const handleSave = () => {
        onSave(editedLead);  // Pass the editedLead state
        onClose();           // Close the modal after saving
    };

    const handleConfirmDelete = () => {
        setConfirmingDelete(false);
        onDelete();
        onClose();
    };

    return (
        <>
            <Modal
                open={isOpen}
                onClose={onClose}
                size="lg"
                title={lead?.name || 'Lead details'}
                description="View and update this lead's details."
                footer={
                    <>
                        <Button variant="danger" className="mr-auto" onClick={() => setConfirmingDelete(true)}>
                            Delete
                        </Button>
                        <Button variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            Save changes
                        </Button>
                    </>
                }
            >
                <div className="space-y-6">
                    <section>
                        <h3 className="text-caption font-medium uppercase tracking-wide text-fg-subtle mb-3">Pipeline</h3>
                        <PipelineProgress variant="steps" status={editedLead.status} />
                    </section>

                    <section>
                        <h3 className="text-caption font-medium uppercase tracking-wide text-fg-subtle mb-3">Contact</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input
                                label="Name"
                                type="text"
                                value={editedLead.name}
                                onChange={(e) => setEditedLead({ ...editedLead, name: e.target.value })}
                            />
                            <PhoneInput
                                label="Phone"
                                value={editedLead.phone}
                                onChange={(e) => setEditedLead({ ...editedLead, phone: e.target.value })}
                            />
                            <Input
                                label="Email"
                                type="email"
                                wrapperClassName="sm:col-span-2"
                                value={editedLead.email || ''}
                                onChange={(e) => setEditedLead({ ...editedLead, email: e.target.value })}
                            />
                        </div>
                    </section>

                    <section>
                        <h3 className="text-caption font-medium uppercase tracking-wide text-fg-subtle mb-3">Leasing</h3>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <Select
                                label="Status"
                                options={LEAD_STATUSES}
                                value={editedLead.status || 'New Inquiry'}
                                onChange={(e) => setEditedLead({ ...editedLead, status: e.target.value })}
                            />
                            <Input
                                label="Move-in date"
                                type="date"
                                value={editedLead.moveInDate || ''}
                                onChange={(e) => setEditedLead({ ...editedLead, moveInDate: e.target.value })}
                            />
                            <Select
                                label="Unit type"
                                options={UNIT_TYPES}
                                placeholder="Select unit type"
                                value={editedLead.unitType || ''}
                                onChange={(e) => setEditedLead({ ...editedLead, unitType: e.target.value })}
                            />
                        </div>
                    </section>

                    <section>
                        <h3 className="text-caption font-medium uppercase tracking-wide text-fg-subtle mb-3">Household</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input
                                label="Number of occupants"
                                type="number"
                                min="1"
                                value={editedLead.occupants || ''}
                                onChange={(e) => setEditedLead({ ...editedLead, occupants: e.target.value ? parseInt(e.target.value) : '' })}
                                placeholder="1"
                            />
                            <Input
                                label="Pets"
                                type="text"
                                value={editedLead.pets || ''}
                                onChange={(e) => setEditedLead({ ...editedLead, pets: e.target.value })}
                                placeholder="None"
                            />
                        </div>
                    </section>

                    <section>
                        <h3 className="text-caption font-medium uppercase tracking-wide text-fg-subtle mb-3">Background</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input
                                label="Employer"
                                type="text"
                                value={editedLead.employer}
                                onChange={(e) => setEditedLead({ ...editedLead, employer: e.target.value })}
                            />
                            <Select
                                label="Move reason"
                                options={MOVE_REASONS}
                                placeholder="Select a reason"
                                value={editedLead.moveReason || ''}
                                onChange={(e) => setEditedLead({ ...editedLead, moveReason: e.target.value })}
                            />
                            <Input
                                label="Address"
                                type="text"
                                wrapperClassName="sm:col-span-2"
                                value={editedLead.address}
                                onChange={(e) => setEditedLead({ ...editedLead, address: e.target.value })}
                            />
                        </div>
                    </section>

                    <section>
                        <h3 className="text-caption font-medium uppercase tracking-wide text-fg-subtle mb-3">Notes</h3>
                        <Textarea
                            aria-label="Notes"
                            rows={4}
                            value={editedLead.notes}
                            onChange={(e) => setEditedLead({ ...editedLead, notes: e.target.value })}
                        />
                    </section>
                </div>
            </Modal>

            <ConfirmDialog
                open={confirmingDelete}
                title="Delete this lead?"
                description={`${lead?.name || 'This lead'} will be permanently removed. This can't be undone.`}
                confirmLabel="Delete lead"
                tone="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmingDelete(false)}
            />
        </>
    );
}

export default LeadModal;
