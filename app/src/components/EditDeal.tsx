import { FormEvent, useEffect, useState } from "react";
import { DealCard as DealCardType, Priority, Status } from "../types";

interface EditDealProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (card: Omit<DealCardType, "id">) => void;
  initialData?: DealCardType | null;
}

export const EditDeal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: EditDealProps) => {
  const [formData, setFormData] = useState({
    name: "",
    customerName: "",
    email: "",
    mpans: [] as string[],
    status: [] as Status[],
    priority: "Medium" as Priority,
    contractStartDate: "",
    contractEndDate: "",
  });

  const [error, setError] = useState("");

  const statusOptions: Status[] = [
    "New Lead",
    "Awaiting Pricing",
    "Awaiting KYC",
    "Signed",
    "Active",
    "Complete",
  ];

  // Populate form when editing OR reset when creating new
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setFormData({
        name: initialData.name ?? "",
        customerName: initialData.customerName ?? "",
        email: initialData.email ?? "",
        mpans: initialData.mpans ?? [],
        status: initialData.status ?? [],
        priority: initialData.priority ?? "Medium",
        contractStartDate: initialData.contractStartDate ?? "",
        contractEndDate: initialData.contractEndDate ?? "",
      });
    } else {
      setFormData({
        name: "",
        customerName: "",
        email: "",
        mpans: [],
        status: [],
        priority: "Medium",
        contractStartDate: "",
        contractEndDate: "",
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!formData.customerName.trim()) {
      setError("Customer name is required");
      return;
    }

    if (!formData.email.trim()) {
      setError("Contact email is required");
      return;
    }

    if (formData.mpans.length === 0 || formData.mpans.some((m) => !m.trim())) {
      setError("Please enter at least one valid MPAN");
      return;
    }

    if (formData.status.length === 0) {
      setError("Please select at least one status");
      return;
    }

    const card: Omit<DealCardType, "id"> = {
      name: formData.name.trim(),
      customerName: formData.customerName.trim(),
      email: formData.email.trim(),
      mpans: formData.mpans.map((m) => m.trim()),
      status: formData.status,
      createdDate: initialData?.createdDate ?? new Date().toISOString(),
      priority: formData.priority,
      contractStartDate: formData.contractStartDate,
      contractEndDate: formData.contractEndDate,
    };

    onSubmit(card);
    onClose();
  };

  const handleStatusToggle = (status: Status) => {
    setFormData((prev) => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter((s) => s !== status)
        : [...prev.status, status],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initialData ? "Edit Deal" : "New Deal"}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter name"
            />
          </div>

          {/* Customer Name */}
          <div className="form-group">
            <label htmlFor="customerName">Customer Name *</label>
            <input
              id="customerName"
              type="text"
              value={formData.customerName}
              onChange={(e) =>
                setFormData({ ...formData, customerName: e.target.value })
              }
              placeholder="Enter customer name"
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Contact Email *</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="contact@example.com"
            />
          </div>

          {/* MPANs */}
          <div className="form-group">
            <label>MPANs *</label>

            {formData.mpans.map((mpan, index) => (
              <div key={index} className="mpan-row">
                <input
                  type="text"
                  value={mpan}
                  onChange={(e) => {
                    const updated = [...formData.mpans];
                    updated[index] = e.target.value;
                    setFormData({ ...formData, mpans: updated });
                  }}
                  placeholder="Enter MPAN"
                />

                <button
                  type="button"
                  className="remove-mpan-btn"
                  onClick={() => {
                    const updated = formData.mpans.filter(
                      (_, i) => i !== index
                    );
                    setFormData({ ...formData, mpans: updated });
                  }}
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              type="button"
              className="add-mpan-btn"
              onClick={() =>
                setFormData({ ...formData, mpans: [...formData.mpans, ""] })
              }
            >
              + Add MPAN
            </button>
          </div>

          {/* Status */}
          <div className="form-group">
            <label>Status *</label>
            <div className="checkbox-group">
              {statusOptions.map((status) => (
                <label key={status} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.status.includes(status)}
                    onChange={() => handleStatusToggle(status)}
                  />
                  <span>{status}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="form-group">
            <label htmlFor="priority">Priority *</label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  priority: e.target.value as Priority,
                })
              }
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          {/* Contract Dates */}
          <div className="form-group">
            <label htmlFor="contractStartDate">Contract Start Date</label>
            <input
              id="contractStartDate"
              type="date"
              value={formData.contractStartDate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  contractStartDate: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="contractEndDate">Contract End Date</label>
            <input
              id="contractEndDate"
              type="date"
              value={formData.contractEndDate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  contractEndDate: e.target.value,
                })
              }
            />
          </div>

          {error && <div className="error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {initialData ? "Save Changes" : "Create Deal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
