import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X, AlertTriangle, Info } from 'lucide-react';
import { Appointment, appointmentTypes } from '../types';
import { format, addHours, isAfter } from 'date-fns';
import { it } from 'date-fns/locale';
import { checkDeviceAvailability } from '../utils/appointmentUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Appointment) => void;
  onDelete: (appointmentId: string) => void;
  selectedSlot?: { start: Date; end: Date; };
  appointment?: Appointment | null;
  existingAppointments: Appointment[];
}

export default function AppointmentModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  selectedSlot,
  appointment,
  existingAppointments
}: Props) {
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    start: new Date(),
    end: new Date(),
    appointmentType: '',
    patientName: '',
    phoneNumber: '',
    duration: 30
  });

  const [availabilityWarning, setAvailabilityWarning] = useState<{
    show: boolean;
    message: string;
    canProceed: boolean;
    type: 'warning' | 'error' | 'info';
  }>({ show: false, message: '', canProceed: true, type: 'info' });

  useEffect(() => {
    if (appointment) {
      setFormData(appointment);
    } else if (selectedSlot) {
      setFormData({
        id: crypto.randomUUID(),
        title: '',
        start: selectedSlot.start,
        end: selectedSlot.end,
        appointmentType: '',
        patientName: '',
        phoneNumber: '',
        duration: 30
      });
    }
  }, [appointment, selectedSlot]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!availabilityWarning.canProceed) return;
    onSave(formData);
  };

  const checkFutureAvailability = (
    selectedType: typeof appointmentTypes[0], 
    startDate: Date,
    existingAppointments: Appointment[]
  ) => {
    // Check if there are any appointments that would overlap with this time slot
    const { available, nextAvailableDate, remainingDevices, restrictionEnd } = checkDeviceAvailability(
      existingAppointments,
      selectedType,
      startDate
    );

    const restrictionEndStr = restrictionEnd 
      ? format(restrictionEnd, "dd/MM/yyyy 'alle' HH:mm", { locale: it })
      : '';

    if (!available) {
      const nextDate = nextAvailableDate 
        ? format(nextAvailableDate, "dd/MM/yyyy 'alle' HH:mm", { locale: it })
        : 'data non disponibile';
      
      setAvailabilityWarning({
        show: true,
        message: `Tutti i dispositivi Holter sono occupati in questa fascia oraria fino al ${nextDate}. Seleziona un'altra data o orario.`,
        canProceed: false,
        type: 'error'
      });
    } else if (remainingDevices === 1) {
      setAvailabilityWarning({
        show: true,
        message: `Ultimo dispositivo Holter disponibile fino al ${restrictionEndStr}. È possibile procedere con la prenotazione.`,
        canProceed: true,
        type: 'warning'
      });
    } else {
      const futureDate = format(
        addHours(startDate, selectedType.restrictionHours || 0),
        "dd/MM/yyyy 'alle' HH:mm",
        { locale: it }
      );
      setAvailabilityWarning({
        show: true,
        message: `Questo dispositivo sarà occupato fino al ${futureDate}.`,
        canProceed: true,
        type: 'info'
      });
    }

    return available;
  };

  const handleAppointmentTypeChange = (type: string) => {
    const selectedType = appointmentTypes.find(t => t.id === type);
    if (selectedType) {
      const endTime = new Date(formData.start);
      endTime.setMinutes(endTime.getMinutes() + formData.duration);
      setFormData({
        ...formData,
        appointmentType: type,
        end: endTime,
        duration: selectedType.defaultDuration
      });

      if (selectedType.deviceGroup) {
        checkFutureAvailability(selectedType, formData.start, existingAppointments);
      } else {
        setAvailabilityWarning({ show: false, message: '', canProceed: true, type: 'info' });
      }
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = new Date(e.target.value);
    const newEnd = new Date(newStart);
    newEnd.setMinutes(newStart.getMinutes() + formData.duration);
    setFormData({ ...formData, start: newStart, end: newEnd });

    if (formData.appointmentType) {
      const selectedType = appointmentTypes.find(t => t.id === formData.appointmentType);
      if (selectedType?.deviceGroup) {
        checkFutureAvailability(selectedType, newStart, existingAppointments);
      }
    }
  };

  const updateDurationAndEnd = (newDuration: number) => {
    const endTime = new Date(formData.start);
    endTime.setMinutes(endTime.getMinutes() + newDuration);
    setFormData({
      ...formData,
      duration: newDuration,
      end: endTime
    });
  };

  const getWarningStyles = (type: 'warning' | 'error' | 'info') => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          text: 'text-yellow-700',
          icon: 'text-yellow-400'
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          text: 'text-red-700',
          icon: 'text-red-400'
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          icon: 'text-blue-400'
        };
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg rounded-xl bg-white p-6 w-full">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-xl font-semibold">
              {appointment ? 'Modifica Appuntamento' : 'Nuovo Appuntamento'}
            </Dialog.Title>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>

          {availabilityWarning.show && (
            <div className={`mb-4 p-4 rounded-md ${getWarningStyles(availabilityWarning.type).bg}`}>
              <div className="flex items-start">
                {availabilityWarning.type === 'info' ? (
                  <Info className={`h-5 w-5 ${getWarningStyles(availabilityWarning.type).icon} mt-0.5`} />
                ) : (
                  <AlertTriangle className={`h-5 w-5 ${getWarningStyles(availabilityWarning.type).icon} mt-0.5`} />
                )}
                <div className="ml-3">
                  <p className={`text-sm ${getWarningStyles(availabilityWarning.type).text}`}>
                    {availabilityWarning.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tipo di Appuntamento
              </label>
              <select
                value={formData.appointmentType}
                onChange={(e) => handleAppointmentTypeChange(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Seleziona tipo</option>
                {appointmentTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nome Paziente
              </label>
              <input
                type="text"
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Numero di Telefono
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Data e Ora
              </label>
              <input
                type="datetime-local"
                value={format(formData.start, "yyyy-MM-dd'T'HH:mm")}
                onChange={handleDateChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Durata (minuti)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                step="5"
                value={formData.duration}
                onChange={(e) => updateDurationAndEnd(parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              {appointment && (
                <button
                  type="button"
                  onClick={() => onDelete(appointment.id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Elimina
                </button>
              )}
              <button
                type="submit"
                disabled={!availabilityWarning.canProceed}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  availabilityWarning.canProceed
                    ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Salva
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}