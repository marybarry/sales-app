import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { DealCard as DealCardType } from "../types";

interface DealCardProps {
  card: DealCardType;
  onEdit: (card: DealCardType) => void;
  onDelete: (card: DealCardType) => void;
  onToggleComplete: (card: DealCardType) => void;
}

const priorityColour: Record<string, "error" | "warning" | "success"> = {
  High: "error",
  Medium: "warning",
  Low: "success",
};

const statusColour: Record<
  string,
  "default" | "primary" | "success" | "warning" | "error"
> = {
  "New Lead": "primary",
  "Awaiting Pricing": "warning",
  "Awaiting KYC": "warning",
  Signed: "success",
  Active: "success",
  Complete: "default",
};

export const DealCard = ({
  card,
  onEdit,
  onDelete,
  onToggleComplete,
}: DealCardProps) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const isComplete = card.status.includes("Complete");

  return (
    <Card
      variant="outlined"
      sx={{
        opacity: isComplete ? 0.6 : 1,
        transition: "opacity 0.2s, box-shadow 0.2s",
        "&:hover": { boxShadow: 3 },
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        {/* Header row */}
        <Stack direction="row" alignItems="flex-start" gap={1} mb={1}>
          <Box flex={1}>
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{ textDecoration: isComplete ? "line-through" : "none" }}
            >
              {card.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {card.customerName}
            </Typography>
          </Box>

          <Chip
            label={card.priority}
            color={priorityColour[card.priority] ?? "default"}
            size="small"
            variant="outlined"
          />

          <Tooltip title={isComplete ? "Mark incomplete" : "Mark complete"}>
            <IconButton size="small" onClick={() => onToggleComplete(card)}>
              {isComplete ? (
                <CheckCircleIcon fontSize="small" color="success" />
              ) : (
                <CheckBoxOutlineBlankIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>

          <Tooltip title="Edit deal">
            <IconButton size="small" onClick={() => onEdit(card)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete deal">
            <IconButton
              aria-label="Delete deal"
              size="small"
              onClick={() => onDelete(card)}
              color="error"
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        <Divider sx={{ my: 1 }} />

        {/* Info rows */}
        <Stack gap={0.75}>
          <Stack direction="row" alignItems="center" gap={1}>
            <EmailOutlinedIcon fontSize="inherit" color="action" />
            <Typography variant="body2" color="text.secondary" noWrap>
              {card.email}
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" gap={1}>
            <ElectricBoltIcon fontSize="inherit" color="action" />
            <Typography variant="body2" color="text.secondary">
              {card.mpans.length} site{card.mpans.length !== 1 ? "s" : ""}
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" gap={1}>
            <CalendarTodayOutlinedIcon fontSize="inherit" color="action" />
            <Typography variant="body2" color="text.secondary">
              {formatDate(card.contractStartDate)} →{" "}
              {formatDate(card.contractEndDate)}
            </Typography>
          </Stack>

          <Typography variant="caption" color="text.disabled">
            Created {formatDate(card.createdDate)}
          </Typography>
        </Stack>

        {/* Status chips */}
        <Stack direction="row" flexWrap="wrap" gap={0.5} mt={1.5}>
          {card.status.map((s) => (
            <Chip
              key={s}
              label={s}
              size="small"
              color={statusColour[s] ?? "default"}
            />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};
