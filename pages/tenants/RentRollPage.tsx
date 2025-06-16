
import React from 'react';
import Card from '../../components/ui/Card';
import { Banknote, Construction } from 'lucide-react';

const RentRollPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Banknote size={32} className="text-primary dark:text-dark-primary"/>
        <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Rent Roll</h1>
      </div>
      <Card className="text-center p-10">
        <Construction size={48} className="mx-auto text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold text-foreground dark:text-dark-foreground">Under Construction</h2>
        <p className="text-foreground/70 dark:text-dark-foreground/70 mt-2">
          The Rent Roll page is currently under development.
          This section will provide a comprehensive overview of tenant rent payments, statuses, and history.
        </p>
      </Card>
    </div>
  );
};

export default RentRollPage;
