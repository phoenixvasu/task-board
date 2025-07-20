import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBoardStore } from "../store/useBoardStore";
import { useSharingStore } from "../store/useSharingStore";
import { useBoardSocket } from "../store/useBoardStore";
import { useAuthStore } from "../store/useAuthStore";
import BoardColumns from "../components/board/BoardColumns";
import ActiveUsers from "../components/collaboration/ActiveUsers";
import ConnectionStatus from "../components/collaboration/ConnectionStatus";
import ShareBoard from "../components/sharing/ShareBoard";
import Button from "../components/ui/Button";
import {
  ChevronLeft,
  SortAsc,
  SortDesc,
  Calendar,
  Share2,
  Lock,
} from "lucide-react";
import Dropdown from "../components/ui/Dropdown";
import { useSearchStore } from "../store/useSearchStore";
import { Priority } from "../types";
import { useActivityFeed } from "../store/useBoardStore";
import { onSocketEvent } from "../api/socket";
import { SOCKET_EVENTS } from "../types/socketEvents";
import toast from "react-hot-toast";

const BoardDetail: React.FC = () => {
  const { boardId } = useParams();
  const { getBoard, fetchBoard, users } = useBoardStore();
  const board = getBoard(boardId!);
  const navigate = useNavigate();
  const [priority, setPriority] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [sort, setSort] = useState<
    "priority" | "dueDate" | "createdAt" | "title"
  >("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const { searchTerm, setPage } = useSearchStore();
  const [showShareModal, setShowShareModal] = useState(false);
  const [isLoadingBoard, setIsLoadingBoard] = useState(false);

  // Sharing integration
  const { boardAccess, checkBoardAccess } = useSharingStore();
  const { currentBoardId } = useBoardStore();
  const { user } = useAuthStore();
  // @ts-ignore: useBoardSocket is injected in useBoardStore
  useBoardSocket(currentBoardId, user?.id);

  const activityFeed = useActivityFeed(currentBoardId || "");

  useEffect(() => {
    setPage("tasks");
  }, [setPage]);

  // Check board access and fetch board if needed
  useEffect(() => {
    if (boardId) {
      const loadBoard = async () => {
        setIsLoadingBoard(true);
        try {
          // Always check board access
          await checkBoardAccess(boardId);
          // Always fetch the board after access is granted
          await fetchBoard(boardId);
        } catch (error) {
          console.error("Failed to load board:", error);
        } finally {
          setIsLoadingBoard(false);
        }
      };
      loadBoard();
    }
  }, [boardId, checkBoardAccess, fetchBoard]);

  useEffect(() => {
    const handleMemberRemoved = (payload: any) => {
      if (payload.boardId === boardId && payload.userId === user?.id) {
        toast.error("You have been removed from this board.");
        navigate("/");
      }
    };
    onSocketEvent(SOCKET_EVENTS.MEMBER_REMOVED, handleMemberRemoved);
    return () => {
      // Optionally: remove listener if your socket abstraction supports it
    };
  }, [boardId, user?.id, navigate]);

  useEffect(() => {
    const handleBoardUpdated = (payload: any) => {
      if (payload.boardId === boardId) {
        fetchBoard(boardId!);
      }
    };
    onSocketEvent(SOCKET_EVENTS.BOARD_UPDATED, handleBoardUpdated);
    return () => {
      // Optionally: remove listener if your socket abstraction supports it
    };
  }, [boardId, fetchBoard]);

  // Early returns for rendering only, after all hooks
  if (boardAccess && !boardAccess.hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Lock size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          You don't have permission to view this board.
        </p>
        <Button variant="primary" onClick={() => navigate("/")}>
          Back to Boards
        </Button>
      </div>
    );
  }

  if (!board && isLoadingBoard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Calendar size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Loading board...</h2>
        <Button variant="primary" onClick={() => navigate("/")}>
          Back to Boards
        </Button>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Calendar size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Board not found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          The board you're looking for doesn't exist or you don't have access to
          it.
        </p>
        <Button variant="primary" onClick={() => navigate("/")}>
          Back to Boards
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-full px-4 py-6 mx-auto dark:bg-darkbg min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<ChevronLeft size={18} />}
            onClick={() => navigate("/")}
          >
            Boards
          </Button>
          <h1 className="text-2xl font-bold dark:text-white">{board.name}</h1>
          {/* Board access indicator */}
          {boardAccess && (
            <span
              className={`px-2 py-1 text-xs font-medium rounded ${
                boardAccess.role === "owner"
                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                  : boardAccess.role === "editor"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
              }`}
            >
              {boardAccess.role}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <ConnectionStatus isConnected={true} />
          <ActiveUsers />

          {/* Share button - only show if user has manage members permission */}
          {boardAccess?.permissions.canManageMembers && (
            <Button
              variant="outline"
              size="sm"
              icon={<Share2 size={16} />}
              onClick={() => setShowShareModal(true)}
            >
              Share
            </Button>
          )}

          {/* Filter controls - only show if user can view */}
          {boardAccess?.permissions.canView && (
            <>
              <Dropdown
                options={[
                  { value: "", label: "All Priorities" },
                  { value: "high", label: "High" },
                  { value: "medium", label: "Medium" },
                  { value: "low", label: "Low" },
                ]}
                value={priority}
                onChange={setPriority}
                placeholder="Priority"
              />
              <Dropdown
                options={[
                  { value: "", label: "All Assignees" },
                  ...users.map((u) => ({ value: u.id, label: u.name })),
                ]}
                value={assignee}
                onChange={setAssignee}
                placeholder="Assignee"
              />
              <Dropdown
                options={[
                  { value: "", label: "All Due Dates" },
                  { value: "overdue", label: "Overdue" },
                  { value: "today", label: "Due Today" },
                  { value: "this-week", label: "This Week" },
                  { value: "this-month", label: "This Month" },
                ]}
                value={dueDate}
                onChange={setDueDate}
                placeholder="Due Date"
              />
              <Dropdown
                options={[
                  { value: "createdAt", label: "Created" },
                  { value: "priority", label: "Priority" },
                  { value: "dueDate", label: "Due Date" },
                  { value: "title", label: "Title" },
                ]}
                value={sort}
                onChange={(val) => setSort(val as any)}
                placeholder="Sort by"
              />
              <Button
                variant="ghost"
                size="sm"
                icon={
                  sortDir === "asc" ? (
                    <SortAsc size={16} />
                  ) : (
                    <SortDesc size={16} />
                  )
                }
                onClick={() =>
                  setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                }
              >
                {sortDir === "asc" ? "Asc" : "Desc"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Permission-based info message */}
      {boardAccess && (
        <div
          className={`mb-4 p-3 rounded-lg border ${
            boardAccess.role === "owner"
              ? "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-700"
              : boardAccess.role === "editor"
              ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700"
              : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
          }`}
        >
          <div
            className={`text-sm ${
              boardAccess.role === "owner"
                ? "text-purple-700 dark:text-purple-300"
                : boardAccess.role === "editor"
                ? "text-blue-700 dark:text-blue-300"
                : "text-gray-700 dark:text-gray-300"
            }`}
          >
            <span className="font-medium">You are a {boardAccess.role}:</span>
            {boardAccess.role === "owner" &&
              " You have full control over this board including managing members and deleting the board."}
            {boardAccess.role === "editor" &&
              " You can view, edit, and organize tasks and columns, but cannot manage members or delete the board."}
            {boardAccess.role === "viewer" &&
              " You can view the board and use filters, but cannot make any changes."}
          </div>
        </div>
      )}

      {/* Board description */}
      {board.description && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-700 dark:text-gray-300">
            {board.description}
          </p>
        </div>
      )}

      {/* Filter status */}
      {(priority || assignee || dueDate || searchTerm) && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
            <span className="font-medium">Active filters:</span>
            {priority && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded text-xs">
                Priority: {priority}
              </span>
            )}
            {assignee && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded text-xs">
                Assignee:{" "}
                {users.find((u) => u.id === assignee)?.name || assignee}
              </span>
            )}
            {dueDate && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded text-xs">
                Due: {dueDate}
              </span>
            )}
            {searchTerm && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded text-xs">
                Search: "{searchTerm}"
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPriority("");
                setAssignee("");
                setDueDate("");
              }}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            >
              Clear all
            </Button>
          </div>
        </div>
      )}

      {/* Sort status */}
      {sort !== "createdAt" && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
            <span className="font-medium">Active sorting:</span>
            <span className="px-2 py-1 bg-green-100 dark:bg-green-800 rounded text-xs">
              {sort === "priority"
                ? "Priority"
                : sort === "dueDate"
                ? "Due Date"
                : sort === "title"
                ? "Title"
                : "Created"}
              ({sortDir === "asc" ? "Ascending" : "Descending"})
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSort("createdAt");
                setSortDir("asc");
              }}
              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
            >
              Reset sort
            </Button>
          </div>
        </div>
      )}

      {/* Columns and Tasks */}
      <BoardColumns
        boardId={boardId!}
        filters={{
          priority: (priority as Priority) || undefined,
          assignedTo: assignee || undefined,
          dueDate:
            (dueDate as "overdue" | "today" | "this-week" | "this-month") ||
            undefined,
        }}
        sortOptions={{
          field: sort,
          direction: sortDir,
        }}
      />

      {/* Activity Feed */}
      <div className="mt-4">
        <h3 className="text-sm font-semibold mb-2">Activity Feed</h3>
        <ul className="text-xs text-gray-500 space-y-1">
          {activityFeed
            .slice(-10)
            .reverse()
            .map((a, i) => (
              <li key={i}>
                {a.timestamp.slice(11, 19)}: {a.activity}
              </li>
            ))}
        </ul>
      </div>

      {/* Share Board Modal */}
      <ShareBoard
        boardId={boardId!}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
};

export default BoardDetail;
