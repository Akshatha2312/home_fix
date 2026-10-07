/**
 * AdminCustomers Component
 * Manages customer accounts, allowing searching and deletion.
 * Supports pagination for large lists.
 */
import React, { useEffect, useState, useCallback } from "react";
import {
  Trash2,
  Search,
  User,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { adminAPI } from "../../services/api";

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchCustomers = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const data = await adminAPI.getCustomers(page, 15);
        if (data.success) {
          setCustomers(data.customers);
          setCurrentPage(data.currentPage);
          setTotalPages(data.totalPages);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchCustomers(1);
  }, [fetchCustomers]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchCustomers(newPage);
    }
  };

  const refreshCustomers = () => {
    fetchCustomers(currentPage);
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await adminAPI.deleteUser(selectedUser._id, "customer");

      // Refresh list
      refreshCustomers();
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert("Failed to delete customer");
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">Loading customers...</div>
    );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#0F2747]">
          Customers Management
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search customers..."
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E] text-slate-800 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                  Contact
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                  Registered
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((customer) => (
                <tr key={customer._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-[#0F766E] font-bold shrink-0">
                      {customer.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {customer.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        ID: {customer._id.slice(-6)}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <p className="truncate">{customer.email}</p>
                    <p className="text-xs text-gray-400">{customer.phone}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeleteClick(customer)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Account"
                      aria-label={`Delete ${customer.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Compact Card View */}
        <div className="block sm:hidden divide-y divide-gray-100">
          {filteredCustomers.map((customer) => (
            <div key={customer._id} className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-[#0F766E] font-bold shrink-0">
                    {customer.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {customer.name}
                    </h3>
                    <p className="text-xs text-gray-400">ID: #{customer._id.slice(-6)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteClick(customer)}
                  className="p-2 text-red-500 bg-red-50 rounded-lg shrink-0"
                  aria-label={`Delete ${customer.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-lg text-xs space-y-1 text-gray-600">
                <p className="truncate"><span className="font-semibold text-gray-700">Email:</span> {customer.email}</p>
                <p><span className="font-semibold text-gray-700">Phone:</span> {customer.phone || "N/A"}</p>
                <p><span className="font-semibold text-gray-700">Joined:</span> {new Date(customer.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No customers found matching "{searchTerm}"
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
                Delete Customer?
              </h3>
              <p className="text-gray-500 mb-6">
                Are you sure you want to permanently delete{" "}
                <strong>{selectedUser?.name}</strong>? This will also remove all
                their bookings and payment history. This action cannot be
                undone.
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
    </div>
  );
};

export default AdminCustomers;
