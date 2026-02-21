import { SaleCard as SaleCardType } from "../types";

/**
 * todo:
 * - theming
 * - use mui material
 * - show contract start/end in list
 * - colours of tags
 * - completed deal styling
 * - tests from front and back
 * - check validation and error handling
 * - pagination, sorting, search
 * - readmes
 * - edge cases?
 *
 */
interface SaleCardProps {
  card: SaleCardType;
  onEdit: (card: SaleCardType) => void;
  onDelete: (card: SaleCardType) => void; // or just pass id?
  onToggleComplete: (card: SaleCardType) => void;
}

export const SaleCard = ({
  card,
  onEdit,
  onDelete,
  onToggleComplete,
}: SaleCardProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getPriorityClass = (priority: string) => {
    return `priority priority-${priority}`;
  };

  return (
    <div className="sale-card">
      <div className="card-header">
        <h3 className="name">{card.name}</h3>

        <span className={getPriorityClass(card.priority)}>{card.priority}</span>

        {/* Complete icon */}
        <button
          className="complete-btn"
          onClick={() => onToggleComplete(card)}
          title="Mark complete"
        >
          {card.status.includes("Complete") ? "✔️" : "⬜"}
        </button>

        {/* Edit icon */}
        <button
          className="edit-btn"
          onClick={() => onEdit(card)}
          title="Edit deal"
        >
          ✏️
        </button>
      </div>

      {/* Delete icon */}
      <button
        className="delete-btn"
        onClick={() => onDelete(card)}
        title="Delete deal"
      >
        🗑️
      </button>

      <div className="card-body">
        <h6 className="customer-name">{card.customerName}</h6>

        <div className="card-info">
          <span className="label">Contact:</span>
          <span className="value">{card.email}</span>
        </div>

        <div className="card-info">
          <span className="label">MPANs:</span>
          <span className="value">
            {card.mpans.length} site{card.mpans.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="card-info">
          <span className="label">Contract start:</span>
          <span className="value">{formatDate(card.contractStartDate)}</span>
        </div>

        <div className="card-info">
          <span className="label">Contract end:</span>
          <span className="value">{formatDate(card.contractEndDate)}</span>
        </div>

        <div className="card-info">
          <span className="label">Created:</span>
          <span className="value">{formatDate(card.createdDate)}</span>
        </div>

        <div className="card-status">
          {card.status.map((status, index) => (
            <span key={index} className="status-badge">
              {status}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
