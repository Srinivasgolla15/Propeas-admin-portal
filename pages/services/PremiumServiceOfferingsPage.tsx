import React, { useEffect, useState, useCallback } from 'react';
import { ServicePackage } from '../../types';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Check, Star, ArrowRight } from 'lucide-react';

const PremiumServiceOfferingsPage: React.FC = () => {
  const [offerings, setOfferings] = useState<ServicePackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadOfferings = useCallback(async () => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'servicePackages'),
        where('tier', 'in', ['Premium', 'Enterprise']) // Filters only premium tiers
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ServicePackage[];
      setOfferings(data);
    } catch (error) {
      console.error("Failed to fetch premium offerings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOfferings();
  }, [loadOfferings]);

  const OfferingCard: React.FC<{ offering: ServicePackage }> = ({ offering }) => (
    <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col bg-gradient-to-br from-primary/5 via-background to-background dark:from-dark-primary/10 dark:via-dark-card dark:to-dark-card border border-primary/20 dark:border-dark-primary/30">
      {offering.imageUrl && (
        <img 
          src={offering.imageUrl} 
          alt={offering.name}
          className="w-full h-48 object-cover rounded-t-xl"
        />
      )}
      <div className="p-6 flex-grow flex flex-col">
        {offering.highlight && (
            <Badge color="purple" className="self-start mb-2"><Star size={12} className="inline mr-1"/> {offering.highlight}</Badge>
        )}
        <h3 className="text-2xl font-bold text-primary dark:text-dark-primary-foreground mb-2">{offering.name}</h3>
        <p className="text-sm text-foreground/80 dark:text-dark-foreground/80 mb-4 flex-grow min-h-[60px]">{offering.description}</p>
        
        <div className="mb-4">
            <p className="text-3xl font-extrabold text-foreground dark:text-dark-foreground">
                ${offering.price.toLocaleString()}
                <span className="text-sm font-normal text-foreground/70 dark:text-dark-foreground/70">/{offering.billingCycle}</span>
            </p>
        </div>

        <ul className="space-y-2 mb-6 text-sm">
          {offering.features.slice(0, 4).map((feature, index) => (
            <li key={index} className="flex items-center text-foreground/90 dark:text-dark-foreground/90">
              <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
              {feature}
            </li>
          ))}
          {offering.features.length > 4 && <li className="text-xs text-foreground/60 dark:text-dark-foreground/60 ml-6">...and more!</li>}
        </ul>
        
        <div className="mt-auto">
            <Button variant="primary" className="w-full group" onClick={() => alert(`Learn more about ${offering.name}`)}>
                Learn More <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform"/>
            </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500 dark:from-dark-primary-foreground dark:to-sky-400 mb-3">
          Exclusive Premium Offerings
        </h1>
        <p className="text-lg text-foreground/70 dark:text-dark-foreground/70 max-w-2xl mx-auto">
          Unlock advanced features and dedicated support with our top-tier service packages, designed for excellence and growth.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-foreground">Loading premium offerings...</div>
      ) : offerings.length === 0 ? (
        <div className="text-center py-12 text-foreground/70">No premium offerings currently available. Please check back later.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
          {offerings.map((offering) => (
            <OfferingCard key={offering.id} offering={offering} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PremiumServiceOfferingsPage;
