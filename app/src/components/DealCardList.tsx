import AddIcon from "@mui/icons-material/Add";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { DealCard as DealCardType } from "../types";
import { DealCard } from "./DealCard";
import { ConfirmDeleteModal } from "./DeleteModal";
import { EditDeal } from "./EditDeal";

export const DealCardList = () => {
  const [cards, setCards] = useState<DealCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<DealCardType | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<DealCardType | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // FETCH
  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch("/deals");
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error ?? "Failed to load deals");
          return;
        }

        setCards(data.deals);
      } catch (err) {
        setError("Network error — could not load deals");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, []);

  // CREATE
  const handleCreateDeal = async (newCard: Omit<DealCardType, "id">) => {
    try {
      const res = await apiFetch("/deals", {
        method: "POST",
        body: JSON.stringify(newCard),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        console.error("Failed to create deal:", data.error);
        return;
      }
      setCards((prev) => [data.deal, ...prev]);
    } catch (err) {
      console.error("Network error creating deal:", err);
    }
  };

  // EDIT
  const handleEditDeal = async (updated: Omit<DealCardType, "id">) => {
    if (!editingCard) return;
    try {
      const res = await apiFetch(`/deals/${editingCard.id}`, {
        method: "PATCH",
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        console.error("Failed to update deal:", data.error);
        return;
      }
      setCards((prev) =>
        prev.map((c) => (c.id === editingCard.id ? data.deal : c))
      );
      setEditingCard(null);
    } catch (err) {
      console.error("Network error updating deal:", err);
    }
  };

  const openEditModal = (card: DealCardType) => {
    setEditingCard(card);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCard(null);
  };

  // DELETE
  const openDeleteModal = (card: DealCardType) => {
    setDeleteTarget(card);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await apiFetch(`/deals/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        console.error("Failed to delete deal:", data.error);
        return;
      }
      setCards((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error("Network error deleting deal:", err);
    }
  };

  // TOGGLE COMPLETE
  const handleToggleComplete = async (card: DealCardType) => {
    const newStatus = card.status.includes("Complete")
      ? ["Active"]
      : ["Complete"];
    try {
      const res = await apiFetch(`/deals/${card.id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...card, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        console.error("Failed to update deal status:", data.error);
        return;
      }
      setCards((prev) => prev.map((c) => (c.id === card.id ? data.deal : c)));
    } catch (err) {
      console.error("Network error toggling complete:", err);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={2}
        py={8}
      >
        <CircularProgress />
        <Typography color="text.secondary">Loading deals...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Sales Pipeline
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {cards.length} active deal{cards.length !== 1 ? "s" : ""}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingCard(null);
            setIsModalOpen(true);
          }}
        >
          New Deal
        </Button>
      </Stack>

      {/* Empty state */}
      {cards.length === 0 ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={2}
          py={10}
        >
          <Typography color="text.secondary">No deals found</Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingCard(null);
              setIsModalOpen(true);
            }}
          >
            Create Your First Deal
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {cards.map((card) => (
            <Grid container spacing={2} key={card.id}>
              <DealCard
                card={card}
                onEdit={openEditModal}
                onDelete={openDeleteModal}
                onToggleComplete={handleToggleComplete}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <EditDeal
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
    </Box>
  );
};
