import React, { useState } from 'react';
import { useRealtime } from '../../context/RealtimeContext';
import { FileText, Shield, Clock, Search, RefreshCw } from 'lucide-react';

export const AuditLogViewer: React.FC<{ venueId?: string }> = ({ venueId }) => {
  const { auditLogs, refreshAuditLogs } = useRealtime();
  const [filterQuery, setFilterQuery] = useState('');

  const filteredLogs = auditLogs.filter(log => {
    const matchesVenue = !venueId || log.venueId === venueId;
    const matchesQuery = !filterQuery ||
      log.action.toLowerCase().includes(filterQuery.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(filterQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(filterQuery.toLowerCase());
    return matchesVenue && matchesQuery;
  });

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ padding: 8, background: 'rgba(56, 189, 248, 0.15)', borderRadius: 'var(--radius-md)', color: '#38bdf8' }}>
            <FileText size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem' }}>Administrative Audit Trail & Safety Logs</h3>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              Immutable record of all gate toggles, telemetry adjustments, and alert broadcasts.
            </p>
          </div>
        </div>

        <button
          className="btn-secondary"
          style={{ fontSize: '0.74rem', padding: '5px 12px' }}
          onClick={() => refreshAuditLogs()}
        >
          <RefreshCw size={13} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Input */}
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Filter audit logs by action, actor, or keyword..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          style={{ width: '100%', fontSize: '0.8rem' }}
        />
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '8px 10px' }}>TIMESTAMP</th>
              <th style={{ padding: '8px 10px' }}>ACTION</th>
              <th style={{ padding: '8px 10px' }}>ACTOR</th>
              <th style={{ padding: '8px 10px' }}>ROLE</th>
              <th style={{ padding: '8px 10px' }}>DETAILS</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '18px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No audit logs found.
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr
                  key={log.id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-surface)',
                  }}
                >
                  <td style={{ padding: '8px 10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td style={{ padding: '8px 10px', fontWeight: 700, color: '#38bdf8' }}>
                    {log.action}
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-primary)' }}>
                    {log.performedBy}
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ padding: '1px 6px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', fontSize: '0.68rem', fontWeight: 600 }}>
                      {log.role}
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                    {log.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
