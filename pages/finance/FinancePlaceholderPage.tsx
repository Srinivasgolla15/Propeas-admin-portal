import React from 'react';
import Card from '../../components/ui/Card';
import { Wrench, ShieldAlert, Info } from 'lucide-react'; // Using Wrench for "under development"

const FinancePlaceholderPage: React.FC = () => {
  return (
    <div className="p-4 sm:p-6">
        <Card className="max-w-2xl mx-auto shadow-xl">
            <div className="p-6 sm:p-8 text-center">
                <Wrench size={56} className="mx-auto text-primary dark:text-dark-primary mb-5 opacity-80" />
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground dark:text-dark-foreground mb-3">
                    Finance Module Coming Soon!
                </h1>
                <p className="text-md text-foreground/80 dark:text-dark-foreground/80 mb-6">
                    Our dedicated Finance Dashboard is currently under active development and will be launched shortly.
                    We appreciate your patience!
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-lg text-sm flex items-start space-x-3" role="alert">
                    <Info size={20} className="flex-shrink-0 mt-0.5"/>
                    <span>
                        In the meantime, for any urgent payment verification tasks or billing inquiries, please contact the <strong>Admin team</strong>. They are equipped to handle these requests.
                    </span>
                </div>
                <p className="mt-8 text-xs text-foreground/60 dark:text-dark-foreground/60">
                    Thank you for your understanding.
                </p>
            </div>
        </Card>
    </div>
  );
};

export default FinancePlaceholderPage;
