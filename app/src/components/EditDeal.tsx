import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { FormEvent, useEffect, useState } from "react";
import { DealCard as DealCardType, Priority, Status } from "../types";

interface EditDealProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (card: Omit<DealCardType, "id">) => void;
  initialData?: DealCardType | null;
}

const statusOptions: Status[] = [
  "New Lead",
  "Awaiting Pricing",
  "Awaiting KYC",
  "Signed",
  "Active",
  "Complete",
];

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

    setError("");
  }, [initialData, isOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) return setError("Name is required");
    if (!formData.customerName.trim())
      return setError("Customer name is required");
    if (!formData.email.trim()) return setError("Contact email is required");
    if (formData.mpans.length === 0 || formData.mpans.some((m) => !m.trim()))
      return setError("Please enter at least one valid MPAN");
    if (formData.status.length === 0)
      return setError("Please select at least one status");

    onSubmit({
      name: formData.name.trim(),
      customerName: formData.customerName.trim(),
      email: formData.email.trim(),
      mpans: formData.mpans.map((m) => m.trim()),
      status: formData.status,
      createdDate: initialData?.createdDate ?? new Date().toISOString(),
      priority: formData.priority,
      contractStartDate: formData.contractStartDate,
      contractEndDate: formData.contractEndDate,
    });

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

  const addMpan = () =>
    setFormData((prev) => ({ ...prev, mpans: [...prev.mpans, ""] }));

  const updateMpan = (index: number, value: string) => {
    const updated = [...formData.mpans];
    updated[index] = value;
    setFormData((prev) => ({ ...prev, mpans: updated }));
  };

  const removeMpan = (index: number) =>
    setFormData((prev) => ({
      ...prev,
      mpans: prev.mpans.filter((_, i) => i !== index),
    }));

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h6" fontWeight={600}>
            {initialData ? "Edit Deal" : "New Deal"}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack gap={2.5}>
            {/* Name */}
            <TextField
              label="Name"
              required
              fullWidth
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter name"
              size="small"
            />

            {/* Customer Name */}
            <TextField
              label="Customer Name"
              required
              fullWidth
              value={formData.customerName}
              onChange={(e) =>
                setFormData({ ...formData, customerName: e.target.value })
              }
              placeholder="Enter customer name"
              size="small"
            />

            {/* Email */}
            <TextField
              label="Contact Email"
              required
              fullWidth
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="contact@example.com"
              size="small"
            />

            {/* MPANs */}
            <Box>
              <FormLabel
                required
                sx={{ display: "block", mb: 1, fontSize: 14 }}
              >
                MPANs
              </FormLabel>
              <Stack gap={1}>
                {formData.mpans.map((mpan, index) => (
                  <Stack
                    key={index}
                    direction="row"
                    gap={1}
                    alignItems="center"
                  >
                    <TextField
                      fullWidth
                      size="small"
                      value={mpan}
                      onChange={(e) => updateMpan(index, e.target.value)}
                      placeholder="Enter MPAN"
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeMpan(index)}
                    >
                      <RemoveCircleOutlineIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
                <Button
                  type="button"
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={addMpan}
                  sx={{ alignSelf: "flex-start" }}
                >
                  Add MPAN
                </Button>
              </Stack>
            </Box>

            {/* Status */}
            <FormControl component="fieldset">
              <FormLabel required sx={{ fontSize: 14, mb: 0.5 }}>
                Status
              </FormLabel>
              <FormGroup row>
                {statusOptions.map((status) => (
                  <FormControlLabel
                    key={status}
                    label={status}
                    control={
                      <Checkbox
                        size="small"
                        checked={formData.status.includes(status)}
                        onChange={() => handleStatusToggle(status)}
                      />
                    }
                  />
                ))}
              </FormGroup>
            </FormControl>

            {/* Priority */}
            <FormControl fullWidth size="small">
              <InputLabel id="priority-label" required>
                Priority
              </InputLabel>

              <Select
                labelId="priority-label"
                id="priority"
                value={formData.priority}
                label="Priority"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: e.target.value as Priority,
                  })
                }
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
              </Select>
            </FormControl>

            {/* Contract Dates */}
            <Stack direction="row" gap={2}>
              <TextField
                label="Contract Start Date"
                type="date"
                fullWidth
                size="small"
                value={formData.contractStartDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contractStartDate: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Contract End Date"
                type="date"
                fullWidth
                size="small"
                value={formData.contractEndDate}
                onChange={(e) =>
                  setFormData({ ...formData, contractEndDate: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" color="inherit" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            {initialData ? "Save Changes" : "Create Deal"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
