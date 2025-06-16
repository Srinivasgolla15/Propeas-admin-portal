
import React, { useEffect, useState, useCallback } from 'react';
import { AppSetting, TableColumn } from '../../types';
import { fetchAppSettings, updateAppSetting } from '../../services/mockApi';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { Edit3, Save, AlertTriangle, CheckCircle, Settings } from 'lucide-react';

const AppConfigurationsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<AppSetting | null>(null);
  const [currentValue, setCurrentValue] = useState<any>('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setFeedbackMessage(null);
    try {
      const data = await fetchAppSettings();
      setSettings(data);
    } catch (error) {
      console.error("Failed to fetch app settings:", error);
      setFeedbackMessage({ type: 'error', message: 'Failed to load app settings.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleOpenModal = (setting: AppSetting) => {
    if (!setting.isEditable) {
        setFeedbackMessage({type: 'error', message: `Setting "${setting.key}" is not editable.`});
        return;
    }
    setEditingSetting(setting);
    setCurrentValue(setting.value);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSetting(null);
    // setFeedbackMessage(null); // Keep feedback from save action visible
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { // Added HTMLTextAreaElement
    if (!editingSetting) return;
    const { value, type } = e.target;
    if (editingSetting.type === 'boolean' && type === 'checkbox') {
        setCurrentValue((e.target as HTMLInputElement).checked);
    } else if (editingSetting.type === 'number') {
        setCurrentValue(parseFloat(value));
    }
    else {
        setCurrentValue(value);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSetting) return;
    setIsLoading(true); // Indicate processing in modal
    try {
      let valueToSave = currentValue;
      if (editingSetting.type === 'json') {
        try {
          valueToSave = JSON.parse(currentValue);
        } catch (jsonError) {
          setFeedbackMessage({type: 'error', message: 'Invalid JSON format for setting value.'});
          setIsLoading(false);
          return;
        }
      }
      await updateAppSetting(editingSetting.id, valueToSave);
      setFeedbackMessage({ type: 'success', message: `Setting "${editingSetting.key}" updated successfully!` });
      loadSettings();
      handleCloseModal();
    } catch (error) {
      console.error("Failed to update setting:", error);
      setFeedbackMessage({ type: 'error', message: (error as Error).message || 'Failed to update setting.' });
    } finally {
      // setIsLoading(false); // Let loadSettings handle global isLoading
    }
  };

  const renderValue = (setting: AppSetting) => {
    if (setting.type === 'boolean') {
      return setting.value ? 
        <span className="text-green-600 dark:text-green-400 font-semibold">Enabled</span> : 
        <span className="text-red-600 dark:text-red-400 font-semibold">Disabled</span>;
    }
    if (typeof setting.value === 'object') {
        return <pre className="text-xs bg-secondary dark:bg-dark-secondary/30 p-1 rounded whitespace-pre-wrap">{JSON.stringify(setting.value, null, 2)}</pre>;
    }
    return String(setting.value);
  };

  const columns: TableColumn<AppSetting>[] = [
    { key: 'key', header: 'Setting Key', render: s => <span className="font-medium text-foreground dark:text-dark-foreground">{s.key}</span> },
    { key: 'description', header: 'Description', render: s => <span className="text-sm text-foreground/80 dark:text-dark-foreground/80">{s.description}</span> },
    { key: 'value', header: 'Current Value', render: renderValue },
    { key: 'type', header: 'Type', render: s => <span className="text-xs uppercase font-mono">{s.type}</span> },
    {
      key: 'actions',
      header: 'Actions',
      render: (setting) => (
        setting.isEditable ? (
            <Button variant="ghost" size="sm" onClick={() => handleOpenModal(setting)} title="Edit Setting">
                <Edit3 size={16} />
            </Button>
        ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500 italic">Not Editable</span>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings size={32} className="text-primary dark:text-dark-primary"/>
        <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Application Configurations</h1>
      </div>
      {feedbackMessage && (
        <div className={`p-3 my-2 rounded-md text-sm flex items-center ${
          feedbackMessage.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700/50' 
            : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700/50'
        }`}>
          {feedbackMessage.type === 'success' ? <CheckCircle size={18} className="mr-2" /> : <AlertTriangle size={18} className="mr-2" />}
          {feedbackMessage.message}
        </div>
      )}
      <Card>
        <Table<AppSetting>
          columns={columns}
          data={settings}
          isLoading={isLoading}
          emptyStateMessage="No application settings found or loaded."
        />
      </Card>

      {editingSetting && isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={`Edit Setting: ${editingSetting.key}`} size="md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-foreground/70 dark:text-dark-foreground/70">{editingSetting.description}</p>
            {editingSetting.type === 'string' && (
              <Input label="Value" name="value" type="text" value={currentValue} onChange={handleValueChange} />
            )}
            {editingSetting.type === 'number' && (
              <Input label="Value" name="value" type="number" value={currentValue} onChange={handleValueChange} step="any" />
            )}
            {editingSetting.type === 'boolean' && (
              <div className="flex items-center">
                <input type="checkbox" id="value" name="value" checked={Boolean(currentValue)} onChange={handleValueChange} className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"/>
                <label htmlFor="value" className="ml-2 block text-sm text-foreground/90 dark:text-dark-foreground/90">Enabled</label>
              </div>
            )}
            {editingSetting.type === 'json' && (
                 <div>
                    <label htmlFor="jsonValue" className="block text-sm font-medium text-foreground/90 dark:text-dark-foreground/90 mb-1">Value (JSON)</label>
                    <textarea id="jsonValue" name="value" rows={5} value={typeof currentValue === 'string' ? currentValue : JSON.stringify(currentValue, null, 2)} 
                    onChange={handleValueChange}
                    className="w-full p-2 border rounded-md bg-background dark:bg-dark-card text-foreground dark:text-dark-foreground border-gray-300 dark:border-gray-600 font-mono text-xs" />
                 </div>
            )}
            <div className="mt-6 flex justify-end space-x-3">
              <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isLoading} leftIcon={<Save size={16}/>}>Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AppConfigurationsPage;