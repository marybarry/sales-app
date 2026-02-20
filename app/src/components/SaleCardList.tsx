import { useEffect, useState } from "react";
import { SaleCard as SaleCardType } from "../types";
import { ConfirmDeleteModal } from "./DeleteModal";
import { NewDealModal } from "./NewDeal";
import { SaleCard } from "./SaleCard";

// Mock data - replace this with API call later
const mockSaleCards: SaleCardType[] = [
  {
    id: "1",
    name: "Acme Corp",
    customerName: "John",
    email: "john@acme.com",
    mpans: ["234"],
    status: ["New Lead", "Awaiting Pricing"],
    createdDate: "2024-02-15",
    priority: "High",
    contractStartDate: "",
    contractEndDate: "",
  },
  {
    id: "2",
    name: "Tech Solutions Ltd",
    customerName: "Sarah",
    email: "sarah@techsolutions.com",
    mpans: ["12345", "5432"],
    status: ["Awaiting KYC"],
    createdDate: "2024-02-10",
    priority: "Medium",
    contractStartDate: "",
    contractEndDate: "",
  },
  {
    id: "3",
    name: "Green Energy Co",
    customerName: "Mike",
    email: "mike@greenenergy.com",
    mpans: ["6789", "09876", "1234"],
    status: ["Signed"],
    createdDate: "2024-02-01",
    priority: "Low",
    contractStartDate: "",
    contractEndDate: "",
  },
];

export const SaleCardList = () => {
  const [cards, setCards] = useState<SaleCardType[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<SaleCardType | null>(null);

  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true);

      await new Promise((resolve) => setTimeout(resolve, 500));
      setCards(mockSaleCards);

      setLoading(false);
    };

    fetchCards();
  }, []);

  // CREATE
  const handleCreateDeal = (newCard: Omit<SaleCardType, "id">) => {
    const id = Date.now().toString();
    const cardWithId: SaleCardType = { ...newCard, id };

    setCards((prev) => [cardWithId, ...prev]);
  };

  // EDIT
  const handleEditDeal = (updated: Omit<SaleCardType, "id">) => {
    if (!editingCard) return;

    const updatedCard: SaleCardType = { ...updated, id: editingCard.id };

    setCards((prev) =>
      prev.map((c) => (c.id === editingCard.id ? updatedCard : c))
    );

    setEditingCard(null);
  };

  const openEditModal = (card: SaleCardType) => {
    setEditingCard(card);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCard(null);
  };

  // DELETE

  const [deleteTarget, setDeleteTarget] = useState<SaleCardType | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const openDeleteModal = (card: SaleCardType) => {
    setDeleteTarget(card);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    setCards((prev) => prev.filter((c) => c.id !== deleteTarget.id));

    setDeleteTarget(null);
    setIsDeleteModalOpen(false);
  };

  // TOGGLE COMPLETE
  const handleToggleComplete = (card: SaleCardType) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === card.id
          ? {
              ...c,
              status: c.status.includes("Complete") ? ["Active"] : ["Complete"],
            }
          : c
      )
    );
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading sales cards...</p>
      </div>
    );
  }

  return (
    <div className="sales-cards-container">
      <div className="cards-header">
        <div>
          <h2>Sales Pipeline</h2>
          <p className="card-count">
            {cards.length} active deal{cards.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          className="btn-new-deal"
          onClick={() => {
            setEditingCard(null);
            setIsModalOpen(true);
          }}
        >
          + New Deal
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="empty-state">
          <p>No sales cards found</p>
          <button
            className="btn-primary"
            onClick={() => {
              setEditingCard(null);
              setIsModalOpen(true);
            }}
          >
            Create Your First Deal
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {cards.map((card) => (
            <SaleCard
              key={card.id}
              card={card}
              onEdit={openEditModal}
              onDelete={openDeleteModal}
              onToggleComplete={handleToggleComplete}
            />
          ))}
        </div>
      )}

      <NewDealModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={editingCard ? handleEditDeal : handleCreateDeal}
        initialData={editingCard}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={deleteTarget?.name}
      />
    </div>
  );
};
