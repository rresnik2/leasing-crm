// src/components/AddLeadForm.jsx
import { useState } from 'react';

import PhoneInput from './PhoneInput';
import Button from './ui/Button';
import Card from './ui/Card';
import Input from './ui/Input';
import Select from './ui/Select';
import { UNIT_TYPES } from '../constants/leadOptions';

function AddLeadForm({ onAddLead }) {
    // Create state for form inputs
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [moveInDate, setMoveInDate] = useState('');
    const [unitType, setUnitType] = useState('');

    const handleSubmit = (e) => {
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
        //set state values
        onAddLead(newLead);
        setName('');
        setEmail('');
        setPhone('');
        setMoveInDate('');
        setUnitType('');
    };

    return (
        <Card as="form" padding="lg" onSubmit={handleSubmit}>
            <h2 className="text-heading text-fg">Add new lead</h2>
            <p className="text-body text-fg-muted">New leads start as New Inquiry.</p>

            <div className="grid gap-4 sm:grid-cols-2 mt-5">
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

            <div className="mt-6 flex justify-end">
                <Button type="submit">Add lead</Button>
            </div>
        </Card>
    );
}

export default AddLeadForm;
