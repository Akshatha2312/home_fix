/**
 * AdminProviders Component
 * Manages provider accounts, displaying their status and stats.
 * Features real-time availability updates via Socket.io.
 */
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Trash2,
  Search,
  Star,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../context/socket";
import ProviderHealthModal from "../../components/admin/ProviderHealthModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const AdminProviders = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { token } = useAuth();
  const { socket } = useSocket();

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Health Card Modal State
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsProvider, setStatsProvider] = useState(null);

  const fetchProviders = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const { data } = await axios.get(
          `${API_URL}/admin/providers?page=${page}&limit=15`,
          config,
        );
        if (data.success) {
          setProviders(data.providers);
          setCurrentPage(data.currentPage);
          setTotalPages(data.totalPages);
        }
      } catch (error) {
        console.error("Error fetching providers:", error);
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    fetchProviders(1);
  }, [fetchProviders]);

  useEffect(() => {
    if (socket) {
      const handleAvailabilityChange = (data) => {
        setProviders((prev) =>
          prev.map((p) =>
            p._id === data.providerId
              ? { ...p, availability: data.isAvailable }
              : p,
          ),
        );
      };

      socket.on("provider-availability-changed", handleAvailabilityChange);

      return () => {
        socket.off("provider-availability-changed", handleAvailabilityChange);
      };
    }
  }, [socket]);

  const refreshProviders = () => {
    fetchProviders(currentPage);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchProviders(newPage);
    }
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(
        `${API_URL}/admin/users/${selectedUser._id}?type=provider`,
        config,
      );

      refreshProviders();
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error deleting provider:", error);
      alert("Failed to delete provider");
    }
  };

  const handleViewStats = (provider) => {
    setStatsProvider(provider);
    setShowStatsModal(true);
  };

  const filteredProviders = providers
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.serviceType.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) =>
      b.availability === a.availability ? 0 : b.availability ? 1 : -1,
    );

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">Loading providers...</div>
    );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Providers Management
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search providers..."
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                Provider
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                Service
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                Stats
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProviders.map((provider) => (
              <tr key={provider._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                    {provider.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {provider.name}
                    </h3>
                    <p className="text-xs text-gray-500">{provider.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium capitalize">
                    {provider.serviceType}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    {provider.experience} years exp
                  </p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-sm font-medium text-gray-700">
                      {provider.rating}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {provider.totalBookings} bookings
                  </p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {provider.availability ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        Online
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full border border-gray-200">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                        Offline
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => handleViewStats(provider)}
                      className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                      View Health Card
                    </button>
                    <button
                      onClick={() => handleDeleteClick(provider)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProviders.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No providers found matching "{searchTerm}"
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-6 border-t border-gray-100 pt-4">
        <span className="text-sm text-gray-500">
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Delete Provider?
              </h3>
              <p className="text-gray-500 mb-6">
                Are you sure you want to permanently delete{" "}
                <strong>{selectedUser?.name}</strong>? This will also remove all
                their bookings, service history and earnings data.
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Provider Health Stats Modal */}
      <ProviderHealthModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        provider={statsProvider}
      />
    </div>
  );
};

export default AdminProviders;
