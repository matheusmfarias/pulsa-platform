export {
  CLIENT_STATUS_LABELS,
  clientStatusSchema,
  type Client,
  type ClientStatus,
} from "./domain/client";
export { formatDocumentNumber } from "./domain/document-number";
export { ClientForm } from "./components/client-form";
export { ClientStatusAction } from "./components/client-status-action";
export { ClientStatusBadge } from "./components/client-status-badge";
export { ClientFilterBar, hasActiveClientFilters } from "./components/client-filter-bar";
export { ClientTable } from "./components/client-table";
export {
  clientIdSchema,
  clientInputSchema,
  clientListFiltersSchema,
  type ClientInput,
  type ClientListFilters,
} from "./schemas/client-schemas";
export { activateClient, deactivateClient } from "./services/change-client-status";
export { createClient } from "./services/create-client";
export { getClientById } from "./services/get-client-by-id";
export { listClients } from "./services/list-clients";
export { updateClient } from "./services/update-client";
