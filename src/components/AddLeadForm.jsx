// src/components/AddLeadForm.jsx
import { useState } from 'react';

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
        <form className="bg-white p-6 rounded-lg shadow-md mb-6" onSubmit={handleSubmit}>
            <h2 className="text-xl font-bold mb-4">Add New Lead</h2>

            <div className="mb-4">
                <label className="block text-gray-700 mb-2">Name:</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                />
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 mb-2">Email:</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                />
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 mb-2">Phone:</label>
                <input
                    type="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                />
            </div>
            
            <div>
                    <label className="block text-gray-700 mb-2">Move-in Date:</label>
                    <input
                        type="date"
                        value={moveInDate}
                        onChange={(e) => setMoveInDate(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                </div>
                
                <div>
                    <label className="block text-gray-700 mb-2">Unit Type:</label>
                    <select
                        value={unitType}
                        onChange={(e) => setUnitType(e.target.value)}
                        className="w-full p-2 border rounded"
                    >
                        <option value="Studio">Studio</option>
                        <option value="1 Bedroom">1 Bedroom</option>
                        <option value="2 Bedroom">2 Bedroom</option>
                        <option value="3 Bedroom">3 Bedroom</option>
                    </select>
                </div>

            <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
                Add Lead
            </button>
        </form>
    );
}

export default AddLeadForm;