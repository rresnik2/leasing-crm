import { useState } from 'react';

function LeadCard({ name, email, phone, status, moveInDate, unitType, onDelete, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState(status);
  const [editName, setEditName] = useState(name);
  const [editEmail, setEditEmail] = useState(email);
  const [editPhone, setEditPhone] = useState(phone);
  const [editMoveInDate, setEditMoveInDate] = useState(moveInDate);
  const [editUnitType, setEditUnitType] = useState(unitType);

  const statusOptions = [
    "New Inquiry",
    "Contacted",
    "Tour Scheduled",
    "Tour Completed",
    "Application Submitted",
    "Approved",
    "Leased",
    "Not Interested",
    "Search Hold",
    "Leased Elsewhere"
  ];

  function getStatusColor(status) {
  const colors = {
    "New Inquiry": "bg-blue-100 text-blue-800",
    "Contacted": "bg-yellow-100 text-yellow-800",
    "Tour Scheduled": "bg-purple-100 text-purple-800",
    "Tour Completed": "bg-indigo-100 text-indigo-800",
    "Application Submitted": "bg-orange-100 text-orange-800",
    "Approved": "bg-green-100 text-green-800",
    "Leased": "bg-teal-100 text-teal-800",
    "Leased Elsewhere": "bg-red-200 text-red-900",
    "Search Hold": "bg-rose-200 text-rose-900",
    "Not Interested": "bg-gray-100 text-gray-800"
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

  const handleSave = (e) => {
    e.preventDefault();
    // onEdit receives an object with new details.
    const updatedData = {
      name: editName,
      email: editEmail,
      phone: editPhone,
      status: editStatus,
      moveInDate: editMoveInDate,
      unitType: editUnitType
    }
    onEdit(updatedData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    //Resets the edit fields to original values
    setEditName(name);
    setEditEmail(email);
    setEditPhone(phone);
    setEditStatus(status);
    setEditMoveInDate(moveInDate);
    setEditUnitType(unitType);
    setIsEditing(false);
    
  };
  // editing display mode
  if (isEditing) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <input
          type="email"
          value={editEmail}
          onChange={(e) => setEditEmail(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <input
          type="phone"
          value={editPhone}
          onChange={(e) => setEditPhone(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <input
          type="date"
          value={editMoveInDate}
          onChange={(e) => setEditMoveInDate(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <select
          value={editUnitType}
          onChange={(e) => setEditUnitType(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        >
          <option value="Studio">Studio</option>
          <option value="1 Bedroom">1 Bedroom</option>
          <option value="2 Bedroom">2 Bedroom</option>
          <option value="3 Bedroom">3 Bedroom</option>
        </select>
        <select
          value={editStatus}
          onChange={(e) => setEditStatus(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        >
          {statusOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Normal display mode
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className='flex justify-between items-start mb-3'>
        <h2 className="text-xl font-bold text-gray-800">{name}</h2>
        <span className={`px-2 py-1 rounded text-sm ${getStatusColor(status)}`}>
        {status}
      </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div>
          <p className='text-green-800'>Email</p>
          <p className='text-gray-900'>{email}</p>
        </div>
        <div>
          <p className='text-green-800'>Phone</p>
          <p className='text-gray-900'>{phone}</p>
        </div>
        <div>
          <p className='text-green-800'>Move-In Date</p>
          <p className='text-gray-900'>{moveInDate}</p>
        </div>
        <div>
          <p className='text-green-800'>Unit Type</p>
          <p className='text-gray-900'>{unitType}</p>
        </div>
      </div>
      
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => setIsEditing(true)}
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
        >
          Delete
        </button>
      </div>
      
    </div>
  );
}
export default LeadCard;