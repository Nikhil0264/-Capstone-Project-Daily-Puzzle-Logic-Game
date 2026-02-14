import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../features/user/userSlice';
import { authAPI } from '../services/api';



const Profile = () => {
  const { user, streak, totalPoints, history } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const handleSave = async () => {
    setSaving(true);
    
    
    setTimeout(() => {
      setSaving(false);
      setIsEditing(false);
      
      alert("Profile updated! (Simulation)");
    }, 1000);
  };

  const solvedCount = Object.keys(history || {}).length;

  
  const winRate = solvedCount > 0 ? "100%" : "0%";

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-4 pt-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">My Profile</h1>

      {}
      <div className="bg-white w-full rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
            👤
          </div>
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-lg font-bold border-b-2 border-blue-500 outline-none pb-1"
                autoFocus
              />
            ) : (
              <h2 className="text-xl font-bold text-gray-800">{user?.name || "Guest User"}</h2>
            )}
            <p className="text-gray-500 text-sm">{user?.email || "No email linked"}</p>
          </div>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className={`text-sm font-semibold px-3 py-1 rounded-lg ${isEditing ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
            disabled={saving}
          >
            {saving ? "Saving..." : (isEditing ? "Save" : "Edit")}
          </button>
        </div>

        <div className="border-t border-gray-100 pt-6 grid grid-cols-2 gap-y-4">
          <div>
            <p className="text-xs text-gray-400 uppercase font-bold">Member Since</p>
            <p className="text-gray-700 font-medium">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Just now"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-bold">Account Type</p>
            <p className="text-gray-700 font-medium capitalize">
              {user?.provider || "Local/Guest"}
            </p>
          </div>
        </div>
      </div>

      {}
      <h3 className="w-full text-left text-lg font-bold text-gray-800 mb-4">Performance</h3>
      <div className="grid grid-cols-2 gap-4 w-full mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-3xl font-bold text-blue-600 mb-1">{solvedCount}</p>
          <p className="text-sm text-gray-500">Puzzles Solved</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-3xl font-bold text-orange-500 mb-1">{streak}</p>
          <p className="text-sm text-gray-500">Day Streak</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-3xl font-bold text-purple-600 mb-1">{winRate}</p>
          <p className="text-sm text-gray-500">Win Rate</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-3xl font-bold text-green-600 mb-1">{totalPoints}</p>
          <p className="text-sm text-gray-500">Total Score</p>
        </div>
      </div>

      {}
      <button
        onClick={handleLogout}
        className="w-full py-3 text-red-600 font-bold bg-red-50 hover:bg-red-100 rounded-xl transition mb-4"
      >
        Log Out
      </button>

      <p className="text-xs text-gray-400 text-center">
        User ID: {user?.id || "local-guest"}
      </p>
    </div>
  );
};

export default Profile;
