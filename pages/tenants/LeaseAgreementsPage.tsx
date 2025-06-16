
import React from 'react';
import Card from '../../components/ui/Card';
import { FileSpreadsheet, Construction } from 'lucide-react';

const LeaseAgreementsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileSpreadsheet size={32} className="text-primary dark:text-dark-primary"/>
        <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Lease Agreements</h1>
      </div>
      <Card className="text-center p-10">
        <Construction size={48} className="mx-auto text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold text-foreground dark:text-dark-foreground">Under Construction</h2>
        <p className="text-foreground/70 dark:text-dark-foreground/70 mt-2">
          This page for managing lease agreements is currently under development.
          Features will include listing active leases, uploading lease documents, and tracking renewals.
        </p>
      </Card>
    </div>
  );
};

export default LeaseAgreementsPage;
