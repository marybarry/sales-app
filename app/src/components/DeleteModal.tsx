interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
}

export const ConfirmDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
}: ConfirmDeleteModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content small" onClick={(e) => e.stopPropagation()}>
        <h3>Delete Deal</h3>
        <p>
          Are you sure you want to delete{" "}
          <strong>{itemName ?? "this deal"}</strong>?
        </p>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            name="confirm-delete"
            className="btn-danger"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
