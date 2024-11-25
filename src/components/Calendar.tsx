import { useState, useCallback } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { Appointment, appointmentTypes } from '../types';
import AppointmentModal from './AppointmentModal';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'it': it,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function Calendar() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const handleSelectSlot = useCallback((slotInfo: any) => {
    setSelectedSlot(slotInfo);
    setSelectedAppointment(null);
    setIsModalOpen(true);
  }, []);

  const handleSelectEvent = useCallback((event: Appointment) => {
    setSelectedAppointment(event);
    setSelectedSlot(null);
    setIsModalOpen(true);
  }, []);

  const handleSaveAppointment = (appointment: Appointment) => {
    if (selectedAppointment) {
      setAppointments(appointments.map(apt => 
        apt.id === appointment.id ? appointment : apt
      ));
    } else {
      setAppointments([...appointments, appointment]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteAppointment = (appointmentId: string) => {
    setAppointments(appointments.filter(apt => apt.id !== appointmentId));
    setIsModalOpen(false);
  };

  const eventStyleGetter = (event: Appointment) => {
    const appointmentType = appointmentTypes.find(t => t.id === event.appointmentType);
    return {
      style: {
        backgroundColor: appointmentType?.color || '#gray',
        border: 'none',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        borderRadius: '0.5rem',
        padding: '0.25rem 0.5rem'
      }
    };
  };

  const formatEventTitle = (event: Appointment) => {
    const type = appointmentTypes.find(t => t.id === event.appointmentType)?.name;
    return `${type} - ${event.patientName} (${event.phoneNumber})`;
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <BigCalendar
          localizer={localizer}
          events={appointments}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 'calc(100vh - 8rem)' }}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          titleAccessor={formatEventTitle}
          formats={{
            dateFormat: 'dd/MM/yyyy',
            timeGutterFormat: 'HH:mm',
          }}
          messages={{
            next: "Successivo",
            previous: "Precedente",
            today: "Oggi",
            month: "Mese",
            week: "Settimana",
            day: "Giorno",
            agenda: "Agenda",
            date: "Data",
            time: "Ora",
            event: "Evento",
          }}
        />
      </div>
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAppointment}
        onDelete={handleDeleteAppointment}
        selectedSlot={selectedSlot}
        appointment={selectedAppointment}
        existingAppointments={appointments}
      />
    </div>
  );
}