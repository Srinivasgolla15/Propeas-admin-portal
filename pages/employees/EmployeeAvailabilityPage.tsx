
import React, { useEffect, useState, useCallback } from 'react';
import { EmployeeSchedule, User, UserRole } from '../../types';
import { fetchEmployeesByRole, fetchEmployeeSchedules, updateEmployeeSchedule, addEmployeeSchedule } from '../../services/mockApi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { CalendarDays, PlusCircle, Edit3, AlertTriangle, CheckCircle } from 'lucide-react';

const EmployeeAvailabilityPage: React.FC = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [schedules, setSchedules] = useState<EmployeeSchedule[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]); // Default to today

  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<EmployeeSchedule | null>(null);
  const [formData, setFormData] = useState<{ availabilityStatus: EmployeeSchedule['availabilityStatus']; notes: string }>({
    availabilityStatus: 'Available', notes: ''
  });
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const loadEmployees = async () => {
      setIsLoadingEmployees(true);
      try {
        // Fetch only Operations Team members as "field employees"
        const empData = await fetchEmployeesByRole([UserRole.Operations]); 
        setEmployees(empData);
        if (empData.length > 0 && !selectedEmployeeId) {
            // setSelectedEmployeeId(empData[0].id); // Optionally auto-select first employee
        }
      } catch (error) {
        console.error("Failed to load employees:", error);
        setFeedbackMessage({ type: 'error', message: 'Failed to load employees.' });
      } finally {
        setIsLoadingEmployees(false);
      }
    };
    loadEmployees();
  }, []);

  const loadSchedules = useCallback(async () => {
    if (!selectedEmployeeId || !selectedDate) {
      setSchedules([]);
      return;
    }
    setIsLoadingSchedules(true);
    setFeedbackMessage(null);
    try {
      const scheduleData = await fetchEmployeeSchedules({ employeeId: selectedEmployeeId, date: selectedDate });
      setSchedules(scheduleData);
    } catch (error) {
      console.error("Failed to load schedules:", error);
      setFeedbackMessage({ type: 'error', message: `Failed to load schedules for ${selectedDate}.` });
    } finally {
      setIsLoadingSchedules(false);
    }
  }, [selectedEmployeeId, selectedDate]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handleOpenModal = (schedule: EmployeeSchedule | null = null) => {
    setEditingSchedule(schedule);
    if (schedule) {
      setFormData({ availabilityStatus: schedule.availabilityStatus, notes: schedule.notes || '' });
    } else {
      // For new schedule for selectedEmployeeId and selectedDate
      setFormData({ availabilityStatus: 'Available', notes: '' });
    }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSchedule(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !selectedDate) {
        setFeedbackMessage({ type: 'error', message: 'Employee and Date must be selected.'});
        return;
    }
    setIsLoadingSchedules(true); // Indicate processing
    try {
      if (editingSchedule) {
        await updateEmployeeSchedule(editingSchedule.id, formData);
        setFeedbackMessage({ type: 'success', message: 'Schedule updated successfully!' });
      } else {
        const employee = employees.find(emp => emp.id === selectedEmployeeId);
        if (!employee) throw new Error("Selected employee not found");
        await addEmployeeSchedule({ 
            employeeId: selectedEmployeeId, 
            employeeName: employee.name,
            date: selectedDate, 
            ...formData 
        });
        setFeedbackMessage({ type: 'success', message: 'New schedule added successfully!' });
      }
      loadSchedules();
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save schedule:", error);
      setFeedbackMessage({ type: 'error', message: (error as Error).message || 'Failed to save schedule.' });
    } finally {
        // setIsLoadingSchedules(false); // Handled by loadSchedules
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Employee Availability</h1>
      
      <Card>
        <div className="p-4 border-b border-secondary dark:border-dark-secondary/50 flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-grow">
            <label htmlFor="employee" className="block text-sm font-medium text-foreground/90 dark:text-dark-foreground/90 mb-1">Select Field Employee (Operations)</label>
            <select
              id="employee"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="block w-full sm:w-72 px-3 py-2 border rounded-md shadow-sm text-sm bg-background dark:bg-dark-card text-foreground dark:text-dark-foreground border-gray-300 dark:border-gray-600"
              disabled={isLoadingEmployees}
            >
              <option value="" disabled>-- Select an Employee --</option>
              {employees.map(emp => (<option key={emp.id} value={emp.id}>{emp.name}</option>))}
            </select>
          </div>
          <div className="flex-grow">
            <Input label="Select Date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>
          <Button 
            variant="primary" 
            onClick={() => handleOpenModal()} 
            leftIcon={<PlusCircle size={18}/>}
            disabled={!selectedEmployeeId || !selectedDate || schedules.length > 0} // Disable if schedule already exists for day to encourage editing
            title={schedules.length > 0 ? "Edit existing schedule below or choose another day" : "Add Schedule for this Day"}
            >
            Set Day Schedule
          </Button>
        </div>

        {feedbackMessage && (
            <div className={`p-3 m-4 rounded-md text-sm flex items-center ${
              feedbackMessage.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700/50' 
                : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700/50'
            }`}>
              {feedbackMessage.type === 'success' ? <CheckCircle size={18} className="mr-2" /> : <AlertTriangle size={18} className="mr-2" />}
              {feedbackMessage.message}
            </div>
        )}

        {isLoadingSchedules && <p className="p-4 text-center">Loading schedules...</p>}
        {!isLoadingSchedules && selectedEmployeeId && selectedDate && (
          <div className="p-4">
            {schedules.length > 0 ? schedules.map(schedule => (
              <Card key={schedule.id} title={`Schedule for ${schedule.employeeName} on ${new Date(schedule.date + 'T00:00:00').toLocaleDateString()}`} className="mb-4">
                <p><strong>Status:</strong> <span className={`font-semibold ${schedule.availabilityStatus === 'Available' ? 'text-green-600' : schedule.availabilityStatus === 'Unavailable' ? 'text-red-600' : 'text-yellow-600'}`}>{schedule.availabilityStatus}</span></p>
                {schedule.notes && <p><strong>Notes:</strong> {schedule.notes}</p>}
                {/* Add time slot display here if implemented */}
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" leftIcon={<Edit3 size={14}/>} onClick={() => handleOpenModal(schedule)}>Edit Schedule</Button>
                </div>
              </Card>
            )) : (
              <p className="text-center text-foreground/70 dark:text-dark-foreground/70 py-4">No schedule set for this day. Click "Set Day Schedule" to add one.</p>
            )}
          </div>
        )}
        {!selectedEmployeeId && !selectedDate && <p className="p-6 text-center text-foreground/70 dark:text-dark-foreground/70">Select an employee and a date to view or manage availability.</p>}
      </Card>

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingSchedule ? "Edit Schedule" : "Set Schedule for Day"} size="md">
          <form onSubmit={handleSubmitSchedule} className="space-y-4">
            <div>
              <label htmlFor="availabilityStatus" className="block text-sm font-medium text-foreground/90 dark:text-dark-foreground/90 mb-1">Availability Status</label>
              <select
                id="availabilityStatus"
                name="availabilityStatus"
                value={formData.availabilityStatus}
                onChange={handleFormChange}
                className="block w-full px-3 py-2 border rounded-md shadow-sm text-sm bg-background dark:bg-dark-card text-foreground dark:text-dark-foreground border-gray-300 dark:border-gray-600"
              >
                <option value="Available">Available</option>
                <option value="Unavailable">Unavailable</option>
                <option value="Partially Available">Partially Available</option>
              </select>
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-foreground/90 dark:text-dark-foreground/90 mb-1">Notes (Optional)</label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleFormChange}
                className="w-full p-2 border rounded-md bg-background dark:bg-dark-card text-foreground dark:text-dark-foreground border-gray-300 dark:border-gray-600"
                placeholder="e.g., Available AM only, Team Meeting PM"
              />
            </div>
            {/* Add time slot inputs here if implementing granular slots */}
            <div className="mt-6 flex justify-end space-x-3">
              <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isLoadingSchedules} leftIcon={<CalendarDays size={16}/>}>
                {editingSchedule ? 'Save Changes' : 'Set Schedule'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default EmployeeAvailabilityPage;