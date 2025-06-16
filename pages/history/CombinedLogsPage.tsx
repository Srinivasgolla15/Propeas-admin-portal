import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { db } from '../../services/firebase';
import { AuditLogEntry, AssignmentLog, TableColumn, User, UserRole } from '../../types';

// UI Components
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import { Search, Info, History, Download, XCircle } from 'lucide-react';

// Types
interface UnifiedLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole?: string;
  actoremail?: string; // Added email field
  action: string;
  description: string;
  targetInfo?: string;
  details?: Record<string, any> | AssignmentLog | AuditLogEntry;
  source: 'Platform Audit' | 'Assignment Log';
}

// Constants
const LOGS_PER_PAGE = 10;
const SOURCE_FILTERS = ['All', 'Platform Audit', 'Assignment Log'] as const;

// Utility Functions
const transformAuditLog = (log: AuditLogEntry, userEmailMap: Map<string, string>): UnifiedLogEntry => {
  let timestamp: string;
  try {
    timestamp = typeof log.timestamp === 'string'
      ? log.timestamp
      : log.timestamp?.toDate?.().toISOString() ?? new Date().toISOString();
  } catch {
    timestamp = new Date().toISOString();
  }
  return {
    id: log.id,
    timestamp,
    actorName: log.actorUserName || 'Unknown',
    actorRole: log.actorUserRole,
    actoremail: log.actorUserId ? userEmailMap.get(log.actorUserId) ?? 'N/A' : 'N/A', // Add email
    action: log.actionType || 'Unknown',
    description: log.actionDescription || 'No description provided',
    targetInfo: log.targetEntityType
      ? `${log.targetEntityType}: ${log.targetEntityDescription || log.targetEntityId || 'N/A'}`
      : undefined,
    details: log,
    source: 'Platform Audit',
  };
};

const transformAssignmentLog = (log: AssignmentLog, userEmailMap: Map<string, string>): UnifiedLogEntry => {
  let timestamp: string;
  try {
    timestamp = typeof log.timestamp === 'string'
      ? log.timestamp
      : log.timestamp?.toDate?.().toISOString() ?? new Date().toISOString();
  } catch {
    timestamp = new Date().toISOString();
  }
  return {
    id: log.id,
    timestamp,
    actorName: log.assignerName || 'Unknown',
    actoremail: log.assignerId ? userEmailMap.get(log.assignerId) ?? 'N/A' : 'N/A', // Add email
    action: log.action || 'Unknown',
    description: `${log.action} ${log.targetType} "${log.targetDescription}" ${
      log.action === 'Assigned' ? `to ${log.assigneeName}` : ''
    }. Notes: ${log.notes || 'N/A'}`,
    targetInfo: `${log.targetType}: ${log.targetDescription}`,
    details: log,
    source: 'Assignment Log',
  };
};

const exportToCSV = (logs: UnifiedLogEntry[], filename: string) => {
  const headers = ['Timestamp', 'Actor', 'Email', 'Role', 'Action', 'Description', 'Target', 'Source']; // Added Email
  const rows = logs.map(log => [
    new Date(log.timestamp).toLocaleString(),
    log.actorName,
    log.actoremail || 'N/A', // Include email
    log.actorRole || 'N/A',
    log.action,
    log.description.replace(/"/g, '""'), // Escape quotes
    log.targetInfo || 'N/A',
    log.source,
  ]);
  const csv = [headers, ...rows].map(row => row.map(val => `"${val}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Main Component
const CombinedLogsPage: React.FC = () => {
  // State
  const [unifiedLogs, setUnifiedLogs] = useState<UnifiedLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<UnifiedLogEntry[]>([]);
  const [platformUsers, setPlatformUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actorFilter, setActorFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState<'All' | 'Platform Audit' | 'Assignment Log'>('All');
  const [selectedLogEntry, setSelectedLogEntry] = useState<UnifiedLogEntry | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Data Fetching
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [auditSnap, assignmentSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, 'platformAuditLogs')),
        getDocs(collection(db, 'assignments')),
        getDocs(collection(db, 'users')),
      ]);
      const auditLogs: AuditLogEntry[] = auditSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLogEntry));
      const assignmentLogs: AssignmentLog[] = assignmentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AssignmentLog));
      const users: User[] = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      
      // Create user ID to email map
      const userEmailMap = new Map<string, string>(users.map(user => [user.id, user.email ?? 'N/A']));
      
      const combined = [
        ...auditLogs.map(log => transformAuditLog(log, userEmailMap)),
        ...assignmentLogs.map(log => transformAssignmentLog(log, userEmailMap)),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setUnifiedLogs(combined);
      setFilteredLogs(combined);
      setPlatformUsers(users.filter(u => Object.values(UserRole).includes(u.role)));
    } catch (error) {
      console.error('Failed to load logs or users:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtering Logic
  useEffect(() => {
    let result = unifiedLogs;
    if (sourceFilter !== 'All') {
      result = result.filter(log => log.source === sourceFilter);
    }
    if (dateFrom) {
      result = result.filter(log => new Date(log.timestamp) >= new Date(dateFrom));
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(log => new Date(log.timestamp) <= toDate);
    }
    if (actorFilter !== 'All') {
      const user = platformUsers.find(u => u.id === actorFilter);
      if (user) {
        result = result.filter(log => log.actorName === user.name);
      }
    }
    if (actionFilter !== 'All') {
      result = result.filter(log => log.action === actionFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(log =>
        log.actorName.toLowerCase().includes(term) ||
        (log.actorRole?.toLowerCase().includes(term)) ||
        (log.actoremail?.toLowerCase().includes(term)) || // Add email to search
        log.action.toLowerCase().includes(term) ||
        log.description.toLowerCase().includes(term) ||
        (log.targetInfo?.toLowerCase().includes(term)) ||
        (JSON.stringify(log.details || {}).toLowerCase().includes(term))
      );
    }
    setFilteredLogs(result);
    setCurrentPage(1);
  }, [searchTerm, dateFrom, dateTo, actorFilter, actionFilter, sourceFilter, unifiedLogs, platformUsers]);

  // Derived Data
  const distinctActors = useMemo(() => [
    { id: 'All', name: 'All' },
    ...platformUsers.map(user => ({ id: user.id, name: user.name })),
  ], [platformUsers]);

  const distinctActions = useMemo(() => [
    'All',
    ...Array.from(new Set(unifiedLogs.map(log => log.action))),
  ], [unifiedLogs]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * LOGS_PER_PAGE;
    return filteredLogs.slice(start, start + LOGS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);

  // Handlers
  const handleViewDetails = useCallback((log: UnifiedLogEntry) => {
    setSelectedLogEntry(log);
    setIsDetailsModalOpen(true);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setActorFilter('All');
    setActionFilter('All');
    setSourceFilter('All');
    setCurrentPage(1);
  }, []);

  const highlightSearchTerm = useCallback((text: string) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return <span dangerouslySetInnerHTML={{ __html: text.replace(regex, '<mark>$1</mark>') }} />;
  }, [searchTerm]);

  // Table Columns
  const columns: TableColumn<UnifiedLogEntry>[] = [
    {
      key: 'timestamp',
      header: 'When',
      render: (log) => formatDistanceToNow(new Date(log.timestamp), { addSuffix: true }),
    },
    {
      key: 'actorName',
      header: 'User',
      render: (log) => (
        <div>
          <span className="font-medium">{highlightSearchTerm(log.actorName)}</span>
          {log.actorRole && <Badge color="gray" className="ml-2">{log.actorRole}</Badge>}
          {log.actoremail && (
            <div className="text-xs text-muted-foreground">{highlightSearchTerm(log.actoremail)}</div>
          )}
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (log) => <Badge color="blue">{highlightSearchTerm(log.action)}</Badge>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (log) => <span>{highlightSearchTerm(log.description)}</span>,
    },
    {
      key: 'targetInfo',
      header: 'Target',
      render: (log) => <span>{highlightSearchTerm(log.targetInfo || 'N/A')}</span>,
    },
    {
      key: 'source',
      header: 'Source',
      render: (log) => <Badge>{log.source}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (log) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewDetails(log)}
          aria-label={`View details for log ${log.id}`}
        >
          <Info size={16} />
        </Button>
      ),
    },
  ];

  // Render
  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <History size={32} className="text-primary" />
        <h1 className="text-3xl font-bold">Log History</h1>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4 border-b grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-end">
          <Input
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search />}
            label="Search"
            className="col-span-full"
            aria-label="Search logs"
          />
          <Input
            label="Date From"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            aria-label="Filter by start date"
          />
          <Input
            label="Date To"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            aria-label="Filter by end date"
          />
          <Select
            label="Source"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)}
            options={SOURCE_FILTERS.map(value => ({ label: value, value }))}
            aria-label="Filter by log source"
          />
          <Select
            label="Actor"
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            options={distinctActors.map(actor => ({ label: actor.name, value: actor.id }))}
            aria-label="Filter by actor"
          />
          <Select
            label="Action"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            options={distinctActions.map(action => ({ label: action, value: action }))}
            aria-label="Filter by action"
          />
          <div className="flex gap-2 col-span-full">
            <Button onClick={() => exportToCSV(filteredLogs, 'audit_logs.csv')} aria-label="Export logs as CSV">
              <Download size={16} className="mr-1" /> Export CSV
            </Button>
            <Button variant="outline" onClick={clearFilters} aria-label="Clear all filters">
              <XCircle size={16} className="mr-1" /> Clear Filters
            </Button>
          </div>
        </div>

        {/* Table */}
        <Table<UnifiedLogEntry>
          columns={columns}
          data={paginatedLogs}
          isLoading={isLoading}
          emptyStateMessage="No logs found matching your filters."
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between px-4 py-3 text-sm text-muted-foreground">
            <span>
              Showing {(currentPage - 1) * LOGS_PER_PAGE + 1}–
              {Math.min(currentPage * LOGS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length}
            </span>
            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                aria-label="Previous page"
              >
                Prev
              </Button>
              <span>Page {currentPage} of {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                aria-label="Next page"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Details Modal */}
      {selectedLogEntry && isDetailsModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Log Details (ID: ${selectedLogEntry.id.slice(0, 8)}...)`}
          size="lg"
        >
          <div className="space-y-2 text-sm">
            <p><strong>Timestamp:</strong> {new Date(selectedLogEntry.timestamp).toLocaleString()}</p>
            <p>
              <strong>Actor:</strong> {selectedLogEntry.actorName}{' '}
              {selectedLogEntry.actorRole ? `(${selectedLogEntry.actorRole})` : ''}
            </p>
            <p><strong>Email:</strong> {selectedLogEntry.actoremail || 'N/A'}</p> {/* Add email */}
            <p><strong>Action:</strong> {selectedLogEntry.action}</p>
            <p><strong>Description:</strong> {selectedLogEntry.description}</p>
            <p><strong>Target:</strong> {selectedLogEntry.targetInfo || 'N/A'}</p>
            <p><strong>Source:</strong> {selectedLogEntry.source}</p>
            <div>
              <strong>Raw Details:</strong>
              <pre className="mt-1 p-2 bg-secondary rounded-md text-xs max-h-60 overflow-auto">
                {JSON.stringify(selectedLogEntry.details, null, 2)}
              </pre>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={() => setIsDetailsModalOpen(false)} aria-label="Close details modal">
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CombinedLogsPage;