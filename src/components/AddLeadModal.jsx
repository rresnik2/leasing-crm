// src/components/AddLeadModal.jsx
import { useState } from 'react';

import PhoneInput from './PhoneInput';
import Button from './ui/Button';
import Input from './ui/Input';
import Modal from './ui/Modal';
import Select from './ui/Select';
import { UNIT_TYPES } from '../constants/leadOptions';

const FORM_ID = 'add-lead-form';

// Mount only while open so the form starts empty each time.
// onAddLead resolves to true once the lead is saved.
function AddLeadModal({ onClose, onAddLead }) {
    // Create state for form inputs
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [moveInDate, setMoveInDate] = useState('');
    const [unitType, setUnitType] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent page refresh

        // create a new lead
        const newLead = {

            name: name,
            email: email,
            phone: phone,
            status: "New Inquiry",
            moveInDate: moveInDate,
            unitType: unitType
        };

        setSaving(true);
        setError('');
        const saved = await onAddLead(newLead);
        setSaving(false);

        // keep the form open with its values so nothing is lost on failure
        if (saved) {
            onClose();
        } else {
            setError("Couldn't add lead. Check your connection and try again.");
        }
    };

    return (
        <Modal
            open
            onClose={onClose}
            title="Add new lead"
            description="New leads start as New Inquiry."
            size="lg"
            closeOnBackdrop={false}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form={FORM_ID} loading={saving}>Add lead</Button>
                </>
            }
        >
            <form id={FORM_ID} onSubmit={handleSubmit}>
                {error && (
                    <p role="alert" className="mb-4 rounded-control bg-danger-subtle px-3 py-2 text-body text-danger-strong">
                        {error}
                    </p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                        label="Name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        required
                    />
                    <Input
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                    />
                    <PhoneInput
                        label="Phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                    />
                    <Input
                        label="Move-in date"
                        type="date"
                        value={moveInDate}
                        onChange={(e) => setMoveInDate(e.target.value)}
                    />
                    <Select
                        label="Unit type"
                        value={unitType}
                        onChange={(e) => setUnitType(e.target.value)}
                        options={UNIT_TYPES}
                        placeholder="Select unit type"
                    />
                </div>
            </form>
        </Modal>
    );
}

export default AddLeadModal;
