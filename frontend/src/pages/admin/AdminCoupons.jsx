import { useState, useEffect } from "react";
import { Plus, Tag, Trash2, CheckCircle2, XCircle, Loader, Calendar, Percent, IndianRupee } from "lucide-react";
import toast from "react-hot-toast";
import { couponsAPI } from "../../services/api";

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    discountType: "fixed",
    discountValue: "",
    minBookingAmount: "0",
    maxDiscount: "",
    expiryDate: "",
    usageLimit: "100",
    applicableService: "all",
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await couponsAPI.getAll();
      if (res.success) {
        setCoupons(res.coupons);
      }
    } catch (err) {
      console.error("Failed to load coupons:", err);
      toast.error("Could not fetch coupons");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await couponsAPI.toggleStatus(id);
      if (res.success) {
        setCoupons((prev) =>
          prev.map((c) => (c._id === id ? { ...c, isActive: res.coupon.isActive } : c)),
        );
        toast.success(`Coupon ${res.coupon.isActive ? "activated" : "deactivated"}`);
      }
    } catch (err) {
      console.error("Failed to toggle coupon:", err);
      toast.error(err.message || "Failed to toggle coupon status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      const res = await couponsAPI.delete(id);
      if (res.success) {
        setCoupons((prev) => prev.filter((c) => c._id !== id));
        toast.success("Coupon deleted");
      }
    } catch (err) {
      console.error("Failed to delete coupon:", err);
      toast.error(err.message || "Failed to delete coupon");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.discountValue || !formData.expiryDate) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setCreating(true);
      const res = await couponsAPI.create(formData);
      if (res.success) {
        toast.success("Coupon created successfully!");
        setCoupons([res.coupon, ...coupons]);
        setShowModal(false);
        setFormData({
          code: "",
          discountType: "fixed",
          discountValue: "",
          minBookingAmount: "0",
          maxDiscount: "",
          expiryDate: "",
          usageLimit: "100",
          applicableService: "all",
        });
      }
    } catch (err) {
      console.error("Failed to create coupon:", err);
      toast.error(err.message || "Failed to create coupon");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <span className="text-xs font-bold text-[#0F766E] uppercase tracking-wider bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
            Promotional Engine
          </span>
          <h1 className="text-2xl font-black text-[#0F2747] mt-2 tracking-tight">
            Coupon & Discount Management
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Create and manage promotional discount codes for platform bookings.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-3 bg-[#0F766E] hover:bg-[#0B5F59] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Coupon</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Loader className="w-8 h-8 text-[#0F766E] animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-500">Loading platform coupons...</p>
        </div>
      ) : coupons.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Coupon Code</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4">Min Spend</th>
                  <th className="py-3.5 px-4">Service</th>
                  <th className="py-3.5 px-4">Usage</th>
                  <th className="py-3.5 px-4">Expires</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {coupons.map((coupon) => (
                  <tr key={coupon._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-[#0F766E]" />
                        <span className="font-extrabold text-[#0F2747] font-mono text-sm">
                          {coupon.code}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {coupon.discountType === "percentage" ? (
                        <span className="text-[#0F766E] font-bold">
                          {coupon.discountValue}% OFF {coupon.maxDiscount ? `(Max ₹${coupon.maxDiscount})` : ""}
                        </span>
                      ) : (
                        <span className="text-[#0F766E] font-bold">
                          ₹{coupon.discountValue} FLAT OFF
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">₹{coupon.minBookingAmount || 0}</td>
                    <td className="py-3.5 px-4 capitalize font-bold text-slate-600">
                      {coupon.applicableService}
                    </td>
                    <td className="py-3.5 px-4">
                      {coupon.usedCount} / {coupon.usageLimit}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(coupon.expiryDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(coupon._id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer border ${
                          coupon.isActive
                            ? "bg-emerald-50 text-[#16A34A] border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {coupon.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{coupon.isActive ? "Active" : "Inactive"}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(coupon._id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Tag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-[#0F2747]">No Coupons Created Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Click "Create New Coupon" to set up promo codes for your users.
          </p>
        </div>
      )}

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <h3 className="text-lg font-extrabold text-[#0F2747] mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-[#0F766E]" /> Create Promo Coupon
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Coupon Code *</label>
                <input
                  type="text"
                  placeholder="e.g. HOMEFIX50"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0F766E] outline-none text-xs font-mono font-bold uppercase"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Discount Type</label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0F766E] outline-none text-xs font-semibold"
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  >
                    <option value="fixed">Fixed Amount (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Value *</label>
                  <input
                    type="number"
                    placeholder="e.g. 100 or 15"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0F766E] outline-none text-xs font-semibold"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Min Spend (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0F766E] outline-none text-xs font-semibold"
                    value={formData.minBookingAmount}
                    onChange={(e) => setFormData({ ...formData, minBookingAmount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Max Discount (₹)</label>
                  <input
                    type="number"
                    placeholder="Optional"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0F766E] outline-none text-xs font-semibold"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0F766E] outline-none text-xs font-semibold"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Usage Limit</label>
                  <input
                    type="number"
                    placeholder="100"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0F766E] outline-none text-xs font-semibold"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Applicable Service</label>
                <select
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0F766E] outline-none text-xs font-semibold capitalize"
                  value={formData.applicableService}
                  onChange={(e) => setFormData({ ...formData, applicableService: e.target.value })}
                >
                  <option value="all">All Services</option>
                  <option value="plumber">Plumber</option>
                  <option value="electrician">Electrician</option>
                  <option value="cleaner">Cleaner</option>
                  <option value="painter">Painter</option>
                  <option value="carpenter">Carpenter</option>
                  <option value="mason">Mason</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {creating ? "Creating..." : "Save Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
