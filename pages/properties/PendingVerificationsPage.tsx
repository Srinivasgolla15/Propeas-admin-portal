import React, { useEffect, useState, useCallback } from 'react';
import { Property } from '../../types';
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../../services/firebase';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import {
  CheckCircle,
  XCircle,
  Eye,
  MapPin,
  UploadCloud,
  Search,
} from 'lucide-react';
import Input from '../../components/ui/Input';

const PendingVerificationsPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // 🔥 Load only properties where status === "Pending"
  const loadProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'properties'), where('status', '==', 'Pending'));
      const snapshot = await getDocs(q);
      const data: Property[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Property[];
      setProperties(data);
      setFilteredProperties(data);
    } catch (error) {
      console.error("Failed to fetch pending properties:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = properties.filter(item =>
      item.address.toLowerCase().includes(lowercasedFilter) ||
      item.id.toLowerCase().includes(lowercasedFilter)
    );
    setFilteredProperties(filteredData);
  }, [searchTerm, properties]);

  const handleOpenModal = useCallback((property: Property) => {
    setSelectedProperty(property);
    setVerificationNotes(property.verificationNotes || '');
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedProperty(null);
    setVerificationNotes('');
  }, []);

  // ✅ Update status and notes in Firestore
  const handleVerification = async (propertyId: string, status: 'Verified' | 'Rejected') => {
    if (!selectedProperty) return;
    try {
      const propertyRef = doc(db, 'properties', propertyId);
      await updateDoc(propertyRef, {
        status,
        verificationNotes,
        verifiedBy: 'admin@example.com', // ⛳ You can replace with current user's email
      });
      handleCloseModal();
      loadProperties();
    } catch (error) {
      console.error(`Failed to ${status.toLowerCase()} property:`, error);
      alert(`Error: Could not ${status.toLowerCase()} property.`);
    }
  };

  const PropertyCard: React.FC<{ property: Property }> = ({ property }) => (
    <Card className="shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex flex-col sm:flex-row gap-4">
        <img
          src={property.imageUrl || `https://picsum.photos/seed/${property.id}/200/150`}
          alt={property.address}
          className="w-full sm:w-1/3 h-40 object-cover rounded-lg"
        />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-primary dark:text-primary-foreground">{property.address}</h3>
          <p className="text-sm text-foreground/80 dark:text-dark-foreground/80">ID: {property.id}</p>
          <p className="text-sm text-foreground/70 dark:text-dark-foreground/70">Type: {property.type}</p>
          <p className="text-sm text-foreground/70 dark:text-dark-foreground/70">Submitted: {new Date(property.submittedDate).toLocaleDateString()}</p>
          <div className="mt-3">
            <Badge color="yellow">{property.status}</Badge>
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-secondary dark:border-dark-secondary/50 flex justify-end">
        <Button variant="primary" size="sm" onClick={() => handleOpenModal(property)} leftIcon={<Eye size={16} />}>
          Review Application
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Pending Property Verifications</h1>
        <Input
          type="text"
          placeholder="Search by address or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search />}
          className="w-full sm:w-64"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-foreground">Loading properties...</div>
      ) : filteredProperties.length === 0 ? (
        <div className="text-center py-10 text-foreground/70">No properties pending verification.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}

      {selectedProperty && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={`Verify Property: ${selectedProperty.address}`} size="xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-lg mb-2 text-foreground dark:text-dark-foreground">Property Details</h4>
              <p><strong>ID:</strong> {selectedProperty.id}</p>
              <p><strong>Address:</strong> {selectedProperty.address}</p>
              <p><strong>Type:</strong> {selectedProperty.type}</p>
              <p><strong>Submitted:</strong> {new Date(selectedProperty.submittedDate).toLocaleDateString()}</p>
              {selectedProperty.geoPoint && (
                <p className="flex items-center mt-2">
                  <MapPin size={16} className="mr-2 text-primary dark:text-dark-primary" />
                  Geo-tag: {selectedProperty.geoPoint.lat}, {selectedProperty.geoPoint.lng}
                </p>
              )}

              <h4 className="font-semibold text-lg mt-6 mb-2 text-foreground dark:text-dark-foreground">Uploaded Documents/Images</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(selectedProperty.images || [selectedProperty.imageUrl || `https://picsum.photos/seed/${selectedProperty.id}/400/300`]).map((img, idx) => (
                  <img key={idx} src={img} alt={`Property ${idx + 1}`} className="w-full h-24 object-cover rounded-md border border-secondary dark:border-dark-secondary" />
                ))}
                <div className="w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                  <UploadCloud size={24} />
                  <span className="text-xs mt-1">Upload More</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2 text-foreground dark:text-dark-foreground">Verification Actions</h4>
              <div className="space-y-3">
                <label htmlFor="verificationNotes" className="block text-sm font-medium text-foreground/90 dark:text-dark-foreground/90">
                  Verification Notes & Feedback
                </label>
                <textarea
                  id="verificationNotes"
                  rows={4}
                  className="w-full p-2 border rounded-md bg-background dark:bg-dark-background border-gray-300 dark:border-gray-600 focus:ring-primary dark:focus:ring-dark-primary focus:border-primary dark:focus:border-dark-primary"
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Add notes for approval or rejection..."
                />
              </div>
              <div className="mt-6 flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <Button
                  variant="danger"
                  onClick={() => handleVerification(selectedProperty.id, 'Rejected')}
                  leftIcon={<XCircle size={18} />}
                  className="w-full sm:w-auto"
                >
                  Reject
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleVerification(selectedProperty.id, 'Verified')}
                  leftIcon={<CheckCircle size={18} />}
                  className="w-full sm:w-auto"
                >
                  Approve & Verify
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PendingVerificationsPage;
