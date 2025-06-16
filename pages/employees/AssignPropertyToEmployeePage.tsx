
// import React, { useEffect, useState, useCallback } from 'react';
// import { Property, User, UserRole } from '../../types';
// import { fetchAllProperties, fetchEmployeesByRole, assignEmployeeToProperty } from '../../services/mockApi';
// import Card from '../../components/ui/Card';
// import Button from '../../components/ui/Button';
// import { AlertTriangle, CheckCircle, Home, UserCheck, Briefcase } from 'lucide-react';

// const AssignPropertyToEmployeePage: React.FC = () => {
//   const [properties, setProperties] = useState<Property[]>([]);
//   const [employees, setEmployees] = useState<User[]>([]); // Operations Team members
  
//   const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
//   const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  
//   const [isLoadingProperties, setIsLoadingProperties] = useState(true);
//   const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
//   const [isSubmitting, setIsSubmitting] = useState(false);
  
//   const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

//   const loadData = useCallback(async () => {
//     setIsLoadingProperties(true);
//     setIsLoadingEmployees(true);
//     setFeedbackMessage(null);
//     try {
//       const [propertiesData, employeesData] = await Promise.all([
//         fetchAllProperties(), // Fetch all, or only unassigned/verified ones
//         fetchEmployeesByRole([UserRole.Operations]) 
//       ]);
//       setProperties(propertiesData.filter(p => p.status === 'Verified')); // Only assign verified properties
//       setEmployees(employeesData);
//     } catch (error) {
//       console.error("Failed to load data:", error);
//       setFeedbackMessage({ type: 'error', message: 'Failed to load properties or employees.' });
//     } finally {
//       setIsLoadingProperties(false);
//       setIsLoadingEmployees(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadData();
//   }, [loadData]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!selectedPropertyId || !selectedEmployeeId) {
//       setFeedbackMessage({ type: 'error', message: 'Please select both a property and an employee.' });
//       return;
//     }
//     setIsSubmitting(true);
//     setFeedbackMessage(null);
//     try {
//       await assignEmployeeToProperty(selectedPropertyId, selectedEmployeeId);
//       const updatedProp = properties.find(p=>p.id === selectedPropertyId)?.address;
//       const assignedEmp = employees.find(emp=>emp.id === selectedEmployeeId)?.name;
//       setFeedbackMessage({ type: 'success', message: `Property "${updatedProp || 'Selected Property'}" successfully assigned to ${assignedEmp || 'selected employee'}!` });
//       loadData(); // Refresh lists
//       setSelectedPropertyId(''); 
//       setSelectedEmployeeId('');
//     } catch (error) {
//       console.error("Failed to assign employee:", error);
//       setFeedbackMessage({ type: 'error', message: (error as Error).message || 'Failed to assign employee.' });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (isLoadingProperties || isLoadingEmployees) {
//     return <div className="p-6 text-center">Loading data...</div>;
//   }

//   return (
//     <div className="space-y-6">
//       <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Assign Property to Employee</h1>
      
//       <Card className="max-w-xl mx-auto">
//         <form onSubmit={handleSubmit} className="space-y-6 p-6">
//           <div>
//             <label htmlFor="property" className="block text-sm font-medium text-foreground/90 dark:text-dark-foreground/90 mb-1">
//               Select Verified Property <Home size={16} className="inline ml-1" />
//             </label>
//             <select
//               id="property"
//               value={selectedPropertyId}
//               onChange={(e) => setSelectedPropertyId(e.target.value)}
//               className="block w-full px-3 py-2 border rounded-md shadow-sm text-sm bg-background dark:bg-dark-card text-foreground dark:text-dark-foreground border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary dark:focus:ring-dark-primary focus:border-primary dark:focus:border-dark-primary"
//               required
//               disabled={isSubmitting}
//             >
//               <option value="" disabled>-- Select a Property --</option>
//               {properties.map(prop => (
//                 <option key={prop.id} value={prop.id}>
//                   {prop.address} (Currently: {employees.find(e => e.id === prop.assignedEmployeeId)?.name || 'Unassigned'})
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <label htmlFor="employee" className="block text-sm font-medium text-foreground/90 dark:text-dark-foreground/90 mb-1">
//               Select Employee (Operations Team) <Briefcase size={16} className="inline ml-1" />
//             </label>
//             <select
//               id="employee"
//               value={selectedEmployeeId}
//               onChange={(e) => setSelectedEmployeeId(e.target.value)}
//               className="block w-full px-3 py-2 border rounded-md shadow-sm text-sm bg-background dark:bg-dark-card text-foreground dark:text-dark-foreground border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary dark:focus:ring-dark-primary focus:border-primary dark:focus:border-dark-primary"
//               required
//               disabled={isSubmitting}
//             >
//               <option value="" disabled>-- Select an Employee --</option>
//               {employees.map(emp => (
//                 <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
//               ))}
//             </select>
//           </div>

//           {feedbackMessage && (
//             <div className={`p-3 rounded-md text-sm flex items-center ${
//               feedbackMessage.type === 'success' 
//                 ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700/50' 
//                 : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700/50'
//             }`}>
//               {feedbackMessage.type === 'success' ? <CheckCircle size={18} className="mr-2" /> : <AlertTriangle size={18} className="mr-2" />}
//               {feedbackMessage.message}
//             </div>
//           )}

//           <Button type="submit" variant="primary" className="w-full" isLoading={isSubmitting} leftIcon={<UserCheck size={18} />}>
//             {isSubmitting ? 'Assigning...' : 'Assign Employee to Property'}
//           </Button>
//         </form>
//       </Card>
//     </div>
//   );
// };

// export default AssignPropertyToEmployeePage;