import React from "react";
import { SearchOff } from "@mui/icons-material";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/slices";
import { AdminTableListScreen, useAdminList } from "@/components/common/admin-shell";
import LeaderCard from "./components/LeaderCard";
import { buildLeaderColumns } from "./components/leaderColumns";
import LeaderViewDialog from "./components/LeaderViewDialog";
import LeaderMultiEditDialog from "./components/LeaderMultiEditDialog";
import { useLeaderFilterOptions } from "./hooks";
import type { LeaderProfile } from "./types";
import {
  LEADERS_DEFAULT_SORT,
  LEADERS_FILTER_KEYS,
  LEADERS_LABELS,
  LEADERS_TEST_ID_PREFIX,
} from "./constants";
import { buildLeaderFilterFields, fetchLeadersPage } from "./utils";

export default function LeaderProfilesManager() {
  const loggedName = useSelector((state: RootState) => state.auth.user?.name);

  const list = useAdminList<LeaderProfile>({
    fetcher: fetchLeadersPage,
    defaultFilters: { [LEADERS_FILTER_KEYS.SORT]: LEADERS_DEFAULT_SORT },
    errorMessage: LEADERS_LABELS.LOAD_ERROR,
  });
  const options = useLeaderFilterOptions();
  const fields = React.useMemo(() => buildLeaderFilterFields(options), [options]);

  const [viewing, setViewing] = React.useState<LeaderProfile | null>(null);
  const [editing, setEditing] = React.useState<LeaderProfile | null>(null);

  const columns = React.useMemo(
    () => buildLeaderColumns({ loggedName, onView: setViewing, onEdit: setEditing }),
    [loggedName],
  );

  return (
    <AdminTableListScreen
      testIdPrefix={LEADERS_TEST_ID_PREFIX}
      title={LEADERS_LABELS.TITLE}
      searchLabel={LEADERS_LABELS.SEARCH}
      searchPlaceholder={LEADERS_LABELS.SEARCH_PLACEHOLDER}
      fields={fields}
      list={list}
      emptyMessage={LEADERS_LABELS.EMPTY}
      emptyIcon={<SearchOff sx={{ fontSize: 56, color: "text.disabled" }} />}
      columns={columns}
      rowKey={(leader) => leader.id}
      renderCard={(leader) => (
        <LeaderCard leader={leader} loggedName={loggedName} onView={setViewing} onEdit={setEditing} />
      )}
      overlays={
        <>
          <LeaderViewDialog open={!!viewing} leader={viewing} onClose={() => setViewing(null)} />
          <LeaderMultiEditDialog
            open={!!editing}
            leader={editing}
            onClose={() => setEditing(null)}
            onSuccess={() => {
              list.reload();
              setEditing(null);
            }}
          />
        </>
      }
    />
  );
}
